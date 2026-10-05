import { useEffect, useMemo, useState } from 'react';
import Heatmap from './components/Heatmap';
import { startingClasses } from './data/classes';
import { equipmentBonuses } from './data/equipment';
import { weapons } from './data/weapons';
import { bossPresets } from './data/bosses';
import {
  allocationLine,
  currentBuildHeatmap,
  effectiveStats,
  fullStatHeatmap,
  meetsRequirements,
  recommendAxes,
  type GraphMode,
  type OptimizeMode,
} from './engine/optimizer';
import type { OffensiveStat, Stat, Stats } from './types';

const statOrder: Stat[] = ['vig', 'mnd', 'end', 'str', 'dex', 'int', 'fai', 'arc'];
const offensiveStats: OffensiveStat[] = ['str', 'dex', 'int', 'fai', 'arc'];
const labels: Record<Stat, string> = { vig: 'VIG', mnd: 'MND', end: 'END', str: 'STR', dex: 'DEX', int: 'INT', fai: 'FAI', arc: 'ARC' };
const rawInitial: Stats = { vig: 1, mnd: 1, end: 1, str: 1, dex: 1, int: 1, fai: 1, arc: 1 };

type AxisHistory = [OffensiveStat, OffensiveStat];

export default function App() {
  const [classId, setClassId] = useState('wretch');
  const selectedClass = startingClasses.find((c) => c.id === classId)!;
  const [stats, setStats] = useState<Stats>(() => floorToClass(rawInitial, selectedClass.stats));
  const [weaponId, setWeaponId] = useState('moonveil');
  const weapon = weapons.find((w) => w.id === weaponId)!;
  const [affinity, setAffinity] = useState(weapon.variants[0].affinity);
  const variant = weapon.variants.find((v) => v.affinity === affinity) ?? weapon.variants[0];
  const [upgrade, setUpgrade] = useState(weapon.maxUpgrade);
  const [mode, setMode] = useState<OptimizeMode>('weapon');
  const [graphMode, setGraphMode] = useState<GraphMode>('current');
  const [twoHanded, setTwoHanded] = useState(false);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [pointsAvailable, setPointsAvailable] = useState(40);
  const suggested = recommendAxes(mode === 'skill' && weapon.skill ? weapon.skill.scaling : variant.scaling);
  const [axisHistory, setAxisHistory] = useState<AxisHistory>(() => axisPair(suggested));
  const [bossId, setBossId] = useState('margit');

  const bonuses = useMemo(() => {
    const total: Partial<Record<Stat, number>> = {};
    equipmentBonuses.filter((item) => equipment.includes(item.id)).forEach((item) => {
      Object.entries(item.bonuses).forEach(([key, value]) => {
        const stat = key as Stat;
        total[stat] = (total[stat] ?? 0) + (value ?? 0);
      });
    });
    return total;
  }, [equipment]);

  const [axisX, axisY] = useMemo(() => {
    const ordered = [...axisHistory].sort((a, b) => statOrder.indexOf(a) - statOrder.indexOf(b));
    return ordered as AxisHistory;
  }, [axisHistory]);

  const effective = effectiveStats(stats, bonuses);
  const currentRuneLevel = selectedClass.runeLevel + statOrder.reduce((sum, stat) => sum + Math.max(0, stats[stat] - selectedClass.stats[stat]), 0);
  const graphInput = { stats: effective, axisX, axisY, pointsAvailable, variant, skill: weapon.skill, mode, upgrade, maxUpgrade: weapon.maxUpgrade, twoHanded };
  const line = useMemo(
    () => allocationLine(graphInput),
    [effective, axisX, axisY, pointsAvailable, variant, weapon.skill, mode, upgrade, weapon.maxUpgrade, twoHanded],
  );
  const map = useMemo(
    () => graphMode === 'full' ? fullStatHeatmap(graphInput) : currentBuildHeatmap(graphInput),
    [graphMode, effective, axisX, axisY, pointsAvailable, variant, weapon.skill, mode, upgrade, weapon.maxUpgrade, twoHanded],
  );
  const best = line
    .filter((point) => point.valid)
    .reduce<(typeof line)[number] | null>((acc, point) => (!acc || point.value > acc.value ? point : acc), null);
  const requirementsMet = meetsRequirements(variant, effective, twoHanded);
  const selectedBoss = bossPresets.find((b) => b.id === bossId)!;
  const dlcSources = [
    weapon.dlc ? `${weapon.name} — ${weapon.dlc === 'shadow-of-the-erdtree' ? 'Shadow of the Erdtree' : 'Tarnished Pack'}` : null,
    selectedClass.dlc ? `${selectedClass.name} — Tarnished Pack` : null,
    ...equipmentBonuses.filter((e) => equipment.includes(e.id) && e.dlc).map((e) => `${e.name} — DLC`),
    selectedBoss.dlc ? `${selectedBoss.name} — Shadow of the Erdtree` : null,
  ].filter(Boolean) as string[];

  const changeClass = (nextId: string) => {
    const next = startingClasses.find((c) => c.id === nextId)!;
    setClassId(nextId);
    setStats((old) => floorToClass(old, next.stats));
  };

  const changeWeapon = (nextId: string) => {
    const next = weapons.find((w) => w.id === nextId)!;
    setWeaponId(nextId);
    setAffinity(next.variants[0].affinity);
    setUpgrade(next.maxUpgrade);
    setMode('weapon');
    setAxisHistory(axisPair(recommendAxes(next.variants[0].scaling)));
  };

  const applyRecommendedAxes = () => setAxisHistory(axisPair(suggested));

  const selectAxis = (stat: OffensiveStat) => {
    setAxisHistory(([older, newer]) => {
      if (stat === newer) return [older, newer];
      if (stat === older) return [newer, older];
      return [newer, stat];
    });
  };

  const meetWeaponRequirements = () => {
    setStats((old) => {
      const next = { ...old };
      for (const [key, requirement] of Object.entries(variant.requirements) as [OffensiveStat, number][]) {
        let effectiveNeeded = requirement ?? 0;
        if (key === 'str' && twoHanded) effectiveNeeded = Math.ceil(effectiveNeeded / 1.5);
        const baseNeeded = Math.max(selectedClass.stats[key], effectiveNeeded - (bonuses[key] ?? 0));
        next[key] = Math.max(next[key], Math.min(99, baseNeeded));
      }
      return next;
    });
  };

  const optimumStats = best ? offensiveStats
    .filter((stat) => stat === axisX || stat === axisY || (variant.requirements[stat] ?? 0) > 0)
    .map((stat) => {
      if (stat === axisX) return { stat, value: best.x, note: stat === 'str' && twoHanded ? '2H' : '' };
      if (stat === axisY) return { stat, value: best.y, note: stat === 'str' && twoHanded ? '2H' : '' };
      const rawRequirement = variant.requirements[stat] ?? 0;
      const minimum = stat === 'str' && twoHanded ? Math.ceil(rawRequirement / 1.5) : rawRequirement;
      return { stat, value: Math.max(effective[stat], minimum), note: stat === 'str' && twoHanded ? '2H' : '' };
    }) : [];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ELDEN RING • BUILD TOOL</p>
          <h1>Weapon Optimizer</h1>
        </div>
        <div className="header-badges">
          <span className="badge muted">v0.2 graph pass</span>
          {dlcSources.length > 0 && <span className="badge dlc" title={dlcSources.join('\n')}>DLC</span>}
        </div>
      </header>

      <div className="warning-banner"><strong>Foundation build:</strong> optimisation/graph behaviour is live, but the small weapon dataset currently uses clearly marked demo values. Do not use displayed AR as an in-game reference until the regulation-derived data pass is complete.</div>

      <main className="layout">
        <aside className="panel controls">
          <section>
            <h2>Weapon</h2>
            <label>Weapon<select value={weaponId} onChange={(e) => changeWeapon(e.target.value)}>{weapons.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
            <div className="two-col">
              <label>Affinity<select value={affinity} onChange={(e) => setAffinity(e.target.value as typeof affinity)}>{weapon.variants.map((v) => <option key={v.affinity}>{v.affinity}</option>)}</select></label>
              <label>Upgrade<select value={upgrade} onChange={(e) => setUpgrade(Number(e.target.value))}>{Array.from({ length: weapon.maxUpgrade + 1 }, (_, i) => i).reverse().map((level) => <option key={level} value={level}>+{level}{level === weapon.maxUpgrade ? ' (Max)' : ''}</option>)}</select></label>
            </div>
            <div className="segmented">
              <button className={mode === 'weapon' ? 'active' : ''} onClick={() => setMode('weapon')}>Weapon AR</button>
              <button disabled={!weapon.skill} className={mode === 'skill' ? 'active' : ''} onClick={() => weapon.skill && setMode('skill')}>{weapon.skill?.name ?? 'No unique skill'}</button>
            </div>
            <label className="check"><input type="checkbox" checked={twoHanded} onChange={(e) => setTwoHanded(e.target.checked)} /> Two-hand weapon</label>
          </section>

          <section>
            <div className="section-heading"><h2>Character</h2><span>RL {currentRuneLevel}</span></div>
            <label>Starting class<select value={classId} onChange={(e) => changeClass(e.target.value)}>{startingClasses.map((c) => <option key={c.id} value={c.id}>{c.name} — RL {c.runeLevel}</option>)}</select></label>
            <div className="stat-table" aria-label="Character stats">
              {statOrder.map((stat) => {
                const offensive = offensiveStats.includes(stat as OffensiveStat);
                const selected = offensive && (stat === axisX || stat === axisY);
                const axis = stat === axisX ? 'X' : stat === axisY ? 'Y' : null;
                return (
                  <div className={`stat-row ${selected ? 'axis-selected' : ''}`} key={stat}>
                    {offensive ? (
                      <button className="stat-name-button" onClick={() => selectAxis(stat as OffensiveStat)} title="Use as one of the two graph axes">
                        <span>{labels[stat]}</span>{axis && <b>{axis}</b>}
                      </button>
                    ) : <div className="stat-name-static">{labels[stat]}</div>}
                    <div className="stat-value-cell">
                      <StatValueInput
                        value={stats[stat]}
                        min={selectedClass.stats[stat]}
                        onCommit={(value) => setStats((old) => ({ ...old, [stat]: value }))}
                      />
                      <small>min {selectedClass.stats[stat]}{bonuses[stat] ? ` • +${bonuses[stat]} gear` : ''}</small>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="requirement-box">
              <div>
                <span className={requirementsMet ? 'requirement-ok' : 'requirement-warning'}>{requirementsMet ? '✓ Requirements met' : 'Requirements not met'}</span>
                <small>{formatRequirements(variant.requirements, twoHanded)}</small>
              </div>
              <button onClick={meetWeaponRequirements} disabled={requirementsMet}>{requirementsMet ? 'Met' : 'Meet requirements'}</button>
            </div>
            <p className="axis-hint">Click an offensive stat name to make it a graph axis. The two most recent selections are kept; the higher row is always X.</p>
          </section>

          <section>
            <h2>Stat boosts</h2>
            <div className="equipment-list">{equipmentBonuses.map((item) => <label className="check" key={item.id}><input type="checkbox" checked={equipment.includes(item.id)} onChange={(e) => setEquipment(e.target.checked ? [...equipment, item.id] : equipment.filter((id) => id !== item.id))} /> {item.name}</label>)}</div>
          </section>

          <section>
            <h2>Target enemy</h2>
            {(['Main path', 'Shadow of the Erdtree'] as const).map((section) => <div key={section}><p className="group-label">{section}</p><div className="boss-chips">{bossPresets.filter((b) => b.section === section).map((boss) => <button key={boss.id} className={boss.id === bossId ? 'active' : ''} onClick={() => setBossId(boss.id)}>{boss.name}</button>)}</div></div>)}
            <p className="coming-soon">Enemy selection is wired into state now; defence/negation damage calculations are the next engine layer.</p>
          </section>
        </aside>

        <section className="workspace">
          <div className="panel graph-panel">
            <div className="graph-header">
              <div><p className="eyebrow">STAT SPACE</p><h2>{weapon.name} {affinity !== 'Unique' ? `• ${affinity}` : ''} +{upgrade}</h2></div>
              <div className="axis-summary"><span>X</span>{axisX.toUpperCase()}<span>Y</span>{axisY.toUpperCase()}</div>
            </div>

            <div className="graph-mode-toggle segmented">
              <button className={graphMode === 'current' ? 'active' : ''} onClick={() => setGraphMode('current')}>From my current build</button>
              <button className={graphMode === 'full' ? 'active' : ''} onClick={() => setGraphMode('full')}>Full 1–99 stat map</button>
            </div>

            <div className="recommendation-row"><span>Recommended axes: <strong>{suggested.map((s) => s.toUpperCase()).join(' + ') || 'None'}</strong></span><button onClick={applyRecommendedAxes}>Use recommended</button></div>
            <div className="budget-row">
              <label>Points to distribute between axes<input type="number" min="0" max="180" value={pointsAvailable} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setPointsAvailable(Math.max(0, Math.min(180, Number(e.target.value) || 0)))} /></label>
              <span>{graphMode === 'full' ? `Full map shown; budget line starts at effective ${axisX.toUpperCase()} ${effective[axisX]} / ${axisY.toUpperCase()} ${effective[axisY]}.` : `Reachable space from effective ${axisX.toUpperCase()} ${effective[axisX]} / ${axisY.toUpperCase()} ${effective[axisY]}.`}</span>
            </div>
            <Heatmap points={map} line={line} axisX={axisX} axisY={axisY} affinity={variant.affinity} somber={weapon.somber} />
          </div>

          <div className="results-grid">
            <div className="panel result-card hero-result">
              <p className="eyebrow">MATHEMATICAL OPTIMUM ON BUDGET LINE</p>
              {best ? <>
                <div className="result-value">{best.value.toFixed(1)}</div>
                <div className="optimal-stat-list">{optimumStats.map(({ stat, value, note }) => <span key={stat}><b>{stat.toUpperCase()}</b> {value}{note ? <small>{note}</small> : null}</span>)}</div>
                <small>{pointsAvailable} points distributed between {axisX.toUpperCase()} / {axisY.toUpperCase()} • other weapon requirements shown at least at their required value</small>
              </> : <p>No valid allocation on this budget line. Meet the weapon requirements or increase the point budget.</p>}
            </div>
            <div className="panel result-card"><p className="eyebrow">BUILD CONTEXT</p><dl><div><dt>Starting class</dt><dd>{selectedClass.name}</dd></div><div><dt>Current RL</dt><dd>{currentRuneLevel}</dd></div><div><dt>Enemy</dt><dd>{selectedBoss.name}</dd></div><div><dt>Graph</dt><dd>{graphMode === 'full' ? 'Full 1–99 map' : 'Current build'}</dd></div><div><dt>Dataset</dt><dd>{weapon.dataStatus === 'verified' ? 'Verified' : 'Demo'}</dd></div></dl></div>
          </div>
        </section>
      </main>
    </div>
  );
}

function floorToClass(stats: Stats, floor: Stats): Stats {
  return Object.fromEntries((Object.keys(stats) as Stat[]).map((key) => [key, Math.max(stats[key], floor[key])])) as Stats;
}

function axisPair(recommended: OffensiveStat[]): AxisHistory {
  const first = recommended[0] ?? 'str';
  const second = recommended.find((stat) => stat !== first) ?? offensiveStats.find((stat) => stat !== first) ?? 'dex';
  return [first, second];
}

function formatRequirements(requirements: Partial<Record<OffensiveStat, number>>, twoHanded: boolean) {
  const parts = (Object.entries(requirements) as [OffensiveStat, number][]).map(([stat, value]) => {
    if (stat === 'str' && twoHanded) return `${stat.toUpperCase()} ${Math.ceil(value / 1.5)} (2H; ${value} req.)`;
    return `${stat.toUpperCase()} ${value}`;
  });
  return parts.length ? parts.join(' • ') : 'No stat requirements';
}

function StatValueInput({ value, min, onCommit }: { value: number; min: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const parsed = Number(draft);
    const next = Number.isFinite(parsed) ? Math.max(min, Math.min(99, Math.round(parsed))) : value;
    onCommit(next);
    setDraft(String(next));
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={99}
      value={draft}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setDraft(String(value));
          e.currentTarget.blur();
        }
      }}
    />
  );
}
