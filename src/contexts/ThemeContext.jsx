/**
 * ==============================================================================
 * Global Theme Context & State Manager
 * ==============================================================================
 * Manages application appearance mode (Light, Dark, or System) according to
 * industry standards:
 * - Persists selection in localStorage (`olai_theme`)
 * - Listens for OS system preference changes (`prefers-color-scheme`)
 * - Sets `.dark` class and `data-theme` attribute on `document.documentElement`
 * - Provides dynamic logo path (`/Olai Logo Dark.png` in dark mode, `/Olai Logo.png` in light mode)
 * ==============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'olai_theme';

export function ThemeProvider({ children }) {
  // Read saved preference from localStorage or default to 'light'
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    }
    return 'light';
  });

  // Effective resolved theme: 'light' | 'dark'
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
      if (saved === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return saved;
    }
    return 'light';
  });

  /**
   * Applies the theme class and attributes to the root document
   */
  const applyThemeToDOM = useCallback((targetTheme) => {
    if (typeof window === 'undefined') return 'light';

    let active = targetTheme;
    if (targetTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      active = prefersDark ? 'dark' : 'light';
    }

    const root = document.documentElement;
    if (active === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    setResolvedTheme(active);
    return active;
  }, []);

  // Update theme setting and sync to storage
  const setTheme = useCallback(
    (newTheme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch {
        // Storage might be restricted
      }
      applyThemeToDOM(newTheme);
    },
    [applyThemeToDOM]
  );

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  // Sync on mount and listen to system preferences
  useEffect(() => {
    applyThemeToDOM(theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyThemeToDOM('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme, applyThemeToDOM]);

  // Dynamic Logo Source based on active theme
  const logoSrc = resolvedTheme === 'dark' ? '/Olai Logo Dark.png' : '/Olai Logo.png';

  const value = {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    logoSrc,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
