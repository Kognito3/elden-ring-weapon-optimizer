import { useMemo, useState } from 'react';
import Heatmap from './components/Heatmap';
import { startingClasses } from './data/classes';
import { equipmentBonuses } from './data/equipment';
import { weapons } from './data/weapons';
import { bossPresets } from './data/bosses';
import { allocationLine, effectiveStats, heatmap, recommendAxes, type OptimizeMode } from './engine/optimizer';
import type { OffensiveStat, Stat, Stats } from './types';

const statOrder: Stat[] = ['vig', 'mnd', 'end', 'str', 'dex', 'int', 'fai', 'arc'];
const offensiveStats: OffensiveStat[] = ['str', 'dex', 'int', 'fai', 'arc'];
const labels: Record<Stat, string> = { vig: 'VIG', mnd: 'MND', end: 'END', str: 'STR', dex: 'DEX', int: 'INT', fai: 'FAI', arc: 'ARC' };
const rawInitial: Stats = { vig: 1, mnd: 1, end: 1, str: 1, dex: 1, int: 1, fai: 1, arc: 1 };

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
  const [twoHanded, setTwoHanded] = useState(false);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [pointsAvailable, setPointsAvailable] = useState(40);
  const suggested = recommendAxes(mode === 'skill' && weapon.skill ? weapon.skill.scaling : variant.scaling);
  const [axisX, setAxisX] = useState<OffensiveStat>(suggested[0] ?? 'str');
  const [axisY, setAxisY] = useState<OffensiveStat>(suggested[1] ?? 'dex');
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

  const effective = effectiveStats(stats, bonuses);
  const currentRuneLevel = selectedClass.runeLevel + statOrder.reduce((sum, stat) => sum + Math.max(0, stats[stat] - selectedClass.stats[stat]), 0);
  const graphInput = { stats: effective, axisX, axisY, pointsAvailable, variant, skill: weapon.skill, mode, upgrade, maxUpgrade: weapon.maxUpgrade, twoHanded };
  const line = useMemo(() => allocationLine(graphInput), [effective, axisX, axisY, pointsAvailable, variant, weapon.skill, mode, upgrade, weapon.maxUpgrade, twoHanded]);
  const map = useMemo(() => heatmap(graphInput), [effective, axisX, axisY, pointsAvailable, variant, weapon.skill, mode, upgrade, weapon.maxUpgrade, twoHanded]);
  const best = line.reduce<(typeof line)[number] | null>((acc, point) => (!acc || point.value > acc.value ? point : acc), null);
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
    const axes = recommendAxes(next.variants[0].scaling);
    setAxisX(axes[0] ?? 'str');
    setAxisY(axes[1] ?? 'dex');
  };

  const applyRecommendedAxes = () => {
    if (suggested[0]) setAxisX(suggested[0]);
    if (suggested[1] && suggested[1] !== suggested[0]) setAxisY(suggested[1]);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ELDEN RING • BUILD TOOL</p>
          <h1>Weapon Optimizer</h1>
        </div>
        <div className="header-badges">
          <span className="badge muted">v0.1 foundation</span>
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
            <div className="stat-grid">
              {statOrder.map((stat) => <label key={stat} className="stat-input"><span>{labels[stat]}</span><input type="number" min={selectedClass.stats[stat]} max="99" value={stats[stat]} onChange={(e) => setStats({ ...stats, [stat]: Math.max(selectedClass.stats[stat], Math.min(99, Number(e.target.value) || selectedClass.stats[stat])) })} /><small>min {selectedClass.stats[stat]}{bonuses[stat] ? ` • +${bonuses[stat]}` : ''}</small></label>)}
            </div>
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
              <div className="axis-controls">
                <label>X<select value={axisX} onChange={(e) => setAxisX(e.target.value as OffensiveStat)}>{offensiveStats.filter((s) => s !== axisY).map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></label>
                <label>Y<select value={axisY} onChange={(e) => setAxisY(e.target.value as OffensiveStat)}>{offensiveStats.filter((s) => s !== axisX).map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></label>
              </div>
            </div>
            <div className="recommendation-row"><span>Recommended axes: <strong>{suggested.map((s) => s.toUpperCase()).join(' + ') || 'None'}</strong></span><button onClick={applyRecommendedAxes}>Use recommended</button></div>
            <div className="budget-row"><label>Points to distribute between axes<input type="number" min="0" max="180" value={pointsAvailable} onChange={(e) => setPointsAvailable(Math.max(0, Math.min(180, Number(e.target.value) || 0)))} /></label><span>Effective starting stats: {axisX.toUpperCase()} {effective[axisX]}, {axisY.toUpperCase()} {effective[axisY]}</span></div>
            <Heatmap points={map} line={line} axisX={axisX} axisY={axisY} />
          </div>

          <div className="results-grid">
            <div className="panel result-card hero-result"><p className="eyebrow">MATHEMATICAL OPTIMUM</p>{best ? <><div className="result-value">{best.value.toFixed(1)}</div><p>{axisX.toUpperCase()} <strong>{best.x}</strong> / {axisY.toUpperCase()} <strong>{best.y}</strong></p><small>{pointsAvailable} points distributed • {mode === 'skill' ? weapon.skill?.name : 'weapon AR'} model</small></> : <p>No valid allocation.</p>}</div>
            <div className="panel result-card"><p className="eyebrow">BUILD CONTEXT</p><dl><div><dt>Starting class</dt><dd>{selectedClass.name}</dd></div><div><dt>Current RL</dt><dd>{currentRuneLevel}</dd></div><div><dt>Enemy</dt><dd>{selectedBoss.name}</dd></div><div><dt>Dataset</dt><dd>{weapon.dataStatus === 'verified' ? 'Verified' : 'Demo'}</dd></div></dl></div>
          </div>
        </section>
      </main>
    </div>
  );
}

function floorToClass(stats: Stats, floor: Stats): Stats {
  return Object.fromEntries((Object.keys(stats) as Stat[]).map((key) => [key, Math.max(stats[key], floor[key])])) as Stats;
}
