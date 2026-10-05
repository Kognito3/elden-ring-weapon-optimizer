/**
 * Elden Ring PvE flat-defense curve. `attackPower` should already include the
 * motion value for the individual hit and should be for one damage type only.
 */
export function defenseMultiplier(attackPower: number, defense: number): number {
  if (defense <= 0) return 0.9;
  const ratio = attackPower / defense;
  if (ratio < 0.125) return 0.1;
  if (ratio < 1) return 0.1 + ((ratio - 0.125) ** 2) / 2.552;
  if (ratio < 2.5) return 0.7 - ((2.5 - ratio) ** 2) / 7.5;
  if (ratio < 8) return 0.9 - ((8 - ratio) ** 2) / 151.25;
  return 0.9;
}

export function damageAfterDefenseAndNegation(
  attackPower: number,
  defense: number,
  negationPercent: number,
): number {
  const afterDefense = attackPower * defenseMultiplier(attackPower, defense);
  return afterDefense * (1 - negationPercent / 100);
}
