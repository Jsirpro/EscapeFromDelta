"use client";

import Link from "next/link";
import { Shield, Zap, Skull, Target, Activity, Box, Settings, Terminal, Lock, Radio } from "lucide-react";
import React, { useEffect, useMemo, useReducer, useState } from "react";

import { DifficultySelector } from "../../game/DifficultySelector";
import { LanguageToggle } from "../../components/LanguageToggle";
import { EquipmentSelector } from "../../game/EquipmentSelector";
import { RaidActionPanel } from "../../game/RaidActionPanel";
import { RaidResult } from "../../game/RaidResult";
import { SafeCaseSelection } from "../../game/SafeCaseSelection";
import { useI18n } from "../../i18n";
import { initialRaidUiState, raidReducer } from "../../game/raidMachine";
import { usePlayerProfile } from "../../wallet/usePlayerProfile";

export default function PlayPage() {
  const [state, dispatch] = useReducer(raidReducer, initialRaidUiState);
  const player = usePlayerProfile();
  const { t } = useI18n();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<null | "start" | "open" | "move" | "fight" | "extract" | "abandon" | "buy-armor" | "buy-weapon">(null);
  const [hasLocalActiveRaid, setHasLocalActiveRaid] = useState(false);
  const [forceReadyMode, setForceReadyMode] = useState(true);
  const [safeCaseCapacity, setSafeCaseCapacity] = useState(0);
  const [updatingSafeCase, setUpdatingSafeCase] = useState(false);
  const [armorPurchaseAmount, setArmorPurchaseAmount] = useState("1.0");
  const [weaponPurchaseAmount, setWeaponPurchaseAmount] = useState("1.0");
  const hasActiveRaid = !forceReadyMode && (hasLocalActiveRaid || Boolean(player.onChainActiveRaid));
  const showResumePrompt = hasActiveRaid && (state.status === "preparing" || state.status === "transitioning");
  const startArmorCost = 2.0;
  const startWeaponCost = 2.0;
  const safeCaseUnitPrice = 500;
  const safeCasePrice = safeCaseCapacity * safeCaseUnitPrice;
  const totalStartEdcoinsCost = 1000 + safeCasePrice;
  const armorPurchasePrice = purchasePriceValue(armorPurchaseAmount);
  const weaponPurchasePrice = purchasePriceValue(weaponPurchaseAmount);
  const armorPurchaseDisabled = busyAction !== null || armorPurchasePrice <= 0 || BigInt(armorPurchasePrice) > player.edcoinsBalance;
  const weaponPurchaseDisabled = busyAction !== null || weaponPurchasePrice <= 0 || BigInt(weaponPurchasePrice) > player.edcoinsBalance;
  const startRaidDisabled =
    busyAction !== null ||
    player.armorPointBalance < startArmorCost ||
    player.weaponPointBalance < startWeaponCost ||
    BigInt(totalStartEdcoinsCost) > player.edcoinsBalance;

  const raidStatusLabel = useMemo(() => {
    if (busyAction === "start") return t.play.deploying;
    if (busyAction === "open") return t.play.openingContainer;
    if (busyAction === "fight") return t.play.engagingEnemy;
    if (busyAction === "move") return t.play.movingZone;
    if (busyAction === "extract") return t.play.extracting;
    if (busyAction === "abandon") return t.play.abandoningRaid;
    if (busyAction === "buy-armor" || busyAction === "buy-weapon") return t.play.loadoutPurchasePrice;
    if (state.status === "pending_battle") return t.play.awaitingFight;
    if (state.status === "active") return t.play.inRaid;
    if (state.status === "succeeded") return t.play.extracted;
    if (state.status === "failed") return t.play.raidFailed;
    return t.play.routeClear;
  }, [busyAction, state.status, t]);

  useEffect(() => {
    setActionError(null);
    setBusyAction(null);
    setHasLocalActiveRaid(false);
    setForceReadyMode(true);
    setSafeCaseCapacity(0);
    dispatch({ type: "reset" });
  }, [player.walletAddress]);

  useEffect(() => {
    if (player.onChainActiveRaid) {
      setForceReadyMode(false);
      setHasLocalActiveRaid(true);
      return;
    }
    if (!player.onChainProfileLoaded) return;
    if (forceReadyMode) return;
    if (hasLocalActiveRaid) {
      setHasLocalActiveRaid(false);
    }
    if (state.status !== "preparing" && state.status !== "transitioning") {
      dispatch({ type: "reset" });
    }
  }, [forceReadyMode, player.onChainProfileLoaded, player.onChainActiveRaid, state.status, hasLocalActiveRaid]);

  useEffect(() => {
    if (forceReadyMode) return;
    if (!hasActiveRaid) return;
    if (!player.onChainRaidArea) return;
    if (state.currentArea === player.onChainRaidArea) return;
    dispatch({ type: "move", area: player.onChainRaidArea });
  }, [forceReadyMode, hasActiveRaid, player.onChainRaidArea, state.currentArea]);

  useEffect(() => {
    if (forceReadyMode) return;
    if (!hasActiveRaid) return;
    if (!player.onChainRaidStatus) return;
    if (player.onChainRaidStatus === "pending_battle" && state.status !== "pending_battle") {
      dispatch({ type: "encounter" });
      return;
    }
    if (player.onChainRaidStatus === "active" && state.status === "pending_battle") {
      dispatch({ type: "win" });
      return;
    }
    if ((player.onChainRaidStatus === "failed" || player.onChainRaidStatus === "timed_out") && state.status !== "failed") {
      setHasLocalActiveRaid(false);
      dispatch({ type: "fail" });
      return;
    }
    if (player.onChainRaidStatus === "succeeded" && state.status !== "succeeded") {
      setHasLocalActiveRaid(false);
      dispatch({ type: "extract" });
    }
  }, [forceReadyMode, hasActiveRaid, player.onChainRaidStatus, state.status]);

  useEffect(() => {
    if (forceReadyMode) return;
    if (!player.onChainProfileLoaded) return;
    if (player.onChainActiveRaid) return;
    if (state.status !== "failed" && state.status !== "succeeded") return;
    if (hasLocalActiveRaid) {
      setHasLocalActiveRaid(false);
    }
  }, [forceReadyMode, player.onChainProfileLoaded, player.onChainActiveRaid, state.status, hasLocalActiveRaid]);

  async function handleRaidAction(action: "open" | "move" | "extract" | "fight") {
    setActionError(null);
    setBusyAction(action);
    try {
      if (action === "open") {
        const snapshot = await player.openDemoContainer(0, 5);
        if (snapshot?.raid?.status === "pending_battle") {
          dispatch({ type: "encounter" });
        }
        return;
      }
      if (action === "fight") {
        const snapshot = await player.fightDemoEnemy();
        if (snapshot?.raid?.status === "active" || snapshot?.profile?.activeRaid) {
          dispatch({ type: "win" });
        } else {
          dispatch({ type: "fail" });
        }
        return;
      }
      if (action === "move") {
        const snapshot = await player.moveDemoArea("medium");
        dispatch({ type: "move", area: snapshot?.raid?.currentArea ?? "medium" });
        return;
      }
      await player.settleDemoRaid("succeeded", player.onChainActiveRaid);
      setHasLocalActiveRaid(false);
      dispatch({ type: "extract" });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "raid-action-failed");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAbandonRaid() {
    setActionError(null);
    setBusyAction("abandon");
    try {
      await player.settleDemoRaid("failed", player.onChainActiveRaid);
      setHasLocalActiveRaid(false);
      dispatch({ type: "fail" });
    } catch (error) {
      const snapshot = await player.refreshRemote().catch(() => null);
      dispatch({ type: "reset" });
      if (isNoActiveRaidError(error) || !snapshot?.profile?.activeRaid) {
        setActionError(null);
      } else {
        setActionError(error instanceof Error ? error.message : "abandon-raid-failed");
      }
    } finally {
      setBusyAction(null);
    }
  }

  async function handleStartRaid() {
    setActionError(null);
    setForceReadyMode(false);
    setBusyAction("start");
    dispatch({ type: "start" });
    try {
      await player.startDemoRaid(safeCaseCapacity);
      setForceReadyMode(false);
      setHasLocalActiveRaid(true);
      dispatch({ type: "landed" });
      void waitForActiveRaid(player.refreshRemote).catch(() => undefined);
    } catch (error) {
      const snapshot = await player.refreshRemote().catch(() => null);
      dispatch({ type: "reset" });
      if (isRaidAlreadyActiveError(error) && snapshot?.profile?.activeRaid) {
        setHasLocalActiveRaid(true);
        setActionError(null);
      } else {
        setActionError(error instanceof Error ? error.message : "start-raid-failed");
      }
    } finally {
      setBusyAction(null);
    }
  }

  async function handlePurchaseLoadout(kind: "armor" | "weapon") {
    setActionError(null);
    setBusyAction(kind === "armor" ? "buy-armor" : "buy-weapon");
    try {
      const rawAmount = kind === "armor" ? armorPurchaseAmount : weaponPurchaseAmount;
      const amountTenths = parsePurchaseTenths(rawAmount);
      await player.purchaseLoadoutPoints(kind, amountTenths);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "purchase-loadout-failed");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleToggleSafeCase(assetId: string) {
    if (!player.onChainSafeCaseCapacity) return;
    setActionError(null);
    setUpdatingSafeCase(true);
    try {
      const nextSelection = player.onChainSafeCaseItems.includes(assetId)
        ? player.onChainSafeCaseItems.filter((item) => item !== assetId)
        : [...player.onChainSafeCaseItems, assetId].slice(0, player.onChainSafeCaseCapacity);
      await player.selectSafeCaseItems(nextSelection, player.onChainSafeCaseCapacity);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "safe-case-update-failed");
    } finally {
      setUpdatingSafeCase(false);
    }
  }

  async function handleResetToReady() {
    setActionError(null);
    setBusyAction("abandon");
    try {
      const shouldSettleOnChain =
        Boolean(player.onChainActiveRaid) &&
        (player.onChainRaidStatus === "active" ||
          player.onChainRaidStatus === "pending_battle" ||
          player.onChainRaidStatus === "timed_out");

      if (shouldSettleOnChain) {
        await player.settleDemoRaid("failed", player.onChainActiveRaid);
      }
      setForceReadyMode(true);
      setHasLocalActiveRaid(false);
      dispatch({ type: "reset" });
    } catch (error) {
      if (isNoActiveRaidError(error)) {
        setForceReadyMode(true);
        setHasLocalActiveRaid(false);
        dispatch({ type: "reset" });
        setActionError(null);
      } else {
        setActionError(error instanceof Error ? error.message : "restart-raid-failed");
      }
    } finally {
      setBusyAction(null);
    }
  }

  // ── 配置页面 UI（参考 testcode/setting.tsx 三栏战术风格）──
  const isPreparingPhase =
    state.status === "preparing" || state.status === "transitioning" || showResumePrompt;

  if (isPreparingPhase) {
    return (
      <div
        className="min-h-screen font-mono selection:bg-emerald-500/30"
        style={{ background: "#05070a", color: "#c0ccd8" }}
      >
        {/* BG scanlines */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,0.25) 50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))",
            backgroundSize: "100% 2px, 2px 100%",
          }}
        />

        {/* Centered inner wrapper */}
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

          {/* Header */}
          <header
            className="flex justify-between items-end relative z-20 px-2 shrink-0"
            style={{ borderBottom: "1px solid rgba(52,211,153,0.1)", paddingBottom: "24px", marginTop: "12px" }}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-emerald-500/10 border border-emerald-500/20">
                  <Radio size={16} className="text-emerald-400" />
                </div>
                {/* <p style={{ fontSize: "10px", letterSpacing: "0.4em", color: "rgba(52,211,153,0.5)", textTransform: "uppercase", margin: 0, fontWeight: 700 }}>
                  {t.play.eyebrow} / SYS_REF_DELTA
                </p> */}
              </div>
              <h1 style={{ fontSize: "2.8rem", fontWeight: 900, fontStyle: "italic", color: "#fff", margin: 0, textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1 }}>
                OPERATIVE <span style={{ color: "#34d399" }}>INTERFACE</span>
              </h1>
            </div>

            <div style={{ display: "flex", gap: "24px", alignItems: "flex-end" }}>
              {/* Tactical Meta */}
              {/* <div className="hidden xl:flex items-center gap-6 pr-6 border-r border-white/5 pb-1">
              <div className="flex flex-col items-end">
                <span style={{ fontSize: "8px", color: "#475569", fontWeight: 900 }}>COORD_LAT</span>
                <span style={{ fontSize: "12px", color: "#e2e8f0", fontWeight: 700, fontFamily: "monospace" }}>34.0522° N</span>
              </div>
              <div className="flex flex-col items-end">
                <span style={{ fontSize: "8px", color: "#475569", fontWeight: 900 }}>COORD_LNG</span>
                <span style={{ fontSize: "12px", color: "#e2e8f0", fontWeight: 700, fontFamily: "monospace" }}>118.2437° W</span>
              </div>
              <div className="flex flex-col items-end">
                <span style={{ fontSize: "8px", color: "#34d399", fontWeight: 900 }}>SIGNAL_STR</span>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ width: 3, height: 8, background: i <= 4 ? "#34d399" : "rgba(255,255,255,0.1)", borderRadius: 1 }} />
                  ))}
                </div>
              </div>
            </div> */}

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Link
                  href="/"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 900,
                    color: "#94a3b8",
                    textDecoration: "none",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    transition: "all 0.2s"
                  }}
                  className="hover:bg-white/10 hover:text-white"
                >
                  {t.common.backHome}
                </Link>
                <LanguageToggle />
              </div>
            </div>
          </header>

          {/* Sub-header status bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 8px 0", marginTop: "-4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: "10px", fontWeight: 900, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                {raidStatusLabel}
              </span>
              <div style={{ height: 1, width: 40, background: "rgba(52,211,153,0.2)" }} />
              <span style={{ fontSize: "9px", color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>
                Session: {player.walletAddress ? player.walletAddress.slice(0, 8) : "GUEST"}
              </span>
            </div>
            <div style={{ fontSize: "9px", color: "#475569", fontWeight: 700 }}>
              TIME: {new Date().toLocaleTimeString([], { hour12: false })}
            </div>
          </div>

          {/* Error banner */}
          {actionError ? (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", fontSize: "12px", color: "#f87171" }}>
              ⚠ {formatPlayError(actionError, t)}
            </div>
          ) : null}

          {/* 3-Column Grid */}
          <main style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", position: "relative", zIndex: 10, overflowY: "auto" }}>

            {/* ── COLUMN 1: Risk zones + Action status + Loot ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>

              {/* Risk zone selector */}
              <TacticalPanel title={`${t.play.lowRisk} / ${t.play.highRisk}`} icon={<Target size={14} className="text-emerald-400" />}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {([
                    { key: "low", label: t.play.lowRisk, sub: t.play.lowEncounter, color: "#34d399" },
                    { key: "medium", label: t.play.mediumRisk, sub: t.play.mediumEncounter, color: "#f59e0b" },
                    { key: "high", label: t.play.highRisk, sub: t.play.highEncounter, color: "#ef4444" },
                  ] as const).map((zone) => (
                    <div
                      key={zone.key}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(255,255,255,0.03)",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        opacity: 0.5,
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: "8px", background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: zone.color }}>
                        {zone.key === "low" ? <Shield size={18} /> : zone.key === "medium" ? <Zap size={18} /> : <Skull size={18} />}
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", color: zone.color }}>{zone.label}</div>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginTop: 2 }}>{zone.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TacticalPanel>

              {/* Action Status */}
              <TacticalPanel title={t.play.status} icon={<Activity size={14} className="text-emerald-400" />}>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "#34d399", textTransform: "uppercase" }}>{raidStatusLabel}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <StatusBox label={t.play.missionControl} value={t.play.lowRisk} />
                  <StatusBox label={t.play.status} value={t.play.startRaid} />
                </div>
                <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ fontSize: "8px", fontWeight: 900, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                    {t.play.startCost}
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>1</div>
                </div>
              </TacticalPanel>

              {/* Loot / Acquired Items */}
              <TacticalPanel title={t.play.lootFound} icon={<Box size={14} className="text-emerald-400" />} flex>
                {player.onChainLootItems.length === 0 ? (
                  <p style={{ fontSize: "10px", color: "#475569", fontStyle: "italic", padding: "12px 4px" }}>{t.play.noLootYet}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {player.onChainLootItems.map((item) => (
                      <div
                        key={item.assetId}
                        style={{
                          background: "rgba(0,0,0,0.4)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "8px",
                          padding: "10px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "9px", color: item.rarity === "legendary" ? "#f59e0b" : item.rarity === "epic" ? "#a855f7" : "#34d399", fontWeight: 900, textTransform: "uppercase", marginBottom: 2 }}>
                            {item.rarity === "legendary" ? t.play.legendary : item.rarity === "epic" ? t.play.epic : t.play.rare}
                          </div>
                          <div style={{ fontSize: "11px", color: "#e2e8f0", fontWeight: 700 }}>{translateLootLabel(item.label, t)}</div>
                        </div>
                        {player.onChainSafeCaseCapacity > 0 ? (
                          <button
                            disabled={busyAction !== null || updatingSafeCase}
                            onClick={() => void handleToggleSafeCase(item.assetId)}
                            style={{
                              background: player.onChainSafeCaseItems.includes(item.assetId) ? "#34d399" : "rgba(52,211,153,0.1)",
                              border: "1px solid rgba(52,211,153,0.3)",
                              borderRadius: "6px",
                              padding: "4px 10px",
                              fontSize: "8px",
                              fontWeight: 900,
                              color: player.onChainSafeCaseItems.includes(item.assetId) ? "#000" : "#34d399",
                              cursor: "pointer",
                              textTransform: "uppercase",
                            }}
                          >
                            {player.onChainSafeCaseItems.includes(item.assetId) ? t.play.safeCaseRemove : t.play.safeCaseKeep}
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </TacticalPanel>
            </div>

            {/* ── COLUMN 2: Balances + Purchase + Carrying Gear ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", padding: "0 4px" }}>
              <div style={{ fontSize: "10px", fontWeight: 900, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: 4 }}>
                <Settings size={14} style={{ color: "#34d399", display: "inline", marginRight: 6 }} /> {t.play.currentBalances} & {t.common.armor}
              </div>

              {/* Current Balance */}
              <StatBlock
                title={t.play.currentBalances}
                armor={player.armorPointBalance.toFixed(1)}
                weapon={player.weaponPointBalance.toFixed(1)}
                edcoins={Number(player.edcoinsBalance)}
                highlight
              />

              {/* Deploy Cost */}
              <StatBlock
                title={t.play.startCost}
                armor={startArmorCost.toFixed(1)}
                weapon={startWeaponCost.toFixed(1)}
                edcoins={totalStartEdcoinsCost}
              />

              {/* Purchase Armor */}
              <PurchaseInputBlock
                label={`${t.play.purchaseAmount} (${t.common.armor})`}
                value={armorPurchaseAmount}
                balance={`${Number(player.edcoinsBalance).toLocaleString()} EDCOINS`}
                price={armorPurchasePrice}
                insufficient={BigInt(armorPurchasePrice) > player.edcoinsBalance}
                insufficientLabel={t.play.insufficientEdcoinsPurchase}
                purchaseHint={t.play.purchaseHint}
                buyLabel={t.play.buyArmorPoint}
                disabled={armorPurchaseDisabled}
                onChange={setArmorPurchaseAmount}
                onBuy={() => void handlePurchaseLoadout("armor")}
              />

              {/* Purchase Weapon */}
              <PurchaseInputBlock
                label={`${t.play.purchaseAmount} (${t.common.weapon})`}
                value={weaponPurchaseAmount}
                balance={`${Number(player.edcoinsBalance).toLocaleString()} EDCOINS`}
                price={weaponPurchasePrice}
                insufficient={BigInt(weaponPurchasePrice) > player.edcoinsBalance}
                insufficientLabel={t.play.insufficientEdcoinsPurchase}
                purchaseHint={t.play.purchaseHint}
                buyLabel={t.play.buyWeaponPoint}
                disabled={weaponPurchaseDisabled}
                onChange={setWeaponPurchaseAmount}
                onBuy={() => void handlePurchaseLoadout("weapon")}
              />

              {/* Carrying Gear */}
              <TacticalPanel title={t.play.startCost} icon={<Terminal size={14} className="text-emerald-400" />}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "8px", color: "#475569", fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>{t.common.armor}</div>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>{player.armorPointBalance.toFixed(1)}</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "8px", color: "#475569", fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>{t.common.weapon}</div>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>{player.weaponPointBalance.toFixed(1)}</div>
                  </div>
                </div>
              </TacticalPanel>
            </div>

            {/* ── COLUMN 3: Tactical feed + Safe box + CTA + Debug ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Tactical Feed */}
              <div
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  aspectRatio: "16/11",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* grid bg */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.05,
                    backgroundImage: "linear-gradient(#10b981 1px,transparent 1px),linear-gradient(90deg,#10b981 1px,transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    border: "1px solid rgba(52,211,153,0.3)",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "8px",
                    fontWeight: 900,
                    color: "#34d399",
                    textTransform: "uppercase",
                    background: "rgba(0,0,0,0.6)",
                    letterSpacing: "0.1em",
                  }}
                >
                  TACTICAL FEED
                </div>
                <svg viewBox="0 0 200 100" style={{ width: "75%", color: "rgba(52,211,153,0.3)" }}>
                  <path d="M0 50 L40 50 L50 20 L60 80 L70 50 L120 50 L130 10 L140 90 L150 50 L200 50" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 14,
                    fontSize: "8px",
                    fontFamily: "monospace",
                    color: "rgba(255,255,255,0.15)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 900,
                  }}
                >
                  SECTOR_09_LOCKED
                </div>
              </div>

              {/* Safe Box */}
              <TacticalPanel title={t.play.safeCase} icon={<Lock size={14} className="text-emerald-400" />}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: "8px", fontFamily: "monospace", fontWeight: 900, color: "rgba(52,211,153,0.5)", textTransform: "uppercase" }}>
                    SAFE MODE: ON
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: 10 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <button
                      key={i}
                      disabled={busyAction !== null || hasActiveRaid}
                      onClick={() => setSafeCaseCapacity(i)}
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        border: safeCaseCapacity === i ? "1px solid #34d399" : "1px solid rgba(255,255,255,0.08)",
                        background: safeCaseCapacity === i ? "#34d399" : "rgba(255,255,255,0.04)",
                        color: safeCaseCapacity === i ? "#000" : "#475569",
                        fontSize: "11px",
                        fontWeight: 900,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: safeCaseCapacity === i ? "0 0 14px rgba(52,211,153,0.4)" : "none",
                      }}
                    >
                      {i === 0 ? t.play.safeCaseNone : `${i} ${t.play.safeCaseSlot}`}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: "9px", color: "#475569", fontStyle: "italic", fontWeight: 700, lineHeight: 1.4 }}>
                  {safeCaseCapacity > 0 ? `${safeCasePrice} EDcoins / ` : ""}{t.play.safeCase}
                </p>
              </TacticalPanel>

              {/* CTA Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
                {showResumePrompt ? (
                  <button
                    disabled={busyAction !== null}
                    onClick={() => dispatch({ type: "landed" })}
                    style={{
                      width: "100%",
                      background: "#34d399",
                      color: "#000",
                      fontWeight: 900,
                      padding: "20px",
                      borderRadius: "14px",
                      fontSize: "14px",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 0 28px rgba(52,211,153,0.3)",
                      transition: "all 0.2s",
                      opacity: busyAction !== null ? 0.5 : 1,
                    }}
                  >
                    {t.play.resumeRaid}
                  </button>
                ) : (
                  <button
                    disabled={startRaidDisabled}
                    onClick={handleStartRaid}
                    style={{
                      width: "100%",
                      background: "#34d399",
                      color: "#000",
                      fontWeight: 900,
                      padding: "20px",
                      borderRadius: "14px",
                      fontSize: "14px",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      border: "none",
                      cursor: startRaidDisabled ? "not-allowed" : "pointer",
                      boxShadow: "0 0 28px rgba(52,211,153,0.3)",
                      transition: "all 0.2s",
                      opacity: startRaidDisabled ? 0.4 : 1,
                    }}
                  >
                    {busyAction === "start" ? t.play.deploying : t.play.startRaid}
                  </button>
                )}

                <button
                  disabled={busyAction !== null}
                  onClick={() => void handleAbandonRaid()}
                  style={{
                    width: "100%",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    color: "rgba(239,68,68,0.6)",
                    fontWeight: 900,
                    padding: "14px",
                    borderRadius: "14px",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    cursor: busyAction !== null ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {busyAction === "abandon" ? t.play.abandoningRaid : t.play.abandonRaid}
                </button>
              </div>

              {/* Debug Terminal */}
              <div
                style={{
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  padding: "16px",
                  borderRadius: "14px",
                  fontFamily: "monospace",
                }}
              >
                <div style={{ fontSize: "9px", fontWeight: 900, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  DEBUG TERMINAL
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "10px", color: "rgba(52,211,153,0.6)", animation: "pulse 2s infinite" }}>
                  <span style={{ opacity: 0.4 }}>{">"}</span>
                  <span>
                    {busyAction
                      ? `${busyAction}_in_progress...`
                      : `state: ${state.status} | addr: ${player.walletAddress ? player.walletAddress.slice(0, 8) + "..." : "not_connected"}`}
                  </span>
                </div>
                {player.lastTransactionDebug ? (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ fontSize: "9px", color: "#475569", cursor: "pointer" }}>Last TX</summary>
                    <pre style={{ fontSize: "8px", color: "#475569", marginTop: 4, overflowX: "auto" }}>
                      {JSON.stringify(player.lastTransactionDebug, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            </div>
          </main>

          <footer style={{ height: 4, background: "linear-gradient(to right, transparent, rgba(52,211,153,0.15), transparent)", flexShrink: 0, marginTop: "auto" }} />
        </div>{/* end centered wrapper */}
      </div>
    );
  }

  // ── Active / Non-preparing phase: keep original layout ──
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <p className="eyebrow">{t.play.eyebrow}</p>
          <h1>{t.play.title}</h1>
        </div>
        <div className="toolbar">
          <Link className="button button-secondary" href="/">
            {t.common.backHome}
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <section className="raid-grid">
        <div className="control-surface">
          <div className="mission-header">
            <div>
              <h2>{t.play.missionControl}</h2>
              <p>{t.play.readyBrief}</p>
            </div>
            <div className="mission-state">
              <span className="field-label">{t.play.status}</span>
              <strong className="mission-state-value">{raidStatusLabel}</strong>
            </div>
          </div>

          {actionError ? <div className="alert">{formatPlayError(actionError, t)}</div> : null}

          {player.lastTransactionDebug ? (
            <details>
              <summary>Transaction Debug</summary>
              <pre>{JSON.stringify(player.lastTransactionDebug, null, 2)}</pre>
            </details>
          ) : null}

          <section className="card">
            <h2>{t.play.lootFound}</h2>
            {player.onChainLootItems.length === 0 ? (
              <p>{t.play.noLootYet}</p>
            ) : (
              <div className="loot-grid">
                {player.onChainLootItems.map((item) => (
                  <div className={`loot-card loot-${item.rarity}`} key={item.assetId}>
                    <span className="field-label">
                      {item.rarity === "legendary" ? t.play.legendary : item.rarity === "epic" ? t.play.epic : t.play.rare}
                    </span>
                    <strong>{translateLootLabel(item.label, t)}</strong>
                    {player.onChainSafeCaseCapacity > 0 ? (
                      <button
                        className={player.onChainSafeCaseItems.includes(item.assetId) ? "button" : "button button-secondary"}
                        disabled={busyAction !== null || updatingSafeCase}
                        type="button"
                        onClick={() => void handleToggleSafeCase(item.assetId)}
                      >
                        {player.onChainSafeCaseItems.includes(item.assetId) ? t.play.safeCaseRemove : t.play.safeCaseKeep}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <details>
            <summary>Play State Debug</summary>
            <pre>
              {JSON.stringify(
                {
                  forceReadyMode,
                  stateStatus: state.status,
                  hasLocalActiveRaid,
                  onChainActiveRaid: player.onChainActiveRaid,
                  onChainRaidStatus: player.onChainRaidStatus,
                },
                null,
                2,
              )}
            </pre>
          </details>

          <div className="mission-actions">
            {state.status === "active" ? (
              <>
                <button
                  className="button"
                  disabled={busyAction !== null}
                  type="button"
                  onClick={() => void handleRaidAction("open")}
                >
                  {busyAction === "open" ? t.play.openingContainer : t.play.openContainer}
                </button>
                <button
                  className="button button-secondary"
                  disabled={busyAction !== null}
                  type="button"
                  onClick={() => void handleRaidAction("move")}
                >
                  {busyAction === "move" ? t.play.movingZone : t.play.moveMedium}
                </button>
                <button
                  className="button button-secondary"
                  disabled={busyAction !== null}
                  type="button"
                  onClick={() => void handleRaidAction("extract")}
                >
                  {busyAction === "extract" ? t.play.extracting : t.play.extract}
                </button>
                <button
                  className="button button-danger"
                  disabled={busyAction !== null}
                  type="button"
                  onClick={() => void handleAbandonRaid()}
                >
                  {busyAction === "abandon" ? t.play.abandoningRaid : t.play.abandonRaid}
                </button>
              </>
            ) : null}

            {state.status === "pending_battle" ? (
              <>
                <button
                  className="button button-danger"
                  disabled={busyAction !== null}
                  type="button"
                  onClick={() => void handleRaidAction("fight")}
                >
                  {busyAction === "fight" ? t.play.engagingEnemy : t.play.winBattle}
                </button>
                <button
                  className="button button-danger"
                  disabled={busyAction !== null}
                  type="button"
                  onClick={() => void handleAbandonRaid()}
                >
                  {busyAction === "abandon" ? t.play.abandoningRaid : t.play.abandonRaid}
                </button>
              </>
            ) : null}

            {state.status === "failed" || state.status === "succeeded" ? (
              <>
                <button
                  className="button"
                  disabled={busyAction !== null}
                  type="button"
                  onClick={() => void handleResetToReady()}
                >
                  {busyAction === "abandon" ? t.play.abandoningRaid : t.play.restartRaid}
                </button>
                <Link className="button button-secondary" href="/">
                  {t.common.backHome}
                </Link>
              </>
            ) : null}
          </div>
        </div>

        <div className="scene" aria-label={t.play.sceneLabel}>
          <div className="scene-banner">
            <span className="field-label">{t.play.actionWindow}</span>
            <strong>{raidStatusLabel}</strong>
          </div>
          <div className="scene-ground" />
          <div className="scene-crates" aria-hidden="true">
            <div className="crate" />
            <div className="crate" />
            <div className="crate" />
            <div className="crate" />
          </div>
        </div>
      </section>

      <section className="raid-grid">
        <div>
          <DifficultySelector />
          <EquipmentSelector />
        </div>
        <div>
          <RaidActionPanel state={state} />
          <SafeCaseSelection
            activeCapacity={player.onChainSafeCaseCapacity}
            activeSelectedCount={player.onChainSafeCaseItems.length}
            capacity={safeCaseCapacity}
            disabled={busyAction !== null || hasActiveRaid}
            priceEdcoins={safeCasePrice}
            onChange={setSafeCaseCapacity}
          />
          {state.status === "succeeded" ? <RaidResult result="succeeded" /> : null}
          {state.status === "failed" ? <RaidResult result="failed" /> : null}
        </div>
      </section>
    </main>
  );
}

function isRaidAlreadyActiveError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes('"Custom":6006') || error.message.includes("RaidAlreadyActive");
}

function isNoActiveRaidError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes("no-active-raid");
}

function formatPlayError(error: string, t: ReturnType<typeof useI18n>["t"]) {
  if (error.includes('"Custom":6007') || error.includes("InvalidRaidState")) {
    return t.play.invalidRaidState;
  }
  if (error.includes('"Custom":6009') || error.includes("InvalidEquipment")) {
    return t.play.insufficientLoadout;
  }
  if (
    error.includes("session-wallet-missing") ||
    error.includes("session-create-not-supported") ||
    error.includes("session-token-not-initialized") ||
    error.includes('"Custom":3012')
  ) {
    return t.play.sessionRequired;
  }
  return error;
}

async function waitForActiveRaid(
  refreshRemote: () => Promise<{ profile: { activeRaid?: string } | null } | undefined>,
  attempts = 8,
  delayMs = 600,
) {
  for (let index = 0; index < attempts; index += 1) {
    const snapshot = await refreshRemote().catch(() => null);
    if (snapshot?.profile?.activeRaid) {
      return true;
    }
    await sleep(delayMs);
  }
  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function parsePurchaseTenths(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("invalid-purchase-amount");
  }
  const tenths = Math.round(parsed * 10);
  if (tenths <= 0) {
    throw new Error("invalid-purchase-amount");
  }
  return tenths;
}

function purchasePriceLabel(value: string) {
  try {
    return Math.round(parsePurchaseTenths(value) * 100);
  } catch {
    return 0;
  }
}

function purchasePriceValue(value: string) {
  return purchasePriceLabel(value);
}

function translateLootLabel(label: string, t: ReturnType<typeof useI18n>["t"]) {
  if (label.startsWith("Legendary Collectible ")) {
    return `${t.play.legendary}收藏品${label.replace("Legendary Collectible ", "")}`;
  }
  if (label.startsWith("Epic Collectible ")) {
    return `${t.play.epic}收藏品${label.replace("Epic Collectible ", "")}`;
  }
  if (label.startsWith("Rare Collectible ")) {
    return `${t.play.rare}收藏品${label.replace("Rare Collectible ", "")}`;
  }
  return label;
}

// ── Sub-components for the new tactical config UI ──

function TacticalPanel({
  title,
  icon,
  children,
  flex = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  flex?: boolean;
}) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        flex: flex ? 1 : undefined,
        backdropFilter: "blur(4px)",
      }}
    >
      <h3
        style={{
          fontSize: "10px",
          fontWeight: 900,
          color: "#475569",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          paddingBottom: 10,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          margin: "0 0 14px",
        }}
      >
        <span style={{ color: "#34d399" }}>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function StatusBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ fontSize: "8px", fontWeight: 900, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: "11px", fontWeight: 900, color: "#e2e8f0", textTransform: "uppercase" }}>{value}</div>
    </div>
  );
}

