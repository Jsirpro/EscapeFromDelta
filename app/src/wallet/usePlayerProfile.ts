"use client";

import { useEffect, useMemo, useState } from "react";
import { formatTenths } from "../../../clients/src/queries/player";
import type { BattleRecord, PlayerProfile } from "../../../clients/src/types";

import { useWalletState } from "./provider";

interface RemotePlayerProfilePayload {
  schemaVersion: number;
  wallet: string;
  grantClaimed: boolean;
  edcoinsBalance: string;
  armorPointBalance: number;
  weaponPointBalance: number;
  warehouseNonce: string;
  nextRaidId: string;
  activeRaid?: string;
}

export function usePlayerProfile() {
  const wallet = useWalletState();
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [remoteProfile, setRemoteProfile] = useState<PlayerProfile | null>(null);
  const [remoteBattleRecords, setRemoteBattleRecords] = useState<BattleRecord[] | null>(null);
  const profile = wallet.profile;

  const refreshRemote = async () => {
    if (!wallet.connected || !wallet.walletAddress) {
      setRemoteProfile(null);
      setRemoteBattleRecords(null);
      return;
    }
    const [playerPayload, recordPayload] = await Promise.all([
      fetch(`/api/player/${wallet.walletAddress}`).then((response) => response.json()),
      fetch(`/api/records/${wallet.walletAddress}?limit=50`).then((response) => response.json()),
    ]);
    setRemoteProfile(playerPayload.profile ? hydrateRemoteProfile(playerPayload.profile) : null);
    setRemoteBattleRecords(recordPayload.records ?? []);
  };

  useEffect(() => {
    let cancelled = false;
    void refreshRemote().catch(() => {
      if (!cancelled) {
        setRemoteProfile(null);
        setRemoteBattleRecords(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [wallet.connected, wallet.walletAddress]);

  return useMemo(
    () => ({
      ...wallet,
      conversionError,
      setConversionError,
      edcoinsBalance: (remoteProfile?.edcoinsBalance ?? profile?.edcoinsBalance) ?? 0n,
      armorPointBalance: remoteProfile
        ? Number(formatTenths(remoteProfile.armorPointBalance))
        : profile
          ? Number(formatTenths(profile.armorPointBalance))
          : 0,
      weaponPointBalance: remoteProfile
        ? Number(formatTenths(remoteProfile.weaponPointBalance))
        : profile
          ? Number(formatTenths(profile.weaponPointBalance))
          : 0,
      battleRecords: remoteBattleRecords ?? wallet.battleRecords,
      refreshRemote,
      startDemoRaid: async () => {
        await wallet.startDemoRaid();
        await refreshRemote();
      },
      openDemoContainer: async (containerIndex?: number, finalRandomValue?: number) => {
        await wallet.openDemoContainer(containerIndex, finalRandomValue);
        await refreshRemote();
      },
      fightDemoEnemy: async () => {
        await wallet.fightDemoEnemy();
        await refreshRemote();
      },
      moveDemoArea: async (area: "low" | "medium" | "high") => {
        await wallet.moveDemoArea(area);
        await refreshRemote();
      },
      settleDemoRaid: async (result: "succeeded" | "failed") => {
        await wallet.settleDemoRaid(result);
        await refreshRemote();
      },
      duplicateGrant: false,
    }),
    [wallet, profile, remoteProfile, remoteBattleRecords, conversionError],
  );
}

function hydrateRemoteProfile(payload: RemotePlayerProfilePayload): PlayerProfile {
  return {
    schemaVersion: payload.schemaVersion,
    wallet: payload.wallet as PlayerProfile["wallet"],
    grantClaimed: payload.grantClaimed,
    edcoinsBalance: BigInt(payload.edcoinsBalance) as PlayerProfile["edcoinsBalance"],
    armorPointBalance: payload.armorPointBalance as PlayerProfile["armorPointBalance"],
    weaponPointBalance: payload.weaponPointBalance as PlayerProfile["weaponPointBalance"],
    warehouseNonce: BigInt(payload.warehouseNonce),
    nextRaidId: BigInt(payload.nextRaidId),
    activeRaid: payload.activeRaid as PlayerProfile["activeRaid"],
  };
}
