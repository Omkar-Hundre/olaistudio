/**
 * ==============================================================================
 * Custom Hook: useAuth
 * ==============================================================================
 * Convenient access to the global AuthContext state and methods.
 * ==============================================================================
 */

import { useAuthContext } from '../contexts/AuthContext';

export function useAuth() {
  return useAuthContext();
}
