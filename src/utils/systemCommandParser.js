/**
 * ==============================================================================
 * System Command & Structured Questionnaire Parser
 * ==============================================================================
 * Industrial-grade parser that:
 * 1. Safely strips %%%SYSTEM_CMD%%% blocks and questions from chat bubble text
 * 2. Parses structured questions and options from both %%%SYSTEM_CMD%%% JSON and inline Markdown text
 * 3. Handles unescaped characters, markdown fences, and bullet formatting (* **A:** ...)
 * 4. Ensures clean separation between conversational greeting and the interactive modal
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
 * Extracts structured questions and options from plain markdown text
 * @param {string} text 
 * @returns {{ questions: Array<{ id: string, question: string, options: string[] }>, strippedText: string }}
 */
export function extractStructuredQuestionsFromText(text) {
  if (!text || typeof text !== 'string') return { questions: [], strippedText: text || '' };

  const lines = text.split('\n');
  const questions = [];
  let currentQ = null;
  const nonQuestionLines = [];
  let isInQuestionsBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for question header (e.g., "1. To begin...", "### 1. ...", "Question 1: ...")
    const questionMatch = trimmed.match(/^(?:(?:\d+\.|\?|Q\d+:?|###\s+\d+\.)\s+)(.+)/i);

    if (questionMatch && (trimmed.includes('?') || trimmed.includes(':'))) {
      isInQuestionsBlock = true;
      if (currentQ) {
        questions.push(currentQ);
      }
      currentQ = {
        id: `q${questions.length + 1}`,
        question: questionMatch[1].replace(/^\*+|\*+$/g, '').trim(),
        options: [],
      };
      continue;
    }

    // Check for options: "* **A:** ...", "- A) ...", "A. ...", "* Option ..."
    const optionMatch = trimmed.match(/^(?:[-*•]\s+)?(?:\*\*)?(?:[A-DА-Я0-9][.):]|\([A-D0-9]\))\s*(?:\*\*)?\s*(.+)/i);

    if (currentQ && optionMatch) {
      const cleanOption = optionMatch[1].replace(/^\*+|\*+$/g, '').trim();
      if (cleanOption) {
        currentQ.options.push(cleanOption);
      }
      continue;
    }

    // Trailing instructions like "Please select the options..."
    if (isInQuestionsBlock && trimmed.toLowerCase().includes('select the options')) {
      continue;
    }

    if (!isInQuestionsBlock) {
      nonQuestionLines.push(line);
    }
  }

  if (currentQ) {
    questions.push(currentQ);
  }

  // Ensure every question has 3 fallback options if none were parsed
  const validQuestions = questions.map((q, idx) => ({
    id: q.id || `q${idx + 1}`,
    question: q.question,
    options: q.options.length >= 2 ? q.options.slice(0, 3) : [
      'Recommended Standard Approach',
      'High-Performance / Scalable Setup',
      'Minimal / Quick Delivery Setup',
    ],
  }));

  const strippedText = validQuestions.length > 0
    ? nonQuestionLines.join('\n').trim()
    : text.trim();

  return { questions: validQuestions, strippedText };
}

/**
 * Parses hidden system command block and markdown text from AI output
 * @param {string} text 
 * @returns {{ cleanText: string, commands: Object | null }}
 */
export function parseSystemCommands(text) {
  if (!text || typeof text !== 'string') {
    return { cleanText: text || '', commands: null };
  }

  // 1. Strip trailing %%%SYSTEM_CMD%%% tag if present
  let cleanText = text.replace(/%%%SYSTEM_CMD%%%[\s\S]*$/, '').trim();
  const match = text.match(/%%%SYSTEM_CMD%%%([\s\S]*?)(?:%%%SYSTEM_CMD%%%|$)/);

  let commands = null;
  if (match) {
    commands = safeJsonParse(match[1].trim());
  }

  // 2. If questions were not provided via JSON or if text contains inline questions:
  const { questions: textQuestions, strippedText } = extractStructuredQuestionsFromText(cleanText);

  if (textQuestions.length > 0) {
    cleanText = strippedText;
    if (!commands) {
      commands = {
        confidence_score: 35,
        current_branch: 'Project Architecture & Scope',
        questions: textQuestions,
      };
    } else if (!commands.questions || commands.questions.length === 0) {
      commands.questions = textQuestions;
    }
  }

  return { cleanText, commands };
}
