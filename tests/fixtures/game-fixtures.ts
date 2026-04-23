import type {
  BattleRecord,
  DifficultyConfiguration,
  EdcoinsLamports,
  PlayerProfile,
  WarehouseAsset,
} from "../../clients/src/types";

export const PROGRAM_ID = "11111111111111111111111111111111";
export const PLAYER_WALLET = "Player111111111111111111111111111111111111";
export const ADMIN_WALLET = "Admin1111111111111111111111111111111111111";

export const playerProfileFixture: PlayerProfile = {
  schemaVersion: 1,
  wallet: PLAYER_WALLET as PlayerProfile["wallet"],
  grantClaimed: true,
  edcoinsBalance: 20_000n as PlayerProfile["edcoinsBalance"],
  armorPointBalance: 200 as PlayerProfile["armorPointBalance"],
  weaponPointBalance: 200 as PlayerProfile["weaponPointBalance"],
  warehouseNonce: 1n,
  nextRaidId: 1n,
};

export const difficultyFixture: DifficultyConfiguration = {
  schemaVersion: 1,
  difficultyId: "standard",
  version: 1,
  name: "Standard Demo",
  active: true,
  entryFeeEdcoins: 1000n as EdcoinsLamports,
  baseEncounterChances: {
    low: 10,
    medium: 30,
    high: 50,
  },
};

export const armorAssetFixture: WarehouseAsset = {
  schemaVersion: 1,
  address: "ArmorAsset111111111111111111111111111111111" as WarehouseAsset["address"],
  ownerProfile: "PlayerProfile111111111111111111111111111111" as WarehouseAsset["ownerProfile"],
  assetType: "armor_points",
  armorTenths: 200,
  weaponTenths: 0,
  safeCaseCapacity: 0,
  lockedState: "available",
  tradable: true,
};

export const weaponAssetFixture: WarehouseAsset = {
  ...armorAssetFixture,
  address: "WeaponAsset11111111111111111111111111111111" as WarehouseAsset["address"],
  assetType: "weapon_points",
  armorTenths: 0,
  weaponTenths: 200,
};

export const battleRecordFixture: BattleRecord = {
  schemaVersion: 1,
  recordId: "record-1",
  playerProfile: armorAssetFixture.ownerProfile,
  raidId: "raid-1",
  difficultyId: difficultyFixture.difficultyId,
  difficultyVersion: difficultyFixture.version,
  result: "succeeded",
  retainedAssets: [armorAssetFixture.address],
  lostAssets: [],
  randomEvents: [
    {
      eventId: "event-1",
      type: "encounter_check",
      finalRandomValue: "42",
      threshold: "10%",
      outcome: "no_encounter",
    },
  ],
};
