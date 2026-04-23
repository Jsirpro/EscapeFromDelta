"use client";

import Link from "next/link";
import { useI18n } from "../i18n";

export function RaidResult({ result }: { result: "succeeded" | "failed" }) {
  const { t } = useI18n();
  return (
    <section className="card">
      <h2>{result === "succeeded" ? t.play.extracted : t.play.raidFailed}</h2>
      <Link className="button" href="/records">{t.play.battleRecord}</Link>
    </section>
  );
}
