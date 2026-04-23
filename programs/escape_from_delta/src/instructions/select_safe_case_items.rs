use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::instructions::safe_case_allows;
use crate::state::{PlayerProfile, RaidSession, RaidStatus, SEED_PLAYER, SEED_RAID};

#[derive(Accounts)]
pub struct SelectSafeCaseItems<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        seeds = [SEED_PLAYER, player.key().as_ref()],
        bump = player_profile.bump,
        constraint = player_profile.wallet == player.key() @ EscapeError::Unauthorized,
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
}

pub fn handler(ctx: Context<SelectSafeCaseItems>, selected_count: u8, capacity: u8) -> Result<()> {
    let raid_session = &mut ctx.accounts.raid_session;
    require!(raid_session.status == RaidStatus::Active, EscapeError::InvalidRaidState);
    require!(selected_count <= capacity, EscapeError::InvalidSafeCaseSelection);
    require!(
        safe_case_allows(capacity, usize::from(selected_count)),
        EscapeError::InvalidSafeCaseSelection
    );

    raid_session.safe_case_capacity = capacity;
    raid_session.safe_case_selection =
        raid_session.carried_loot.iter().copied().take(usize::from(selected_count)).collect();
    Ok(())
}
