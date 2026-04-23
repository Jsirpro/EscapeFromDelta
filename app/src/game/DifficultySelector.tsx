"use client";

import { useI18n } from "../i18n";

export function DifficultySelector() {
  const { t } = useI18n();
  return (
    <label className="card">
      <span className="field-label">{t.play.difficulty}</span>
      <select defaultValue="standard">
        <option value="standard">{t.play.standardDemo}</option>
      </select>
    </label>
  );
}
