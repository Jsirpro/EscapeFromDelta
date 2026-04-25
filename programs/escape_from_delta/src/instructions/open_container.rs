use anchor_lang::prelude::*;
use session_keys::{session_auth_or, Session, SessionError, SessionToken};

use crate::errors::EscapeError;
use crate::instructions::effective_encounter_chance;
use crate::state::{
    PlayerProfile, RaidSession, RaidStatus, RandomEventAudit, RandomEventType, RandomOutcome,
    RiskAreaRuntime, RiskLevel, DEFAULT_HIGH_ENCOUNTER_PERCENT, DEFAULT_LOW_ENCOUNTER_PERCENT,
    DEFAULT_MID_ENCOUNTER_PERCENT, SEED_PLAYER, SEED_RAID,
};

#[derive(Accounts, Session)]
pub struct OpenContainer<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
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
    ctx: Context<OpenContainer>,
    container_index: u8,
    _base: u16,
    _same_area_steps: u16,
    _area_changes: u16,
    final_random_value: u64,
) -> Result<u16> {
    require!(final_random_value > 0, EscapeError::InvalidRandomAudit);

    let now = Clock::get()?.unix_timestamp;
    let raid_session = &mut ctx.accounts.raid_session;
    if crate::instructions::is_timed_out(raid_session.started_at, now) {
        raid_session.status = RaidStatus::TimedOut;
        return err!(EscapeError::RaidTimedOut);
    }
    require!(raid_session.status == RaidStatus::Active, EscapeError::InvalidRaidState);

    let current_area = raid_session.current_area;
    let raid_id = raid_session.raid_id;
    let event_id = raid_session.random_events.len() as u64 + 1;
    let area_state = current_area_state_mut(&mut raid_session.area_states, current_area)?;
    require!(container_index < area_state.containers_total, EscapeError::InvalidContainer);
    require!(
        area_state.containers_opened < area_state.containers_total,
        EscapeError::InvalidContainer
    );

    area_state.containers_opened =
        area_state.containers_opened.checked_add(1).ok_or(EscapeError::ArithmeticOverflow)?;

    let encounter_threshold = area_state.effective_encounter_chance;
    let encountered = (final_random_value % 100) < u64::from(encounter_threshold);
    area_state.same_area_increment_points = area_state
        .same_area_increment_points
        .checked_add(1)
        .ok_or(EscapeError::ArithmeticOverflow)?;
    area_state.effective_encounter_chance = effective_encounter_chance(
        base_encounter_for(current_area),
        area_state.same_area_increment_points,
        area_state.area_change_increment_points,
    )?;

    raid_session.random_events.push(RandomEventAudit::new(
        event_id,
        RandomEventType::EncounterCheck,
        final_random_value,
        encounter_threshold,
        if encountered { RandomOutcome::Encounter } else { RandomOutcome::NoEncounter },
        now,
    )?);

    if encountered {
        raid_session.status = RaidStatus::PendingBattle;
        return Ok(encounter_threshold);
    }

    let loot_event_id = raid_session.random_events.len() as u64 + 1;
    let loot_pubkey = synthetic_loot_key(raid_id, loot_event_id);
    raid_session.carried_loot.push(loot_pubkey);
    if raid_session.safe_case_capacity > 0 {
        raid_session.safe_case_selection = raid_session
            .carried_loot
            .iter()
            .copied()
            .take(usize::from(raid_session.safe_case_capacity))
            .collect();
    }
    raid_session.random_events.push(RandomEventAudit::new(
        loot_event_id,
        RandomEventType::LootDrop,
        final_random_value,
        encounter_threshold,
        loot_outcome_for(current_area),
        now,
    )?);
    Ok(encounter_threshold)
}

fn current_area_state_mut(
    area_states: &mut [RiskAreaRuntime],
    current_area: RiskLevel,
) -> Result<&mut RiskAreaRuntime> {
    area_states
        .iter_mut()
        .find(|state| state.risk_level == current_area)
        .ok_or(EscapeError::InvalidRaidState.into())
}

fn base_encounter_for(level: RiskLevel) -> u16 {
    match level {
        RiskLevel::Low => DEFAULT_LOW_ENCOUNTER_PERCENT,
        RiskLevel::Medium => DEFAULT_MID_ENCOUNTER_PERCENT,
        RiskLevel::High => DEFAULT_HIGH_ENCOUNTER_PERCENT,
    }
}

fn loot_outcome_for(level: RiskLevel) -> RandomOutcome {
    match level {
        RiskLevel::Low => RandomOutcome::LootCommon,
        RiskLevel::Medium => RandomOutcome::LootRare,
        RiskLevel::High => RandomOutcome::LootEpic,
    }
}

fn synthetic_loot_key(raid_id: u64, event_id: u64) -> Pubkey {
    let raid_bytes = raid_id.to_le_bytes();
    let event_bytes = event_id.to_le_bytes();
    Pubkey::find_program_address(
        &[b"loot", raid_bytes.as_ref(), event_bytes.as_ref()],
        &crate::id(),
    )
    .0
}
