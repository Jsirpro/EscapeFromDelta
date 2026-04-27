export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type WalletAddress = Brand<string, "WalletAddress">;
export type AccountAddress = Brand<string, "AccountAddress">;
export type EdcoinsLamports = Brand<bigint, "EdcoinsLamports">;
export type Tenths = Brand<number, "Tenths">;

export const SCHEMA_VERSION = 1;
export const EDCOINS_STARTER_GRANT = 20_000n as EdcoinsLamports;
export const STARTER_ARMOR_TENTHS = 200 as Tenths;
export const STARTER_WEAPON_TENTHS = 200 as Tenths;
export const SOL_TO_EDCOINS_RATE = 10_000_000n;
export const RAID_TIMEOUT_SECONDS = 120;
export const DEFAULT_RECORD_LIMIT = 50;

export type RiskLevel = "low" | "medium" | "high";
export type RaidStatus =
  | "preparing"
  | "active"
  | "pending_battle"
  | "extracting"
  | "succeeded"
  | "failed"
  | "timed_out";

export type AssetType = "collectible" | "armor_points" | "weapon_points" | "safe_case";
export type AssetQuality = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type AssetLockState = "available" | "in_raid" | "listed" | "consumed";
export type ListingStatus = "active" | "sold" | "canceled" | "expired";

export interface PlayerProfile {
  schemaVersion: number;
  wallet: WalletAddress;
  grantClaimed: boolean;
  edcoinsBalance: EdcoinsLamports;
  armorPointBalance: Tenths;
  weaponPointBalance: Tenths;
  warehouseNonce: bigint;
  nextRaidId: bigint;
  activeRaid?: AccountAddress;
}

export interface WarehouseAsset {
  schemaVersion: number;
  address: AccountAddress;
  assetId: string;
  ownerProfile: AccountAddress;
  assetType: AssetType;
  quality?: AssetQuality;
  collectibleCode?: string;
  armorTenths: number;
  weaponTenths: number;
  safeCaseCapacity: number;
  lockedState: AssetLockState;
  tradable: boolean;
  createdFrom: number;
}

export interface RandomEventAudit {
  eventId: string;
  type: "encounter_check" | "battle_result" | "loot_drop";
  finalRandomValue: string;
  threshold: string;
  outcome: string;
}

export interface BattleRecord {
  schemaVersion: number;
  recordId: string;
  playerProfile: AccountAddress;
  raidId: string;
  difficultyId: string;
  difficultyVersion: number;
  result: "succeeded" | "failed" | "timed_out";
  retainedAssets: AccountAddress[];
  lostAssets: AccountAddress[];
  randomEvents: RandomEventAudit[];
}

export interface DifficultyConfiguration {
  schemaVersion: number;
  difficultyId: string;
  version: number;
  name: string;
  active: boolean;
  entryFeeEdcoins: EdcoinsLamports;
  baseEncounterChances: Record<RiskLevel, number>;
}

export interface MarketplaceListing {
  schemaVersion: number;
  address: AccountAddress;
  listingId: string;
  sellerProfile: AccountAddress;
  assetId: AccountAddress;
  priceEdcoins: string;
  feePaidEdcoins: string;
  status: ListingStatus;
  buyerProfile?: AccountAddress;
  createdAt: string;
  settledAt?: string;
}
