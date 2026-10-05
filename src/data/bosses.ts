export type EnemyDamageType = 'standard' | 'strike' | 'slash' | 'pierce' | 'magic' | 'fire' | 'lightning' | 'holy';

export interface EnemyDefenseProfile {
  defense: number;
  negation: Record<EnemyDamageType, number>;
  phase?: string;
  source: string;
  note?: string;
}

export interface BossPreset {
  id: string;
  name: string;
  section: 'Main path' | 'Shadow of the Erdtree';
  dlc?: 'shadow-of-the-erdtree';
  profile?: EnemyDefenseProfile;
}

const wiki = (slug: string) => `https://eldenring.wiki.gg/wiki/${slug}`;
const n = (
  defense: number,
  values: [number, number, number, number, number, number, number, number],
  source: string,
  phase?: string,
  note?: string,
): EnemyDefenseProfile => ({
  defense,
  negation: {
    standard: values[0], strike: values[1], slash: values[2], pierce: values[3],
    magic: values[4], fire: values[5], lightning: values[6], holy: values[7],
  },
  source,
  phase,
  note,
});

export const bossPresets: BossPreset[] = [
  { id: 'margit', name: 'Margit, the Fell Omen', section: 'Main path', profile: n(103, [0, 0, -10, 0, 0, 0, 0, 40], wiki('Margit_the_Fell_Omen')) },
  { id: 'godrick', name: 'Godrick the Grafted', section: 'Main path', profile: n(105, [0, 0, 0, 0, 20, 20, 20, 40], wiki('Godrick_the_Grafted')) },
  { id: 'red-wolf', name: 'Red Wolf of Radagon', section: 'Main path', profile: n(107, [0, 0, -10, 0, 40, 20, 20, 20], wiki('Red_Wolf_of_Radagon')) },
  { id: 'rennala', name: 'Rennala, Queen of the Full Moon', section: 'Main path', profile: n(109, [-10, 0, -10, -10, 80, 20, 20, 20], wiki('Rennala'), 'Phase 1', 'Phase 2 changes several elemental negations; phase selection will be added with the hit-damage pass.') },
  { id: 'radahn', name: 'Starscourge Radahn', section: 'Main path', profile: n(113, [10, 10, 10, 0, 20, 20, 20, 40], wiki('General_Radahn')) },
  { id: 'dts', name: 'Draconic Tree Sentinel (Leyndell)', section: 'Main path', profile: n(114, [10, 10, 35, 10, 20, 40, 40, 20], wiki('Draconic_Tree_Sentinel'), undefined, 'Negations are verified; the 114 NG defense value will be rechecked against the regulation-derived enemy table before final-damage calculations are enabled.') },
  { id: 'golden-godfrey', name: 'Godfrey, First Elden Lord (Golden Shade)', section: 'Main path' },
  { id: 'morgott', name: 'Morgott, the Omen King', section: 'Main path', profile: n(114, [0, 0, -10, 0, 0, 0, 0, 40], wiki('Morgott,_the_Omen_King')) },
  { id: 'fire-giant', name: 'Fire Giant', section: 'Main path', profile: n(118, [0, 0, -10, 0, 0, 50, 0, 20], wiki('Fire_Giant')) },
  { id: 'godskin-duo', name: 'Godskin Duo', section: 'Main path' },
  { id: 'maliketh', name: 'Maliketh, the Black Blade', section: 'Main path', profile: n(120, [35, 35, 35, 35, 40, 40, 40, 80], wiki('Maliketh,_the_Black_Blade')) },
  { id: 'gideon', name: 'Sir Gideon Ofnir, the All-Knowing', section: 'Main path' },
  { id: 'godfrey', name: 'Godfrey / Hoarah Loux', section: 'Main path', profile: n(120, [10, 10, 10, 0, 20, 20, 0, 40], wiki('Godfrey,_First_Elden_Lord'), 'Godfrey phase', 'Hoarah Loux has a different physical negation profile; phase selection is coming with the damage pass.') },
  { id: 'radagon', name: 'Radagon of the Golden Order', section: 'Main path' },
  { id: 'elden-beast', name: 'Elden Beast', section: 'Main path', profile: n(121, [10, 10, 10, 10, 40, 40, 40, 80], wiki('Elden_Beast')) },
  { id: 'divine-beast', name: 'Divine Beast Dancing Lion', section: 'Shadow of the Erdtree', dlc: 'shadow-of-the-erdtree', profile: n(122, [30, 30, 30, 0, 40, 0, 40, 40], wiki('Divine_Beast_Dancing_Lion')) },
  { id: 'rellana', name: 'Rellana, Twin Moon Knight', section: 'Shadow of the Erdtree', dlc: 'shadow-of-the-erdtree' },
  { id: 'messmer', name: 'Messmer the Impaler', section: 'Shadow of the Erdtree', dlc: 'shadow-of-the-erdtree' },
  { id: 'romina', name: 'Romina, Saint of the Bud', section: 'Shadow of the Erdtree', dlc: 'shadow-of-the-erdtree' },
  { id: 'consort', name: 'Promised Consort Radahn', section: 'Shadow of the Erdtree', dlc: 'shadow-of-the-erdtree', profile: n(125, [40, 40, 40, 20, 40, 40, 40, 0], wiki('Promised_Consort_Radahn'), 'Phase 1', 'Phase 2 Holy negation rises to 40%.') },
];
