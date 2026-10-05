import type { AllocationPoint, OffensiveStat, Stats, WeaponVariant, SkillProfile, ScalingProfile } from '../types';
import { scalingContribution } from './scaling';

export type OptimizeMode = 'weapon' | 'skill';

export function effectiveStats(base: Stats, bonuses: Partial<Record<keyof Stats, number>>): Stats {
  const out = { ...base };
  (Object.keys(out) as (keyof Stats)[]).forEach((key) => {
    out[key] = Math.min(99, out[key] + (bonuses[key] ?? 0));
  });
  return out;
}

export function meetsRequirements(variant: WeaponVariant, stats: Stats, twoHanded: boolean): boolean {
  return Object.entries(variant.requirements).every(([key, req]) => {
    const stat = key as OffensiveStat;
    const value = stat === 'str' && twoHanded ? Math.floor(stats.str * 1.5) : stats[stat];
    return value >= (req ?? 0);
  });
}

export function calculateValue(
  mode: OptimizeMode,
  variant: WeaponVariant,
  skill: SkillProfile | undefined,
  stats: Stats,
  upgrade: number,
  maxUpgrade: number,
  twoHanded: boolean,
): number {
  const upgradeRatio = maxUpgrade === 0 ? 1 : upgrade / maxUpgrade;
  const upgradeMultiplier = 0.58 + 0.42 * upgradeRatio;
  if (mode === 'skill' && skill) {
    return skill.basePower * upgradeMultiplier * (1 + scalingContribution(skill.scaling, stats));
  }
  const requirementPenalty = meetsRequirements(variant, stats, twoHanded) ? 1 : 0.6;
  return variant.baseAR * upgradeMultiplier * (1 + scalingContribution(variant.scaling, stats)) * requirementPenalty;
}

export function recommendAxes(profile: ScalingProfile): OffensiveStat[] {
  return (Object.entries(profile) as [OffensiveStat, number][]) 
    .filter(([, value]) => (value ?? 0) > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([stat]) => stat);
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

export function heatmap(input: OptimizeInput): AllocationPoint[] {
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
