import type { OffensiveStat, ScalingProfile, Stats } from '../types';

const softCaps: Record<OffensiveStat, [number, number, number]> = {
  str: [20, 55, 80],
  dex: [20, 55, 80],
  int: [20, 50, 80],
  fai: [20, 50, 80],
  arc: [20, 45, 80],
};

// Smooth piecewise approximation for v0.1 visualization. Replaced by exact
// CalcCorrectGraph tables when the verified regulation dataset is integrated.
export function statSaturation(stat: OffensiveStat, value: number): number {
  const v = Math.max(1, Math.min(99, value));
  const [c1, c2, c3] = softCaps[stat];
  if (v <= c1) return (v - 1) / (c1 - 1) * 0.28;
  if (v <= c2) return 0.28 + ((v - c1) / (c2 - c1)) * 0.42;
  if (v <= c3) return 0.70 + ((v - c2) / (c3 - c2)) * 0.23;
  return 0.93 + ((v - c3) / (99 - c3)) * 0.07;
}

export function scalingContribution(profile: ScalingProfile, stats: Stats): number {
  let total = 0;
  for (const [key, coefficient] of Object.entries(profile) as [OffensiveStat, number][]) {
    total += coefficient * statSaturation(key, stats[key]);
  }
  return total;
}
