"use client";

import { useI18n } from "../i18n";

export function EquipmentSelector() {
  const { t } = useI18n();
  return (
    <section className="control-surface">
      <h2>{t.play.loadout}</h2>
      <div className="field-row">
      <label>
        <span className="field-label">{t.common.armor}</span>
        <input min="1" max="6" step="0.1" defaultValue="2.0" type="number" />
      </label>
      <label>
        <span className="field-label">{t.common.weapon}</span>
        <input min="1" max="5" step="0.1" defaultValue="2.0" type="number" />
      </label>
      </div>
    </section>
  );
}