function StatBlock({
  title,
  armor,
  weapon,
  edcoins,
  highlight = false,
}: {
  title: string;
  armor: string;
  weapon: string;
  edcoins: number;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.4)",
        border: highlight ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(255,255,255,0.05)",
        borderRadius: "14px",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {highlight && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "rgba(52,211,153,0.3)",
            boxShadow: "0 0 12px #34d399",
          }}
        />
      )}
      <div style={{ fontSize: "9px", fontWeight: 900, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
        {title}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <div style={{ fontSize: "8px", color: "#475569", fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>ARMOR</div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>{armor}</div>
          </div>
          <div>
            <div style={{ fontSize: "8px", color: "#475569", fontWeight: 900, textTransform: "uppercase", marginBottom: 6 }}>WEAPON</div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>{weapon}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "8px", color: "rgba(52,211,153,0.5)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            EDCOINS
          </div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: "#34d399", fontFamily: "monospace" }}>
            {edcoins.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchaseInputBlock({
  label,
  value,
  balance,
  price,
  insufficient,
  insufficientLabel,
  purchaseHint,
  buyLabel,
  disabled,
  onChange,
  onBuy,
}: {
  label: string;
  value: string;
  balance: string;
  price: number;
  insufficient: boolean;
  insufficientLabel: string;
  purchaseHint: string;
  buyLabel: string;
  disabled: boolean;
  onChange: (v: string) => void;
  onBuy: () => void;
}) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "14px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <label
        style={{
          fontSize: "10px",
          fontWeight: 900,
          color: "#475569",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="number"
          inputMode="decimal"
          min="0.1"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: "#0a0c10",
            border: insufficient ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            padding: "12px 14px",
            fontSize: "14px",
            fontFamily: "monospace",
            fontWeight: 900,
            color: "#fff",
            outline: "none",
          }}
        />
        <button
          disabled={disabled}
          onClick={onBuy}
          style={{
            background: disabled ? "rgba(255,255,255,0.05)" : "rgba(52,211,153,0.12)",
            border: "1px solid rgba(52,211,153,0.2)",
            borderRadius: "10px",
            padding: "0 20px",
            fontSize: "10px",
            fontWeight: 900,
            color: disabled ? "#475569" : "#34d399",
            cursor: disabled ? "not-allowed" : "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            transition: "all 0.2s",
          }}
        >
          BUY
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "9px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>{purchaseHint}</span>
        <span style={{ fontSize: "9px", fontFamily: "monospace", fontWeight: 900, color: "rgba(52,211,153,0.4)" }}>{balance}</span>
      </div>
      {insufficient && (
        <div style={{ fontSize: "10px", color: "#f87171", fontWeight: 700 }}>⚠ {insufficientLabel}</div>
      )}
      <div style={{ fontSize: "9px", color: "#475569" }}>{price.toLocaleString()} EDcoins</div>
    </div>
  );
}

