import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Heatmap from './components/Heatmap';
import { startingClasses } from './data/classes';
import { equipmentBonuses } from './data/equipment';
import { bossPresets } from './data/bosses';
import {
  allocationLine,
  currentBuildHeatmap,
  effectiveStats,
  fullStatHeatmap,
  meetsRequirements,
  type GraphMode,
  type OptimizeMode,
} from './engine/optimizer';
import { buildWeaponCatalog, recommendedAxesForVariant } from './game/catalog';
import { displayedAttackRating, usesTwoHandStrength } from './game/calculator';
import { loadRegulationWeapons, REGULATION_VERSION } from './game/regulation';
import type { Affinity, OffensiveStat, Stat, Stats, Weapon } from './types';

const statOrder: Stat[] = ['vig', 'mnd', 'end', 'str', 'dex', 'int', 'fai', 'arc'];
const offensiveStats: OffensiveStat[] = ['str', 'dex', 'int', 'fai', 'arc'];
const labels: Record<Stat, string> = { vig: 'VIG', mnd: 'MND', end: 'END', str: 'STR', dex: 'DEX', int: 'INT', fai: 'FAI', arc: 'ARC' };
const rawInitial: Stats = { vig: 1, mnd: 1, end: 1, str: 1, dex: 1, int: 1, fai: 1, arc: 1 };
type AxisHistory = [OffensiveStat, OffensiveStat];

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; weapons: Weapon[]; configurations: number };

export default function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState({ status: 'loading' });
    loadRegulationWeapons(controller.signal)
      .then((gameWeapons) => {
        const weapons = buildWeaponCatalog(gameWeapons);
        if (!weapons.length) throw new Error('Patch data loaded but contained no weapons.');
        setLoadState({ status: 'ready', weapons, configurations: gameWeapons.length });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
      });
    return () => controller.abort();
  }, [retry]);

  if (loadState.status === 'loading') {
    return <DataShell title={`Loading Elden Ring patch ${REGULATION_VERSION} weapon data…`} detail="Decoding affinities, reinforcement levels and exact scaling curves." />;
  }

  if (loadState.status === 'error') {
    return (
      <DataShell
        title="Couldn’t load the regulation dataset"
        detail={`${loadState.message} The calculator needs internet access for this v0.3 build.`}
        action={<button onClick={() => setRetry((value) => value + 1)}>Retry</button>}
      />
    );
  }

  return <OptimizerApp weapons={loadState.weapons} configurationCount={loadState.configurations} />;
}

