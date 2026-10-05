import type { GameWeapon } from './game/types';

export type OffensiveStat = 'str' | 'dex' | 'int' | 'fai' | 'arc';
export type Stat = 'vig' | 'mnd' | 'end' | OffensiveStat;

export type Stats = Record<Stat, number>;

export interface StartingClass {
  id: string;
  name: string;
  runeLevel: number;
  stats: Stats;
  dlc?: 'tarnished-pack';
}

export type Affinity =
  | 'Standard'
  | 'Heavy'
  | 'Keen'
  | 'Quality'
  | 'Magic'
  | 'Fire'
  | 'Flame Art'
  | 'Lightning'
  | 'Sacred'
  | 'Poison'
  | 'Blood'
  | 'Cold'
  | 'Occult'
  | 'Unique';

export interface ScalingProfile {
  str?: number;
  dex?: number;
  int?: number;
  fai?: number;
  arc?: number;
}

export interface WeaponVariant {
  affinityId: number;
  affinity: Affinity;
  requirements: Partial<Record<OffensiveStat, number>>;
  gameWeapon: GameWeapon;
}

export interface SkillProfile {
  name: string;
  basePower: number;
  scaling: ScalingProfile;
  note?: string;
}

export interface Weapon {
  id: string;
  name: string;
  category: string;
  somber: boolean;
  dlc?: 'shadow-of-the-erdtree' | 'tarnished-pack';
  maxUpgrade: 10 | 25;
  variants: WeaponVariant[];
  skill?: SkillProfile;
  dataStatus: 'demo' | 'verified';
}

export interface EquipmentBonus {
  id: string;
  name: string;
  bonuses: Partial<Record<Stat, number>>;
  dlc?: 'shadow-of-the-erdtree' | 'tarnished-pack';
}

export interface AllocationPoint {
  x: number;
  y: number;
  value: number;
  valid: boolean;
}
