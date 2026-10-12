'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark'; // resolved effective theme
  rawTheme: Theme; // user choice: 'light' | 'dark' | 'system'
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'fmc_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [rawTheme, setRawThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const applyTheme = (target: 'light' | 'dark') => {
    const root = document.documentElement;
    if (target === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      const initialChoice: Theme =
        stored === 'light' || stored === 'dark' || stored === 'system'
          ? stored
          : 'system';
      setRawThemeState(initialChoice);

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const computeResolved = (choice: Theme): 'light' | 'dark' => {
        if (choice === 'dark') return 'dark';
        if (choice === 'light') return 'light';
        return mediaQuery.matches ? 'dark' : 'light';
      };

      const resolved = computeResolved(initialChoice);
      setResolvedTheme(resolved);
      applyTheme(resolved);

      const handleSystemChange = (e: MediaQueryListEvent) => {
        const currentStored = localStorage.getItem(THEME_STORAGE_KEY);
        if (!currentStored || currentStored === 'system') {
          const next = e.matches ? 'dark' : 'light';
          setResolvedTheme(next);
          applyTheme(next);
        }
      };

      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } catch {
      // Fallback for SSR or restrictive environments
    }
  }, []);

  const setTheme = (choice: Theme) => {
    setRawThemeState(choice);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const nextResolved: 'light' | 'dark' =
      choice === 'dark'
        ? 'dark'
        : choice === 'light'
        ? 'light'
        : mediaQuery.matches
        ? 'dark'
        : 'light';

    setResolvedTheme(nextResolved);
    applyTheme(nextResolved);

    try {
      if (choice === 'system') {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, choice);
      }
    } catch {
      // Ignore storage errors
    }
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        rawTheme,
        toggleTheme,
        setTheme,
      }}
    >
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
