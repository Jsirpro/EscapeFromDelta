use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::instructions::effective_encounter_chance;
use crate::state::{
    PlayerProfile, RaidSession, RaidStatus, RiskAreaRuntime, RiskLevel,
    DEFAULT_HIGH_ENCOUNTER_PERCENT, DEFAULT_LOW_ENCOUNTER_PERCENT, DEFAULT_MID_ENCOUNTER_PERCENT,
    SEED_PLAYER, SEED_RAID,
};

#[derive(Accounts)]
pub struct MoveArea<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
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

pub fn handler(ctx: Context<MoveArea>, target_area: RiskLevel) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let raid_session = &mut ctx.accounts.raid_session;
    if crate::instructions::is_timed_out(raid_session.started_at, now) {
        raid_session.status = RaidStatus::TimedOut;
        return err!(EscapeError::RaidTimedOut);
    }
    require!(raid_session.status == RaidStatus::Active, EscapeError::InvalidRaidState);
    require!(raid_session.current_area != target_area, EscapeError::InvalidRaidState);

    let target_state = target_area_state_mut(&mut raid_session.area_states, target_area)?;
    target_state.area_change_increment_points = target_state
        .area_change_increment_points
        .checked_add(1)
        .ok_or(EscapeError::ArithmeticOverflow)?;
    target_state.effective_encounter_chance = effective_encounter_chance(
        base_encounter_for(target_area),
        target_state.same_area_increment_points,
        target_state.area_change_increment_points,
    )?;
    raid_session.current_area = target_area;
    Ok(())
}

fn target_area_state_mut(
    area_states: &mut [RiskAreaRuntime],
    target_area: RiskLevel,
) -> Result<&mut RiskAreaRuntime> {
    area_states
        .iter_mut()
        .find(|state| state.risk_level == target_area)
        .ok_or(EscapeError::InvalidRaidState.into())
}

fn base_encounter_for(level: RiskLevel) -> u16 {
    match level {
        RiskLevel::Low => DEFAULT_LOW_ENCOUNTER_PERCENT,
        RiskLevel::Medium => DEFAULT_MID_ENCOUNTER_PERCENT,
        RiskLevel::High => DEFAULT_HIGH_ENCOUNTER_PERCENT,
    }
}