function OptimizerApp({ weapons, configurationCount }: { weapons: Weapon[]; configurationCount: number }) {
  const initialWeapon = weapons.find((w) => w.id === 'moonveil') ?? weapons[0];
  const initialSuggested = recommendedAxesForVariant(initialWeapon.variants[0], initialWeapon.maxUpgrade);

  const [classId, setClassId] = useState('wretch');
  const selectedClass = startingClasses.find((c) => c.id === classId)!;
  const [stats, setStats] = useState<Stats>(() => floorToClass(rawInitial, selectedClass.stats));
  const [weaponId, setWeaponId] = useState(initialWeapon.id);
  const weapon = weapons.find((w) => w.id === weaponId) ?? initialWeapon;
  const [affinity, setAffinity] = useState<Affinity>(weapon.variants[0].affinity);
  const variant = weapon.variants.find((v) => v.affinity === affinity) ?? weapon.variants[0];
  const [upgrade, setUpgrade] = useState(weapon.maxUpgrade);
  const [mode, setMode] = useState<OptimizeMode>('weapon');
  const [graphMode, setGraphMode] = useState<GraphMode>('current');
  const [twoHanded, setTwoHanded] = useState(false);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [pointsAvailable, setPointsAvailable] = useState(40);
  const [axisHistory, setAxisHistory] = useState<AxisHistory>(() => axisPair(initialSuggested));
  const [bossId, setBossId] = useState('margit');
  const [weaponSearch, setWeaponSearch] = useState('');

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
  const suggested = recommendedAxesForVariant(variant, upgrade);
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
  const filteredWeapons = useMemo(() => {
    const q = weaponSearch.trim().toLowerCase();
    if (!q) return weapons;
    return weapons.filter((w) => `${w.name} ${w.category}`.toLowerCase().includes(q));
  }, [weapons, weaponSearch]);

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
    const next = weapons.find((w) => w.id === nextId);
    if (!next) return;
    setWeaponId(nextId);
    setAffinity(next.variants[0].affinity);
    setUpgrade(next.maxUpgrade);
    setMode('weapon');
    setAxisHistory(axisPair(recommendedAxesForVariant(next.variants[0], next.maxUpgrade)));
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
      const effectiveTwoHand = usesTwoHandStrength(variant.gameWeapon, twoHanded);
      for (const [key, requirement] of Object.entries(variant.requirements) as [OffensiveStat, number][]) {
        let effectiveNeeded = requirement ?? 0;
        if (key === 'str' && effectiveTwoHand) effectiveNeeded = Math.ceil(effectiveNeeded / 1.5);
        const baseNeeded = Math.max(selectedClass.stats[key], effectiveNeeded - (bonuses[key] ?? 0));
        next[key] = Math.max(next[key], Math.min(99, baseNeeded));
      }
      return next;
    });
  };

  const optimumStats = best ? offensiveStats
    .filter((stat) => stat === axisX || stat === axisY || (variant.requirements[stat] ?? 0) > 0)
    .map((stat) => {
      const effectiveTwoHand = usesTwoHandStrength(variant.gameWeapon, twoHanded);
      if (stat === axisX) return { stat, value: best.x, note: stat === 'str' && effectiveTwoHand ? '2H' : '' };
      if (stat === axisY) return { stat, value: best.y, note: stat === 'str' && effectiveTwoHand ? '2H' : '' };
      const rawRequirement = variant.requirements[stat] ?? 0;
      const minimum = stat === 'str' && effectiveTwoHand ? Math.ceil(rawRequirement / 1.5) : rawRequirement;
      return { stat, value: Math.max(effective[stat], minimum), note: stat === 'str' && effectiveTwoHand ? '2H' : '' };
    }) : [];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ELDEN RING • BUILD TOOL</p>
          <h1>Weapon Optimizer</h1>
        </div>
        <div className="header-badges">
          <span className="badge verified">Patch {REGULATION_VERSION} data</span>
          {dlcSources.length > 0 && <span className="badge dlc" title={dlcSources.join('\n')}>DLC</span>}
        </div>
      </header>

      <div className="success-banner"><strong>Exact weapon AR is live.</strong> Weapon bases, affinities, upgrades, scaling coefficients and CalcCorrectGraph curves are decoded from the patch {REGULATION_VERSION} regulation-derived dataset. Enemy profiles are being added alongside the next hit-damage layer.</div>

      <main className="layout">
        <aside className="panel controls">
          <section>
            <div className="section-heading"><h2>Weapon</h2><span>{weapons.length} weapons</span></div>
            <label>Search<input type="search" placeholder="Moonveil, katana, greatsword…" value={weaponSearch} onChange={(e) => setWeaponSearch(e.target.value)} /></label>
            <label>Weapon<select value={weaponId} onChange={(e) => changeWeapon(e.target.value)}>{filteredWeapons.map((w) => <option key={w.id} value={w.id}>{w.name} — {w.category}</option>)}</select></label>
            <div className="two-col">
              <label>Affinity<select value={affinity} onChange={(e) => setAffinity(e.target.value as Affinity)}>{weapon.variants.map((v) => <option key={`${v.affinityId}-${v.affinity}`} value={v.affinity}>{v.affinity}</option>)}</select></label>
              <label>Upgrade<select value={upgrade} onChange={(e) => setUpgrade(Number(e.target.value))}>{Array.from({ length: weapon.maxUpgrade + 1 }, (_, i) => i).reverse().map((level) => <option key={level} value={level}>+{level}{level === weapon.maxUpgrade ? ' (Max)' : ''}</option>)}</select></label>
            </div>
            <div className="segmented">
              <button className={mode === 'weapon' ? 'active' : ''} onClick={() => setMode('weapon')}>Weapon AR</button>
              <button disabled={!weapon.skill} className={mode === 'skill' ? 'active' : ''} onClick={() => weapon.skill && setMode('skill')} title="Verified weapon-skill formulas are the next calculation pass">{weapon.skill?.name ?? 'Skill data next'}</button>
            </div>
            <label className="check"><input type="checkbox" checked={twoHanded} onChange={(e) => setTwoHanded(e.target.checked)} /> Two-hand weapon</label>
            <p className="data-note">Loaded {configurationCount.toLocaleString()} weapon/affinity configurations from patch {REGULATION_VERSION}.</p>
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
                      <StatValueInput value={stats[stat]} min={selectedClass.stats[stat]} onCommit={(value) => setStats((old) => ({ ...old, [stat]: value }))} />
                      <small>min {selectedClass.stats[stat]}{bonuses[stat] ? ` • +${bonuses[stat]} gear` : ''}</small>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="requirement-box">
              <div>
                <span className={requirementsMet ? 'requirement-ok' : 'requirement-warning'}>{requirementsMet ? '✓ Requirements met' : 'Requirements not met'}</span>
                <small>{formatRequirements(variant.requirements, usesTwoHandStrength(variant.gameWeapon, twoHanded))}</small>
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
            {selectedBoss.profile ? <EnemyProfile profile={selectedBoss.profile} /> : <p className="coming-soon">This boss is in the selector, but its exact defense profile is still being verified before it is allowed into calculations.</p>}
          </section>
        </aside>

        <section className="workspace">
          <div className="panel graph-panel">
            <div className="graph-header">
              <div><p className="eyebrow">STAT SPACE • EXACT AR</p><h2>{weapon.name} {affinity !== 'Unique' ? `• ${affinity}` : ''} +{upgrade}</h2></div>
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
                <div className="result-value">{displayedAttackRating(best.value)} <small>AR</small></div>
                <div className="optimal-stat-list">{optimumStats.map(({ stat, value, note }) => <span key={stat}><b>{stat.toUpperCase()}</b> {value}{note ? <small>{note}</small> : null}</span>)}</div>
                <small>{pointsAvailable} points distributed between {axisX.toUpperCase()} / {axisY.toUpperCase()} • other weapon requirements shown at least at their required value</small>
              </> : <p>No valid allocation on this budget line. Meet the weapon requirements or increase the point budget.</p>}
            </div>
            <div className="panel result-card"><p className="eyebrow">BUILD CONTEXT</p><dl><div><dt>Starting class</dt><dd>{selectedClass.name}</dd></div><div><dt>Current RL</dt><dd>{currentRuneLevel}</dd></div><div><dt>Enemy</dt><dd>{selectedBoss.name}</dd></div><div><dt>Graph</dt><dd>{graphMode === 'full' ? 'Full 1–99 map' : 'Current build'}</dd></div><div><dt>Dataset</dt><dd>Patch {REGULATION_VERSION} verified</dd></div></dl></div>
          </div>
        </section>
      </main>
    </div>
  );
}

