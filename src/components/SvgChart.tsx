'use client';

import React, { useState } from 'react';

interface ChartPoint {
  label: string;
  value: number;
}

interface SvgChartProps {
  data?: ChartPoint[];
  width?: number;
  height?: number;
}

export default function SvgChart({ 
  data = [
    { label: 'Apr 28', value: 1200 },
    { label: 'May 5', value: 2800 },
    { label: 'May 12', value: 5342 },
    { label: 'May 19', value: 3100 },
    { label: 'May 26', value: 5900 },
    { label: 'Jun 2', value: 7120 },
  ],
  width = 800,
  height = 300
}: SvgChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(2); // Default to highlight the peak

  const padding = { top: 40, right: 40, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.value)) * 1.15;
  const minVal = 0;

  // Compute SVG Coordinates
  const points = data.map((d, index) => {
    const x = padding.left + (index / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.value - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });

  // Generate Bezier Curve path
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (2 * (next.x - curr.x)) / 3;
      const cpY2 = next.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
  }

  // Generate Area Path (for gradient fill under curve)
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
    : '';

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="section-title">API Requests Overview</h3>
        <select 
          className="form-input" 
          style={{ width: '120px', padding: '6px 12px', fontSize: '12px' }}
          defaultValue="30"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      <div style={{ position: 'relative', background: 'rgba(255,255,255,0.005)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px 8px' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            {/* Area Gradient */}
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
            </linearGradient>
            {/* Glow Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + chartHeight * ratio;
            const val = Math.round(maxVal - ratio * (maxVal - minVal));
            return (
              <g key={i}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={width - padding.right} 
                  y2={y} 
                  stroke="var(--border-color)" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={padding.left - 10} 
                  y={y + 4} 
                  fill="var(--text-muted)" 
                  fontSize="10" 
                  textAnchor="end" 
                  fontFamily="var(--font-mono)"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {points.map((pt, i) => (
            <text 
              key={i} 
              x={pt.x} 
              y={height - padding.bottom + 20} 
              fill="var(--text-muted)" 
              fontSize="10.5" 
              textAnchor="middle"
            >
              {pt.label}
            </text>
          ))}

          {/* Area Fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Bezier Path Line */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="var(--accent-primary)" 
            strokeWidth="3" 
            filter="url(#glow)" 
          />

          {/* Interactive Hover Areas */}
          {points.map((pt, i) => (
            <g key={i} onMouseEnter={() => setHoveredIndex(i)}>
              {/* Vertical Guide Line */}
              {hoveredIndex === i && (
                <line 
                  x1={pt.x} 
                  y1={padding.top} 
                  x2={pt.x} 
                  y2={height - padding.bottom} 
                  stroke="rgba(37,99,235,0.3)" 
                  strokeWidth="1.5"
                />
              )}

              {/* Data Point Dot */}
              <circle 
                cx={pt.x} 
                cy={pt.y} 
                r={hoveredIndex === i ? 6 : 4} 
                fill={hoveredIndex === i ? 'var(--text-primary)' : 'var(--accent-primary)'} 
                stroke="var(--bg-primary)" 
                strokeWidth={hoveredIndex === i ? 3 : 2} 
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
              />

              {/* invisible wider circle for easier hovering */}
              <circle 
                cx={pt.x} 
                cy={pt.y} 
                r="20" 
                fill="transparent" 
                style={{ cursor: 'pointer' }}
              />
            </g>
          ))}

          {/* Tooltip Overlay */}
          {hoveredIndex !== null && (
            <g transform={`translate(${points[hoveredIndex].x - 60}, ${points[hoveredIndex].y - 48})`}>
              <rect 
                width="120" 
                height="36" 
                rx="8" 
                fill="#1C1C1E" 
                stroke="var(--border-color)" 
                strokeWidth="1.5"
                filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
              />
              <text x="60" y="15" fill="var(--text-primary)" fontSize="11" fontWeight="700" textAnchor="middle">
                {points[hoveredIndex].value.toLocaleString()}
              </text>
              <text x="60" y="27" fill="var(--text-muted)" fontSize="9.5" textAnchor="middle">
                {points[hoveredIndex].label}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
