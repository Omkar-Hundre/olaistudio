/**
 * ==============================================================================
 * Profile Service (Business Logic)
 * ==============================================================================
 * Manages fetching and updating user profiles from the `public.profiles` table.
 * ==============================================================================
 */

import { supabase } from '../lib/supabase';

/**
 * Fetches the profile for a given user ID
 * @param {string} userId
 * @returns {Promise<{ profile: any, error: any }>}
 */
export async function getProfile(userId) {
  if (!userId) {
    return { profile: null, error: { message: 'User ID is required' } };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { profile: data, error };
}

/**
 * Updates profile fields for the authenticated user
 * @param {string} userId
 * @param {Object} updates
 * @returns {Promise<{ profile: any, error: any }>}
 */
export async function updateProfile(userId, updates) {
  if (!userId) {
    return { profile: null, error: { message: 'User ID is required' } };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  return { profile: data, error };
}
