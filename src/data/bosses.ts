export interface BossPreset {
  id: string;
  name: string;
  section: 'Main path' | 'Shadow of the Erdtree';
  dlc?: 'shadow-of-the-erdtree';
}

export const bossPresets: BossPreset[] = [
  { id: 'margit', name: 'Margit, the Fell Omen', section: 'Main path' },
  { id: 'godrick', name: 'Godrick the Grafted', section: 'Main path' },
  { id: 'red-wolf', name: 'Red Wolf of Radagon', section: 'Main path' },
  { id: 'rennala', name: 'Rennala, Queen of the Full Moon', section: 'Main path' },
  { id: 'radahn', name: 'Starscourge Radahn', section: 'Main path' },
  { id: 'dts', name: 'Draconic Tree Sentinel (Leyndell)', section: 'Main path' },
  { id: 'golden-godfrey', name: 'Godfrey, First Elden Lord (Golden Shade)', section: 'Main path' },
  { id: 'morgott', name: 'Morgott, the Omen King', section: 'Main path' },
  { id: 'fire-giant', name: 'Fire Giant', section: 'Main path' },
  { id: 'godskin-duo', name: 'Godskin Duo', section: 'Main path' },
  { id: 'maliketh', name: 'Maliketh, the Black Blade', section: 'Main path' },
  { id: 'gideon', name: 'Sir Gideon Ofnir, the All-Knowing', section: 'Main path' },
  { id: 'godfrey', name: 'Godfrey / Hoarah Loux', section: 'Main path' },
  { id: 'radagon', name: 'Radagon of the Golden Order', section: 'Main path' },
  { id: 'elden-beast', name: 'Elden Beast', section: 'Main path' },
  { id: 'divine-beast', name: 'Divine Beast Dancing Lion', section: 'Shadow of the Erdtree', dlc: 'shadow-of-the-erdtree' },
  { id: 'rellana', name: 'Rellana, Twin Moon Knight', section: 'Shadow of the Erdtree', dlc: 'shadow-of-the-erdtree' },
  { id: 'messmer', name: 'Messmer the Impaler', section: 'Shadow of the Erdtree', dlc: 'shadow-of-the-erdtree' },
  { id: 'romina', name: 'Romina, Saint of the Bud', section: 'Shadow of the Erdtree', dlc: 'shadow-of-the-erdtree' },
  { id: 'consort', name: 'Promised Consort Radahn', section: 'Shadow of the Erdtree', dlc: 'shadow-of-the-erdtree' },
];
