import { useMemo, useState } from 'react';
import type { AllocationPoint, OffensiveStat } from '../types';

interface Props {
  points: AllocationPoint[];
  line: AllocationPoint[];
  axisX: OffensiveStat;
  axisY: OffensiveStat;
}

const WIDTH = 720;
const HEIGHT = 500;
const PAD = { l: 64, r: 22, t: 24, b: 58 };

function statLabel(stat: OffensiveStat) {
  return stat.toUpperCase();
}

export default function Heatmap({ points, line, axisX, axisY }: Props) {
  const [hover, setHover] = useState<AllocationPoint | null>(null);
  const geometry = useMemo(() => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const values = points.map((p) => p.value);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const plotW = WIDTH - PAD.l - PAD.r;
    const plotH = HEIGHT - PAD.t - PAD.b;
    const xScale = (x: number) => PAD.l + ((x - minX) / Math.max(1, maxX - minX)) * plotW;
    const yScale = (y: number) => PAD.t + plotH - ((y - minY) / Math.max(1, maxY - minY)) * plotH;
    return { minX, maxX, minY, maxY, minV, maxV, plotW, plotH, xScale, yScale };
  }, [points]);

  if (!points.length) return <div className="empty-graph">No legal allocations in this range.</div>;

  const cellW = Math.max(4, geometry.plotW / Math.max(1, geometry.maxX - geometry.minX + 1));
  const cellH = Math.max(4, geometry.plotH / Math.max(1, geometry.maxY - geometry.minY + 1));
  const colour = (p: AllocationPoint) => {
    if (!p.valid) return 'rgba(90, 90, 90, .45)';
    const t = (p.value - geometry.minV) / Math.max(1e-9, geometry.maxV - geometry.minV);
    const hue = 220 - t * 175;
    return `hsl(${hue} 72% ${38 + t * 14}%)`;
  };
  const best = line.reduce<AllocationPoint | null>((acc, p) => (!acc || p.value > acc.value ? p : acc), null);

  return (
    <div className="heatmap-wrap">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="heatmap" role="img" aria-label={`${statLabel(axisX)} by ${statLabel(axisY)} optimisation heatmap`}>
        <rect x={PAD.l} y={PAD.t} width={geometry.plotW} height={geometry.plotH} rx="10" className="plot-bg" />
        {points.map((p) => (
          <rect
            key={`${p.x}-${p.y}`}
            x={geometry.xScale(p.x) - cellW / 2}
            y={geometry.yScale(p.y) - cellH / 2}
            width={cellW + 0.8}
            height={cellH + 0.8}
            fill={colour(p)}
            onMouseEnter={() => setHover(p)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
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
            r="4.5"
            className="allocation-dot"
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
      <div className="graph-legend"><span>Lower</span><div className="gradient" /><span>Higher</span><span className="legend-invalid">■ Requirements unmet</span></div>
      <div className={`hover-readout ${hover ? 'active' : ''}`}>
        {hover ? <><strong>{statLabel(axisX)} {hover.x} / {statLabel(axisY)} {hover.y}</strong><span>{hover.value.toFixed(1)} {hover.valid ? '' : '• requirements unmet'}</span></> : <span>Hover the heatmap or allocation line for exact values.</span>}
      </div>
    </div>
  );
}
