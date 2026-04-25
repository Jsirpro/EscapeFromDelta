"use client";

import { Connection } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";
import { formatTenths } from "../../../clients/src/queries/player";
import type { BattleRecord, PlayerProfile } from "../../../clients/src/types";
import { fetchBrowserPlayerProfile, fetchBrowserRaidState } from "../lib/onchain";

import { useWalletState } from "./provider";

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
  const connection = useMemo(
    () => new Connection(process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com", "confirmed"),
    [],
  );
  const programId = process.env.NEXT_PUBLIC_PROGRAM_ID ?? process.env.PROGRAM_ID ?? "7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ";

  const refreshRemote = async () => {
    if (!wallet.connected || !wallet.walletAddress) {
      setRemoteProfile(null);
      setRemoteRaid(null);
      setRemoteLoaded(false);
      return;
    }
    const playerPayload = await fetchBrowserPlayerProfile(connection, wallet.walletAddress, programId);
    const nextProfile = playerPayload?.profile ?? null;
    const nextRaid = nextProfile?.activeRaid ? await fetchBrowserRaidState(connection, nextProfile.activeRaid) : null;
    setRemoteProfile(nextProfile);
    setRemoteRaid(nextRaid);
    setRemoteLoaded(true);
    return { profile: nextProfile, raid: nextRaid };
  };

  const refreshRecords = async () => {
    if (!wallet.connected || !wallet.walletAddress) {
      setRemoteBattleRecords(null);
      return null;
    }
    const recordPayload = await fetch(`/api/records/${wallet.walletAddress}?limit=50`, { cache: "no-store" }).then((response) => response.json());
    const nextRecords = recordPayload.records ?? [];
    setRemoteBattleRecords(nextRecords);
    return nextRecords;
  };

  useEffect(() => {
    let cancelled = false;
    void refreshRemote().catch(() => {
      if (!cancelled) {
        setRemoteProfile(null);
        setRemoteRaid(null);
        setRemoteLoaded(true);
      }
    });
    void refreshRecords().catch(() => {
      if (!cancelled) {
        setRemoteBattleRecords(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [wallet.connected, wallet.walletAddress, connection, programId]);

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
      selectSafeCaseItems: async (selectedAssets: string[], capacity: number) => {
        await wallet.selectSafeCaseItems(selectedAssets, capacity);
        return refreshRemoteSafe();
      },
      settleDemoRaid: async (result: "succeeded" | "failed", raidSessionAddress?: string | null) => {
        await wallet.settleDemoRaid(result, raidSessionAddress ?? remoteProfile?.activeRaid ?? null);
        const snapshot = await refreshRemoteSafe();
        await refreshRecords().catch(() => null);
        return snapshot;
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
