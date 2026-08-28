/**
 * ==============================================================================
 * Credit Management Service (Business Logic & Security)
 * ==============================================================================
 * Interacts with the public.user_credits table:
 * - Read-only client access secured by Row Level Security (RLS)
 * - Prevents client-side balance manipulation
 * - Provides live balance retrieval and caching
 * ==============================================================================
 */

import { supabase } from '../lib/supabase';

/**
 * Fetches user credit balance and allocation
 * @param {string} userId
 * @returns {Promise<{ credits: { balance: number, allocated: number, used: number, tier: string }, error: any }>}
 */
export async function getUserCredits(userId) {
  if (!userId) {
    return { credits: { balance: 100, allocated: 100, used: 0, tier: 'standard' }, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance, allocated_credits, used_credits, tier')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Failed to fetch user credits:', error);
      return { credits: { balance: 100, allocated: 100, used: 0, tier: 'standard' }, error };
    }

    if (!data) {
      return { credits: { balance: 100, allocated: 100, used: 0, tier: 'standard' }, error: null };
    }

    return {
      credits: {
        balance: data.balance ?? 100,
        allocated: data.allocated_credits ?? 100,
        used: data.used_credits ?? 0,
        tier: data.tier || 'standard',
      },
      error: null,
    };
  } catch (err) {
    return { credits: { balance: 100, allocated: 100, used: 0, tier: 'standard' }, error: err };
  }
}
