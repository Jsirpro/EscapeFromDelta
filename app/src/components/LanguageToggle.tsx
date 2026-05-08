"use client";

import type { CSSProperties } from "react";

import { useI18n } from "../i18n";

export function LanguageToggle({ className, style }: { className?: string; style?: CSSProperties }) {
  const { t, toggleLanguage } = useI18n();
  return (
    <button className={className ?? "button button-secondary"} style={style} type="button" onClick={toggleLanguage}>
      {t.languageButton}
    </button>
  );
}
