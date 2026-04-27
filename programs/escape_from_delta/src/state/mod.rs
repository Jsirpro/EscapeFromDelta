use anchor_lang::prelude::*;

pub mod account_map;
pub mod constants;
pub mod random_audit;
pub mod validation;

pub use account_map::*;
pub use constants::*;
pub use random_audit::*;
pub use validation::*;

#[account]
#[derive(InitSpace)]
pub struct GameConfig {
    pub schema_version: u16,
    pub admin_authority: Pubkey,
    pub edcoins_mint: Pubkey,
    pub token_program: Pubkey,
    pub treasury_edcoins_account: Pubkey,
    pub sol_treasury: Pubkey,
    pub starter_grant_edcoins: u64,
    pub starter_armor_tenths: u16,
    pub starter_weapon_tenths: u16,
    pub sol_to_edcoins_rate: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AdminProfile {
    pub schema_version: u16,
    pub wallet: Pubkey,
    pub active: bool,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PlayerProfile {
    pub schema_version: u16,
    pub wallet: Pubkey,
    pub grant_claimed: bool,
    pub profile_created_at: i64,
    pub edcoins_balance: u64,
    pub armor_point_balance: u16,
    pub weapon_point_balance: u16,
    pub warehouse_nonce: u64,
    pub next_raid_id: u64,
    pub active_raid: Option<Pubkey>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Eq, PartialEq, InitSpace)]
pub enum AssetType {
    Collectible,
    ArmorPoints,
    WeaponPoints,
    SafeCase,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Eq, PartialEq, InitSpace)]
pub enum AssetQuality {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Eq, PartialEq, InitSpace)]
pub enum AssetLockState {
    Available,
    InRaid,
    Listed,
    Consumed,
}

#[account]
#[derive(InitSpace)]
pub struct WarehouseAsset {
    pub schema_version: u16,
    pub asset_id: u64,
    pub owner_profile: Pubkey,
    pub asset_type: AssetType,
    pub quality: Option<AssetQuality>,
    #[max_len(24)]
    pub collectible_code: String,
    pub armor_tenths: u16,
    pub weapon_tenths: u16,
    pub safe_case_capacity: u8,
    pub tradable: bool,
    pub locked_state: AssetLockState,
    pub created_from: u8,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Eq, PartialEq, InitSpace)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, InitSpace)]
pub struct RiskAreaConfig {
    pub risk_level: RiskLevel,
    pub area_count: u8,
    pub base_encounter_percent: u16,
    pub enemy_combat_min_tenths: u16,
    pub enemy_combat_max_tenths: u16,
    pub loot_weight_total: u16,
}

#[account]
#[derive(InitSpace)]
pub struct DifficultyConfiguration {
    pub schema_version: u16,
    pub difficulty_id: u64,
    pub version: u32,
    #[max_len(48)]
    pub name: String,
    pub active: bool,
    pub entry_fee_edcoins: u64,
    pub low: RiskAreaConfig,
    pub medium: RiskAreaConfig,
    pub high: RiskAreaConfig,
    pub created_by_admin: Pubkey,
    pub created_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Eq, PartialEq, InitSpace)]
pub enum RaidStatus {
    Preparing,
    Active,
    PendingBattle,
    Extracting,
    Succeeded,
    Failed,
    TimedOut,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, InitSpace)]
pub struct RiskAreaRuntime {
    pub risk_level: RiskLevel,
    pub containers_total: u8,
    pub containers_opened: u8,
    pub same_area_increment_points: u16,
    pub area_change_increment_points: u16,
    pub effective_encounter_chance: u16,
}

#[account]
#[derive(InitSpace)]
pub struct RaidSession {
    pub schema_version: u16,
    pub raid_id: u64,
    pub player_profile: Pubkey,
    pub status: RaidStatus,
    pub locked_difficulty: Pubkey,
    pub locked_difficulty_id: u64,
    pub locked_difficulty_version: u32,
    pub entry_fee_paid: u64,
    pub selected_safe_case: Option<Pubkey>,
    pub safe_case_capacity: u8,
    #[max_len(3)]
    pub safe_case_selection: Vec<Pubkey>,
    pub armor_asset: Pubkey,
    pub weapon_asset: Pubkey,
    pub current_armor_tenths: u16,
    pub current_weapon_tenths: u16,
    pub current_area: RiskLevel,
    #[max_len(3)]
    pub area_states: Vec<RiskAreaRuntime>,
    pub pending_loot: Option<Pubkey>,
    #[max_len(64)]
    pub carried_loot: Vec<Pubkey>,
    #[max_len(128)]
    pub random_events: Vec<RandomEventAudit>,
    pub started_at: i64,
    pub settled_at: Option<i64>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Eq, PartialEq, InitSpace)]
pub enum ListingStatus {
    Active,
    Sold,
    Canceled,
    Expired,
}

#[account]
#[derive(InitSpace)]
pub struct MarketplaceListing {
    pub schema_version: u16,
    pub listing_id: u64,
    pub seller_profile: Pubkey,
    pub asset_id: Pubkey,
    pub price_edcoins: u64,
    pub fee_paid_edcoins: u64,
    pub status: ListingStatus,
    pub buyer_profile: Option<Pubkey>,
    pub created_at: i64,
    pub settled_at: Option<i64>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Eq, PartialEq, InitSpace)]
pub enum RaidResult {
    Succeeded,
    Failed,
    TimedOut,
}

#[account]
#[derive(InitSpace)]
pub struct BattleRecord {
    pub schema_version: u16,
    pub record_id: u64,
    pub player_profile: Pubkey,
    pub raid_id: u64,
    pub difficulty_id: u64,
    pub difficulty_version: u32,
    pub result: RaidResult,
    #[max_len(64)]
    pub retained_assets: Vec<Pubkey>,
    #[max_len(64)]
    pub lost_assets: Vec<Pubkey>,
    pub entry_fee_paid: u64,
    pub started_at: i64,
    pub settled_at: i64,
    #[max_len(128)]
    pub random_event_audits: Vec<RandomEventAudit>,
    pub bump: u8,
}
