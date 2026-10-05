export const allAttributes = ['str', 'dex', 'int', 'fai', 'arc'] as const;
export type Attribute = typeof allAttributes[number];
export type Attributes = Record<Attribute, number>;

export const AttackPowerType = {
  PHYSICAL: 0,
  MAGIC: 1,
  FIRE: 2,
  LIGHTNING: 3,
  HOLY: 4,
  POISON: 5,
  SCARLET_ROT: 6,
  BLEED: 7,
  FROST: 8,
  SLEEP: 9,
  MADNESS: 10,
  DEATH_BLIGHT: 11,
} as const;
export type AttackPowerType = typeof AttackPowerType[keyof typeof AttackPowerType];
export const allDamageTypes: AttackPowerType[] = [0, 1, 2, 3, 4];
export const allStatusTypes: AttackPowerType[] = [5, 6, 7, 8, 9, 10, 11];

export type CalcCorrectStage = {
  maxVal: number;
  maxGrowVal: number;
  adjPt: number;
};
export type CalcCorrectGraph = CalcCorrectStage[];

export interface ReinforceParamWeapon {
  attack: Partial<Record<AttackPowerType, number>>;
  attributeScaling: Record<Attribute, number>;
  statusSpEffectId1?: number;
  statusSpEffectId2?: number;
  statusSpEffectId3?: number;
}

export interface EncodedWeaponJson {
  name: string;
  weaponName: string;
  variant?: string;
  url?: string | null;
  affinityId: number;
  weaponType: number;
  requirements: Partial<Record<Attribute, number>>;
  attributeScaling: (readonly [Attribute, number])[];
  attack: (readonly [AttackPowerType, number])[];
  statusSpEffectParamIds?: number[];
  reinforceTypeId: number;
  attackElementCorrectId: number;
  calcCorrectGraphIds?: Partial<Record<AttackPowerType, number>>;
  paired?: boolean;
  sorceryTool?: boolean;
  incantationTool?: boolean;
  dlc?: boolean;
}

export interface EncodedRegulationDataJson {
  readonly calcCorrectGraphs: Record<number, CalcCorrectGraph | undefined>;
  readonly attackElementCorrects: Record<
    number,
    Partial<Record<AttackPowerType, Partial<Record<Attribute, number | true>>>> | undefined
  >;
  readonly reinforceTypes: Record<number, ReinforceParamWeapon[] | undefined>;
  readonly statusSpEffectParams: Record<number, Partial<Record<AttackPowerType, number>> | undefined>;
  readonly scalingTiers: [number, string][];
  readonly weapons: readonly EncodedWeaponJson[];
}

export type AttackElementCorrect = Partial<
  Record<AttackPowerType, Partial<Record<Attribute, number | true>>>
>;

export interface GameWeapon {
  name: string;
  weaponName: string;
  variant?: string;
  url: string | null;
  affinityId: number;
  weaponType: number;
  requirements: Partial<Record<Attribute, number>>;
  attributeScaling: Partial<Record<Attribute, number>>[];
  attack: Partial<Record<AttackPowerType, number>>[];
  attackElementCorrect: AttackElementCorrect;
  calcCorrectGraphs: Record<AttackPowerType, number[]>;
  paired?: boolean;
  sorceryTool?: boolean;
  incantationTool?: boolean;
  scalingTiers: [number, string][];
  dlc: boolean;
}
