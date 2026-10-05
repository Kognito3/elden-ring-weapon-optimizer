import type { Weapon } from '../types';

// v0.1 uses a deliberately small demo dataset so the UI/optimizer can be tested
// before we import a complete, regulation-derived dataset. Values here are NOT
// intended to be treated as authoritative in-game AR numbers yet.
export const weapons: Weapon[] = [
  {
    id: 'moonveil',
    name: 'Moonveil',
    category: 'Katana',
    somber: true,
    maxUpgrade: 10,
    dataStatus: 'demo',
    variants: [
      {
        affinity: 'Unique',
        baseAR: 365,
        scaling: { str: 0.18, dex: 0.55, int: 0.72 },
        requirements: { str: 12, dex: 18, int: 23 },
      },
    ],
    skill: {
      name: 'Transient Moonlight',
      basePower: 250,
      scaling: { int: 1.0, dex: 0.22 },
      note: 'Demo skill model only. Full skill motion-value/bullet formulas come in the verified-data pass.',
    },
  },
  {
    id: 'uchigatana',
    name: 'Uchigatana',
    category: 'Katana',
    somber: false,
    maxUpgrade: 25,
    dataStatus: 'demo',
    variants: [
      { affinity: 'Standard', baseAR: 310, scaling: { str: 0.42, dex: 0.52 }, requirements: { str: 11, dex: 15 } },
      { affinity: 'Keen', baseAR: 285, scaling: { str: 0.15, dex: 0.88 }, requirements: { str: 11, dex: 15 } },
      { affinity: 'Heavy', baseAR: 292, scaling: { str: 0.9, dex: 0.1 }, requirements: { str: 11, dex: 15 } },
      { affinity: 'Cold', baseAR: 330, scaling: { str: 0.25, dex: 0.4, int: 0.5 }, requirements: { str: 11, dex: 15 } },
      { affinity: 'Blood', baseAR: 300, scaling: { str: 0.25, dex: 0.45, arc: 0.35 }, requirements: { str: 11, dex: 15 } },
      { affinity: 'Occult', baseAR: 290, scaling: { str: 0.18, dex: 0.28, arc: 0.72 }, requirements: { str: 11, dex: 15 } },
    ],
  },
  {
    id: 'blasphemous-blade',
    name: 'Blasphemous Blade',
    category: 'Greatsword',
    somber: true,
    maxUpgrade: 10,
    dataStatus: 'demo',
    variants: [
      { affinity: 'Unique', baseAR: 500, scaling: { str: 0.48, dex: 0.28, fai: 0.72 }, requirements: { str: 22, dex: 15, fai: 21 } },
    ],
    skill: {
      name: "Taker's Flames",
      basePower: 380,
      scaling: { fai: 1.05 },
      note: 'Demo skill model only.',
    },
  },
];
