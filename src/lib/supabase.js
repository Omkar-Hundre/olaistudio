/**
 * ==============================================================================
 * Supabase Client Configuration & Session Security
 * ==============================================================================
 * Configures the Supabase client with:
 * - JWT authentication persistence
 * - Automatic token refreshing
 * - 7-day session lifecycle verification
 * - Idempotency key generation for atomic requests
 * ==============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase credentials missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are set.');
  }
}

// 7-day session duration limit in milliseconds
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Custom storage wrapper that validates session TTL against the 7-day policy
 */
const customAuthStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    try {
      const timestampKey = `${key}_ts`;
      const savedAt = window.localStorage.getItem(timestampKey);
      if (savedAt) {
        const age = Date.now() - parseInt(savedAt, 10);
        if (age > SESSION_MAX_AGE_MS) {
          // Session expired beyond 7 days - clean up
          window.localStorage.removeItem(key);
          window.localStorage.removeItem(timestampKey);
          return null;
        }
      }
    } catch {
      // Return raw if parse error
    }
    return raw;
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
    window.localStorage.setItem(`${key}_ts`, Date.now().toString());
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(`${key}_ts`);
  },
};

/**
 * Generates an RFC-compliant UUIDv4 idempotency key for safe API requests
 */
export function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const supabase = createClient(
  supabaseUrl || 'https://unaasqwrbyhsmninvwpl.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: customAuthStorage,
      storageKey: 'olai_auth_token',
  },
});
