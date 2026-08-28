/**
 * ==============================================================================
 * Custom Hook: useTheme
 * ==============================================================================
 * Provides easy access to the active theme, resolved theme, and toggle methods.
 * ==============================================================================
 */

import { useThemeContext } from '../contexts/ThemeContext';

export function useTheme() {
  return useThemeContext();
}
