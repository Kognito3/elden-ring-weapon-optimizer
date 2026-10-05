import {
  allDamageTypes,
  allStatusTypes,
  AttackPowerType,
  type AttackElementCorrect,
  type CalcCorrectGraph,
  type EncodedRegulationDataJson,
  type GameWeapon,
} from './types';

export const REGULATION_VERSION = '1.17';
export const REGULATION_SOURCE =
  'https://raw.githubusercontent.com/ThomasJClark/elden-ring-weapon-calculator/b8a1cf8847fe67aacc7f8fcb038a9cfd6725f19a/public/regulation-vanilla-v1.17.js';

const defaultDamageCalcCorrectGraphId = 0;
const defaultStatusCalcCorrectGraphId = 6;

function evaluateCalcCorrectGraph(calcCorrectGraph: CalcCorrectGraph) {
  const arr: number[] = [];

  for (let i = 1; i < calcCorrectGraph.length; i += 1) {
    const prevStage = calcCorrectGraph[i - 1];
    const stage = calcCorrectGraph[i];
    const minAttributeValue = i === 1 ? 1 : prevStage.maxVal + 1;
    const maxAttributeValue = i === calcCorrectGraph.length - 1 ? 148 : stage.maxVal;

    for (let attributeValue = minAttributeValue; attributeValue <= maxAttributeValue; attributeValue += 1) {
      if (arr[attributeValue] !== undefined) continue;
      let ratio = Math.max(
        0,
        Math.min(1, (attributeValue - prevStage.maxVal) / (stage.maxVal - prevStage.maxVal)),
      );
      if (prevStage.adjPt > 0) ratio = ratio ** prevStage.adjPt;
      else if (prevStage.adjPt < 0) ratio = 1 - (1 - ratio) ** -prevStage.adjPt;
      arr[attributeValue] =
        prevStage.maxGrowVal + (stage.maxGrowVal - prevStage.maxGrowVal) * ratio;
    }
  }

  return arr;
}

export function decodeRegulationData(data: EncodedRegulationDataJson): GameWeapon[] {
  const calcCorrectGraphsById = new Map(
    Object.entries(data.calcCorrectGraphs).map(([id, graph]) => [+id, evaluateCalcCorrectGraph(graph!)]),
  );

  const attackElementCorrectsById = new Map<number, AttackElementCorrect>(
    Object.entries(data.attackElementCorrects).map(([id, correction]) => [
      +id,
      {
        ...correction,
        [AttackPowerType.POISON]: { arc: true },
        [AttackPowerType.BLEED]: { arc: true },
        [AttackPowerType.MADNESS]: { arc: true },
        [AttackPowerType.SLEEP]: { arc: true },
        [AttackPowerType.SCARLET_ROT]: { arc: undefined },
        [AttackPowerType.FROST]: { arc: undefined },
        [AttackPowerType.DEATH_BLIGHT]: { arc: undefined },
      },
    ]),
  );

  return data.weapons.map((encoded): GameWeapon => {
    const attackElementCorrect = attackElementCorrectsById.get(encoded.attackElementCorrectId);
    if (!attackElementCorrect) throw new Error(`Missing AttackElementCorrectParam ${encoded.attackElementCorrectId} for ${encoded.name}`);

    const reinforceParams = data.reinforceTypes[encoded.reinforceTypeId];
    if (!reinforceParams) throw new Error(`Missing ReinforceParamWeapon ${encoded.reinforceTypeId} for ${encoded.name}`);

    const getGraph = (id: number) => {
      const graph = calcCorrectGraphsById.get(id);
      if (!graph) throw new Error(`Missing CalcCorrectGraph ${id} for ${encoded.name}`);
      return graph;
    };

    const calcCorrectGraphs = {} as GameWeapon['calcCorrectGraphs'];
    allDamageTypes.forEach((type) => {
      calcCorrectGraphs[type] = getGraph(encoded.calcCorrectGraphIds?.[type] ?? defaultDamageCalcCorrectGraphId);
    });
    allStatusTypes.forEach((type) => {
      calcCorrectGraphs[type] = getGraph(encoded.calcCorrectGraphIds?.[type] ?? defaultStatusCalcCorrectGraphId);
    });

    const attack: GameWeapon['attack'] = reinforceParams.map((reinforceParam) => {
      const atLevel: Partial<Record<number, number>> = {};
      encoded.attack.forEach(([type, base]) => {
        atLevel[type] = base * (reinforceParam.attack[type] ?? 0);
      });

      const offsets = [
        reinforceParam.statusSpEffectId1,
        reinforceParam.statusSpEffectId2,
        reinforceParam.statusSpEffectId3,
      ];
      encoded.statusSpEffectParamIds?.forEach((spEffectId, i) => {
        if (!spEffectId) return;
        Object.assign(atLevel, data.statusSpEffectParams[spEffectId + (offsets[i] ?? 0)]);
      });
      return atLevel;
    });

    const attributeScaling: GameWeapon['attributeScaling'] = reinforceParams.map((reinforceParam) => {
      const atLevel: Partial<Record<'str' | 'dex' | 'int' | 'fai' | 'arc', number>> = {};
      encoded.attributeScaling.forEach(([attribute, base]) => {
        atLevel[attribute] = base * reinforceParam.attributeScaling[attribute];
      });
      return atLevel;
    });

    return {
      name: encoded.name,
      weaponName: encoded.weaponName,
      variant: encoded.variant,
      url: encoded.url === undefined
        ? `https://eldenring.wiki.gg/wiki/${encoded.weaponName.replaceAll(' ', '_')}`
        : encoded.url,
      affinityId: encoded.affinityId,
      weaponType: encoded.weaponType,
      requirements: encoded.requirements,
      attributeScaling,
      attack,
      attackElementCorrect,
      calcCorrectGraphs,
      paired: encoded.paired,
      sorceryTool: encoded.sorceryTool,
      incantationTool: encoded.incantationTool,
      scalingTiers: data.scalingTiers,
      dlc: encoded.dlc ?? false,
    };
  });
}

export async function loadRegulationWeapons(signal?: AbortSignal): Promise<GameWeapon[]> {
  const response = await fetch(REGULATION_SOURCE, { signal, cache: 'force-cache' });
  if (!response.ok) throw new Error(`Could not load patch ${REGULATION_VERSION} data (${response.status})`);
  const data = (await response.json()) as EncodedRegulationDataJson;
  return decodeRegulationData(data);
}
