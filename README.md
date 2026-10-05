# Elden Ring Weapon Optimizer

An interactive Elden Ring build tool for visualising weapon Attack Rating across two stats, drawing a fixed-point allocation line, and finding the mathematically best split.

## v0.3 — regulation data pass

- Loads the current patch **1.17** regulation-derived weapon dataset at runtime.
- Uses exact base attack, affinity, upgrade, attribute scaling, AttackElementCorrect and CalcCorrectGraph data.
- Exact sheet-AR calculation replaces the v0.2 demo approximation.
- Full weapon catalogue with affinities and upgrade levels.
- Weapon search field.
- Keeps both graph modes from v0.2: **From my current build** and **Full 1–99 stat map**.
- Keeps starter classes, equipment stat bonuses, requirement handling, two-handing and budget-line optimisation.
- Adds verified defense/negation profiles for the first set of main-path and DLC bosses.
- Includes the PvE defense-curve code for the later hit-damage pass, but final enemy damage is deliberately not exposed yet because physical attack type + motion value must be selected first.

## Run locally

```bash
npm install
npm run dev
```

## Data notes

The weapon engine/data format is adapted from Tom Clark's MIT-licensed Elden Ring Weapon Calculator. See `THIRD_PARTY_NOTICES.md`.

This v0.3 build fetches the patch 1.17 dataset from the upstream GitHub raw file when the app starts. A bundled/offline snapshot can be added later for PWA/offline use.
