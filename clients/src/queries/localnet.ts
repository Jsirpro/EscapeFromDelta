import { createHash } from "node:crypto";

import type { BattleRecord, PlayerProfile, RaidStatus, RandomEventAudit, RiskLevel } from "../types";

const RPC_URL = process.env.RPC_URL ?? process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_INDEXES = new Map(BASE58_ALPHABET.split("").map((char, index) => [char, index]));

interface RpcAccount {
  pubkey: string;
  account: {
    data: [string, string];
  };
}

interface DecodedPlayerProfileAccount {
  address: string;
  profile: PlayerProfile;
}

interface DecodedBattleRecordAccount {
  address: string;
  record: BattleRecord;
}

interface DecodedRaidSessionAccount {
  address: string;
  raid: {
    status: RaidStatus;
    currentArea: RiskLevel;
    safeCaseCapacity: number;
    safeCaseItems: string[];
    lootItems: LootDisplayItem[];
  };
}

export interface LootDisplayItem {
  assetId: string;
  rarity: "rare" | "epic" | "legendary";
  label: string;
}

class ByteReader {
  constructor(private readonly bytes: Uint8Array, private offset = 0) {}

  position(): number {
    return this.offset;
  }

  readU8(): number {
    return this.bytes[this.offset++] ?? 0;
  }

  readBool(): boolean {
    return this.readU8() === 1;
  }

  readU16(): number {
    const value = new DataView(this.bytes.buffer, this.bytes.byteOffset + this.offset, 2).getUint16(0, true);
    this.offset += 2;
    return value;
  }

  readU32(): number {
    const value = new DataView(this.bytes.buffer, this.bytes.byteOffset + this.offset, 4).getUint32(0, true);
    this.offset += 4;
    return value;
  }

  readU64(): bigint {
    const value = new DataView(this.bytes.buffer, this.bytes.byteOffset + this.offset, 8).getBigUint64(0, true);
    this.offset += 8;
    return value;
  }

  readI64(): bigint {
    const value = new DataView(this.bytes.buffer, this.bytes.byteOffset + this.offset, 8).getBigInt64(0, true);
    this.offset += 8;
    return value;
  }

  readBytes(length: number): Uint8Array {
    const slice = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  readPubkey(): string {
    return encodeBase58(this.readBytes(32));
  }

  readOptionalPubkey(): string | undefined {
    return this.readU8() === 0 ? undefined : this.readPubkey();
  }

  readPubkeyVec(): string[] {
    const length = this.readU32();
    return Array.from({ length }, () => this.readPubkey());
  }
}

export async function fetchPlayerProfileByWallet(
  wallet: string,
  programId: string,
  rpcUrl = RPC_URL,
): Promise<DecodedPlayerProfileAccount | null> {
  const derivedAddress = derivePlayerProfileAddress(wallet, programId);
  const directAccount = await getAccountInfo(derivedAddress, rpcUrl);
  if (directAccount?.data?.[0]) {
    return {
      address: derivedAddress,
      profile: decodePlayerProfileAccount(directAccount.data[0]),
    };
  }

  const accounts = await getProgramAccounts(programId, rpcUrl, [
    {
      memcmp: {
        offset: 0,
        bytes: encodeBase58(accountDiscriminator("PlayerProfile")),
      },
    },
    {
      memcmp: {
        offset: 10,
        bytes: wallet,
      },
    },
  ]);

  const first = accounts[0];
  if (!first) return null;
  return {
    address: first.pubkey,
    profile: decodePlayerProfileAccount(first.account.data[0]),
  };
}

export async function fetchBattleRecordsByPlayer(
  playerProfileAddress: string,
  programId: string,
  limit = 50,
  rpcUrl = RPC_URL,
): Promise<DecodedBattleRecordAccount[]> {
  const accounts = await getProgramAccounts(programId, rpcUrl, [
    {
      memcmp: {
        offset: 0,
        bytes: encodeBase58(accountDiscriminator("BattleRecord")),
      },
    },
  ]);

  return accounts
    .map((account) => ({
      address: account.pubkey,
      record: decodeBattleRecordAccount(account.account.data[0]),
    }))
    .filter((entry) => entry.record.playerProfile === playerProfileAddress)
    .sort((left, right) => Number(BigInt(right.record.raidId) - BigInt(left.record.raidId)))
    .slice(0, limit);
}

export async function fetchBattleRecordsByWallet(
  wallet: string,
  programId: string,
  limit = 50,
  rpcUrl = RPC_URL,
): Promise<DecodedBattleRecordAccount[]> {
  const profile = await fetchPlayerProfileByWallet(wallet, programId, rpcUrl);
  if (!profile) return [];
  return fetchBattleRecordsByPlayer(profile.address, programId, limit, rpcUrl);
}

export async function fetchRaidSessionByAddress(
  address: string,
  rpcUrl = RPC_URL,
): Promise<DecodedRaidSessionAccount | null> {
  const account = await getAccountInfo(address, rpcUrl);
  if (!account?.data?.[0]) {
    return null;
  }
  return {
    address,
    raid: decodeRaidSessionAccount(account.data[0]),
  };
}

async function getProgramAccounts(
  programId: string,
  rpcUrl: string,
  filters: Array<Record<string, unknown>>,
): Promise<RpcAccount[]> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getProgramAccounts",
      params: [
        programId,
        {
          encoding: "base64",
          filters,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`rpc-http-${response.status}`);
  }

