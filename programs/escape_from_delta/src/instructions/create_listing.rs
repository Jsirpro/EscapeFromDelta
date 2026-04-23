use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::instructions::token_helpers::listing_fee;
use crate::state::validation::checked_sub_u64;
use crate::state::{
    AssetLockState, ListingStatus, MarketplaceListing, PlayerProfile, WarehouseAsset,
    SCHEMA_VERSION, SEED_ASSET, SEED_LISTING, SEED_PLAYER,
};

#[derive(Accounts)]
pub struct CreateListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        mut,
        seeds = [SEED_PLAYER, seller.key().as_ref()],
        bump = seller_profile.bump,
        constraint = seller_profile.wallet == seller.key() @ EscapeError::Unauthorized
    )]
    pub seller_profile: Account<'info, PlayerProfile>,
    #[account(
        mut,
        seeds = [SEED_ASSET, seller_profile.key().as_ref(), &warehouse_asset.asset_id.to_le_bytes()],
        bump = warehouse_asset.bump,
        constraint = warehouse_asset.owner_profile == seller_profile.key() @ EscapeError::Unauthorized
    )]
    pub warehouse_asset: Account<'info, WarehouseAsset>,
    #[account(
        init,
        payer = seller,
        space = 8 + MarketplaceListing::INIT_SPACE,
        seeds = [SEED_LISTING, warehouse_asset.key().as_ref()],
        bump
    )]
    pub marketplace_listing: Account<'info, MarketplaceListing>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateListing>, price_edcoins: u64) -> Result<u64> {
    require!(price_edcoins > 0, EscapeError::InvalidListing);

    let fee_paid = listing_fee(price_edcoins)?;
    let seller_profile = &mut ctx.accounts.seller_profile;
    seller_profile.edcoins_balance = checked_sub_u64(seller_profile.edcoins_balance, fee_paid)?;
    seller_profile.warehouse_nonce =
        seller_profile.warehouse_nonce.checked_add(1).ok_or(EscapeError::ArithmeticOverflow)?;

    let warehouse_asset = &mut ctx.accounts.warehouse_asset;
    require!(warehouse_asset.tradable, EscapeError::InvalidListing);
    require!(
        warehouse_asset.locked_state == AssetLockState::Available,
        EscapeError::InvalidListing
    );
    warehouse_asset.locked_state = AssetLockState::Listed;

    let now = Clock::get()?.unix_timestamp;
    let listing = &mut ctx.accounts.marketplace_listing;
    listing.schema_version = SCHEMA_VERSION;
    listing.listing_id = warehouse_asset.asset_id;
    listing.seller_profile = seller_profile.key();
    listing.asset_id = warehouse_asset.key();
    listing.price_edcoins = price_edcoins;
    listing.fee_paid_edcoins = fee_paid;
    listing.status = ListingStatus::Active;
    listing.buyer_profile = None;
    listing.created_at = now;
    listing.settled_at = None;
    listing.bump = ctx.bumps.marketplace_listing;
    Ok(fee_paid)
}
