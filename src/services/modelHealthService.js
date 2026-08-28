/**
 * ==============================================================================
 * Model Health & API Key Verification Service
 * ==============================================================================
 * Performs client-side verification and models discovery for AI providers:
 * - OpenAI (GET https://api.openai.com/v1/models)
 * - Anthropic Claude (GET https://api.anthropic.com/v1/models)
 * - Google Gemini (GET https://generativelanguage.googleapis.com/v1beta/models)
 * ==============================================================================
 */

/**
 * Validates OpenAI API Key and fetches available chat/completion models
 * @param {string} apiKey
 * @returns {Promise<{ isValid: boolean, models: string[], error?: string }>}
 */
export async function verifyOpenAIKey(apiKey) {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) return { isValid: false, models: [] };

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cleanKey}`,
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const message = errJson?.error?.message || `HTTP ${response.status}: Invalid OpenAI Key`;
      return { isValid: false, models: [], error: message };
    }

    const data = await response.json();
    const rawList = Array.isArray(data?.data) ? data.data : [];

    // Filter relevant GPT models
    const filtered = rawList
      .map((m) => m.id)
      .filter((id) => id.includes('gpt') || id.includes('o1') || id.includes('o3') || id.includes('chatgpt'))
      .sort((a, b) => (a > b ? -1 : 1))
      .slice(0, 8); // Top 8 models for compact preview

    return {
      isValid: true,
      models: filtered.length > 0 ? filtered : ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
    };
  } catch (err) {
    return {
      isValid: false,
      models: [],
      error: err.message || 'Network error while connecting to OpenAI.',
    };
  }
}

/**
 * Validates Anthropic Claude API Key and discovers models
 * @param {string} apiKey
 * @returns {Promise<{ isValid: boolean, models: string[], error?: string }>}
 */
export async function verifyClaudeKey(apiKey) {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) return { isValid: false, models: [] };

  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': cleanKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const message = errJson?.error?.message || `HTTP ${response.status}: Invalid Claude Key`;
      return { isValid: false, models: [], error: message };
    }

    const data = await response.json();
    const rawList = Array.isArray(data?.data) ? data.data : [];
    const models = rawList.map((m) => m.id).slice(0, 6);

    return {
      isValid: true,
      models: models.length > 0 ? models : ['claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
    };
  } catch (err) {
    return {
      isValid: false,
      models: [],
      error: err.message || 'Network error while connecting to Anthropic.',
    };
  }
}

/**
 * Validates Google Gemini API Key and fetches active Gemini models
 * @param {string} apiKey
 * @returns {Promise<{ isValid: boolean, models: string[], error?: string }>}
 */
export async function verifyGeminiKey(apiKey) {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) return { isValid: false, models: [] };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const message = errJson?.error?.message || `HTTP ${response.status}: Invalid Gemini API Key`;
      return { isValid: false, models: [], error: message };
    }

    const data = await response.json();
    const rawList = Array.isArray(data?.models) ? data.models : [];

    // Filter generateContent capable Gemini models
    const geminiModels = rawList
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => m.name.replace('models/', ''))
      .filter((name) => name.startsWith('gemini'))
      .slice(0, 8);

    return {
      isValid: true,
      models: geminiModels.length > 0 ? geminiModels : ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    };
  } catch (err) {
    return {
      isValid: false,
      models: [],
      error: err.message || 'Network error while connecting to Google Gemini.',
    };
  }
}
