import type { AllocationPoint, OffensiveStat, Stats, WeaponVariant, SkillProfile } from '../types';
import { getWeaponAttack, totalAttackRating } from '../game/calculator';
import type { Attributes } from '../game/types';

export type OptimizeMode = 'weapon' | 'skill';
export type GraphMode = 'current' | 'full';

export function effectiveStats(base: Stats, bonuses: Partial<Record<keyof Stats, number>>): Stats {
  const out = { ...base };
  (Object.keys(out) as (keyof Stats)[]).forEach((key) => {
    out[key] = Math.min(99, out[key] + (bonuses[key] ?? 0));
  });
  return out;
}

function offensiveAttributes(stats: Stats): Attributes {
  return {
    str: stats.str,
    dex: stats.dex,
    int: stats.int,
    fai: stats.fai,
    arc: stats.arc,
  };
}

export function meetsRequirements(variant: WeaponVariant, stats: Stats, twoHanded: boolean): boolean {
  const result = getWeaponAttack({
    weapon: variant.gameWeapon,
    attributes: offensiveAttributes(stats),
    twoHanding: twoHanded,
    upgradeLevel: Math.min(variant.gameWeapon.attack.length - 1, 0),
  });
  return result.ineffectiveAttributes.length === 0;
}

export function calculateValue(
  mode: OptimizeMode,
  variant: WeaponVariant,
  skill: SkillProfile | undefined,
  stats: Stats,
  upgrade: number,
  _maxUpgrade: number,
  twoHanded: boolean,
): number {
  // Skill formula support is the next engine layer. Until a weapon has a verified skill profile,
  // the skill button is disabled in the UI. Keeping this branch makes that addition non-breaking.
  if (mode === 'skill' && skill) {
    const scaling = Object.entries(skill.scaling).reduce((sum, [stat, coefficient]) => {
      const value = stats[stat as OffensiveStat] ?? 1;
      return sum + (coefficient ?? 0) * Math.max(0, value - 1) / 98;
    }, 0);
    return skill.basePower * (1 + scaling);
  }

  const attack = getWeaponAttack({
    weapon: variant.gameWeapon,
    attributes: offensiveAttributes(stats),
    twoHanding: twoHanded,
    upgradeLevel: Math.min(upgrade, variant.gameWeapon.attack.length - 1),
  });
  return totalAttackRating(attack.attackPower);
}

export interface OptimizeInput {
  stats: Stats;
  axisX: OffensiveStat;
  axisY: OffensiveStat;
  pointsAvailable: number;
  variant: WeaponVariant;
  skill?: SkillProfile;
  mode: OptimizeMode;
  upgrade: number;
  maxUpgrade: number;
  twoHanded: boolean;
}

export function allocationLine(input: OptimizeInput): AllocationPoint[] {
  const { stats, axisX, axisY, pointsAvailable } = input;
  const result: AllocationPoint[] = [];
  for (let spendX = 0; spendX <= pointsAvailable; spendX += 1) {
    const spendY = pointsAvailable - spendX;
    const x = stats[axisX] + spendX;
    const y = stats[axisY] + spendY;
    if (x > 99 || y > 99) continue;
    const candidate = { ...stats, [axisX]: x, [axisY]: y };
    const value = calculateValue(input.mode, input.variant, input.skill, candidate, input.upgrade, input.maxUpgrade, input.twoHanded);
    result.push({ x, y, value, valid: meetsRequirements(input.variant, candidate, input.twoHanded) });
  }
  return result;
}

/** Reachable stat space from the user's current effective stats using up to N points. */
export function currentBuildHeatmap(input: OptimizeInput): AllocationPoint[] {
  const points: AllocationPoint[] = [];
  const minX = input.stats[input.axisX];
  const minY = input.stats[input.axisY];
  const maxX = Math.min(99, minX + input.pointsAvailable);
  const maxY = Math.min(99, minY + input.pointsAvailable);
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      const spent = (x - minX) + (y - minY);
      if (spent > input.pointsAvailable) continue;
      const candidate = { ...input.stats, [input.axisX]: x, [input.axisY]: y };
      const value = calculateValue(input.mode, input.variant, input.skill, candidate, input.upgrade, input.maxUpgrade, input.twoHanded);
      points.push({ x, y, value, valid: meetsRequirements(input.variant, candidate, input.twoHanded) });
    }
  }
  return points;
}

/** Full 1–99 × 1–99 stat map. Non-axis stats stay fixed at the user's entered values. */
export function fullStatHeatmap(input: OptimizeInput): AllocationPoint[] {
  const points: AllocationPoint[] = [];
  for (let x = 1; x <= 99; x += 1) {
    for (let y = 1; y <= 99; y += 1) {
      const candidate = { ...input.stats, [input.axisX]: x, [input.axisY]: y };
      const valid = meetsRequirements(input.variant, candidate, input.twoHanded);
      const value = calculateValue(input.mode, input.variant, input.skill, candidate, input.upgrade, input.maxUpgrade, input.twoHanded);
      points.push({ x, y, value, valid });
    }
  }
  return points;
}
