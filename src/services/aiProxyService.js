/**
 * ==============================================================================
 * Secure AI Proxy Client Service
 * ==============================================================================
 * Dispatches chat messages to the backend Edge Function `ai-proxy`:
 * - Protects platform credentials on server
 * - Automatically utilizes user custom API keys if present (0 credit cost)
 * - Safely deducts 1 platform credit if using system-hosted credentials
 * ==============================================================================
 */

import { supabase } from '../lib/supabase';

/**
 * Sends chat request via secure backend AI proxy
 * @param {Object} params
 * @param {Array<{ role: string, content: string }>} params.messages
 * @param {string} [params.provider='gemini'] - 'gemini' | 'openai' | 'claude'
 * @param {string} [params.model='gemini-2.0-flash']
 * @param {string} [params.systemPrompt] - Optional system prompt instruction
 * @returns {Promise<{ reply: string, creditsRemaining?: number, usedUserKey?: boolean, error?: string }>}
 */
export async function sendProxyChatMessage({ messages, provider = 'gemini', model = 'gemini-2.0-flash', systemPrompt = '' }) {
  try {
    const finalMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        provider,
        model,
        messages: finalMessages,
        systemPrompt,
      },
    });

    if (error) {
      return {
        reply: '',
        error: error.message || 'Failed to communicate with AI proxy.',
      };
    }

    if (data?.error) {
      return {
        reply: '',
        error: data.error,
      };
    }

    return {
      reply: data.reply || '',
      creditsRemaining: data.creditsRemaining,
      usedUserKey: data.usedUserKey,
    };
  } catch (err) {
    return {
      reply: '',
      error: err.message || 'Network error while contacting AI proxy.',
    };
  }
}
