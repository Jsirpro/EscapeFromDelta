use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::state::validation::{checked_sub_u64, require_armor_range, require_weapon_range};
use crate::state::{
    PlayerProfile, RaidSession, RaidStatus, RiskAreaRuntime, RiskLevel,
    DEFAULT_CONTAINERS_PER_AREA, DEFAULT_HIGH_ENCOUNTER_PERCENT, DEFAULT_LOW_ENCOUNTER_PERCENT,
    DEFAULT_MID_ENCOUNTER_PERCENT, SCHEMA_VERSION, SEED_PLAYER, SEED_RAID,
};

#[derive(Accounts)]
pub struct StartRaid<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [SEED_PLAYER, player.key().as_ref()],
        bump = player_profile.bump,
        constraint = player_profile.wallet == player.key() @ EscapeError::Unauthorized
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    #[account(
        init,
        payer = player,
        space = 8 + RaidSession::INIT_SPACE,
        seeds = [SEED_RAID, player_profile.key().as_ref(), &player_profile.next_raid_id.to_le_bytes()],
        bump
    )]
    pub raid_session: Account<'info, RaidSession>,
    /// CHECK: Default difficulty can be Pubkey::default() for the first playable demo;
    /// when configured, this must match a program-owned difficulty account.
    pub difficulty_configuration: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<StartRaid>,
    armor_tenths: u16,
    weapon_tenths: u16,
    entry_fee: u64,
) -> Result<()> {
    require!(entry_fee > 0, EscapeError::InsufficientFunds);
    require_armor_range(armor_tenths)?;
    require_weapon_range(weapon_tenths)?;
    let player_profile = &mut ctx.accounts.player_profile;
    require!(player_profile.active_raid.is_none(), EscapeError::RaidAlreadyActive);
    require!(player_profile.edcoins_balance >= entry_fee, EscapeError::InsufficientFunds);
    require!(player_profile.armor_point_balance >= armor_tenths, EscapeError::InvalidEquipment);
    require!(player_profile.weapon_point_balance >= weapon_tenths, EscapeError::InvalidEquipment);

    player_profile.edcoins_balance = checked_sub_u64(player_profile.edcoins_balance, entry_fee)?;
    player_profile.armor_point_balance = player_profile
        .armor_point_balance
        .checked_sub(armor_tenths)
        .ok_or(EscapeError::ArithmeticOverflow)?;
    player_profile.weapon_point_balance = player_profile
        .weapon_point_balance
        .checked_sub(weapon_tenths)
        .ok_or(EscapeError::ArithmeticOverflow)?;
    player_profile.warehouse_nonce =
        player_profile.warehouse_nonce.checked_add(1).ok_or(EscapeError::ArithmeticOverflow)?;

    let raid_id = player_profile.next_raid_id;
    let area_states = vec![
        RiskAreaRuntime {
            risk_level: RiskLevel::Low,
            containers_total: DEFAULT_CONTAINERS_PER_AREA,
            containers_opened: 0,
            same_area_increment_points: 0,
            area_change_increment_points: 0,
            effective_encounter_chance: DEFAULT_LOW_ENCOUNTER_PERCENT,
        },
        RiskAreaRuntime {
            risk_level: RiskLevel::Medium,
            containers_total: DEFAULT_CONTAINERS_PER_AREA,
            containers_opened: 0,
            same_area_increment_points: 0,
            area_change_increment_points: 0,
            effective_encounter_chance: DEFAULT_MID_ENCOUNTER_PERCENT,
        },
        RiskAreaRuntime {
            risk_level: RiskLevel::High,
            containers_total: DEFAULT_CONTAINERS_PER_AREA,
            containers_opened: 0,
            same_area_increment_points: 0,
            area_change_increment_points: 0,
            effective_encounter_chance: DEFAULT_HIGH_ENCOUNTER_PERCENT,
        },
    ];

    let raid_session = &mut ctx.accounts.raid_session;
    raid_session.schema_version = SCHEMA_VERSION;
    raid_session.raid_id = raid_id;
    raid_session.player_profile = player_profile.key();
    raid_session.status = RaidStatus::Active;
    raid_session.locked_difficulty = ctx.accounts.difficulty_configuration.key();
    raid_session.locked_difficulty_id = 0;
    raid_session.locked_difficulty_version = 1;
    raid_session.entry_fee_paid = entry_fee;
    raid_session.selected_safe_case = None;
    raid_session.safe_case_capacity = 0;
    raid_session.safe_case_selection = Vec::new();
    raid_session.armor_asset = Pubkey::default();
    raid_session.weapon_asset = Pubkey::default();
    raid_session.current_armor_tenths = armor_tenths;
    raid_session.current_weapon_tenths = weapon_tenths;
    raid_session.current_area = RiskLevel::Low;
    raid_session.area_states = area_states;
    raid_session.carried_loot = Vec::new();
    raid_session.random_events = Vec::new();
    raid_session.started_at = Clock::get()?.unix_timestamp;
    raid_session.settled_at = None;
    raid_session.bump = ctx.bumps.raid_session;

    player_profile.active_raid = Some(raid_session.key());
    player_profile.next_raid_id =
        player_profile.next_raid_id.checked_add(1).ok_or(EscapeError::ArithmeticOverflow)?;
    Ok(())
}

pub fn default_area_states() -> [(u8, u16); 3] {
    [
        (DEFAULT_CONTAINERS_PER_AREA, DEFAULT_LOW_ENCOUNTER_PERCENT),
        (DEFAULT_CONTAINERS_PER_AREA, DEFAULT_MID_ENCOUNTER_PERCENT),
        (DEFAULT_CONTAINERS_PER_AREA, DEFAULT_HIGH_ENCOUNTER_PERCENT),
    ]
}
