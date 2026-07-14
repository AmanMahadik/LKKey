'use client';

import React from 'react';
import { useTheme } from './ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      padding: '2px',
      gap: '2px'
    }}>
      {/* Light Mode Button */}
      <button 
        onClick={() => setTheme('light')}
        style={{
          background: theme === 'light' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          border: 'none',
          borderRadius: '8px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: theme === 'light' ? 'var(--accent-glow)' : 'var(--text-muted)',
          boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
          transition: 'var(--transition)'
        }}
        title="Light Mode"
      >
        <Sun size={14} />
      </button>

      {/* Dark Mode Button */}
      <button 
        onClick={() => setTheme('dark')}
        style={{
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          border: 'none',
          borderRadius: '8px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: theme === 'dark' ? 'var(--accent-glow)' : 'var(--text-muted)',
          boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
          transition: 'var(--transition)'
        }}
        title="Dark Mode"
      >
        <Moon size={14} />
      </button>

      {/* System Mode Button */}
      <button 
        onClick={() => setTheme('system')}
        style={{
          background: theme === 'system' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          border: 'none',
          borderRadius: '8px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: theme === 'system' ? 'var(--accent-glow)' : 'var(--text-muted)',
          boxShadow: theme === 'system' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
          transition: 'var(--transition)'
        }}
        title="System Preference"
      >
        <Monitor size={14} />
      </button>
    </div>
  );
}
