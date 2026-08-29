/**
 * ==============================================================================
 * Service: platformModelService
 * ==============================================================================
 * Dynamically fetches the default platform AI models (e.g., Olai M1) from Supabase
 * rather than hardcoding them in the frontend. This allows seamless updates 
 * to backend models without requiring a new client deployment.
 * ==============================================================================
 */

import { supabase } from '../lib/supabase';

// Fallback in case of database connectivity issues
const FALLBACK_PLATFORM_MODELS = [
  {
    id: 'olai-m1',
    name: 'Olai M1',
    provider: 'gemini',
    rawModel: 'gemini-2.0-flash',
    isPlatform: true,
    creditCost: 'Default • High-speed platform intelligence',
  },
];

let cachedPlatformModels = null;

/**
 * Fetches platform models dynamically from Supabase `platform_models` table
 * @returns {Promise<Array>} Array of model objects formatted for the UI
 */
export async function getPlatformModels() {
  if (cachedPlatformModels) return cachedPlatformModels;

  try {
    const { data, error } = await supabase
      .from('platform_models')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Failed to fetch platform models, using fallback:', error?.message);
      cachedPlatformModels = FALLBACK_PLATFORM_MODELS;
      return cachedPlatformModels;
    }

    cachedPlatformModels = data.map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      rawModel: model.raw_model,
      isPlatform: true,
      creditCost: model.credit_cost_label,
    }));

    return cachedPlatformModels;
  } catch (err) {
    console.error('Exception fetching platform models:', err);
    cachedPlatformModels = FALLBACK_PLATFORM_MODELS;
    return cachedPlatformModels;
  }
}
