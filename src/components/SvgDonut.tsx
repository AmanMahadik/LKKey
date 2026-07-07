'use client';

import React from 'react';

interface SvgDonutProps {
  active?: number;
  revoked?: number;
  expired?: number;
  size?: number;
}

export default function SvgDonut({ 
  active = 6, 
  revoked = 1, 
  expired = 1, 
  size = 140 
}: SvgDonutProps) {
  const total = active + revoked + expired;
  
  // Circumference for r=40 is 2 * pi * 40 = 251.3
  const r = 40;
  const c = 2 * Math.PI * r;
  
  const activePct = total > 0 ? active / total : 0;
  const revokedPct = total > 0 ? revoked / total : 0;
  const expiredPct = total > 0 ? expired / total : 0;
  
  const activeOffset = c;
  const revokedOffset = c - (activePct * c);
  const expiredOffset = c - ((activePct + revokedPct) * c);
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          {/* Base Circle */}
          <circle 
            cx="50" 
            cy="50" 
            r={r} 
            fill="transparent" 
            stroke="#1C1C1E" 
            strokeWidth="10" 
          />
          
          {/* Expired Segment */}
          {expired > 0 && (
            <circle 
              cx="50" 
              cy="50" 
              r={r} 
              fill="transparent" 
              stroke="#3F3F46" 
              strokeWidth="10" 
              strokeDasharray={c}
              strokeDashoffset={expiredOffset}
              strokeLinecap="round"
            />
          )}

          {/* Revoked Segment */}
          {revoked > 0 && (
            <circle 
              cx="50" 
              cy="50" 
              r={r} 
              fill="transparent" 
              stroke="var(--color-danger)" 
              strokeWidth="10" 
              strokeDasharray={c}
              strokeDashoffset={revokedOffset}
              strokeLinecap="round"
            />
          )}

          {/* Active Segment */}
          {active > 0 && (
            <circle 
              cx="50" 
              cy="50" 
              r={r} 
              fill="transparent" 
              stroke="var(--accent-primary)" 
              strokeWidth="10" 
              strokeDasharray={c}
              strokeDashoffset={activeOffset}
              strokeLinecap="round"
              filter="drop-shadow(0 0 4px rgba(37,99,235,0.4))"
            />
          )}
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-sans)',
        }}>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{total}</span>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Keys</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', boxShadow: '0 0 6px var(--accent-primary)' }}></div>
          <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Active</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{active}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }}></div>
          <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Revoked</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{revoked}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3F3F46' }}></div>
          <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Expired</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{expired}</span>
        </div>
      </div>
    </div>
  );
}
