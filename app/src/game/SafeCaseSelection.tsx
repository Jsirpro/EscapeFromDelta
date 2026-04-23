"use client";

import { useI18n } from "../i18n";

export function SafeCaseSelection() {
  const { t } = useI18n();
  return (
    <section className="card">
      <h2>{t.play.safeCase}</h2>
      <p>{t.play.safeCaseHelp}</p>
    </section>
  );
}