  const payload = (await response.json()) as { error?: { message?: string }; result?: RpcAccount[] };
  if (payload.error) {
    throw new Error(payload.error.message ?? "rpc-error");
  }
  return payload.result ?? [];
}

async function getAccountInfo(
  address: string,
  rpcUrl: string,
): Promise<{ data: [string, string] } | null> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getAccountInfo",
      params: [
        address,
        {
          encoding: "base64",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`rpc-http-${response.status}`);
  }

  const payload = (await response.json()) as {
    error?: { message?: string };
    result?: { value?: { data: [string, string] } | null };
  };
  if (payload.error) {
    throw new Error(payload.error.message ?? "rpc-error");
  }
  return payload.result?.value ?? null;
}

function decodePlayerProfileAccount(base64: string): PlayerProfile {
  const bytes = Buffer.from(base64, "base64");
  const reader = new ByteReader(bytes.subarray(8));
  const schemaVersion = reader.readU16();
  const wallet = reader.readPubkey() as PlayerProfile["wallet"];
  const grantClaimed = reader.readBool();
  reader.readI64();
  return {
    schemaVersion,
    wallet,
    grantClaimed,
    edcoinsBalance: reader.readU64() as PlayerProfile["edcoinsBalance"],
    armorPointBalance: reader.readU16() as PlayerProfile["armorPointBalance"],
    weaponPointBalance: reader.readU16() as PlayerProfile["weaponPointBalance"],
    warehouseNonce: reader.readU64(),
    nextRaidId: reader.readU64(),
    activeRaid: reader.readOptionalPubkey() as PlayerProfile["activeRaid"],
  };
}

function decodeBattleRecordAccount(base64: string): BattleRecord {
  const bytes = Buffer.from(base64, "base64");
  const reader = new ByteReader(bytes.subarray(8));
  return {
    schemaVersion: reader.readU16(),
    recordId: reader.readU64().toString(),
    playerProfile: reader.readPubkey() as BattleRecord["playerProfile"],
    raidId: reader.readU64().toString(),
    difficultyId: reader.readU64().toString(),
    difficultyVersion: reader.readU32(),
    result: decodeRaidResult(reader.readU8()),
    retainedAssets: reader.readPubkeyVec() as BattleRecord["retainedAssets"],
    lostAssets: reader.readPubkeyVec() as BattleRecord["lostAssets"],
    randomEvents: readRandomEventAudits(reader),
  };
}

