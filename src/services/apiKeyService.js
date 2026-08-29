/**
 * ==============================================================================
 * API Key Service (Business Logic & Security)
 * ==============================================================================
 * Manages secure storage and daily synchronized caching for user API keys:
 * - Direct Supabase PostgreSQL synchronization protected by Row Level Security (RLS)
 * - LocalStorage caching with 24-hour TTL daily refresh verification
 * - Secure isolation (only authenticated user can access/modify their keys)
 * ==============================================================================
 */

import { supabase } from '../lib/supabase';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Gets cached API keys from local storage
 * @param {string} userId
 * @returns {{ openaiKey: string, claudeKey: string, geminiKey: string, cachedAt?: number } | null}
 */
export function getCachedApiKeys(userId) {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const raw = localStorage.getItem(`olai_api_keys_${userId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Saves API keys to local cache with timestamp
 * @param {string} userId
 * @param {Object} keys
 */
export function setCachedApiKeys(userId, keys) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const payload = {
      ...keys,
      cachedAt: Date.now(),
    };
    localStorage.setItem(`olai_api_keys_${userId}`, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to cache API keys locally:', err);
  }
}

/**
 * Fetches user API keys from Supabase or local cache if fresh
 * @param {string} userId
 * @param {boolean} forceRefresh - If true, bypasses 24h cache check
 * @returns {Promise<{ keys: { openaiKey: string, claudeKey: string, geminiKey: string }, error: any }>}
 */
export async function getUserApiKeys(userId, forceRefresh = false) {
  if (!userId) {
    return { keys: { openaiKey: '', claudeKey: '', geminiKey: '' }, error: null };
  }

  // 1. Check local cache validity
  const cached = getCachedApiKeys(userId);
  const isRevokedKey = cached?.geminiKey?.includes('AIzaSyChoZcloU55XtyvzNbPW8Kp7UQdBJ7ng4A');
  const isFresh = cached && cached.cachedAt && (Date.now() - cached.cachedAt < CACHE_TTL_MS) && !isRevokedKey;

  if (isFresh && !forceRefresh) {
    return {
      keys: {
        openaiKey: cached.openaiKey || '',
        claudeKey: cached.claudeKey || '',
        geminiKey: cached.geminiKey || '',
      },
      error: null,
    };
  }

  // 2. Fetch fresh record from Supabase
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('openai_key, claude_key, gemini_key')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    // If network error, fallback to existing cache if available
    if (cached) {
      return {
        keys: {
          openaiKey: cached.openaiKey || '',
          claudeKey: cached.claudeKey || '',
          geminiKey: cached.geminiKey || '',
        },
        error: null,
      };
    }
    return { keys: { openaiKey: '', claudeKey: '', geminiKey: '' }, error };
  }

  const resultKeys = {
    openaiKey: data?.openai_key || '',
    claudeKey: data?.claude_key || '',
    geminiKey: data?.gemini_key || '',
  };

  // 3. Update local cache
  setCachedApiKeys(userId, resultKeys);

  return { keys: resultKeys, error: null };
}

/**
 * Saves/upserts user API keys to Supabase and updates local storage
 * @param {string} userId
 * @param {Object} keys
 * @param {string} keys.openaiKey
 * @param {string} keys.claudeKey
 * @param {string} keys.geminiKey
 * @returns {Promise<{ success: boolean, error: any }>}
 */
export async function saveUserApiKeys(userId, { openaiKey, claudeKey, geminiKey }) {
  if (!userId) {
    return { success: false, error: { message: 'User ID is required' } };
  }

  const payload = {
    user_id: userId,
    openai_key: (openaiKey || '').trim(),
    claude_key: (claudeKey || '').trim(),
    gemini_key: (geminiKey || '').trim(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_api_keys')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    return { success: false, error };
  }

  // Update local storage cache
  setCachedApiKeys(userId, {
    openaiKey: payload.openai_key,
    claudeKey: payload.claude_key,
    geminiKey: payload.gemini_key,
  });

  return { success: true, error: null };
}
