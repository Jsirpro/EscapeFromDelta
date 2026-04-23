use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::state::constants::*;

pub fn effective_encounter_chance(
    base: u16,
    same_area_steps: u16,
    area_changes: u16,
) -> Result<u16> {
    let same_area = same_area_steps
        .checked_mul(SAME_AREA_INCREMENT_PERCENT)
        .ok_or(EscapeError::ArithmeticOverflow)?;
    let moved = area_changes
        .checked_mul(AREA_CHANGE_INCREMENT_PERCENT)
        .ok_or(EscapeError::ArithmeticOverflow)?;
    let total = base
        .checked_add(same_area)
        .and_then(|value| value.checked_add(moved))
        .ok_or(EscapeError::ArithmeticOverflow)?;
    Ok(total.min(ENCOUNTER_CAP_PERCENT))
}

pub fn battle_win_chance(player_armor: u16, player_weapon: u16, enemy_combat: u16) -> Result<u16> {
    if player_weapon <= AUTO_LOSE_WEAPON_TENTHS {
        return Ok(0);
    }

    let player = player_armor.checked_add(player_weapon).ok_or(EscapeError::ArithmeticOverflow)?;
    let diff = i32::from(player) - i32::from(enemy_combat);
    let base = 50 + diff / 2;
    Ok(base.clamp(i32::from(MIN_WIN_CHANCE_PERCENT), i32::from(MAX_WIN_CHANCE_PERCENT)) as u16)
}

pub fn degrade_combat(value: u16) -> u16 {
    value.saturating_sub(5)
}

pub fn is_timed_out(started_at: i64, now: i64) -> bool {
    now.saturating_sub(started_at) > RAID_TIMEOUT_SECONDS
}

pub fn safe_case_allows(capacity: u8, selected_count: usize) -> bool {
    selected_count <= usize::from(capacity)
}

pub fn ceil_percent(value: u64, percent: u64) -> Result<u64> {
    let numerator = value.checked_mul(percent).ok_or(EscapeError::ArithmeticOverflow)?;
    Ok(numerator.checked_add(99).ok_or(EscapeError::ArithmeticOverflow)? / 100)
}
