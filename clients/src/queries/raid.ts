export function battleWinChance(armorTenths: number, weaponTenths: number, enemyCombatTenths: number): number {
  if (weaponTenths <= 10) return 0;
  const diff = armorTenths + weaponTenths - enemyCombatTenths;
  return Math.max(15, Math.min(85, 50 + Math.trunc(diff / 2)));
}

export function encounterChance(base: number, sameAreaSteps: number, areaChanges: number): number {
  return Math.min(95, base + sameAreaSteps * 5 + areaChanges * 15);
}

export function safeCaseRetained(carried: string[], selected: string[], capacity: number): string[] {
  const carriedSet = new Set(carried);
  return selected.filter((item) => carriedSet.has(item)).slice(0, capacity);
}

export const defaultRiskAreas = [
  { risk: "low", containers: 5, baseEncounterChance: 10 },
  { risk: "medium", containers: 5, baseEncounterChance: 30 },
  { risk: "high", containers: 5, baseEncounterChance: 50 },
];
