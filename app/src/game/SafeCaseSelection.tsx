"use client";

import { useI18n } from "../i18n";

interface SafeCaseSelectionProps {
  capacity: number;
  priceEdcoins: number;
  disabled?: boolean;
  onChange?: (capacity: number) => void;
  activeCapacity?: number;
  activeSelectedCount?: number;
}

export function SafeCaseSelection({
  capacity,
  priceEdcoins,
  disabled = false,
  onChange,
  activeCapacity = 0,
  activeSelectedCount = 0,
}: SafeCaseSelectionProps) {
  const { t } = useI18n();
  return (
    <section className="card">
      <h2>{t.play.safeCase}</h2>
      <p>{t.play.safeCaseHelp}</p>
      <div className="toolbar">
        {[0, 1, 2, 3].map((option) => (
          <button
            key={option}
            className={option === capacity ? "button" : "button button-secondary"}
            disabled={disabled}
            type="button"
            onClick={() => onChange?.(option)}
          >
            {option === 0 ? t.play.safeCaseNone : `${option} ${t.play.safeCaseSlot}`}
          </button>
        ))}
      </div>
      <p>{t.play.safeCasePrice.replace("{price}", String(priceEdcoins))}</p>
      {activeCapacity > 0 ? (
        <p>{t.play.safeCaseAuto.replace("{count}", String(activeSelectedCount)).replace("{capacity}", String(activeCapacity))}</p>
      ) : null}
    </section>
  );
}
