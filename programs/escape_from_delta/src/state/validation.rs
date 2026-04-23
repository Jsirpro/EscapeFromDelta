use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::state::constants::*;

pub fn require_authority(expected: &Pubkey, actual: &Pubkey) -> Result<()> {
    require_keys_eq!(*expected, *actual, EscapeError::Unauthorized);
    Ok(())
}

pub fn require_schema_version(version: u16) -> Result<()> {
    require_eq!(version, SCHEMA_VERSION, EscapeError::InvalidAccount);
    Ok(())
}

pub fn require_armor_range(armor_tenths: u16) -> Result<()> {
    require!(
        (MIN_ARMOR_TENTHS..=MAX_ARMOR_TENTHS).contains(&armor_tenths),
        EscapeError::InvalidEquipment
    );
    Ok(())
}

pub fn require_weapon_range(weapon_tenths: u16) -> Result<()> {
    require!(
        (MIN_WEAPON_TENTHS..=MAX_WEAPON_TENTHS).contains(&weapon_tenths),
        EscapeError::InvalidEquipment
    );
    Ok(())
}

pub fn require_probability_percent(value: u16) -> Result<()> {
    require!(value <= PERCENT_DENOMINATOR, EscapeError::InvalidNumericRange);
    Ok(())
}

pub fn checked_add_u64(left: u64, right: u64) -> Result<u64> {
    left.checked_add(right).ok_or(EscapeError::ArithmeticOverflow.into())
}

pub fn checked_sub_u64(left: u64, right: u64) -> Result<u64> {
    left.checked_sub(right).ok_or(EscapeError::ArithmeticOverflow.into())
}

pub fn checked_mul_u64(left: u64, right: u64) -> Result<u64> {
    left.checked_mul(right).ok_or(EscapeError::ArithmeticOverflow.into())
}

pub fn require_safe_case_capacity(capacity: u8) -> Result<()> {
    require!(capacity <= MAX_SAFE_CASE_CAPACITY, EscapeError::InvalidSafeCaseSelection);
    Ok(())
}
