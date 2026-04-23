"use client";

import { DifficultyForm } from "../../components/DifficultyForm";
import { LanguageToggle } from "../../components/LanguageToggle";
import { useI18n } from "../../i18n";

export default function AdminPage() {
  const { t } = useI18n();
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <p className="eyebrow">{t.admin.eyebrow}</p>
          <h1>{t.admin.title}</h1>
        </div>
        <LanguageToggle />
      </header>
      <section className="control-surface">
        <p>{t.admin.description}</p>
        <DifficultyForm />
      </section>
    </main>
  );
}
