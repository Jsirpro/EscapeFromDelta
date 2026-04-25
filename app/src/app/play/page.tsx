"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useState } from "react";

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
              <p>{showResumePrompt ? t.play.resumeBrief : t.play.readyBrief}</p>
            </div>
            <div className="mission-state">
              <span className="field-label">{t.play.status}</span>
              <strong className="mission-state-value">{raidStatusLabel}</strong>
            </div>
          </div>
          <div className="risk-map">
            <div className="risk-zone risk-low">
              <strong>{t.play.lowRisk}</strong>
              <span>{t.play.lowEncounter}</span>
            </div>
            <div className="risk-zone risk-medium">
              <strong>{t.play.mediumRisk}</strong>
              <span>{t.play.mediumEncounter}</span>
            </div>
            <div className="risk-zone risk-high">
              <strong>{t.play.highRisk}</strong>
              <span>{t.play.highEncounter}</span>
            </div>
          </div>

          <div className="stat-strip">
            <div className="stat-card">
              <span className="stat-label">{t.play.currentBalances}</span>
              <strong className="stat-value">
                {t.common.armor}: {player.armorPointBalance.toFixed(1)}
              </strong>
              <p>
                {t.common.weapon}: {player.weaponPointBalance.toFixed(1)}
              </p>
            </div>
            <div className="stat-card">
              <span className="stat-label">{t.play.startCost}</span>
              <strong className="stat-value">
                {t.common.armor}: {startArmorCost.toFixed(1)}
              </strong>
              <p>
                {t.common.weapon}: {startWeaponCost.toFixed(1)}
              </p>
              <p>
                {t.play.safeCase}: {safeCaseCapacity === 0 ? t.play.safeCaseNone : `${safeCaseCapacity} ${t.play.safeCaseSlot}`} ({safeCasePrice} EDcoins)
              </p>
              <p>{t.common.edcoins}: {totalStartEdcoinsCost}</p>
            </div>
          </div>

          <div className="field-row">
            <label className="card">
              <span className="field-label">{t.play.purchaseAmount}</span>
              <input
                className="text-input"
                inputMode="decimal"
                min="0.1"
                step="0.1"
                type="number"
                value={armorPurchaseAmount}
                onChange={(event) => setArmorPurchaseAmount(event.target.value)}
              />
              <p>{t.play.purchaseHint}</p>
              <p>{armorPurchasePrice} EDcoins</p>
              {BigInt(armorPurchasePrice) > player.edcoinsBalance ? <p className="purchase-warning">{t.play.insufficientEdcoinsPurchase}</p> : null}
              <button
                className="button button-secondary"
                disabled={armorPurchaseDisabled}
                type="button"
                onClick={() => void handlePurchaseLoadout("armor")}
              >
                {t.play.buyArmorPoint}
              </button>
            </label>

            <label className="card">
              <span className="field-label">{t.play.purchaseAmount}</span>
              <input
                className="text-input"
                inputMode="decimal"
                min="0.1"
                step="0.1"
                type="number"
                value={weaponPurchaseAmount}
                onChange={(event) => setWeaponPurchaseAmount(event.target.value)}
              />
              <p>{t.play.purchaseHint}</p>
              <p>{weaponPurchasePrice} EDcoins</p>
              {BigInt(weaponPurchasePrice) > player.edcoinsBalance ? <p className="purchase-warning">{t.play.insufficientEdcoinsPurchase}</p> : null}
              <button
                className="button button-secondary"
                disabled={weaponPurchaseDisabled}
                type="button"
                onClick={() => void handlePurchaseLoadout("weapon")}
              >
                {t.play.buyWeaponPoint}
              </button>
            </label>
          </div>

          <div className="toolbar">
            <span className="pill">{t.play.loadoutPurchasePrice}</span>
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
            {showResumePrompt ? (
              <>
                <button
                  className="button"
                  disabled={busyAction !== null}
                  type="button"
                  onClick={() => dispatch({ type: "landed" })}
                >
                  {t.play.resumeRaid}
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
            ) : state.status === "preparing" || state.status === "transitioning" ? (
              <>
                <button
                  className="button"
                  disabled={startRaidDisabled}
                  type="button"
                  onClick={handleStartRaid}
                >
                  {busyAction === "start" ? t.play.deploying : t.play.startRaid}
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
  if (error.includes("session-wallet-missing") || error.includes("session-create-not-supported")) {
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
