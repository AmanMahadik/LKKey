'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('lkkey_theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  // Apply theme when state changes
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    function applyTheme() {
      if (theme === 'light') {
        body.classList.add('light-theme');
        root.style.colorScheme = 'light';
      } else if (theme === 'dark') {
        body.classList.remove('light-theme');
        root.style.colorScheme = 'dark';
      } else {
        // System preference
        const isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDarkSystem) {
          body.classList.remove('light-theme');
          root.style.colorScheme = 'dark';
        } else {
          body.classList.add('light-theme');
          root.style.colorScheme = 'light';
        }
      }
    }

    applyTheme();

    // Listen for system theme changes if set to 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      
      // Support older and newer media query listener API
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
      } else {
        mediaQuery.addListener(listener);
      }
      
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', listener);
        } else {
          mediaQuery.removeListener(listener);
        }
      };
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('lkkey_theme', newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
