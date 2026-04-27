"use client";

import { Connection, PublicKey } from "@solana/web3.js";

import type { PlayerProfile } from "../../../clients/src/types";
import { deriveCollectibleDisplay, type LootDisplayItem } from "./loot";

export interface BrowserRaidState {
  status: "preparing" | "active" | "pending_battle" | "extracting" | "succeeded" | "failed" | "timed_out";
  currentArea: "low" | "medium" | "high";
  safeCaseCapacity: number;
  safeCaseItems: string[];
  lootItems: LootDisplayItem[];
  startedAt: number;
}

class ByteReader {
  constructor(private readonly bytes: Uint8Array, private offset = 0) {}

  readU8() {
    return this.bytes[this.offset++] ?? 0;
  }

  readBool() {
    return this.readU8() === 1;
  }

  readU16() {
    const value = new DataView(this.bytes.buffer, this.bytes.byteOffset + this.offset, 2).getUint16(0, true);
    this.offset += 2;
    return value;
  }

  readU32() {
    const value = new DataView(this.bytes.buffer, this.bytes.byteOffset + this.offset, 4).getUint32(0, true);
    this.offset += 4;
    return value;
  }

  readU64() {
    const value = new DataView(this.bytes.buffer, this.bytes.byteOffset + this.offset, 8).getBigUint64(0, true);
    this.offset += 8;
    return value;
  }

  readI64() {
    const value = new DataView(this.bytes.buffer, this.bytes.byteOffset + this.offset, 8).getBigInt64(0, true);
    this.offset += 8;
    return value;
  }

  readPubkey() {
    const key = new PublicKey(this.bytes.subarray(this.offset, this.offset + 32)).toBase58();
    this.offset += 32;
    return key;
  }

  readOptionalPubkey() {
    return this.readU8() === 0 ? undefined : this.readPubkey();
  }
}

export async function fetchBrowserPlayerProfile(
  connection: Connection,
  wallet: string,
  programId: string,
): Promise<{ address: string; profile: PlayerProfile } | null> {
  const walletKey = new PublicKey(wallet);
  const programKey = new PublicKey(programId);
  const [playerProfile] = PublicKey.findProgramAddressSync([Buffer.from("player"), walletKey.toBytes()], programKey);
  const account = await connection.getAccountInfo(playerProfile, "confirmed");
  if (!account?.data) {
    return null;
  }
  const reader = new ByteReader(account.data.subarray(8));
  const schemaVersion = reader.readU16();
  const profileWallet = reader.readPubkey() as PlayerProfile["wallet"];
  const grantClaimed = reader.readBool();
  reader.readI64();
  return {
    address: playerProfile.toBase58(),
    profile: {
      schemaVersion,
      wallet: profileWallet,
      grantClaimed,
      edcoinsBalance: reader.readU64() as PlayerProfile["edcoinsBalance"],
      armorPointBalance: reader.readU16() as PlayerProfile["armorPointBalance"],
      weaponPointBalance: reader.readU16() as PlayerProfile["weaponPointBalance"],
      warehouseNonce: reader.readU64(),
      nextRaidId: reader.readU64(),
      activeRaid: reader.readOptionalPubkey() as PlayerProfile["activeRaid"],
    },
  };
}

export async function fetchBrowserRaidState(
  connection: Connection,
  raidAddress: string,
): Promise<BrowserRaidState | null> {
  const raidKey = new PublicKey(raidAddress);
  const account = await connection.getAccountInfo(raidKey, "confirmed");
  if (!account?.data) {
    return null;
  }
  const bytes = account.data.subarray(8);
  try {
    return decodeRaidState(bytes, true);
  } catch {
    return decodeRaidState(bytes, false);
  }
}

function decodeRaidState(bytes: Uint8Array, hasPendingLoot: boolean): BrowserRaidState {
  const reader = new ByteReader(bytes);
  reader.readU16();
  reader.readU64();
  reader.readPubkey();
  const status = decodeRaidStatus(reader.readU8());
  reader.readPubkey();
  reader.readU64();
  reader.readU32();
  reader.readU64();
  reader.readOptionalPubkey();
  const safeCaseCapacity = reader.readU8();
  const safeCaseSelectionLength = reader.readU32();
  if (safeCaseSelectionLength > 3) throw new Error("invalid-safe-case-length");
  const safeCaseItems = Array.from({ length: safeCaseSelectionLength }, () => reader.readPubkey());
  reader.readPubkey();
  reader.readPubkey();
  reader.readU16();
  reader.readU16();
  const currentArea = decodeRiskLevel(reader.readU8());
  const areaStatesLength = reader.readU32();
  if (areaStatesLength > 3) throw new Error("invalid-area-state-length");
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
  if (carriedLootLength > 64) throw new Error("invalid-carried-loot-length");
  const carriedLoot = Array.from({ length: carriedLootLength }, () => reader.readPubkey());
  const randomEventsLength = reader.readU32();
  if (randomEventsLength > 128) throw new Error("invalid-random-events-length");
  for (let index = 0; index < randomEventsLength; index += 1) {
    reader.readU64();
    reader.readU8();
    reader.readU64();
    reader.readU16();
    reader.readU8();
    reader.readI64();
  }
  const startedAt = Number(reader.readI64());
  reader.readU8();
  if (bytes.length > 0) {
    // settled_at when present
    if (reader.readBool()) {
      reader.readI64();
    }
  }
  return {
    status,
    currentArea,
    safeCaseCapacity,
    safeCaseItems,
    lootItems: carriedLoot.map(deriveCollectibleDisplay),
    startedAt,
  };
}

function decodeRaidStatus(value: number): BrowserRaidState["status"] {
  if (value === 1) return "active";
  if (value === 2) return "pending_battle";
  if (value === 3) return "extracting";
  if (value === 4) return "succeeded";
  if (value === 5) return "failed";
  if (value === 6) return "timed_out";
  return "preparing";
}

function decodeRiskLevel(value: number): BrowserRaidState["currentArea"] {
  if (value === 1) return "medium";
  if (value === 2) return "high";
  return "low";
}
