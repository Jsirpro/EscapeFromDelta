"use client";

import type { RaidUiState } from "./raidMachine";
import { useI18n } from "../i18n";

export function RaidActionPanel({ state }: { state: RaidUiState }) {
  const { t } = useI18n();
  return (
    <section className="control-surface" aria-label="Raid actions">
      <h2>{t.play.raidStatus}</h2>
      <div className="stat-strip">
        <div className="stat-card">
          <span className="stat-label">{t.play.area}</span>
          <strong className="stat-value">{translateArea(state.currentArea, t)}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t.play.status}</span>
          <strong className="stat-value">{translateStatus(state.status, t)}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t.play.actions}</span>
          <strong className="stat-value">{state.availableActions.length}</strong>
        </div>
      </div>
      <div className="toolbar">
        {state.availableActions.map((action) => (
          <span className="pill" key={action}>
            {translateAction(action, t)}
          </span>
        ))}
      </div>
    </section>
  );
}

function translateArea(area: RaidUiState["currentArea"], t: ReturnType<typeof useI18n>["t"]) {
  if (area === "low") return t.play.lowRisk;
  if (area === "medium") return t.play.mediumRisk;
  return t.play.highRisk;
}

function translateStatus(status: RaidUiState["status"], t: ReturnType<typeof useI18n>["t"]) {
  const labels = {
    preparing: t.play.startRaid,
    transitioning: t.play.land,
    active: t.play.inRaid,
    pending_battle: t.play.encounter,
    succeeded: t.play.extracted,
    failed: t.play.raidFailed,
  };
  return labels[status];
}

function translateAction(action: string, t: ReturnType<typeof useI18n>["t"]) {
  const labels: Record<string, string> = {
    start: t.play.startRaid,
    open: t.play.openContainer,
    move: t.play.moveMedium,
    extract: t.play.extract,
    fight: t.play.winBattle,
  };
  return labels[action] ?? action;
}
