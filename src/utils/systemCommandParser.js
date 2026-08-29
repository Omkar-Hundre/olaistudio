/**
 * ==============================================================================
 * System Command & Structured Questionnaire Parser
 * ==============================================================================
 * Industrial-grade parser that:
 * 1. Safely strips %%%SYSTEM_CMD%%% blocks so user never sees raw JSON or metadata (Rule 14 & 16)
 * 2. Parses structured questions, alignment confidence, suggested title, and action buttons
 * 3. Handles unescaped characters, markdown fences (```json ... ```), trailing commas, and formatting errors
 * 4. Extracts structured fallback questions from plain text if model omits JSON block
 * ==============================================================================
 */

/**
 * Robust JSON cleanser and extractor
 * @param {string} raw 
 * @returns {Object | null}
 */
function safeJsonParse(raw) {
  if (!raw || typeof raw !== 'string') return null;

  // 1. Clean markdown code fences
  let clean = raw.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  // 2. Try direct parse
  try {
    return JSON.parse(clean);
  } catch {}

  // 3. Clean trailing commas in objects and arrays
  try {
    const fixedTrailingCommas = clean
      .replace(/,\s*([\]}])/g, '$1')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''));
    return JSON.parse(fixedTrailingCommas);
  } catch {}

  // 4. Regex-based field reconstruction
  try {
    const extracted = {};

    const titleMatch = clean.match(/"suggested_title"\s*:\s*"([^"]+)"/);
    if (titleMatch) extracted.suggested_title = titleMatch[1];

    const confMatch = clean.match(/"confidence_score"\s*:\s*(\d+)/);
    if (confMatch) extracted.confidence_score = parseInt(confMatch[1], 10);

    const branchMatch = clean.match(/"current_branch"\s*:\s*"([^"]+)"/);
    if (branchMatch) extracted.current_branch = branchMatch[1];

    const ctaMatch = clean.match(/"cta_label"\s*:\s*"([^"]+)"/);
    if (ctaMatch) extracted.cta_label = ctaMatch[1];

    const readyMatch = clean.match(/"ready_for_vision"\s*:\s*(true|false)/i);
    if (readyMatch) extracted.ready_for_vision = readyMatch[1].toLowerCase() === 'true';

    // Extract questions array block
    const questionsBlockMatch = clean.match(/"questions"\s*:\s*(\[[\s\S]*?\])\s*(?:,|}|\n)/);
    if (questionsBlockMatch) {
      try {
        extracted.questions = JSON.parse(questionsBlockMatch[1]);
      } catch {
        // Individual question item regex extraction
        const qMatches = [...questionsBlockMatch[1].matchAll(/{\s*"id"\s*:\s*"([^"]+)"[\s\S]*?"question"\s*:\s*"([^"]+)"[\s\S]*?"options"\s*:\s*\[([\s\S]*?)\]\s*}/g)];
        if (qMatches.length > 0) {
          extracted.questions = qMatches.map((m, idx) => {
            const options = [...m[3].matchAll(/"([^"]+)"/g)].map(opt => opt[1]);
            return {
              id: m[1] || `q${idx + 1}`,
              question: m[2],
              options: options.length > 0 ? options : ['Option A', 'Option B', 'Option C'],
            };
          });
        }
      }
    }

    if (Object.keys(extracted).length > 0) {
      return extracted;
    }
  } catch {}

  return null;
}

/**
 * Extracts fallback questions from plain text questionnaire if model outputs text questions
 * @param {string} text 
 * @returns {Array<{ id: string, question: string, options: string[] }>}
 */
function extractFallbackQuestionsFromText(text) {
  if (!text || typeof text !== 'string') return [];

  const questions = [];
  // Look for patterns like "1. What is..." or "Question 1: ..."
  const lines = text.split('\n');
  let currentQ = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const qMatch = trimmed.match(/^(?:(?:\d+\.|\?|Q\d+:?)\s+)(.+)/i);
    if (qMatch && trimmed.includes('?')) {
      if (currentQ) questions.push(currentQ);
      currentQ = {
        id: `q${questions.length + 1}`,
        question: qMatch[1].replace(/\*\*/g, '').trim(),
        options: [
          'Recommended Standard Approach',
          'High-Performance / Scalable Setup',
          'Minimal / Quick Delivery Setup',
        ],
      };
    }
  }

  if (currentQ) questions.push(currentQ);
  return questions.slice(0, 3); // Max 3 focused questions
}

/**
 * Parses hidden system command block from AI output text
 * @param {string} text 
 * @returns {{ cleanText: string, commands: Object | null }}
 */
export function parseSystemCommands(text) {
  if (!text || typeof text !== 'string') {
    return { cleanText: text || '', commands: null };
  }

  // 1. Check for %%%SYSTEM_CMD%%% tag
  const match = text.match(/%%%SYSTEM_CMD%%%([\s\S]*?)(?:%%%SYSTEM_CMD%%%|$)/);
  if (!match) {
    // If no hidden command block exists, check if text has questions
    const fallbackQuestions = extractFallbackQuestionsFromText(text);
    return {
      cleanText: text.trim(),
      commands: fallbackQuestions.length > 0 ? { questions: fallbackQuestions, confidence_score: 35 } : null,
    };
  }

  // 2. Strip all %%%SYSTEM_CMD%%% blocks from rendered text
  const cleanText = text.replace(/%%%SYSTEM_CMD%%%[\s\S]*$/, '').trim();
  const rawCommandContent = match[1].trim();

  // 3. Parse commands payload
  const commands = safeJsonParse(rawCommandContent);

  // If questions were not found in JSON but exist in text, fallback gracefully
  if (commands && (!commands.questions || commands.questions.length === 0) && !commands.ready_for_vision && (commands.confidence_score === undefined || commands.confidence_score < 85)) {
    const fallbackQuestions = extractFallbackQuestionsFromText(cleanText);
    if (fallbackQuestions.length > 0) {
      commands.questions = fallbackQuestions;
    }
  }

  return { cleanText, commands };
}