function EnemyProfile({ profile }: { profile: NonNullable<(typeof bossPresets)[number]['profile']> }) {
  return (
    <div className="enemy-profile">
      <div className="enemy-profile-head"><strong>NG defense {profile.defense}</strong><span>{profile.phase ?? 'Base profile'}</span></div>
      <div className="negation-grid">
        {Object.entries(profile.negation).map(([type, value]) => <div key={type}><span>{type}</span><b>{value}%</b></div>)}
      </div>
      {profile.note && <small>{profile.note}</small>}
      <a href={profile.source} target="_blank" rel="noreferrer">Enemy data source ↗</a>
    </div>
  );
}

function DataShell({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="app-shell loading-shell">
      <header className="topbar"><div><p className="eyebrow">ELDEN RING • BUILD TOOL</p><h1>Weapon Optimizer</h1></div></header>
      <div className="panel loading-panel"><div className="loading-rune">✦</div><h2>{title}</h2><p>{detail}</p>{action}</div>
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

function formatRequirements(requirements: Partial<Record<OffensiveStat, number>>, effectiveTwoHand: boolean) {
  const parts = (Object.entries(requirements) as [OffensiveStat, number][]).map(([stat, value]) => {
    if (stat === 'str' && effectiveTwoHand) return `${stat.toUpperCase()} ${Math.ceil(value / 1.5)} (2H; ${value} req.)`;
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
        if (e.key === 'Escape') { setDraft(String(value)); e.currentTarget.blur(); }
      }}
    />
  );
}
