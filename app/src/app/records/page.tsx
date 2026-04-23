"use client";

import { LanguageToggle } from "../../components/LanguageToggle";
import { RandomAuditDetails } from "../../components/RandomAuditDetails";
import { useI18n } from "../../i18n";
import { usePlayerProfile } from "../../wallet/usePlayerProfile";

export default function RecordsPage() {
  const player = usePlayerProfile();
  const { t } = useI18n();
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <p className="eyebrow">{t.records.eyebrow}</p>
          <h1>{t.records.title}</h1>
        </div>
        <LanguageToggle />
      </header>
      {player.battleRecords.length === 0 ? <p className="card">{t.records.empty}</p> : null}
      <div className="record-grid">
        {player.battleRecords.map((record) => (
          <section className="record-card" key={record.recordId}>
            <h2>{t.records.raid} {record.raidId}</h2>
            <p>{t.records.result}: {t.records.results[record.result]}</p>
            <p>{t.records.retained}: {record.retainedAssets.length}</p>
            <p>{t.records.lost}: {record.lostAssets.length}</p>
            <RandomAuditDetails events={record.randomEvents} />
          </section>
        ))}
      </div>
    </main>
  );
}
