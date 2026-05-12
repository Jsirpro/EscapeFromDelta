use anchor_lang::prelude::*;
use session_keys::{session_auth_or, Session, SessionError, SessionToken};

use crate::errors::EscapeError;
use crate::state::{
    PlayerProfile, RaidSession, RaidStatus, MAX_SAFE_CASE_CAPACITY, SEED_PLAYER, SEED_RAID,
};

#[derive(Accounts, Session)]
pub struct SelectSafeCaseItems<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        seeds = [SEED_PLAYER, player_profile.wallet.as_ref()],
        bump = player_profile.bump,
        constraint = player_profile.active_raid == Some(raid_session.key()) @ EscapeError::InvalidRaidState
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    #[account(
        mut,
        seeds = [SEED_RAID, player_profile.key().as_ref(), &raid_session.raid_id.to_le_bytes()],
        bump = raid_session.bump,
        constraint = raid_session.player_profile == player_profile.key() @ EscapeError::Unauthorized
    )]
    pub raid_session: Account<'info, RaidSession>,
    #[session(
        signer = signer,
        authority = player_profile.wallet.key()
    )]
    pub session_token: Option<Account<'info, SessionToken>>,
}

#[session_auth_or(
    ctx.accounts.player_profile.wallet.key() == ctx.accounts.signer.key(),
    SessionError::InvalidToken
)]
pub fn handler(
    ctx: Context<SelectSafeCaseItems>,
    selected_assets: Vec<Pubkey>,
    capacity: u8,
) -> Result<()> {
    let raid_session = &mut ctx.accounts.raid_session;
    require!(raid_session.status == RaidStatus::Active, EscapeError::InvalidRaidState);
    require!(capacity <= MAX_SAFE_CASE_CAPACITY, EscapeError::InvalidSafeCaseSelection);
    require!(selected_assets.len() <= usize::from(capacity), EscapeError::InvalidSafeCaseSelection);
    require!(capacity == raid_session.safe_case_capacity, EscapeError::InvalidSafeCaseSelection);
    for asset in &selected_assets {
        require!(raid_session.carried_loot.contains(asset), EscapeError::InvalidSafeCaseSelection);
    }

    raid_session.safe_case_capacity = capacity;
    raid_session.safe_case_selection = selected_assets;
    Ok(())
}
