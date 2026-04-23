"use client";

import { useI18n } from "../i18n";

export interface DifficultyFormValues {
  entryFee: number;
  low: number;
  medium: number;
  high: number;
}

export function validateDifficultyForm(values: DifficultyFormValues): boolean {
  return (
    values.entryFee >= 0 &&
    [values.low, values.medium, values.high].every((value) => value >= 0 && value <= 100)
  );
}

export function DifficultyForm() {
  const { t } = useI18n();
  return (
    <form>
      <label>
        {t.admin.entryFee}
        <input min="0" name="entryFee" type="number" />
      </label>
      <button className="button" type="button">
        {t.admin.createDifficulty}
      </button>
    </form>
  );
}
