/**
 * ==============================================================================
 * Activity Log Service (Audit & Tracking)
 * ==============================================================================
 * Fetches and records activity logs for the authenticated user from public.activity_logs.
 * ==============================================================================
 */

import { supabase } from '../lib/supabase';

/**
 * Fetches recent activity logs for a user
 * @param {string} userId
 * @param {number} [limit=20]
 * @returns {Promise<{ logs: Array<any>, error: any }>}
 */
export async function getUserActivityLogs(userId, limit = 20) {
  if (!userId) {
    return { logs: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, action, model, credits_used, details, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { logs: [], error };
    }

    return { logs: data || [], error: null };
  } catch (err) {
    return { logs: [], error: err };
  }
}
