import type { Affinity, OffensiveStat, Weapon, WeaponVariant } from '../types';
import type { GameWeapon } from './types';

const affinityById: Record<number, Affinity> = {
  [-1]: 'Unique',
  0: 'Standard',
  1: 'Heavy',
  2: 'Keen',
  3: 'Quality',
  4: 'Fire',
  5: 'Flame Art',
  6: 'Lightning',
  7: 'Sacred',
  8: 'Magic',
  9: 'Cold',
  10: 'Poison',
  11: 'Blood',
  12: 'Occult',
};

const weaponTypeLabels: Record<number, string> = {
  1: 'Dagger', 3: 'Straight Sword', 5: 'Greatsword', 7: 'Colossal Sword',
  9: 'Curved Sword', 11: 'Curved Greatsword', 13: 'Katana', 14: 'Twinblade',
  15: 'Thrusting Sword', 16: 'Heavy Thrusting Sword', 17: 'Axe', 19: 'Greataxe',
  21: 'Hammer', 23: 'Great Hammer', 24: 'Flail', 25: 'Spear', 28: 'Great Spear',
  29: 'Halberd', 31: 'Reaper', 35: 'Fist', 37: 'Claw', 39: 'Whip',
  41: 'Colossal Weapon', 50: 'Light Bow', 51: 'Bow', 53: 'Greatbow', 55: 'Crossbow',
  56: 'Ballista', 57: 'Glintstone Staff', 59: 'Dual Catalyst', 61: 'Sacred Seal',
  65: 'Small Shield', 67: 'Medium Shield', 69: 'Greatshield', 87: 'Torch',
  88: 'Hand-to-Hand', 89: 'Perfume Bottle', 90: 'Thrusting Shield', 91: 'Throwing Blade',
  92: 'Backhand Blade', 93: 'Light Greatsword', 94: 'Great Katana', 95: 'Beast Claw',
};

const tarnishedPackWeapons = new Set([
  'Hefty Scimitar',
  'Reverse-Bladed Sword',
  'Idus Sword',
  'Reed Great Katana',
  'Ritual Thrusting Shield',
  "Leontiel's Greatsword",
  'Golden Order Flail',
]);

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toVariant(gameWeapon: GameWeapon): WeaponVariant {
  return {
    affinityId: gameWeapon.affinityId,
    affinity: affinityById[gameWeapon.affinityId] ?? 'Unique',
    requirements: gameWeapon.requirements as Partial<Record<OffensiveStat, number>>,
    gameWeapon,
  };
}

export function buildWeaponCatalog(gameWeapons: GameWeapon[]): Weapon[] {
  const groups = new Map<string, GameWeapon[]>();
  for (const weapon of gameWeapons) {
    const key = `${weapon.weaponName}::${weapon.variant ?? ''}`;
    const group = groups.get(key) ?? [];
    group.push(weapon);
    groups.set(key, group);
  }

  return [...groups.entries()]
    .map(([key, variants]): Weapon => {
      variants.sort((a, b) => a.affinityId - b.affinityId);
      const representative = variants.find((w) => w.affinityId === 0) ?? variants[0];
      const maxUpgrade = Math.max(...variants.map((w) => w.attack.length - 1));
      const tarnishedPack = tarnishedPackWeapons.has(representative.weaponName);
      return {
        id: slug(key),
        name: representative.variant
          ? `${representative.weaponName} (${representative.variant})`
          : representative.weaponName,
        category: weaponTypeLabels[representative.weaponType] ?? `Weapon type ${representative.weaponType}`,
        somber: maxUpgrade <= 10,
        dlc: tarnishedPack ? 'tarnished-pack' : representative.dlc ? 'shadow-of-the-erdtree' : undefined,
        maxUpgrade: maxUpgrade <= 10 ? 10 : 25,
        variants: variants.map(toVariant),
        dataStatus: 'verified',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function recommendedAxesForVariant(variant: WeaponVariant, upgrade: number): OffensiveStat[] {
  const scaling = variant.gameWeapon.attributeScaling[Math.min(upgrade, variant.gameWeapon.attributeScaling.length - 1)] ?? {};
  return (Object.entries(scaling) as [OffensiveStat, number][])
    .filter(([, value]) => (value ?? 0) > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([stat]) => stat);
}