function readRandomEventAudits(reader: ByteReader): RandomEventAudit[] {
  const _entryFeePaid = reader.readU64();
  const _startedAt = reader.readI64();
  const _settledAt = reader.readI64();
  const length = reader.readU32();
  const audits = Array.from({ length }, () => {
    const eventId = reader.readU64().toString();
    const type = decodeRandomEventType(reader.readU8());
    const finalRandomValue = reader.readU64().toString();
    const threshold = reader.readU16().toString();
    const outcome = decodeRandomOutcome(reader.readU8());
    const _createdAt = reader.readI64();
    return { eventId, type, finalRandomValue, threshold, outcome };
  });
  const _bump = reader.readU8();
  return audits;
}

function decodeRaidSessionAccount(base64: string): DecodedRaidSessionAccount["raid"] {
  const bytes = Buffer.from(base64, "base64");
  try {
    return decodeRaidSessionLayout(bytes.subarray(8), true);
  } catch {
    return decodeRaidSessionLayout(bytes.subarray(8), false);
  }
}

function decodeRaidSessionLayout(bytes: Uint8Array, hasPendingLoot: boolean): DecodedRaidSessionAccount["raid"] {
  const reader = new ByteReader(bytes);
  const _schemaVersion = reader.readU16();
  const _raidId = reader.readU64();
  const _playerProfile = reader.readPubkey();
  const status = decodeRaidStatus(reader.readU8());
  const _lockedDifficulty = reader.readPubkey();
  const _lockedDifficultyId = reader.readU64();
  const _lockedDifficultyVersion = reader.readU32();
  const _entryFeePaid = reader.readU64();
  const _selectedSafeCase = reader.readOptionalPubkey();
  const safeCaseCapacity = reader.readU8();
  const safeCaseSelectionLength = reader.readU32();
  if (safeCaseSelectionLength > 3) {
    throw new Error("invalid-safe-case-length");
  }
  const safeCaseItems: string[] = [];
  for (let index = 0; index < safeCaseSelectionLength; index += 1) {
    safeCaseItems.push(reader.readPubkey());
  }
  const _armorAsset = reader.readPubkey();
  const _weaponAsset = reader.readPubkey();
  const _currentArmorTenths = reader.readU16();
  const _currentWeaponTenths = reader.readU16();
  const currentArea = decodeRiskLevel(reader.readU8());
  const areaStatesLength = reader.readU32();
  if (areaStatesLength > 3) {
    throw new Error("invalid-area-state-length");
  }
  for (let index = 0; index < areaStatesLength; index += 1) {
    reader.readU8();
    reader.readU8();
    reader.readU8();
    reader.readU16();
    reader.readU16();
    reader.readU16();
  }
  if (hasPendingLoot) {
    reader.readOptionalPubkey();
  }
  const carriedLootLength = reader.readU32();
  if (carriedLootLength > 64) {
    throw new Error("invalid-carried-loot-length");
  }
  const carriedLoot = Array.from({ length: carriedLootLength }, () => reader.readPubkey());
  return {
    status,
    currentArea,
    safeCaseCapacity,
    safeCaseItems,
    lootItems: carriedLoot.map(deriveCollectibleDisplay),
  };
}

export function deriveCollectibleDisplay(assetId: string): LootDisplayItem {
  const bytes = decodeBase58(assetId);
  const rarityRoll = ((bytes[0] ?? 0) + (bytes[7] ?? 0) + (bytes[13] ?? 0)) % 100;
  const rarity = rarityRoll < 8 ? "legendary" : rarityRoll < 30 ? "epic" : "rare";
  const poolSize = rarity === "legendary" ? 5 : rarity === "epic" ? 10 : 20;
  const pickSeed =
    (((bytes[3] ?? 0) << 16) | ((bytes[11] ?? 0) << 8) | (bytes[19] ?? 0)) >>> 0;
  const serial = (pickSeed % poolSize) + 1;
  const labelPrefix =
    rarity === "legendary" ? "Legendary Collectible" : rarity === "epic" ? "Epic Collectible" : "Rare Collectible";
  return {
    assetId,
    rarity,
    label: `${labelPrefix} ${serial}`,
  };
}

