use anchor_lang::prelude::*;
use session_keys::{session_auth_or, Session, SessionError, SessionToken};

use crate::errors::EscapeError;
use crate::instructions::{battle_win_chance, degrade_combat};
use crate::state::{
    PlayerProfile, RaidSession, RaidStatus, RandomEventAudit, RandomEventType, RandomOutcome,
    SEED_PLAYER, SEED_RAID,
};

#[derive(Accounts, Session)]
pub struct FightEnemy<'info> {
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
    ctx: Context<FightEnemy>,
    armor: u16,
    weapon: u16,
    enemy: u16,
    final_random_value: u64,
) -> Result<(bool, u16, u16)> {
    require!(final_random_value > 0, EscapeError::InvalidRandomAudit);

    let now = Clock::get()?.unix_timestamp;
    let raid_session = &mut ctx.accounts.raid_session;

    if crate::instructions::is_timed_out(raid_session.started_at, now) {
        raid_session.status = RaidStatus::TimedOut;
        return err!(EscapeError::RaidTimedOut);
    }
    require!(raid_session.status == RaidStatus::PendingBattle, EscapeError::InvalidRaidState);
    require_eq!(raid_session.current_armor_tenths, armor, EscapeError::InvalidEquipment);
    require_eq!(raid_session.current_weapon_tenths, weapon, EscapeError::InvalidEquipment);

    let chance = battle_win_chance(armor, weapon, enemy)?;
    let won = chance > 0 && (final_random_value % 100) < u64::from(chance);
    let degraded_armor = degrade_combat(armor);
    let degraded_weapon = degrade_combat(weapon);
    let current_area = raid_session.current_area;

    let event_id = raid_session.random_events.len() as u64 + 1;
    raid_session.random_events.push(RandomEventAudit::new(
        event_id,
        RandomEventType::BattleResult,
        final_random_value,
        chance,
        if won { RandomOutcome::PlayerWon } else { RandomOutcome::PlayerLost },
        now,
    )?);

    if won {
        raid_session.status = RaidStatus::Active;
        raid_session.current_armor_tenths = degraded_armor;
        raid_session.current_weapon_tenths = degraded_weapon;
        if let Some(loot_pubkey) = raid_session.pending_loot.take() {
            let loot_event_id = raid_session.random_events.len() as u64 + 1;
            raid_session.carried_loot.push(loot_pubkey);
            raid_session.random_events.push(RandomEventAudit::new(
                loot_event_id,
                RandomEventType::LootDrop,
                final_random_value,
                chance,
                loot_outcome_for(current_area),
                now,
            )?);
        }
        return Ok((true, degraded_armor, degraded_weapon));
    }

    raid_session.status = RaidStatus::Failed;
    raid_session.current_armor_tenths = 0;
    raid_session.current_weapon_tenths = 0;
    raid_session.pending_loot = None;
    raid_session.settled_at = None;
    Ok((false, 0, 0))
}

fn loot_outcome_for(level: crate::state::RiskLevel) -> RandomOutcome {
    match level {
        crate::state::RiskLevel::Low => RandomOutcome::LootCommon,
        crate::state::RiskLevel::Medium => RandomOutcome::LootRare,
        crate::state::RiskLevel::High => RandomOutcome::LootEpic,
    }
}
