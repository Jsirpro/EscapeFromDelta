"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useReducer, useState } from "react";

import { LanguageToggle } from "../../components/LanguageToggle";
import { DifficultySelector } from "../../game/DifficultySelector";
import { EquipmentSelector } from "../../game/EquipmentSelector";
import { RaidActionPanel } from "../../game/RaidActionPanel";
import { RaidResult } from "../../game/RaidResult";
import { SafeCaseSelection } from "../../game/SafeCaseSelection";
import { initialRaidUiState, raidReducer } from "../../game/raidMachine";
import { type Language, useI18n } from "../../i18n";
import { usePlayerProfile } from "../../wallet/usePlayerProfile";

export default function PlayPage() {
  const [state, dispatch] = useReducer(raidReducer, initialRaidUiState);
  const player = usePlayerProfile();
  const { t, language } = useI18n();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [feedFrame, setFeedFrame] = useState(0);
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
  const raidTimeoutSeconds = 300;
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
  const timeoutRemainingSeconds =
    player.onChainRaidStartedAt && hasActiveRaid
      ? Math.max(0, raidTimeoutSeconds - Math.floor(nowMs / 1000 - player.onChainRaidStartedAt))
      : null;
  const showTimeoutWarning =
    timeoutRemainingSeconds !== null &&
    timeoutRemainingSeconds > 0 &&
    timeoutRemainingSeconds <= 30 &&
    (state.status === "active" || state.status === "pending_battle");
  const headerActionStyle: CSSProperties = {
    minHeight: "48px",
    padding: "0 18px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#c0ccd8",
    textDecoration: "none",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontSize: "11px",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  };
  const tacticalFeedPath = useMemo(() => buildTacticalFeedPath(feedFrame), [feedFrame]);
  const tacticalFeedGhostPath = useMemo(
    () => buildTacticalFeedPath((feedFrame + TACTICAL_FEED_PATTERNS.length - 1) % TACTICAL_FEED_PATTERNS.length, 0.74),
    [feedFrame],
  );
  const extractionChance = useMemo(
    () => getMissionExtractionChance(state.currentArea, state.status === "pending_battle"),
    [state.currentArea, state.status],
  );
  const missionNarrative = useMemo(
    () => getMissionNarrative(language, state.currentArea, state.status === "pending_battle", player.onChainLootItems.length > 0),
    [language, state.currentArea, state.status, player.onChainLootItems.length],
  );

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
    const timer = window.setInterval(() => {
      setFeedFrame((current) => (current + 1) % TACTICAL_FEED_PATTERNS.length);
    }, 900);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hasActiveRaid || !player.onChainRaidStartedAt) {
      return;
    }
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hasActiveRaid, player.onChainRaidStartedAt]);

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
        if (snapshot?.raid?.status === "active") {
          dispatch({ type: "win" });
        } else {
          setHasLocalActiveRaid(false);
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
      setForceReadyMode(true);
      setHasLocalActiveRaid(false);
      dispatch({ type: "reset" });
    } catch (error) {
      const snapshot = await player.refreshRemote().catch(() => null);
      if (isNoActiveRaidError(error) || !snapshot?.profile?.activeRaid) {
        setForceReadyMode(true);
        setHasLocalActiveRaid(false);
        dispatch({ type: "reset" });
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

  const isPreparingPhase = state.status === "preparing" || state.status === "transitioning" || showResumePrompt;
  const isMissionActivePhase = state.status === "active" || state.status === "pending_battle";
  const hasUnsettledFailedRaid =
    state.status === "failed" &&
    Boolean(player.onChainActiveRaid) &&
    (player.onChainRaidStatus === "failed" || player.onChainRaidStatus === "timed_out");

  if (isPreparingPhase) {
    return (
      <div className="min-h-screen font-mono selection:bg-emerald-500/30" style={{ background: "#05070a", color: "#c0ccd8" }}>
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,0.25) 50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))",
            backgroundSize: "100% 2px, 2px 100%",
          }}
        />

        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>
          <header
            style={{
              borderBottom: "1px solid rgba(52,211,153,0.1)",
              paddingBottom: "24px",
              marginTop: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              position: "relative",
              zIndex: 20,
              paddingLeft: "8px",
              paddingRight: "8px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "2px",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                  }}
                >
                  <IconRadio size={16} style={{ color: "#34d399" }} />
                </div>
              </div>
              <h1
                style={{
                  fontSize: "2.8rem",
                  fontWeight: 900,
                  fontStyle: "italic",
                  color: "#fff",
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                }}
              >
                OPERATIVE <span style={{ color: "#34d399" }}>INTERFACE</span>
              </h1>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "flex-end" }}>
              <Link href="/" style={headerActionStyle}>
                {t.common.backHome}
              </Link>
              <LanguageToggle style={headerActionStyle} />
            </div>
          </header>

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

          {actionError ? (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", fontSize: "12px", color: "#f87171" }}>
              ⚠ {formatPlayError(actionError, t)}
            </div>
          ) : null}

          <main style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", position: "relative", zIndex: 10, overflowY: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
              <TacticalPanel title={`${t.play.lowRisk} / ${t.play.highRisk}`} icon={<IconTarget size={14} style={{ color: "#34d399" }} />}>
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
                        {zone.key === "low" ? <IconShield size={18} /> : zone.key === "medium" ? <IconZap size={18} /> : <IconSkull size={18} />}
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", color: zone.color }}>{zone.label}</div>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginTop: 2 }}>{zone.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TacticalPanel>

              <TacticalPanel title={t.play.status} icon={<IconActivity size={14} style={{ color: "#34d399" }} />}>
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

              <TacticalPanel title={t.play.lootFound} icon={<IconBox size={14} style={{ color: "#34d399" }} />} flex>
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
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          {item.meta ? (
                            <div style={{ flex: "0 0 40px", width: 40, height: 40, borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#05080c" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.meta.image} alt={language === "zh" ? item.meta.nameCn : item.meta.nameEn} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            </div>
                          ) : null}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "9px", color: item.rarity === "legendary" ? "#f59e0b" : item.rarity === "epic" ? "#a855f7" : "#34d399", fontWeight: 900, textTransform: "uppercase", marginBottom: 2 }}>
                              {item.rarity === "legendary" ? t.play.legendary : item.rarity === "epic" ? t.play.epic : t.play.rare}
                            </div>
                            <div
                              style={{ fontSize: "11px", color: "#e2e8f0", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                              title={item.meta ? (language === "zh" ? item.meta.descriptionCn : item.meta.descriptionEn) : undefined}
                            >
                              {item.meta ? (language === "zh" ? item.meta.nameCn : item.meta.nameEn) : translateLootLabel(item.label, t)}
                            </div>
                          </div>
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

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", padding: "0 4px" }}>
              <div style={{ fontSize: "10px", fontWeight: 900, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", paddingLeft: 4 }}>
                <IconSettings size={14} style={{ color: "#34d399", display: "inline", marginRight: 6 }} /> {t.play.currentBalances} &amp; {t.common.armor}
              </div>

              <StatBlock
                title={t.play.currentBalances}
                armor={player.armorPointBalance.toFixed(1)}
                weapon={player.weaponPointBalance.toFixed(1)}
                edcoins={Number(player.edcoinsBalance)}
                highlight
              />

              <StatBlock title={t.play.startCost} armor={startArmorCost.toFixed(1)} weapon={startWeaponCost.toFixed(1)} edcoins={totalStartEdcoinsCost} />

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

              <TacticalPanel title={t.play.startCost} icon={<IconTerminal size={14} style={{ color: "#34d399" }} />}>
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

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                    inset: 0,
                    opacity: 0.16,
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.03) 35%, rgba(52,211,153,0.2) 50%, rgba(52,211,153,0.03) 65%, transparent 100%)",
                    animation: "tacticalSweep 3s linear infinite",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.22,
                    background:
                      "linear-gradient(180deg, transparent 0%, rgba(52,211,153,0.14) 48%, rgba(52,211,153,0.02) 60%, transparent 100%)",
                    animation: "tacticalVerticalScan 5.5s linear infinite",
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
                <svg viewBox="0 0 200 100" style={{ width: "75%", overflow: "visible" }}>
                  <defs>
                    <filter id="tactical-feed-glow">
                      <feGaussianBlur stdDeviation="1.8" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    d={tacticalFeedGhostPath}
                    fill="none"
                    stroke="rgba(52,211,153,0.18)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M0 50 L200 50" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="0.7" strokeDasharray="4 4" />
                  <path
                    d={tacticalFeedPath}
                    fill="none"
                    stroke="rgba(52,211,153,0.25)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#tactical-feed-glow)"
                  />
                  <path
                    d={tacticalFeedPath}
                    fill="none"
                    stroke="rgba(52,211,153,0.72)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transition: "d 240ms ease, opacity 240ms ease" }}
                  />
                  {TACTICAL_FEED_PING_POINTS.map((point, index) => (
                    <circle
                      key={`${point.x}-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="1.2"
                      fill="rgba(52,211,153,0.85)"
                      style={{
                        opacity: (feedFrame + index) % 3 === 0 ? 0.9 : 0.18,
                        transition: "opacity 180ms ease",
                      }}
                    />
                  ))}
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

              <TacticalPanel title={t.play.safeCase} icon={<IconLock size={14} style={{ color: "#34d399" }} />}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.6 }}>{t.play.safeCaseHelp}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {[0, 1, 2, 3].map((capacity) => {
                      const selected = safeCaseCapacity === capacity;
                      const price = capacity * safeCaseUnitPrice;
                      return (
                        <button
                          key={capacity}
                          type="button"
                          disabled={busyAction !== null || hasActiveRaid}
                          onClick={() => setSafeCaseCapacity(capacity)}
                          style={{
                            background: selected ? "rgba(52,211,153,0.18)" : "rgba(255,255,255,0.03)",
                            border: selected ? "1px solid rgba(52,211,153,0.5)" : "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "10px",
                            padding: "12px 8px",
                            cursor: busyAction !== null || hasActiveRaid ? "not-allowed" : "pointer",
                            color: selected ? "#34d399" : "#94a3b8",
                            transition: "all 0.2s",
                          }}
                        >
                          <div style={{ fontSize: "16px", fontWeight: 900, fontFamily: "monospace" }}>{capacity}</div>
                          <div style={{ fontSize: "8px", textTransform: "uppercase", marginTop: 2 }}>{capacity === 0 ? t.play.safeCaseNone : t.play.safeCaseSlot}</div>
                          <div style={{ fontSize: "8px", marginTop: 6, opacity: 0.7 }}>{price}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "12px 14px" }}>
                    <div style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", fontWeight: 900, marginBottom: 4 }}>
                      {t.play.safeCase}
                    </div>
                    <div style={{ fontSize: "14px", color: "#e2e8f0", fontWeight: 700 }}>
                      {safeCaseCapacity === 0 ? t.play.safeCaseNone : `${safeCaseCapacity} ${t.play.safeCaseSlot}`}
                    </div>
                    <div style={{ fontSize: "10px", color: "#34d399", marginTop: 4 }}>{t.play.safeCasePrice.replace("{price}", String(safeCasePrice))}</div>
                  </div>
                </div>
              </TacticalPanel>

              <div
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {showResumePrompt ? (
                  <button
                    disabled={busyAction !== null}
                    onClick={() => dispatch({ type: "landed" })}
                    style={{
                      width: "100%",
                      background: "linear-gradient(90deg, rgba(52,211,153,0.9), rgba(16,185,129,1))",
                      color: "#03120a",
                      fontWeight: 900,
                      padding: "16px",
                      borderRadius: "14px",
                      fontSize: "14px",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                      border: "none",
                      cursor: busyAction !== null ? "not-allowed" : "pointer",
                      boxShadow: "0 0 28px rgba(52,211,153,0.3)",
                    }}
                  >
                    {t.play.resumeRaid}
                  </button>
                ) : (
                  <button
                    disabled={startRaidDisabled}
                    onClick={() => void handleStartRaid()}
                    style={{
                      width: "100%",
                      background: "linear-gradient(90deg, rgba(52,211,153,0.9), rgba(16,185,129,1))",
                      color: "#03120a",
                      fontWeight: 900,
                      padding: "16px",
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
                  <span style={{ opacity: 0.4 }}>&gt;</span>
                  <span>
                    {busyAction
                      ? `${busyAction}_in_progress...`
                      : `state: ${state.status} | addr: ${player.walletAddress ? `${player.walletAddress.slice(0, 8)}...` : "not_connected"}`}
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
        </div>
      </div>
    );
  }

  if (isMissionActivePhase) {
    const secondaryActionLabel =
      state.status === "pending_battle"
        ? busyAction === "abandon"
          ? t.play.abandoningRaid
          : getMissionSecondaryActionLabel(language, "retreat")
        : state.currentArea === "low"
          ? busyAction === "move"
            ? t.play.movingZone
            : getMissionSecondaryActionLabel(language, "advance")
          : busyAction === "extract"
            ? t.play.extracting
            : getMissionSecondaryActionLabel(language, "extract");

    return (
      <div className="min-h-screen font-mono selection:bg-emerald-500/30" style={{ background: "#05070a", color: "#c0ccd8" }}>
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,0.25) 50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))",
            backgroundSize: "100% 2px, 2px 100%",
          }}
        />

        <div style={{ maxWidth: "1540px", margin: "0 auto", padding: "28px 20px 24px", display: "flex", flexDirection: "column", gap: 26, minHeight: "100vh" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <Link
                href="/"
                aria-label={t.common.backHome}
                style={{
                  width: 44,
                  height: 44,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  borderRadius: 10,
                  border: "1px solid transparent",
                  transition: "all 0.2s",
                }}
              >
                <IconArrowLeft size={26} />
              </Link>
              <h1
                style={{
                  margin: 0,
                  fontSize: "3.4rem",
                  lineHeight: 0.92,
                  fontStyle: "italic",
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  color: "#fff",
                  textTransform: "uppercase",
                }}
              >
                MISSION ACTIVE
              </h1>
            </div>

            <div
              style={{
                padding: 6,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <LanguageToggle />
            </div>
          </header>

          <div style={{ display: "grid", gridTemplateColumns: "390px minmax(0, 1fr)", gap: 28, alignItems: "stretch", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div
                style={{
                  borderRadius: 26,
                  border: "1px solid rgba(16,185,129,0.28)",
                  background: "rgba(7,20,15,0.72)",
                  boxShadow: "0 18px 48px rgba(0,0,0,0.32)",
                  padding: "26px 28px 30px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#34d399", fontWeight: 900, marginBottom: 26 }}>
                  <IconActivity size={18} style={{ color: "#34d399" }} />
                  <span style={{ fontSize: 15 }}>{language === "zh" ? "实战遥测" : "LIVE TELEMETRY"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <MissionMeter
                    label={language === "zh" ? "护甲强度" : "ARMOR INTEGRITY"}
                    value={player.armorPointBalance}
                    maxValue={20}
                    color="#34d399"
                  />
                  <MissionMeter
                    label={language === "zh" ? "武器充能" : "WEAPON CHARGE"}
                    value={player.weaponPointBalance}
                    maxValue={20}
                    color="#22d3ee"
                  />
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "28px 0 22px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, fontWeight: 800 }}>
                  <span style={{ color: "#8190a5" }}>{language === "zh" ? "撤离成功率：" : "EXTRACTION CHANCE:"}</span>
                  <span style={{ color: "#fff" }}>{extractionChance}%</span>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 26,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(4,7,10,0.72)",
                  padding: "28px",
                  flex: 1,
                }}
              >
                <div style={{ fontSize: 15, color: "#94a3b8", fontWeight: 900, marginBottom: 24 }}>
                  {language === "zh" ? "任务简报" : "MISSION BRIEF"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 24, color: "#a8b3c4", fontSize: 15, lineHeight: 1.8 }}>
                  <MissionBriefItem label={language === "zh" ? "坐标" : "Coordinates"} value="Sector Delta-09" />
                  <MissionBriefItem label={language === "zh" ? "威胁等级" : "Threat Level"} value={getMissionThreatLabel(state.currentArea, t)} />
                  <MissionBriefItem
                    label={language === "zh" ? "提取状态" : "Extraction Status"}
                    value={state.status === "pending_battle" ? getMissionTerminalState(language, "hostile") : getMissionTerminalState(language, "verify")}
                  />
                  {player.onChainLootItems.length > 0 ? (
                    <MissionBriefItem
                      label={language === "zh" ? "已获战利品" : "Recovered Loot"}
                      value={String(player.onChainLootItems.length)}
                    />
                  ) : null}
                </div>
                <div style={{ marginTop: 42, fontSize: 13, color: "#11895c", fontWeight: 900, textTransform: "uppercase" }}>
                  LINK_ESTABLISHED...
                </div>
              </div>
            </div>

            <div
              style={{
                borderRadius: 34,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(4,7,10,0.8)",
                display: "flex",
                flexDirection: "column",
                minHeight: "calc(100vh - 170px)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "22px 28px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748b",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#34d399" }}>
                  <IconRadio size={16} style={{ color: "#34d399" }} />
                </div>
                <span style={{ letterSpacing: "0.03em" }}>SECURE_TERMINAL_ACTIVE</span>
              </div>

              <div style={{ padding: "56px 46px 28px", display: "flex", flexDirection: "column", gap: 28, flex: 1 }}>
                <div style={{ fontSize: 20, color: "#0f7d5b", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  &gt;&gt; {language === "zh" ? "潜入流程已启动..." : "INFILTRATION SEQUENCE INITIATED..."}
                </div>

                {actionError ? (
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.24)", borderRadius: 18, padding: "14px 18px", color: "#fca5a5", fontSize: 14 }}>
                    {formatPlayError(actionError, t)}
                  </div>
                ) : null}

                {showTimeoutWarning ? (
                  <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.24)", borderRadius: 18, padding: "14px 18px", color: "#fcd34d", fontSize: 14 }}>
                    {t.play.timeoutWarning.replace("{seconds}", String(timeoutRemainingSeconds))}
                  </div>
                ) : null}

                <div
                  style={{
                    maxWidth: 920,
                    borderRadius: 24,
                    border: "1px solid rgba(255,255,255,0.09)",
                    background: "rgba(255,255,255,0.04)",
                    padding: "24px 26px",
                  }}
                >
                  <div style={{ fontSize: 16, color: "#34d399", fontWeight: 900, marginBottom: 12 }}>DELTA_HQ &gt;</div>
                  <div style={{ fontSize: 17, lineHeight: 1.75, color: "#d5dde8", fontWeight: 700 }}>{missionNarrative}</div>
                </div>

                {player.onChainLootItems.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                    {player.onChainLootItems.map((item) => (
                      <div
                        key={item.assetId}
                        style={{
                          borderRadius: 18,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                          padding: "16px 18px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {item.meta ? (
                          <div style={{ width: "100%", maxWidth: 140, aspectRatio: "1 / 1", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "#05080c" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.meta.image} alt={language === "zh" ? item.meta.nameCn : item.meta.nameEn} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </div>
                        ) : null}
                        <div style={{ fontSize: 11, color: item.rarity === "legendary" ? "#f59e0b" : item.rarity === "epic" ? "#a855f7" : "#34d399", fontWeight: 900, textTransform: "uppercase" }}>
                          {item.rarity === "legendary" ? t.play.legendary : item.rarity === "epic" ? t.play.epic : t.play.rare}
                        </div>
                        <strong style={{ color: "#fff", fontSize: 15, lineHeight: 1.45 }}>
                          {item.meta ? (language === "zh" ? item.meta.nameCn : item.meta.nameEn) : translateLootLabel(item.label, t)}
                        </strong>
                        {item.meta ? (
                          <p style={{ margin: 0, color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>
                            {language === "zh" ? item.meta.descriptionCn : item.meta.descriptionEn}
                          </p>
                        ) : null}
                        {player.onChainSafeCaseCapacity > 0 ? (
                          <button
                            disabled={busyAction !== null || updatingSafeCase}
                            onClick={() => void handleToggleSafeCase(item.assetId)}
                            style={{
                              marginTop: "auto",
                              minHeight: 38,
                              borderRadius: 10,
                              border: "1px solid rgba(52,211,153,0.24)",
                              background: player.onChainSafeCaseItems.includes(item.assetId) ? "rgba(52,211,153,0.92)" : "rgba(52,211,153,0.08)",
                              color: player.onChainSafeCaseItems.includes(item.assetId) ? "#04120c" : "#34d399",
                              fontWeight: 900,
                              cursor: busyAction !== null || updatingSafeCase ? "not-allowed" : "pointer",
                            }}
                          >
                            {player.onChainSafeCaseItems.includes(item.assetId) ? t.play.safeCaseRemove : t.play.safeCaseKeep}
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    {state.status === "pending_battle" ? (
                      <>
                        <MissionActionButton
                          label={busyAction === "fight" ? t.play.engagingEnemy : getMissionPrimaryActionLabel(language, "fight")}
                          disabled={busyAction !== null}
                          onClick={() => void handleRaidAction("fight")}
                        />
                        <MissionActionButton
                          label={secondaryActionLabel}
                          disabled={busyAction !== null}
                          onClick={() => void handleAbandonRaid()}
                        />
                      </>
                    ) : (
                      <>
                        <MissionActionButton
                          label={busyAction === "open" ? t.play.openingContainer : getMissionPrimaryActionLabel(language, "open")}
                          disabled={busyAction !== null}
                          onClick={() => void handleRaidAction("open")}
                        />
                        <MissionActionButton
                          label={secondaryActionLabel}
                          disabled={busyAction !== null}
                          onClick={() => void (state.currentArea === "low" ? handleRaidAction("move") : handleRaidAction("extract"))}
                        />
                      </>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() => void handleAbandonRaid()}
                      style={{
                        minHeight: 38,
                        padding: "0 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(239,68,68,0.18)",
                        background: "rgba(239,68,68,0.06)",
                        color: "rgba(248,113,113,0.78)",
                        fontWeight: 800,
                        cursor: busyAction !== null ? "not-allowed" : "pointer",
                      }}
                    >
                      {busyAction === "abandon" ? t.play.abandoningRaid : t.play.abandonRaid}
                    </button>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                      {player.onChainSafeCaseCapacity > 0
                        ? t.play.safeCaseAuto
                            .replace("{count}", String(player.onChainSafeCaseItems.length))
                            .replace("{capacity}", String(player.onChainSafeCaseCapacity))
                        : t.play.noLootYet}
                    </div>
                  </div>

                  {player.lastTransactionDebug ? (
                    <details style={{ marginTop: 4 }}>
                      <summary style={{ fontSize: 12, color: "#64748b", cursor: "pointer" }}>Transaction Debug</summary>
                      <pre style={{ fontSize: 11, color: "#718096", marginTop: 8, overflowX: "auto" }}>
                        {JSON.stringify(player.lastTransactionDebug, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <footer style={{ height: 4, background: "linear-gradient(to right, transparent, rgba(52,211,153,0.15), transparent)", flexShrink: 0, marginTop: "auto" }} />
        </div>
      </div>
    );
  }

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
          {showTimeoutWarning ? (
            <div className="alert">
              {t.play.timeoutWarning.replace("{seconds}", String(timeoutRemainingSeconds))}
            </div>
          ) : null}

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
                    {item.meta ? (
                      <div className="loot-card-image">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.meta.image} alt={language === "zh" ? item.meta.nameCn : item.meta.nameEn} loading="lazy" />
                      </div>
                    ) : null}
                    <span className="field-label">
                      {item.rarity === "legendary" ? t.play.legendary : item.rarity === "epic" ? t.play.epic : t.play.rare}
                    </span>
                    <strong>{item.meta ? (language === "zh" ? item.meta.nameCn : item.meta.nameEn) : translateLootLabel(item.label, t)}</strong>
                    {item.meta ? <p className="loot-card-description">{language === "zh" ? item.meta.descriptionCn : item.meta.descriptionEn}</p> : null}
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
                <button className="button" disabled={busyAction !== null} type="button" onClick={() => void handleRaidAction("open")}>
                  {busyAction === "open" ? t.play.openingContainer : t.play.openContainer}
                </button>
                <button className="button button-secondary" disabled={busyAction !== null} type="button" onClick={() => void handleRaidAction("move")}>
                  {busyAction === "move" ? t.play.movingZone : t.play.moveMedium}
                </button>
                <button className="button button-secondary" disabled={busyAction !== null} type="button" onClick={() => void handleRaidAction("extract")}>
                  {busyAction === "extract" ? t.play.extracting : t.play.extract}
                </button>
                <button className="button button-danger" disabled={busyAction !== null} type="button" onClick={() => void handleAbandonRaid()}>
                  {busyAction === "abandon" ? t.play.abandoningRaid : t.play.abandonRaid}
                </button>
              </>
            ) : null}

            {state.status === "pending_battle" ? (
              <>
                <button className="button button-danger" disabled={busyAction !== null} type="button" onClick={() => void handleRaidAction("fight")}>
                  {busyAction === "fight" ? t.play.engagingEnemy : t.play.winBattle}
                </button>
                <button className="button button-danger" disabled={busyAction !== null} type="button" onClick={() => void handleAbandonRaid()}>
                  {busyAction === "abandon" ? t.play.abandoningRaid : t.play.abandonRaid}
                </button>
              </>
            ) : null}

            {state.status === "failed" ? (
              <>
                {hasUnsettledFailedRaid ? (
                  <button className="button button-danger" disabled={busyAction !== null} type="button" onClick={() => void handleAbandonRaid()}>
                    {busyAction === "abandon" ? t.play.abandoningRaid : t.play.abandonRaid}
                  </button>
                ) : (
                  <button className="button" disabled={busyAction !== null} type="button" onClick={() => void handleResetToReady()}>
                    {busyAction === "abandon" ? t.play.abandoningRaid : t.play.restartRaid}
                  </button>
                )}
                <Link className="button button-secondary" href="/">
                  {t.common.backHome}
                </Link>
              </>
            ) : null}

            {state.status === "succeeded" ? (
              <>
                <button className="button" disabled={busyAction !== null} type="button" onClick={() => void handleResetToReady()}>
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

const TACTICAL_FEED_PATTERNS = [
  [50, 50, 50, 50, 50, 50, 24, 78, 50, 50, 50, 50, 50, 14, 86, 50, 50, 50],
  [50, 50, 50, 50, 38, 18, 50, 74, 50, 50, 50, 42, 20, 50, 84, 50, 50, 50],
  [50, 50, 50, 46, 22, 50, 80, 50, 50, 50, 36, 50, 18, 50, 72, 50, 50, 50],
  [50, 50, 44, 18, 50, 82, 50, 50, 50, 34, 50, 50, 16, 50, 78, 50, 50, 50],
  [50, 50, 50, 50, 26, 50, 74, 50, 50, 50, 50, 44, 12, 50, 70, 50, 50, 50],
];

const TACTICAL_FEED_PING_POINTS = [
  { x: 18, y: 50 },
  { x: 56, y: 50 },
  { x: 90, y: 50 },
  { x: 124, y: 50 },
  { x: 158, y: 50 },
  { x: 188, y: 50 },
];

function buildTacticalFeedPath(frame: number, amplitudeScale = 1) {
  const values = TACTICAL_FEED_PATTERNS[frame] ?? TACTICAL_FEED_PATTERNS[0];
  const step = 200 / (values.length - 1);
  return values
    .map((value, index) => {
      const normalizedValue = 50 + (value - 50) * amplitudeScale;
      return `${index === 0 ? "M" : "L"}${(index * step).toFixed(2)} ${normalizedValue.toFixed(2)}`;
    })
    .join(" ");
}

function getMissionExtractionChance(area: "low" | "medium" | "high", hostileContact: boolean) {
  if (hostileContact) return 22;
  if (area === "low") return 50;
  if (area === "medium") return 37;
  return 28;
}

function getMissionThreatLabel(area: "low" | "medium" | "high", t: ReturnType<typeof useI18n>["t"]) {
  if (area === "high") return t.play.highRisk;
  if (area === "medium") return t.play.mediumRisk;
  return t.play.lowRisk;
}

function getMissionTerminalState(language: Language, kind: "verify" | "hostile") {
  if (language === "zh") {
    return kind === "hostile" ? "遭遇敌对目标" : "待验证";
  }
  return kind === "hostile" ? "Hostile Contact" : "Awaiting Verification";
}

function getMissionNarrative(language: Language, area: "low" | "medium" | "high", hostileContact: boolean, hasLoot: boolean) {
  if (language === "zh") {
    if (hostileContact) {
      return "热源和移动信号同时抬升。观测塔周围发现敌对单位，链路建议立刻交战清除威胁，否则撤回当前路线。";
    }
    if (area === "medium" || area === "high") {
      return hasLoot
        ? "你已穿过外环观察点，终端记录到物资回收成功。前方仍存在可疑通信节点，可以继续深入，也可以立即发起撤离。"
        : "你已绕过前方观测塔并接近核心区外围。雷达回波稳定，但补给点仍未完全确认，建议谨慎推进或就地撤离。";
    }
    return "系统初始化完成。你已成功降落在 Delta-09 扇区边缘。前方发现一座废弃的观测塔，雷达显示那里有微弱的补给信号。";
  }

  if (hostileContact) {
    return "Thermal and motion signatures just spiked around the watchtower. Hostile contact is confirmed. Clear the threat now or break the route before the corridor collapses.";
  }
  if (area === "medium" || area === "high") {
    return hasLoot
      ? "You breached the outer perimeter and recovered material from the route. A weak terminal relay is still pulsing ahead. Push deeper or trigger extraction from your current position."
      : "You bypassed the outer watchtower and reached the approach to the core sector. Radar remains stable, but the supply marker is still unresolved. Advance carefully or extract now.";
  }
  return "System boot complete. You touched down on the edge of Sector Delta-09. An abandoned watchtower is standing ahead, and radar is picking up a weak supply signal inside.";
}

function getMissionPrimaryActionLabel(language: Language, action: "open" | "fight") {
  if (language === "zh") {
    return action === "fight" ? "正面接敌，清除威胁" : "潜入观测塔寻找物资";
  }
  return action === "fight" ? "Engage hostile contact" : "Infiltrate the tower for supplies";
}

function getMissionSecondaryActionLabel(language: Language, action: "advance" | "extract" | "retreat") {
  if (language === "zh") {
    if (action === "advance") return "绕过观测塔，直接前往核心区";
    if (action === "extract") return "锁定当前路径，直接发起撤离";
    return "中止当前路线，立即后撤";
  }
  if (action === "advance") return "Bypass the tower and advance to core sector";
  if (action === "extract") return "Lock the route and trigger extraction";
  return "Abort the route and retreat";
}

function MissionMeter({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const fill = Math.max(0, Math.min(100, (safeValue / maxValue) * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: 14, color: "#93a0b3", fontWeight: 800 }}>{label}</span>
        <span style={{ fontSize: 14, color: "#fff", fontWeight: 900 }}>
          {safeValue.toFixed(1)} / {maxValue.toFixed(1)}
        </span>
      </div>
      <div style={{ width: "100%", height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div
          style={{
            width: `${fill}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
            boxShadow: `0 0 18px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

function MissionBriefItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ color: "#d1d8e4", lineHeight: 1.7 }}>•</span>
      <div>
        <span style={{ color: "#d1d8e4", fontWeight: 700 }}>{label}：</span>
        <span>{value}</span>
      </div>
    </div>
  );
}

function MissionActionButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        minHeight: 74,
        padding: "0 28px",
        borderRadius: 18,
        border: "1px solid rgba(16,185,129,0.3)",
        background: "rgba(3,19,12,0.88)",
        color: "#34d399",
        fontSize: 16,
        fontWeight: 900,
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.2s",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 28, lineHeight: 1, color: "rgba(52,211,153,0.55)" }}>›</span>
    </button>
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

function TacticalPanel({
  title,
  icon,
  children,
  flex = false,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
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
      {highlight ? (
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
      ) : null}
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
          <div style={{ fontSize: "22px", fontWeight: 900, color: "#34d399", fontFamily: "monospace" }}>{edcoins.toLocaleString()}</div>
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
  disabled: boolean;
  onChange: (value: string) => void;
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
      <label style={{ fontSize: "10px", fontWeight: 900, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="number"
          inputMode="decimal"
          min="0.1"
          step="0.1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
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
      {insufficient ? <div style={{ fontSize: "10px", color: "#f87171", fontWeight: 700 }}>⚠ {insufficientLabel}</div> : null}
      <div style={{ fontSize: "9px", color: "#475569" }}>{price.toLocaleString()} EDcoins</div>
    </div>
  );
}

function IconShield({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function IconArrowLeft({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="m15 18-6-6 6-6" />
      <path d="M21 12H9" />
    </svg>
  );
}

function IconZap({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconSkull({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12 2a8 8 0 0 0-5 14.24V20a2 2 0 0 0 2 2h1v-3h4v3h1a2 2 0 0 0 2-2v-3.76A8 8 0 0 0 12 2Z" />
      <circle cx="9" cy="10" r="1" />
      <circle cx="15" cy="10" r="1" />
      <path d="M8 14h8" />
    </svg>
  );
}

function IconTarget({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconActivity({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function IconBox({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function IconSettings({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 1.75l-.12.94a2 2 0 0 1-1.52 1.64l-.91.22a2 2 0 0 0-1.22 3.1l.5.81a2 2 0 0 1 0 2.12l-.5.81a2 2 0 0 0 1.22 3.1l.91.22a2 2 0 0 1 1.52 1.64l.12.94a2 2 0 0 0 2 1.75h.44a2 2 0 0 0 2-1.75l.12-.94a2 2 0 0 1 1.52-1.64l.91-.22a2 2 0 0 0 1.22-3.1l-.5-.81a2 2 0 0 1 0-2.12l.5-.81a2 2 0 0 0-1.22-3.1l-.91-.22a2 2 0 0 1-1.52-1.64l-.12-.94a2 2 0 0 0-2-1.75Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconTerminal({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function IconLock({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconRadio({ size = 14, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2a6 6 0 0 1 0-8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8a6 6 0 0 1 0 8.5" />
      <path d="M19.1 4.9a10 10 0 0 1 0 14.2" />
    </svg>
  );
}