function decodeRaidResult(value: number): BattleRecord["result"] {
  if (value === 0) return "succeeded";
  if (value === 1) return "failed";
  return "timed_out";
}

function decodeRaidStatus(value: number): RaidStatus {
  if (value === 1) return "active";
  if (value === 2) return "pending_battle";
  if (value === 3) return "extracting";
  if (value === 4) return "succeeded";
  if (value === 5) return "failed";
  if (value === 6) return "timed_out";
  return "preparing";
}

function decodeRiskLevel(value: number): RiskLevel {
  if (value === 1) return "medium";
  if (value === 2) return "high";
  return "low";
}

function decodeRandomEventType(value: number): RandomEventAudit["type"] {
  if (value === 0) return "encounter_check";
  if (value === 1) return "battle_result";
  return "loot_drop";
}

function decodeRandomOutcome(value: number): string {
  return [
    "no_encounter",
    "encounter",
    "player_won",
    "player_lost",
    "loot_common",
    "loot_uncommon",
    "loot_rare",
    "loot_epic",
    "loot_legendary",
  ][value] ?? "unknown";
}

function accountDiscriminator(name: string): Uint8Array {
  return createHash("sha256").update(`account:${name}`).digest().subarray(0, 8);
}

function derivePlayerProfileAddress(wallet: string, programId: string): string {
  const [address] = findProgramAddress(
    [new TextEncoder().encode("player"), decodeBase58(wallet)],
    decodeBase58(programId),
  );
  return encodeBase58(address);
}

export function encodeBase58(bytes: Uint8Array): string {
  let digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let index = 0; index < digits.length; index += 1) {
      const value = digits[index] * 256 + carry;
      digits[index] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let output = "";
  for (const byte of bytes) {
    if (byte !== 0) break;
    output += "1";
  }
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    output += BASE58_ALPHABET[digits[index]];
  }
  return output || "1";
}

function findProgramAddress(seeds: Uint8Array[], programId: Uint8Array): [Uint8Array, number] {
  for (let bump = 255; bump >= 0; bump -= 1) {
    const candidate = createProgramAddress([...seeds, Uint8Array.of(bump)], programId);
    if (candidate) {
      return [candidate, bump];
    }
  }
  throw new Error("unable-to-derive-pda");
}

function createProgramAddress(seeds: Uint8Array[], programId: Uint8Array): Uint8Array | null {
  const buffer = Buffer.concat([
    ...seeds.map((seed) => Buffer.from(seed)),
    Buffer.from(programId),
    Buffer.from("ProgramDerivedAddress"),
  ]);
  const hash = createHash("sha256").update(buffer).digest();
  return isOnCurve(hash) ? null : Uint8Array.from(hash);
}

function isOnCurve(bytes: Uint8Array): boolean {
  try {
    // Lazy require keeps this file usable in server/runtime contexts already using Buffer APIs.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PublicKey } = require("@solana/web3.js");
    return PublicKey.isOnCurve(bytes);
  } catch {
    return false;
  }
}

export function decodeBase58(value: string): Uint8Array {
  let bytes = [0];
  for (const char of value) {
    const digit = BASE58_INDEXES.get(char);
    if (digit === undefined) {
      throw new Error("invalid-base58");
    }
    let carry = digit;
    for (let index = 0; index < bytes.length; index += 1) {
      const next = bytes[index] * 58 + carry;
      bytes[index] = next & 0xff;
      carry = next >> 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of value) {
    if (char !== "1") break;
    bytes.push(0);
  }
  return Uint8Array.from(bytes.reverse());
}
