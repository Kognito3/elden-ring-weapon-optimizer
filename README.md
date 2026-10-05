# Elden Ring Weapon Optimizer

Early interactive foundation for a graphical Elden Ring weapon/stat optimizer.

## Current v0.2 foundation

- React + TypeScript + Vite
- Starting class stat floors (Wretch is the default)
- Vertical stat editor with click-to-select offensive graph axes
- Weapon, affinity and upgrade selection
- Weapon AR / unique-skill optimization modes
- Two-handing support
- Equipment/stat-boost hooks
- One-click “meet weapon requirements”
- Two graph views:
  - **From my current build** — reachable stat space from entered stats plus N points
  - **Full 1–99 stat map** — the complete two-stat surface, with the same budget line overlaid
- Requirements-unmet cells are grey/hatched and excluded from the valid colour scale
- Affinity-aware, luminance-heavy heatmap palette designed to be easier to read with colour-vision deficiencies
- Hoverable allocation points and exact outputs
- Mathematical optimum highlighted on the current point-budget line
- Optimal spread includes non-axis weapon requirements
- DLC source badge hooks
- Main-path and Shadow of the Erdtree boss quick-select UI

## Important

The UI and optimization flow are functional, but the current small weapon dataset uses **demo values**. The next major data pass is to replace those with regulation-derived weapon/affinity data and exact CalcCorrectGraph curves, followed by verified skill and enemy damage models.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints in the terminal (normally `http://localhost:5173`).

## Build

```bash
npm run build
```
