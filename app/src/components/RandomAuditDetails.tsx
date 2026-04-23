"use client";

import type { RandomEventAudit } from "../../../clients/src/types";
import { useI18n } from "../i18n";

export function RandomAuditDetails({ events = [] }: { events?: RandomEventAudit[] }) {
  const { t } = useI18n();
  return (
    <details>
      <summary>{t.records.randomAudit}</summary>
      {events.length === 0 ? <p>{t.records.noRandomEvents}</p> : null}
      {events.map((event) => (
        <p key={event.eventId}>
          {event.type}: {event.finalRandomValue}
        </p>
      ))}
    </details>
  );
}
