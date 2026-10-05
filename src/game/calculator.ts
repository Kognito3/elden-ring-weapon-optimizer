import {
  allAttributes,
  allDamageTypes,
  allStatusTypes,
  type Attribute,
  type Attributes,
  type AttackPowerType,
  type GameWeapon,
} from './types';

export interface WeaponAttackResult {
  attackPower: Partial<Record<AttackPowerType, number>>;
  ineffectiveAttributes: Attribute[];
  ineffectiveAttackPowerTypes: AttackPowerType[];
}

export function usesTwoHandStrength(weapon: GameWeapon, requestedTwoHanding: boolean) {
  return !weapon.paired && (requestedTwoHanding || [50, 51, 53, 56].includes(weapon.weaponType));
}

export function adjustedAttributesForTwoHanding(
  weapon: GameWeapon,
  attributes: Attributes,
  twoHanding: boolean,
): Attributes {
  if (!usesTwoHandStrength(weapon, twoHanding)) return attributes;
  return { ...attributes, str: Math.floor(attributes.str * 1.5) };
}

export function getWeaponAttack({
  weapon,
  attributes,
  twoHanding,
  upgradeLevel,
}: {
  weapon: GameWeapon;
  attributes: Attributes;
  twoHanding: boolean;
  upgradeLevel: number;
}): WeaponAttackResult {
  const adjustedAttributes = adjustedAttributesForTwoHanding(weapon, attributes, twoHanding);
  const ineffectiveAttributes = (Object.entries(weapon.requirements) as [Attribute, number][])
    .filter(([attribute, requirement]) => adjustedAttributes[attribute] < requirement)
    .map(([attribute]) => attribute);

  const ineffectiveAttackPowerTypes: AttackPowerType[] = [];
  const attackPower: Partial<Record<AttackPowerType, number>> = {};

  for (const attackPowerType of [...allDamageTypes, ...allStatusTypes]) {
    const baseAttackPower = weapon.attack[upgradeLevel]?.[attackPowerType] ?? 0;
    if (!baseAttackPower && !weapon.sorceryTool && !weapon.incantationTool) continue;

    const scalingAttributes = weapon.attackElementCorrect[attackPowerType] ?? {};
    let totalScaling = 1;

    if (ineffectiveAttributes.some((attribute) => scalingAttributes[attribute])) {
      totalScaling = 0.6;
      ineffectiveAttackPowerTypes.push(attackPowerType);
    } else {
      for (const attribute of allAttributes) {
        const attributeCorrect = scalingAttributes[attribute];
        if (!attributeCorrect) continue;
        let scaling: number;
        if (attributeCorrect === true) {
          scaling = weapon.attributeScaling[upgradeLevel]?.[attribute] ?? 0;
        } else {
          const baseScaling = weapon.attributeScaling[0]?.[attribute] ?? 0;
          scaling = baseScaling === 0
            ? 0
            : (attributeCorrect * (weapon.attributeScaling[upgradeLevel]?.[attribute] ?? 0)) / baseScaling;
        }
        if (!scaling) continue;
        totalScaling += weapon.calcCorrectGraphs[attackPowerType][adjustedAttributes[attribute]] * scaling;
      }
    }

    if (baseAttackPower) attackPower[attackPowerType] = baseAttackPower * totalScaling;
  }

  return { attackPower, ineffectiveAttributes, ineffectiveAttackPowerTypes };
}

export function totalAttackRating(attackPower: Partial<Record<AttackPowerType, number>>) {
  return allDamageTypes.reduce<number>((total, type) => total + (attackPower[type] ?? 0), 0);
}

export function displayedAttackRating(value: number) {
  return Math.floor(value + 1e-9);
}
