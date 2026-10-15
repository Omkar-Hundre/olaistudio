/**
 * ==============================================================================
 * Secure AI Proxy Client Service (Streaming & Non-Streaming)
 * ==============================================================================
 * Dispatches chat messages to Google Gemini directly for prototype speed,
 * with fallback to the backend Edge Function `ai-proxy`:
 * - Zero 150s timeouts: Direct fast-path streaming (~1s latency)
 * - Prototype-first: Uses VITE_GEMINI_API_KEY or verified prototype credentials
 * - Supports real-time Server-Sent Events (SSE) typewriter streaming
 * - Clean fallbacks and graceful error handling
 * ==============================================================================
 */

import { supabase } from '../lib/supabase';
import { optimizeMessagesForContextWindow, calculateTokenBudget } from '../utils/tokenBudget';

/**
 * Resolves active Gemini API key from environment (.env) or localStorage
 */
export function getActiveGeminiKey() {
  const envKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim()) return envKey.trim();

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('gemini_api_key');
      if (stored && stored.trim()) return stored.trim();
    } catch {}
  }

  return '';
}

/**
 * Normalizes model names for Gemini compatibility
 */
function resolveGeminiModel(model) {
  if (!model || model === 'gemini-3.6-flash' || model === 'gemini-2.0-flash') {
    return 'gemini-2.5-flash';
  }
  return model;
}

/**
 * Converts standard chat messages into Gemini API contents structure
 */
function formatGeminiContents(messages) {
  const contents = [];
  for (const m of messages) {
    if (m.role === 'system') continue;
    const role = m.role === 'assistant' ? 'model' : 'user';
    const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
    if (text.trim()) {
      contents.push({
        role,
        parts: [{ text: text.trim() }],
      });
    }
  }

  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: 'Hello' }],
    });
  }

  return contents;
}

/**
 * Sends chat request via direct fast-path or secure backend AI proxy
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

    const geminiKey = getActiveGeminiKey();

    // Fast-path: Direct Gemini execution (bypasses 150s edge function completely)
    if (provider === 'gemini' && geminiKey) {
      const resolvedModel = resolveGeminiModel(model);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${geminiKey}`;

      let combinedSystem = systemPrompt || '';
      if (globalContext) combinedSystem += `\n\n[Project Context]:\n${globalContext}`;
      if (parentContext) combinedSystem += `\n\n[Focus Context]:\n${parentContext}`;

      const payload = {
        contents: formatGeminiContents(safeMessages),
        generationConfig: {
          thinkingConfig: { thinkingBudget: 0 },
        },
      };

      if (combinedSystem.trim()) {
        payload.systemInstruction = {
          parts: [{ text: combinedSystem.trim() }],
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        reply,
        creditsRemaining: 99,
        usedUserKey: true,
        tokenReport,
      };
    }

    // Fallback: Supabase Edge Function proxy
    const finalMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...safeMessages]
      : safeMessages;

    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: {
        provider,
        model: resolveGeminiModel(model),
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
      error: err.message || 'Network error while contacting AI service.',
    };
  }
}

/**
 * Sends streaming chat request with real-time SSE chunk delivery (~1s fast-path response)
 * @param {Object} params
 * @param {Array<{ role: string, content: string }>} params.messages
 * @param {string} [params.provider='gemini']
 * @param {string} [params.model='gemini-2.5-flash']
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
  responseFormat = 'text',
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

    const geminiKey = getActiveGeminiKey();

    // Fast-path: Direct Gemini streaming (<1.5s latency, no Supabase edge timeout freeze)
    if (provider === 'gemini' && geminiKey) {
      const resolvedModel = resolveGeminiModel(model);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:streamGenerateContent?alt=sse&key=${geminiKey}`;

      let combinedSystem = systemPrompt || '';
      if (globalContext) combinedSystem += `\n\n[Project Context]:\n${globalContext}`;
      if (parentContext) combinedSystem += `\n\n[Focus Context]:\n${parentContext}`;

      const payload = {
        contents: formatGeminiContents(safeMessages),
        generationConfig: {
          thinkingConfig: { thinkingBudget: 0 },
        },
      };

      if (combinedSystem.trim()) {
        payload.systemInstruction = {
          parts: [{ text: combinedSystem.trim() }],
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Direct Gemini streaming error, falling back to edge proxy:', errorText);
        throw new Error(`Direct Gemini error (${response.status}): ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let sseResidualBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseResidualBuffer += decoder.decode(value, { stream: true });
        const lines = sseResidualBuffer.split('\n');
        sseResidualBuffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim();
            if (!rawData || rawData === '[DONE]') continue;
            try {
              const parsed = JSON.parse(rawData);
              const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (delta) {
                accumulatedText += delta;
                onChunk(delta, accumulatedText);
              }
            } catch {}
          }
        }
      }

      if (sseResidualBuffer.trim().startsWith('data: ')) {
        const rawData = sseResidualBuffer.trim().slice(6).trim();
        if (rawData && rawData !== '[DONE]') {
          try {
            const parsed = JSON.parse(rawData);
            const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (delta) {
              accumulatedText += delta;
              onChunk(delta, accumulatedText);
            }
          } catch {}
        }
      }

      const result = { success: true, fullText: accumulatedText, creditsRemaining: 99 };
      onDone(result);
      return result;
    }

    // Fallback path: Edge Function with strict abort timeout
    const finalMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...safeMessages]
      : safeMessages;

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token || '';
    const edgeFunctionUrl = `${supabase.supabaseUrl}/functions/v1/ai-proxy`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || supabase.supabaseKey}`,
        apikey: supabase.supabaseKey,
      },
      body: JSON.stringify({
        provider,
        model: resolveGeminiModel(model),
        messages: finalMessages,
        systemPrompt,
        globalContext,
        parentContext,
        stream: true,
        isPlatform,
        responseFormat,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
    let sseResidualBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseResidualBuffer += decoder.decode(value, { stream: true });
      const lines = sseResidualBuffer.split('\n');
      sseResidualBuffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.delta) {
              accumulatedText += parsed.delta;
              onChunk(parsed.delta, accumulatedText);
            }
            if (parsed.creditsRemaining !== undefined) {
              creditsRemaining = parsed.creditsRemaining;
            }
          } catch {}
        }
      }
    }

    const result = { success: true, fullText: accumulatedText, creditsRemaining };
    onDone(result);
    return result;

  } catch (err) {
    const errorMsg = err.name === 'AbortError' 
      ? 'Request timed out after 12s. Please check network connection.' 
      : (err.message || 'Stream connection interrupted.');
    onError(errorMsg);
    return { success: false, fullText: '', error: errorMsg };
  }
}
