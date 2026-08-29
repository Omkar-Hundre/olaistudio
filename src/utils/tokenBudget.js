/**
 * ==============================================================================
 * Token Budget Calculator & Context Window Guard
 * ==============================================================================
 * Strictly enforces Rule 9 of Olai Project Rules:
 * - Calculates total token count across system prompt, vision, parent, history, and user input.
 * - Enforces context limits based on model capabilities (e.g., Gemini 1M, GPT-4o 128k, Claude 200k).
 * - User prompt is 100% PROTECTED and NEVER truncated under any circumstance.
 * - Auto-summarizes older conversation turns if payload exceeds 80% threshold or 50k tokens.
 * ==============================================================================
 */

// Model Context Window Maximums (in Tokens)
export const MODEL_CONTEXT_LIMITS = {
  'gemini-2.5-flash': 1048576,
  'gemini-2.5-pro': 2097152,
  'gemini-3.7-flash': 1048576,
  'gemini-2.0-flash': 1048576,
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'o3-mini': 200000,
  'claude-3-5-sonnet': 200000,
  'claude-3-7-sonnet': 200000,
  'default': 128000,
};

// Token Budget Allocations per Rule 9
export const TOKEN_BUDGET_LIMITS = {
  SYSTEM_PROMPT_MAX: 2000,
  GLOBAL_CONTEXT_MAX: 4000,
  PARENT_CONTEXT_MAX: 2000,
  CONVERSATION_HISTORY_MAX: 50000,
  SAFETY_MARGIN_PERCENT: 0.80, // 80% ceiling triggers auto-compression
};

/**
 * Estimates token count based on standard ~4 characters per token heuristic
 * with a 15% safety buffer for special tokens and multi-byte characters.
 * @param {string} text 
 * @returns {number} Estimated tokens
 */
export function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  return Math.ceil((text.length / 4) * 1.15);
}

/**
 * Calculates token breakdown for a full payload request
 * @param {Object} params
 * @param {Array<{ role: string, content: string }>} params.messages
 * @param {string} [params.systemPrompt='']
 * @param {string} [params.globalContext='']
 * @param {string} [params.parentContext='']
 * @param {string} [params.model='gemini-2.5-flash']
 * @returns {Object} Token analysis report
 */
export function calculateTokenBudget({
  messages = [],
  systemPrompt = '',
  globalContext = '',
  parentContext = '',
  model = 'gemini-2.5-flash',
}) {
  const modelLimit = MODEL_CONTEXT_LIMITS[model] || MODEL_CONTEXT_LIMITS['default'];
  const maxSafeTokens = Math.floor(modelLimit * TOKEN_BUDGET_LIMITS.SAFETY_MARGIN_PERCENT);

  const systemTokens = estimateTokens(systemPrompt);
  const globalTokens = estimateTokens(globalContext);
  const parentTokens = estimateTokens(parentContext);

  // User's latest prompt is the last message with role 'user'
  let userPromptTokens = 0;
  let historyTokens = 0;

  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'user') {
      userPromptTokens = estimateTokens(lastMsg.content);
    }

    // Previous history turns (excluding the latest message)
    const priorMessages = messages.slice(0, messages.length - 1);
    historyTokens = priorMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  }

  const totalTokens = systemTokens + globalTokens + parentTokens + historyTokens + userPromptTokens;
  const isOverBudget = totalTokens > maxSafeTokens || historyTokens > TOKEN_BUDGET_LIMITS.CONVERSATION_HISTORY_MAX;

  return {
    model,
    modelLimit,
    maxSafeTokens,
    totalTokens,
    isOverBudget,
    breakdown: {
      systemPrompt: systemTokens,
      globalContext: globalTokens,
      parentContext: parentTokens,
      conversationHistory: historyTokens,
      userPrompt: userPromptTokens,
    },
  };
}

/**
 * Optimizes conversation history while strictly protecting the user's latest prompt.
 * If history is oversized, summarizes older turns into a compressed digest.
 * @param {Object} params
 * @param {Array<{ role: string, content: string }>} params.messages
 * @param {string} [params.systemPrompt='']
 * @param {string} [params.globalContext='']
 * @param {string} [params.parentContext='']
 * @param {string} [params.model='gemini-2.5-flash']
 * @returns {Array<{ role: string, content: string }>} Optimized messages array
 */
export function optimizeMessagesForContextWindow({
  messages = [],
  systemPrompt = '',
  globalContext = '',
  parentContext = '',
  model = 'gemini-2.5-flash',
}) {
  if (!messages || messages.length <= 4) {
    return messages;
  }

  const budget = calculateTokenBudget({
    messages,
    systemPrompt,
    globalContext,
    parentContext,
    model,
  });

  if (!budget.isOverBudget) {
    return messages;
  }

  console.warn(`[TokenBudget] Payload (${budget.totalTokens} tokens) exceeds safety budget (${budget.maxSafeTokens} tokens). Compressing older turns.`);

  // Always preserve the latest 4 messages (including the latest user prompt)
  const recentMessages = messages.slice(-4);
  const olderMessages = messages.slice(0, -4);

  // Compress older messages into a structured digest
  const summaryParts = olderMessages.map((m) => {
    const roleLabel = m.role === 'user' ? 'User' : 'Assistant';
    const textSnippet = typeof m.content === 'string' 
      ? (m.content.length > 200 ? `${m.content.slice(0, 200)}...` : m.content)
      : '[Complex Payload]';
    return `${roleLabel}: ${textSnippet}`;
  });

  const summaryMessage = {
    role: 'user',
    content: `[Previous Conversation Digest (${olderMessages.length} turns)]\n${summaryParts.join('\n')}`,
  };

  const summaryAck = {
    role: 'assistant',
    content: 'Acknowledged previous context summary. Ready for current user prompt.',
  };

  return [summaryMessage, summaryAck, ...recentMessages];
}
