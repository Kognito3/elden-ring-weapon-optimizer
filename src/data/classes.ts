import type { StartingClass } from '../types';

export const startingClasses: StartingClass[] = [
  { id: 'wretch', name: 'Wretch', runeLevel: 1, stats: { vig: 10, mnd: 10, end: 10, str: 10, dex: 10, int: 10, fai: 10, arc: 10 } },
  { id: 'vagabond', name: 'Vagabond', runeLevel: 9, stats: { vig: 15, mnd: 10, end: 11, str: 14, dex: 13, int: 9, fai: 9, arc: 7 } },
  { id: 'warrior', name: 'Warrior', runeLevel: 8, stats: { vig: 11, mnd: 12, end: 11, str: 10, dex: 16, int: 10, fai: 8, arc: 9 } },
  { id: 'hero', name: 'Hero', runeLevel: 7, stats: { vig: 14, mnd: 9, end: 12, str: 16, dex: 9, int: 7, fai: 8, arc: 11 } },
  { id: 'bandit', name: 'Bandit', runeLevel: 5, stats: { vig: 10, mnd: 11, end: 10, str: 9, dex: 13, int: 9, fai: 8, arc: 14 } },
  { id: 'astrologer', name: 'Astrologer', runeLevel: 6, stats: { vig: 9, mnd: 15, end: 9, str: 8, dex: 12, int: 16, fai: 7, arc: 9 } },
  { id: 'prophet', name: 'Prophet', runeLevel: 7, stats: { vig: 10, mnd: 14, end: 8, str: 11, dex: 10, int: 7, fai: 16, arc: 10 } },
  { id: 'samurai', name: 'Samurai', runeLevel: 9, stats: { vig: 12, mnd: 11, end: 13, str: 12, dex: 15, int: 9, fai: 8, arc: 8 } },
  { id: 'prisoner', name: 'Prisoner', runeLevel: 9, stats: { vig: 11, mnd: 12, end: 11, str: 11, dex: 14, int: 14, fai: 6, arc: 9 } },
  { id: 'confessor', name: 'Confessor', runeLevel: 10, stats: { vig: 10, mnd: 13, end: 10, str: 12, dex: 12, int: 9, fai: 14, arc: 9 } },
  { id: 'heavy-knight', name: 'Heavy Knight', runeLevel: 10, dlc: 'tarnished-pack', stats: { vig: 14, mnd: 8, end: 17, str: 15, dex: 11, int: 7, fai: 8, arc: 9 } },
  { id: 'idus-knight', name: 'Idus Knight', runeLevel: 7, dlc: 'tarnished-pack', stats: { vig: 10, mnd: 12, end: 11, str: 13, dex: 15, int: 8, fai: 11, arc: 6 } },
];
