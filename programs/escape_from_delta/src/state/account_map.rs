use anchor_lang::prelude::*;

use crate::state::constants::*;

pub struct AccountMapEntry {
    pub account: &'static str,
    pub seed_prefix: &'static [u8],
    pub owner: &'static str,
    pub signer_authority: &'static str,
    pub mutable_when: &'static str,
    pub token_program: &'static str,
    pub size_budget: &'static str,
    pub precision: &'static str,
    pub overflow_rule: &'static str,
}

pub const ACCOUNT_MAP: &[AccountMapEntry] = &[
    AccountMapEntry {
        account: "GameConfig",
        seed_prefix: SEED_GAME_CONFIG,
        owner: "Escape from Delta program",
        signer_authority:
            "deploying wallet initializes; active admin mutates supported global admin fields",
        mutable_when: "initialization/admin rotation",
        token_program: "stores configured token program id",
        size_budget: "fixed global config",
        precision: "EDcoins base units; integer conversion rate",
        overflow_rule: "duplicate init or invalid rate fails",
    },
    AccountMapEntry {
        account: "AdminProfile",
        seed_prefix: SEED_ADMIN,
        owner: "Escape from Delta program",
        signer_authority: "deploying wallet for first admin; active admin for later changes",
        mutable_when: "active flag and metadata",
        token_program: "N/A",
        size_budget: "fixed per admin",
        precision: "boolean and timestamp",
        overflow_rule: "unauthorized or inactive admin fails",
    },
    AccountMapEntry {
        account: "PlayerProfile",
        seed_prefix: SEED_PLAYER,
        owner: "Escape from Delta program",
        signer_authority: "player wallet",
        mutable_when: "grant, active raid, warehouse nonce",
        token_program: "references player EDcoins token account",
        size_budget: "fixed per player",
        precision: "nonce, timestamp, grant flag",
        overflow_rule: "duplicate grant and wrong signer fail",
    },
    AccountMapEntry {
        account: "WarehouseAsset",
        seed_prefix: SEED_ASSET,
        owner: "Escape from Delta program",
        signer_authority: "owner player wallet",
        mutable_when: "ownership, lock state, point balances, safe-case state",
        token_program: "N/A",
        size_budget: "bounded asset metadata",
        precision: "armor/weapon tenths; safe-case capacity integer",
        overflow_rule: "invalid owner, locked reuse, cap overflow, invalid capacity fail",
    },
    AccountMapEntry {
        account: "DifficultyConfiguration",
        seed_prefix: SEED_DIFFICULTY,
        owner: "Escape from Delta program",
        signer_authority: "active admin wallet",
        mutable_when: "creation or selectable flag only",
        token_program: "N/A",
        size_budget: "bounded low/mid/high config and weights",
        precision: "probability points; EDcoins base units",
        overflow_rule: "invalid probability, fee, weight, or enemy range fails",
    },
    AccountMapEntry {
        account: "RaidSession",
        seed_prefix: SEED_RAID,
        owner: "Escape from Delta program",
        signer_authority: "player wallet or permitted settlement caller",
        mutable_when: "until settlement",
        token_program: "references EDcoins entry fee token account",
        size_budget: "bounded area states, loot, safe-case selection, random events",
        precision: "armor/weapon tenths; probability points; timestamps",
        overflow_rule: "invalid transition, timeout, vector bound, or container overflow fails",
    },
    AccountMapEntry {
        account: "MarketplaceListing",
        seed_prefix: SEED_LISTING,
        owner: "Escape from Delta program",
        signer_authority: "seller creates/cancels; buyer purchases",
        mutable_when: "until sold/canceled",
        token_program: "uses configured EDcoins token accounts",
        size_budget: "fixed listing fields plus asset reference",
        precision: "EDcoins base units; ceil 3 percent fee",
        overflow_rule: "invalid price, owner, funds, or state fails",
    },
    AccountMapEntry {
        account: "BattleRecord",
        seed_prefix: SEED_BATTLE_RECORD,
        owner: "Escape from Delta program",
        signer_authority: "settlement instruction creates",
        mutable_when: "immutable after creation",
        token_program: "N/A",
        size_budget: "bounded retained/lost assets and audit events",
        precision: "EDcoins base units; timestamps; final random values",
        overflow_rule: "duplicate, malformed audit, missing version, or vector bound fails",
    },
];

pub fn pda(program_id: &Pubkey, seeds: &[&[u8]]) -> (Pubkey, u8) {
    Pubkey::find_program_address(seeds, program_id)
}
