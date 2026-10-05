import { useMemo, useState } from 'react';
import type { Affinity, AllocationPoint, OffensiveStat } from '../types';

interface Props {
  points: AllocationPoint[];
  line: AllocationPoint[];
  axisX: OffensiveStat;
  axisY: OffensiveStat;
  affinity: Affinity;
  somber: boolean;
}

const WIDTH = 720;
const HEIGHT = 500;
const PAD = { l: 64, r: 22, t: 24, b: 58 };

function statLabel(stat: OffensiveStat) {
  return stat.toUpperCase();
}

function affinityHue(affinity: Affinity, somber: boolean): number {
  if (somber) return 205;
  const hues: Record<Affinity, number> = {
    Standard: 42,
    Heavy: 28,
    Keen: 190,
    Quality: 48,
    Magic: 228,
    Fire: 18,
    'Flame Art': 8,
    Lightning: 54,
    Sacred: 43,
    Poison: 108,
    Blood: 350,
    Cold: 196,
    Occult: 278,
    Unique: 205,
  };
  return hues[affinity];
}

function paletteColour(t: number, hue: number) {
  // Strong luminance change is intentional: the graph should remain readable even
  // when hue differences are hard to distinguish. Quantising also creates visible
  // AR bands rather than an almost imperceptibly smooth gradient.
  const band = Math.round(Math.max(0, Math.min(1, t)) * 14) / 14;
  const saturation = 34 + band * 54;
  const lightness = 15 + band * 68;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export default function Heatmap({ points, line, axisX, axisY, affinity, somber }: Props) {
  const [hover, setHover] = useState<AllocationPoint | null>(null);
  const hue = affinityHue(affinity, somber);
  const geometry = useMemo(() => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const validValues = points.filter((p) => p.valid).map((p) => p.value);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minV = validValues.length ? Math.min(...validValues) : 0;
    const maxV = validValues.length ? Math.max(...validValues) : 1;
    const plotW = WIDTH - PAD.l - PAD.r;
    const plotH = HEIGHT - PAD.t - PAD.b;
    const xScale = (x: number) => PAD.l + ((x - minX) / Math.max(1, maxX - minX)) * plotW;
    const yScale = (y: number) => PAD.t + plotH - ((y - minY) / Math.max(1, maxY - minY)) * plotH;
    return { minX, maxX, minY, maxY, minV, maxV, plotW, plotH, xScale, yScale };
  }, [points]);

  if (!points.length) return <div className="empty-graph">No allocations in this range.</div>;

  const cellW = Math.max(1, geometry.plotW / Math.max(1, geometry.maxX - geometry.minX + 1));
  const cellH = Math.max(1, geometry.plotH / Math.max(1, geometry.maxY - geometry.minY + 1));
  const colour = (p: AllocationPoint) => {
    if (!p.valid) return 'url(#invalid-hatch)';
    const t = (p.value - geometry.minV) / Math.max(1e-9, geometry.maxV - geometry.minV);
    return paletteColour(t, hue);
  };
  const validLine = line.filter((p) => p.valid);
  const best = validLine.reduce<AllocationPoint | null>((acc, p) => (!acc || p.value > acc.value ? p : acc), null);
  const legendStops = [0, .25, .5, .75, 1].map((t) => paletteColour(t, hue));

  return (
    <div className="heatmap-wrap">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="heatmap" role="img" aria-label={`${statLabel(axisX)} by ${statLabel(axisY)} optimisation heatmap`}>
        <defs>
          <pattern id="invalid-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="#30332e" />
            <rect width="2" height="7" fill="#50534c" opacity=".65" />
          </pattern>
        </defs>
        <rect x={PAD.l} y={PAD.t} width={geometry.plotW} height={geometry.plotH} rx="10" className="plot-bg" />
        <g shapeRendering="crispEdges">
          {points.map((p) => (
            <rect
              key={`${p.x}-${p.y}`}
              x={geometry.xScale(p.x) - cellW / 2}
              y={geometry.yScale(p.y) - cellH / 2}
              width={cellW + 0.45}
              height={cellH + 0.45}
              fill={colour(p)}
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </g>
        {line.length > 1 && (
          <polyline
            points={line.map((p) => `${geometry.xScale(p.x)},${geometry.yScale(p.y)}`).join(' ')}
            fill="none"
            className="allocation-line"
          />
        )}
        {line.map((p) => (
          <circle
            key={`line-${p.x}-${p.y}`}
            cx={geometry.xScale(p.x)}
            cy={geometry.yScale(p.y)}
            r="3.5"
            className={p.valid ? 'allocation-dot' : 'allocation-dot invalid'}
            onMouseEnter={() => setHover(p)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {best && (
          <g transform={`translate(${geometry.xScale(best.x)} ${geometry.yScale(best.y)})`}>
            <circle r="10" className="best-ring" />
            <circle r="4" className="best-dot" />
          </g>
        )}
        <line x1={PAD.l} y1={HEIGHT - PAD.b} x2={WIDTH - PAD.r} y2={HEIGHT - PAD.b} className="axis" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={HEIGHT - PAD.b} className="axis" />
        <text x={PAD.l} y={HEIGHT - PAD.b + 24} className="tick">{geometry.minX}</text>
        <text x={WIDTH - PAD.r} y={HEIGHT - PAD.b + 24} textAnchor="end" className="tick">{geometry.maxX}</text>
        <text x={PAD.l - 10} y={HEIGHT - PAD.b} textAnchor="end" className="tick">{geometry.minY}</text>
        <text x={PAD.l - 10} y={PAD.t + 5} textAnchor="end" className="tick">{geometry.maxY}</text>
        <text x={PAD.l + geometry.plotW / 2} y={HEIGHT - 14} textAnchor="middle" className="axis-label">{statLabel(axisX)}</text>
        <text transform={`translate(18 ${PAD.t + geometry.plotH / 2}) rotate(-90)`} textAnchor="middle" className="axis-label">{statLabel(axisY)}</text>
      </svg>
      <div className="graph-legend">
        <span>Lower</span>
        <div className="gradient" style={{ background: `linear-gradient(90deg, ${legendStops.join(', ')})` }} />
        <span>Higher</span>
        <span className="legend-invalid">▧ Requirements unmet</span>
      </div>
      <div className={`hover-readout ${hover ? 'active' : ''}`}>
        {hover ? <><strong>{statLabel(axisX)} {hover.x} / {statLabel(axisY)} {hover.y}</strong><span>{hover.valid ? hover.value.toFixed(1) : 'Requirements unmet'}</span></> : <span>Hover the heatmap or allocation line for exact values.</span>}
      </div>
    </div>
  );
}
