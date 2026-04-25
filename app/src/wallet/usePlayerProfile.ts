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

interface RemoteRaidPayload {
  status: "preparing" | "active" | "pending_battle" | "extracting" | "succeeded" | "failed" | "timed_out";
  currentArea: "low" | "medium" | "high";
  safeCaseCapacity: number;
  safeCaseItems: string[];
  lootItems: Array<{
    assetId: string;
    rarity: "rare" | "epic" | "legendary";
    label: string;
  }>;
}

export function usePlayerProfile() {
  const wallet = useWalletState();
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [remoteProfile, setRemoteProfile] = useState<PlayerProfile | null>(null);
  const [remoteBattleRecords, setRemoteBattleRecords] = useState<BattleRecord[] | null>(null);
  const [remoteRaid, setRemoteRaid] = useState<RemoteRaidPayload | null>(null);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const profile = wallet.profile;

  const refreshRemote = async () => {
    if (!wallet.connected || !wallet.walletAddress) {
      setRemoteProfile(null);
      setRemoteBattleRecords(null);
      setRemoteRaid(null);
      setRemoteLoaded(false);
      return;
    }
    const [playerPayload, recordPayload] = await Promise.all([
      fetch(`/api/player/${wallet.walletAddress}`, { cache: "no-store" }).then((response) => response.json()),
      fetch(`/api/records/${wallet.walletAddress}?limit=50`, { cache: "no-store" }).then((response) => response.json()),
    ]);
    const nextProfile = playerPayload.profile ? hydrateRemoteProfile(playerPayload.profile) : null;
    const nextRecords = recordPayload.records ?? [];
    const nextRaid = playerPayload.raid ?? null;
    setRemoteProfile(nextProfile);
    setRemoteBattleRecords(nextRecords);
    setRemoteRaid(nextRaid);
    setRemoteLoaded(true);
    return { profile: nextProfile, records: nextRecords, raid: nextRaid };
  };

  useEffect(() => {
    let cancelled = false;
    void refreshRemote().catch(() => {
      if (!cancelled) {
        setRemoteProfile(null);
        setRemoteBattleRecords(null);
        setRemoteRaid(null);
        setRemoteLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [wallet.connected, wallet.walletAddress]);

  useEffect(() => {
    if (!wallet.connected || !wallet.walletAddress) return;
    const intervalId = window.setInterval(() => {
      void refreshRemote().catch(() => undefined);
    }, 3_000);
    return () => window.clearInterval(intervalId);
  }, [wallet.connected, wallet.walletAddress]);

  async function refreshRemoteSafe() {
    try {
      return await refreshRemote();
    } catch {
      return null;
    }
  }

  return useMemo(
    () => ({
      ...wallet,
      profile: wallet.connected ? remoteProfile : profile,
      onChainProfile: remoteProfile,
      onChainActiveRaid: remoteProfile?.activeRaid ?? null,
      onChainRaidStatus: remoteRaid?.status ?? null,
      onChainRaidArea: remoteRaid?.currentArea ?? null,
      onChainSafeCaseCapacity: remoteRaid?.safeCaseCapacity ?? 0,
      onChainSafeCaseItems: remoteRaid?.safeCaseItems ?? [],
      onChainLootItems: remoteRaid?.lootItems ?? [],
      onChainProfileLoaded: remoteLoaded,
      conversionError,
      setConversionError,
      edcoinsBalance: wallet.connected ? (remoteProfile?.edcoinsBalance ?? 0n) : (profile?.edcoinsBalance ?? 0n),
      armorPointBalance: remoteProfile
        ? Number(formatTenths(remoteProfile.armorPointBalance))
        : wallet.connected
          ? 0
          : profile
          ? Number(formatTenths(profile.armorPointBalance))
          : 0,
      weaponPointBalance: remoteProfile
        ? Number(formatTenths(remoteProfile.weaponPointBalance))
        : wallet.connected
          ? 0
          : profile
          ? Number(formatTenths(profile.weaponPointBalance))
          : 0,
      battleRecords: remoteBattleRecords ?? wallet.battleRecords,
      refreshRemote,
      purchaseLoadoutPoints: async (kind: "armor" | "weapon", amountTenths = 10) => {
        await wallet.purchaseLoadoutPoints(kind, amountTenths);
        return refreshRemoteSafe();
      },
      startDemoRaid: async (safeCaseCapacity = 0) => {
        await wallet.startDemoRaid(safeCaseCapacity);
        return refreshRemoteSafe();
      },
      openDemoContainer: async (containerIndex?: number, finalRandomValue?: number) => {
        await wallet.openDemoContainer(containerIndex, finalRandomValue);
        return refreshRemoteSafe();
      },
      fightDemoEnemy: async () => {
        await wallet.fightDemoEnemy();
        return refreshRemoteSafe();
      },
      moveDemoArea: async (area: "low" | "medium" | "high") => {
        await wallet.moveDemoArea(area);
        return refreshRemoteSafe();
      },
      settleDemoRaid: async (result: "succeeded" | "failed", raidSessionAddress?: string | null) => {
        await wallet.settleDemoRaid(result, raidSessionAddress ?? remoteProfile?.activeRaid ?? null);
        return refreshRemoteSafe();
      },
      duplicateGrant: false,
      convertDemoSol: async (solAmount = 1n) => {
        await wallet.convertDemoSol(solAmount);
        return refreshRemoteSafe();
      },
    }),
    [wallet, profile, remoteProfile, remoteBattleRecords, remoteRaid, conversionError, remoteLoaded],
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
