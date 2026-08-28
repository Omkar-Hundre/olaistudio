/**
 * ==============================================================================
 * Component: ThemeToggle
 * ==============================================================================
 * High-end SaaS Theme Switchers:
 * - ThemePillSwitch: Clean sliding pill toggle for the dashboard navbar
 * - ThemeSegmentedSelector: 3-way segmented control for Settings modal
 * ==============================================================================
 */

import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

/**
 * Modern Sliding Pill Theme Switcher for Header / Navbar
 */
export function ThemePillSwitch({ className = '' }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-slate-200/90 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 p-0.5 transition-colors duration-200 focus:outline-none ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle color theme"
    >
      {/* Sliding Thumb */}
      <span
        className={`pointer-events-none flex h-5.5 w-5.5 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 shadow-xs ring-0 transition-transform duration-200 ease-in-out ${
          isDark ? 'translate-x-5' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-zinc-200 transition-transform duration-200" />
        ) : (
          <Sun className="h-3 w-3 text-slate-700 transition-transform duration-200" />
        )}
      </span>
    </button>
  );
}

/**
 * Segmented 3-Way Selector for Settings Dialog
 */
export function ThemeSegmentedSelector() {
  const { theme, setTheme } = useTheme();

  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900 p-1">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={`flex items-center justify-center gap-2 rounded-md py-1.5 text-xs font-medium transition-all cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ThemePillSwitch;
