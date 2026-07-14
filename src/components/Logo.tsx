'use client';

import React from 'react';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 32 }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0px 0px 8px rgba(37, 99, 235, 0.15))', transition: 'var(--transition)' }}
    >
      {/* Hexagon Border */}
      <path 
        d="M50 10 L86 31 L86 69 L50 90 L14 69 L14 31 Z" 
        stroke="url(#hexGradient)" 
        strokeWidth="6.5" 
        strokeLinejoin="round"
      />

      {/* Nodes on Top, Bottom, and Left Vertices */}
      <circle cx="50" cy="10" r="5" fill="var(--sidebar-bg)" stroke="url(#hexGradient)" strokeWidth="3" />
      <circle cx="50" cy="90" r="5" fill="var(--sidebar-bg)" stroke="url(#hexGradient)" strokeWidth="3" />
      <circle cx="14" cy="50" r="5" fill="var(--sidebar-bg)" stroke="url(#hexGradient)" strokeWidth="3" />

      {/* Stylized 'L' (Left Side) */}
      <path 
        d="M32 36 V64 H48 V58 H38 V36 H32 Z" 
        fill="var(--text-primary)"
        style={{ transition: 'fill 0.25s ease' }}
      />
      {/* L Bottom shadow accent */}
      <path 
        d="M32 64 L38 68 H48 V64 Z" 
        fill="var(--accent-primary)"
        opacity="0.85"
      />

      {/* Stylized 'F' (Right Side) */}
      <path 
        d="M50 36 V64 H56 V52 H64 V46 H56 V42 H66 V36 H50 Z" 
        fill="var(--text-primary)"
        style={{ transition: 'fill 0.25s ease' }}
      />
      {/* F mid and top shadow accents */}
      <path 
        d="M56 42 H66 V46 H56 Z" 
        fill="var(--accent-primary)"
        opacity="0.85"
      />
      <path 
        d="M56 52 H64 V56 H56 Z" 
        fill="var(--accent-primary)"
        opacity="0.85"
      />
      {/* F bottom shadow accent */}
      <path 
        d="M50 64 L56 68 V64 Z" 
        fill="var(--accent-primary)"
        opacity="0.85"
      />

      {/* Definitions for Gradient */}
      <defs>
        <linearGradient id="hexGradient" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent-glow)" />
          <stop offset="100%" stopColor="var(--accent-primary)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
