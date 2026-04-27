"use client";

import { useI18n } from "../i18n";

export function LanguageToggle() {
  const { t, toggleLanguage } = useI18n();
  return (
    <button className="topbar-tool-button" style={{ height: "42px", padding: "0 12px", display: "flex", alignItems: "center", gap: "8px" }} type="button" onClick={toggleLanguage}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      <span style={{ fontSize: "11px", fontWeight: "900", fontFamily: "monospace" }}>{t.languageButton}</span>
    </button>
  );
}
