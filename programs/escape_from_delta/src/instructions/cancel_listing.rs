use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::state::{
    AssetLockState, ListingStatus, MarketplaceListing, PlayerProfile, WarehouseAsset, SEED_ASSET,
    SEED_LISTING, SEED_PLAYER,
};

#[derive(Accounts)]
pub struct CancelListing<'info> {
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
        mut,
        seeds = [SEED_LISTING, warehouse_asset.key().as_ref()],
        bump = marketplace_listing.bump,
        constraint = marketplace_listing.asset_id == warehouse_asset.key() @ EscapeError::InvalidListing,
        constraint = marketplace_listing.seller_profile == seller_profile.key() @ EscapeError::InvalidListing
    )]
    pub marketplace_listing: Account<'info, MarketplaceListing>,
}

pub fn handler(ctx: Context<CancelListing>) -> Result<()> {
    let listing = &mut ctx.accounts.marketplace_listing;
    require!(listing.status == ListingStatus::Active, EscapeError::InvalidListing);

    let warehouse_asset = &mut ctx.accounts.warehouse_asset;
    require!(warehouse_asset.locked_state == AssetLockState::Listed, EscapeError::InvalidListing);
    warehouse_asset.locked_state = AssetLockState::Available;

    let seller_profile = &mut ctx.accounts.seller_profile;
    seller_profile.warehouse_nonce =
        seller_profile.warehouse_nonce.checked_add(1).ok_or(EscapeError::ArithmeticOverflow)?;

    listing.status = ListingStatus::Canceled;
    listing.settled_at = Some(Clock::get()?.unix_timestamp);
    Ok(())
}
