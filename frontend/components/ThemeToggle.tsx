'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render placeholder with identical dimensions to prevent layout shifts or hydration flicker
    return (
      <button
        type="button"
        aria-hidden="true"
        className={`inline-flex items-center justify-center gap-2 p-2 rounded-lg border border-border bg-card/50 text-muted-foreground opacity-60 cursor-default ${className}`}
      >
        <span className="w-4 h-4" />
        {showLabel && <span className="text-xs font-semibold">Theme</span>}
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative inline-flex items-center justify-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-accent text-foreground transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-primary/40 active:scale-95 cursor-pointer shadow-2xs ${className}`}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-all duration-300 transform rotate-0 scale-100 group-hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-primary transition-all duration-300 transform rotate-0 scale-100 group-hover:-rotate-12" />
        )}
      </span>
      {showLabel && (
        <span className="text-xs font-semibold text-foreground/90">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
