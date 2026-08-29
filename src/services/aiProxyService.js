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
import { optimizeMessagesForContextWindow, calculateTokenBudget } from '../utils/tokenBudget';

/**
 * Sends chat request via secure backend AI proxy with token budget safety guards
 * @param {Object} params
 * @param {Array<{ role: string, content: string }>} params.messages
 * @param {string} [params.provider='gemini'] - 'gemini' | 'openai' | 'claude'
 * @param {string} [params.model='gemini-2.5-flash']
 * @param {string} [params.systemPrompt=''] - Optional system prompt instruction
 * @param {string} [params.globalContext=''] - Optional global vision/project context
 * @param {string} [params.parentContext=''] - Optional parent node context
 * @returns {Promise<{ reply: string, creditsRemaining?: number, usedUserKey?: boolean, tokenBudget?: Object, error?: string }>}
 */
export async function sendProxyChatMessage({
  messages,
  provider = 'gemini',
  model = 'gemini-2.5-flash',
  systemPrompt = '',
  globalContext = '',
  parentContext = '',
}) {
  try {
    // 1. Calculate token budget and optimize conversation history (protecting user input)
    const tokenReport = calculateTokenBudget({
      messages,
      systemPrompt,
      globalContext,
      parentContext,
      model,
    });

    const safeMessages = optimizeMessagesForContextWindow({
      messages,
      systemPrompt,
      globalContext,
      parentContext,
      model,
    });

    const finalMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...safeMessages]
      : safeMessages;

    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        provider,
        model,
        messages: finalMessages,
        systemPrompt,
        globalContext,
        parentContext,
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
      tokenReport,
    };
  } catch (err) {
    return {
      reply: '',
      error: err.message || 'Network error while contacting AI proxy.',
    };
  }
}
