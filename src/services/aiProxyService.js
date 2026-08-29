/**
 * ==============================================================================
 * Secure AI Proxy Client Service (Streaming & Non-Streaming)
 * ==============================================================================
 * Dispatches chat messages to the backend Edge Function `ai-proxy`:
 * - Protects platform credentials on server
 * - Enforces Token Budget Calculator (Rule 9)
 * - Supports real-time Server-Sent Events (SSE) typewriter streaming
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
 * @returns {Promise<{ reply: string, creditsRemaining?: number, usedUserKey?: boolean, tokenReport?: Object, error?: string }>}
 */
export async function sendProxyChatMessage({
  messages,
  provider = 'gemini',
  model = 'gemini-2.5-flash',
  systemPrompt = '',
  globalContext = '',
  parentContext = '',
  isPlatform = true,
}) {
  try {
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
        stream: false,
        isPlatform,
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

/**
 * Sends streaming chat request via secure backend AI proxy with real-time SSE chunk delivery
 * @param {Object} params
 * @param {Array<{ role: string, content: string }>} params.messages
 * @param {string} [params.provider='gemini']
 * @param {string} [params.model='gemini-2.0-flash']
 * @param {string} [params.systemPrompt='']
 * @param {string} [params.globalContext='']
 * @param {string} [params.parentContext='']
 * @param {boolean} [params.isPlatform=true]
 * @param {Function} params.onChunk - Callback invoked with `(deltaText, accumulatedFullText)`
 * @param {Function} [params.onDone] - Callback invoked when streaming completes `({ fullText, creditsRemaining })`
 * @param {Function} [params.onError] - Callback invoked on failure `(errorMessage)`
 * @returns {Promise<{ success: boolean, fullText: string, creditsRemaining?: number }>}
 */
export async function sendStreamingProxyChatMessage({
  messages,
  provider = 'gemini',
  model = 'gemini-2.5-flash',
  systemPrompt = '',
  globalContext = '',
  parentContext = '',
  isPlatform = true,
  onChunk = () => {},
  onDone = () => {},
  onError = () => {},
}) {
  try {
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

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token || '';

    const edgeFunctionUrl = `${supabase.supabaseUrl}/functions/v1/ai-proxy`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || supabase.supabaseKey}`,
        apikey: supabase.supabaseKey,
      },
      body: JSON.stringify({
        provider,
        model,
        messages: finalMessages,
        systemPrompt,
        globalContext,
        parentContext,
        stream: true,
        isPlatform,
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg = errorJson?.error || `HTTP ${response.status}: Failed to initialize stream.`;
      onError(errorMsg);
      return { success: false, fullText: '', error: errorMsg };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    let creditsRemaining = undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const rawChunk = decoder.decode(value, { stream: true });
      const lines = rawChunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.replace('data: ', '').trim();
          if (payload === '[DONE]') {
            continue;
          }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.delta) {
              accumulatedText += parsed.delta;
              onChunk(parsed.delta, accumulatedText);
            }
            if (parsed.creditsRemaining !== undefined) {
              creditsRemaining = parsed.creditsRemaining;
            }
          } catch {
            // Partial JSON buffer
          }
        }
      }
    }

    const result = { success: true, fullText: accumulatedText, creditsRemaining };
    onDone(result);
    return result;

  } catch (err) {
    const errorMsg = err.message || 'Stream connection interrupted.';
    onError(errorMsg);
    return { success: false, fullText: '', error: errorMsg };
  }
}
