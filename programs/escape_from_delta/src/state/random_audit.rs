use anchor_lang::prelude::*;

use crate::errors::EscapeError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Eq, PartialEq, InitSpace)]
pub enum RandomEventType {
    EncounterCheck,
    BattleResult,
    LootDrop,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Eq, PartialEq, InitSpace)]
pub enum RandomOutcome {
    NoEncounter,
    Encounter,
    PlayerWon,
    PlayerLost,
    LootCommon,
    LootUncommon,
    LootRare,
    LootEpic,
    LootLegendary,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, InitSpace)]
pub struct RandomEventAudit {
    pub event_id: u64,
    pub event_type: RandomEventType,
    pub final_random_value: u64,
    pub threshold: u16,
    pub outcome: RandomOutcome,
    pub created_at: i64,
}

impl RandomEventAudit {
    pub fn new(
        event_id: u64,
        event_type: RandomEventType,
        final_random_value: u64,
        threshold: u16,
        outcome: RandomOutcome,
        created_at: i64,
    ) -> Result<Self> {
        require!(threshold <= 100, EscapeError::InvalidRandomAudit);
        Ok(Self { event_id, event_type, final_random_value, threshold, outcome, created_at })
    }
}
