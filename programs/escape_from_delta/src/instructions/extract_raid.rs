use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::state::{
    BattleRecord, PlayerProfile, RaidResult, RaidSession, RaidStatus, SCHEMA_VERSION,
    SEED_BATTLE_RECORD, SEED_PLAYER, SEED_RAID,
};

#[derive(Accounts)]
pub struct ExtractRaid<'info> {
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
    #[account(
        init,
        payer = player,
        space = 8 + BattleRecord::INIT_SPACE,
        seeds = [SEED_BATTLE_RECORD, player_profile.key().as_ref(), &raid_session.raid_id.to_le_bytes()],
        bump
    )]
    pub battle_record: Account<'info, BattleRecord>,
    pub system_program: Program<'info, System>,
}

pub fn handler<'info>(ctx: Context<'_, '_, '_, 'info, ExtractRaid<'info>>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let player_profile = &mut ctx.accounts.player_profile;
    let raid_session = &mut ctx.accounts.raid_session;

    if crate::instructions::is_timed_out(raid_session.started_at, now) {
        raid_session.status = RaidStatus::TimedOut;
        return err!(EscapeError::RaidTimedOut);
    }
    require!(raid_session.status == RaidStatus::Active, EscapeError::InvalidRaidState);

    player_profile.armor_point_balance = player_profile
        .armor_point_balance
        .checked_add(raid_session.current_armor_tenths)
        .ok_or(EscapeError::ArithmeticOverflow)?;
    player_profile.weapon_point_balance = player_profile
        .weapon_point_balance
        .checked_add(raid_session.current_weapon_tenths)
        .ok_or(EscapeError::ArithmeticOverflow)?;
    let retained_assets = raid_session.carried_loot.clone();
    let random_event_audits = raid_session.random_events.clone();
    let _created_assets = crate::instructions::create_collectible_assets_from_loot(
        ctx.accounts.player.to_account_info(),
        player_profile,
        &retained_assets,
        ctx.remaining_accounts,
        ctx.accounts.system_program.to_account_info(),
    )?;
    player_profile.active_raid = None;

    raid_session.status = RaidStatus::Succeeded;
    raid_session.pending_loot = None;
    raid_session.settled_at = Some(now);

    let battle_record = &mut ctx.accounts.battle_record;
    battle_record.schema_version = SCHEMA_VERSION;
    battle_record.record_id = raid_session.raid_id;
    battle_record.player_profile = player_profile.key();
    battle_record.raid_id = raid_session.raid_id;
    battle_record.difficulty_id = raid_session.locked_difficulty_id;
    battle_record.difficulty_version = raid_session.locked_difficulty_version;
    battle_record.result = RaidResult::Succeeded;
    battle_record.retained_assets = retained_assets;
    battle_record.lost_assets = Vec::new();
    battle_record.entry_fee_paid = raid_session.entry_fee_paid;
    battle_record.started_at = raid_session.started_at;
    battle_record.settled_at = now;
    battle_record.random_event_audits = random_event_audits;
    battle_record.bump = ctx.bumps.battle_record;
    Ok(())
}
