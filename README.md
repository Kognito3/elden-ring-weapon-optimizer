# Elden Ring Weapon Optimizer

Interactive stat-allocation visualiser and optimizer for Elden Ring weapons.

## Current status — v0.1 foundation

The UI and optimization engine are functional, including:

- starting-class stat floors (Wretch default)
- all eight character-stat inputs
- weapon / affinity / upgrade selection
- weapon-AR vs unique-skill optimization mode
- selectable X/Y offensive-stat axes with recommended axes
- stat-boosting equipment inputs
- two-handing toggle
- fixed distributable-point budget
- interactive AR heatmap and legal-allocation line
- exhaustive mathematical best split for the selected two stats
- base-game main-route and Shadow of the Erdtree boss quick-select UI
- DLC provenance badge infrastructure

**Important:** the small weapon dataset in this initial foundation build uses demo values so the interface and optimizer can be developed before importing a complete regulation-derived dataset. Displayed AR/skill values are therefore not yet authoritative in-game values.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Production build

```bash
npm run build
```

## Planned next stages

1. Integrate a complete, versioned Elden Ring weapon/affinity dataset and exact CalcCorrectGraph scaling.
2. Add verified skill formulas/motion values with weapon-vs-skill optimization.
3. Add enemy defence/negation presets and real-damage optimization.
4. Expand stat-modifying equipment and DLC provenance tracking.
5. Add shareable build URLs and GitHub Pages deployment.

## Third-party work

The exact-data/calculation pass is intended to build on MIT-licensed open-source Elden Ring calculator work with attribution retained in this repository. No third-party source code has been copied into this foundation build yet.
