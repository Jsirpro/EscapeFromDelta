"use client";

import { useReducer } from "react";

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
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <p className="eyebrow">{t.play.eyebrow}</p>
          <h1>{t.play.title}</h1>
        </div>
        <LanguageToggle />
      </header>

      <section className="raid-grid">
        <div className="control-surface">
          <h2>{t.play.route}</h2>
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

          <div className="toolbar">
            <button
              className="button"
              type="button"
              onClick={async () => {
                await player.startDemoRaid();
                dispatch({ type: "start" });
              }}
            >
              {t.play.startRaid}
            </button>
            <button className="button button-secondary" type="button" onClick={() => dispatch({ type: "landed" })}>
              {t.play.land}
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={async () => {
                await player.openDemoContainer(0, 5);
                dispatch({ type: "encounter" });
              }}
            >
              {t.play.encounter}
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={async () => {
                await player.fightDemoEnemy();
                dispatch({ type: "win" });
              }}
            >
              {t.play.winBattle}
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={async () => {
                await player.moveDemoArea("medium");
                dispatch({ type: "move", area: "medium" });
              }}
            >
              {t.play.moveMedium}
            </button>
            <button
              className="button"
              type="button"
              onClick={async () => {
                await player.settleDemoRaid("succeeded");
                dispatch({ type: "extract" });
              }}
            >
              {t.play.extract}
            </button>
            <button
              className="button button-danger"
              type="button"
              onClick={async () => {
                await player.settleDemoRaid("failed");
                dispatch({ type: "fail" });
              }}
            >
              {t.play.failRaid}
            </button>
          </div>
        </div>

        <div className="scene" aria-label={t.play.sceneLabel}>
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
