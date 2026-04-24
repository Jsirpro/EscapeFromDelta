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
  const showResumePrompt =
    Boolean(player.profile?.activeRaid) && (state.status === "preparing" || state.status === "transitioning");
  const startArmorCost = 2.0;
  const startWeaponCost = 2.0;

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
    if (!player.onChainProfileLoaded) return;
    if (player.onChainActiveRaid) return;
    if (state.status === "active" || state.status === "pending_battle") {
      dispatch({ type: "reset" });
    }
  }, [player.onChainProfileLoaded, player.onChainActiveRaid, state.status]);

  async function handleRaidAction(action: "open" | "move" | "extract" | "fight") {
    setActionError(null);
    setBusyAction(action);
    try {
      if (action === "open") {
        await player.openDemoContainer(0, 5);
        dispatch({ type: "encounter" });
        return;
      }
      if (action === "fight") {
        const snapshot = await player.fightDemoEnemy();
        if (snapshot?.profile?.activeRaid) {
          dispatch({ type: "win" });
        } else {
          dispatch({ type: "fail" });
        }
        return;
      }
      if (action === "move") {
        await player.moveDemoArea("medium");
        dispatch({ type: "move", area: "medium" });
        return;
      }
      await player.settleDemoRaid("succeeded");
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
      await player.settleDemoRaid("failed");
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
    setBusyAction("start");
    dispatch({ type: "start" });
    try {
      await player.startDemoRaid();
      dispatch({ type: "landed" });
    } catch (error) {
      const snapshot = await player.refreshRemote().catch(() => null);
      dispatch({ type: "reset" });
      if (isRaidAlreadyActiveError(error) && snapshot?.profile?.activeRaid) {
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
      await player.purchaseLoadoutPoints(kind);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "purchase-loadout-failed");
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
            </div>
          </div>

          <div className="toolbar">
            <button
              className="button button-secondary"
              disabled={busyAction !== null}
              type="button"
              onClick={() => void handlePurchaseLoadout("armor")}
            >
              {t.play.buyArmorPoint}
            </button>
            <button
              className="button button-secondary"
              disabled={busyAction !== null}
              type="button"
              onClick={() => void handlePurchaseLoadout("weapon")}
            >
              {t.play.buyWeaponPoint}
            </button>
            <span className="pill">{t.play.loadoutPurchasePrice}</span>
          </div>

          {actionError ? <div className="alert">{formatPlayError(actionError, t)}</div> : null}

          {player.lastTransactionDebug ? (
            <details>
              <summary>Transaction Debug</summary>
              <pre>{JSON.stringify(player.lastTransactionDebug, null, 2)}</pre>
            </details>
          ) : null}

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
                  disabled={busyAction !== null}
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
                  {busyAction === "open" ? t.play.openingContainer : t.play.encounter}
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
          <SafeCaseSelection />
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
  if (error.includes('"Custom":6009') || error.includes("InvalidEquipment")) {
    return t.play.insufficientLoadout;
  }
  return error;
}
