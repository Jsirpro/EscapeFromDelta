import type { EdcoinsLamports, PlayerProfile, Tenths, WalletAddress } from "../types";
import { decodeJsonAccount, requireNumber, requireString } from "./decoders";

export interface PlayerWalletState {
  profile: PlayerProfile;
  edcoins: EdcoinsLamports;
  armorPointBalance: Tenths;
  weaponPointBalance: Tenths;
}

export function decodePlayerProfile(account: { owner: string; data: unknown }, programId: string): PlayerProfile {
  return decodeJsonAccount(account, programId, (value) => ({
    schemaVersion: 1,
    wallet: requireString(value.wallet, "wallet") as WalletAddress,
    grantClaimed: value.grantClaimed === true,
    edcoinsBalance: BigInt(requireNumber(value.edcoinsBalance, "edcoinsBalance")) as EdcoinsLamports,
    armorPointBalance: requireNumber(value.armorPointBalance, "armorPointBalance") as Tenths,
    weaponPointBalance: requireNumber(value.weaponPointBalance, "weaponPointBalance") as Tenths,
    warehouseNonce: BigInt(requireNumber(value.warehouseNonce, "warehouseNonce")),
    nextRaidId: BigInt(requireNumber(value.nextRaidId, "nextRaidId")),
    activeRaid: typeof value.activeRaid === "string" ? (value.activeRaid as PlayerProfile["activeRaid"]) : undefined,
  }));
}

export function formatTenths(value: number): string {
  return (value / 10).toFixed(1);
}
