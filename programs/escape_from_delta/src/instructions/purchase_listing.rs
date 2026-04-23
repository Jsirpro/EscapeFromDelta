use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::state::validation::{checked_add_u64, checked_sub_u64};
use crate::state::{
    AssetLockState, ListingStatus, MarketplaceListing, PlayerProfile, WarehouseAsset, SEED_ASSET,
    SEED_LISTING, SEED_PLAYER,
};

#[derive(Accounts)]
pub struct PurchaseListing<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        seeds = [SEED_PLAYER, buyer.key().as_ref()],
        bump = buyer_profile.bump,
        constraint = buyer_profile.wallet == buyer.key() @ EscapeError::Unauthorized
    )]
    pub buyer_profile: Account<'info, PlayerProfile>,
    #[account(mut)]
    pub seller_profile: Account<'info, PlayerProfile>,
    #[account(
        mut,
        seeds = [SEED_ASSET, seller_profile.key().as_ref(), &warehouse_asset.asset_id.to_le_bytes()],
        bump = warehouse_asset.bump,
        constraint = warehouse_asset.owner_profile == seller_profile.key() @ EscapeError::Unauthorized
    )]
    pub warehouse_asset: Account<'info, WarehouseAsset>,
    #[account(
        mut,
        seeds = [SEED_LISTING, warehouse_asset.key().as_ref()],
        bump = marketplace_listing.bump,
        constraint = marketplace_listing.asset_id == warehouse_asset.key() @ EscapeError::InvalidListing,
        constraint = marketplace_listing.seller_profile == seller_profile.key() @ EscapeError::InvalidListing
    )]
    pub marketplace_listing: Account<'info, MarketplaceListing>,
}

pub fn handler(ctx: Context<PurchaseListing>) -> Result<()> {
    let listing = &mut ctx.accounts.marketplace_listing;
    require!(listing.status == ListingStatus::Active, EscapeError::InvalidListing);

    let buyer_profile = &mut ctx.accounts.buyer_profile;
    let seller_profile = &mut ctx.accounts.seller_profile;
    require_keys_neq!(buyer_profile.key(), seller_profile.key(), EscapeError::InvalidListing);

    buyer_profile.edcoins_balance =
        checked_sub_u64(buyer_profile.edcoins_balance, listing.price_edcoins)?;
    seller_profile.edcoins_balance =
        checked_add_u64(seller_profile.edcoins_balance, listing.price_edcoins)?;
    buyer_profile.warehouse_nonce =
        buyer_profile.warehouse_nonce.checked_add(1).ok_or(EscapeError::ArithmeticOverflow)?;
    seller_profile.warehouse_nonce =
        seller_profile.warehouse_nonce.checked_add(1).ok_or(EscapeError::ArithmeticOverflow)?;

    let warehouse_asset = &mut ctx.accounts.warehouse_asset;
    require!(warehouse_asset.locked_state == AssetLockState::Listed, EscapeError::InvalidListing);
    warehouse_asset.owner_profile = buyer_profile.key();
    warehouse_asset.locked_state = AssetLockState::Available;

    listing.status = ListingStatus::Sold;
    listing.buyer_profile = Some(buyer_profile.key());
    listing.settled_at = Some(Clock::get()?.unix_timestamp);
    Ok(())
}
