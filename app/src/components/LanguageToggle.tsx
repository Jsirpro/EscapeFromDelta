"use client";

import { useI18n } from "../i18n";

export function LanguageToggle() {
  const { t, toggleLanguage } = useI18n();
  return (
    <button className="button button-secondary" type="button" onClick={toggleLanguage}>
      {t.languageButton}
    </button>
  );
}
