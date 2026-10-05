import type { EquipmentBonus } from '../types';

export const equipmentBonuses: EquipmentBonus[] = [
  { id: 'starscourge', name: 'Starscourge Heirloom', bonuses: { str: 5 } },
  { id: 'prosthesis-wearer', name: "Prosthesis-Wearer's Heirloom", bonuses: { dex: 5 } },
  { id: 'stargazer', name: 'Stargazer Heirloom', bonuses: { int: 5 } },
  { id: 'two-fingers', name: 'Two Fingers Heirloom', bonuses: { fai: 5 } },
  { id: 'silver-tear', name: 'Silver Tear Mask', bonuses: { arc: 8 } },
  { id: 'str-knot', name: 'Strength-knot Crystal Tear', bonuses: { str: 10 } },
  { id: 'dex-knot', name: 'Dexterity-knot Crystal Tear', bonuses: { dex: 10 } },
  { id: 'int-knot', name: 'Intelligence-knot Crystal Tear', bonuses: { int: 10 } },
  { id: 'fai-knot', name: 'Faith-knot Crystal Tear', bonuses: { fai: 10 } },
];
