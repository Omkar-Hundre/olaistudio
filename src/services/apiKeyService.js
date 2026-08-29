/**
 * ==============================================================================
 * API Key Service (Business Logic & Security)
 * ==============================================================================
 * Manages secure storage for user API keys:
 * - Always reads live, fresh credentials from Supabase (Zero stale cache issues)
 * - Row Level Security (RLS) guarantees complete tenant isolation
 * - Seamless automatic error recovery
 * ==============================================================================
 */

import { supabase } from '../lib/supabase';

/**
 * Fetches user API keys directly from Supabase (always fresh, zero stale caching)
 * @param {string} userId
 * @returns {Promise<{ keys: { openaiKey: string, claudeKey: string, geminiKey: string }, error: any }>}
 */
export async function getUserApiKeys(userId) {
  if (!userId) {
    return { keys: { openaiKey: '', claudeKey: '', geminiKey: '' }, error: null };
  }

  try {
    // Clear any legacy localStorage stale cache
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`olai_api_keys_${userId}`);
      } catch {}
    }

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('openai_key, claude_key, gemini_key')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching API keys from Supabase:', error);
      return { keys: { openaiKey: '', claudeKey: '', geminiKey: '' }, error };
    }

    return {
      keys: {
        openaiKey: data?.openai_key || '',
        claudeKey: data?.claude_key || '',
        geminiKey: data?.gemini_key || '',
      },
      error: null,
    };
  } catch (err) {
    console.error('Failed to fetch user API keys:', err);
    return { keys: { openaiKey: '', claudeKey: '', geminiKey: '' }, error: err };
  }
}

/**
 * Saves or updates user API keys in Supabase
 * @param {string} userId
 * @param {{ openaiKey?: string, claudeKey?: string, geminiKey?: string }} keys
 * @returns {Promise<{ success: boolean, error: any }>}
 */
export async function saveUserApiKeys(userId, keys) {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }

  try {
    const payload = {
      user_id: userId,
      openai_key: (keys.openaiKey ?? '').trim(),
      claude_key: (keys.claudeKey ?? '').trim(),
      gemini_key: (keys.geminiKey ?? '').trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_api_keys')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) throw error;

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`olai_api_keys_${userId}`);
      } catch {}
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Failed to save API keys to Supabase:', err);
    return { success: false, error: err };
  }
}
