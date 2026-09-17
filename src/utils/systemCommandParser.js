/**
 * ==============================================================================
 * System Command & Structured Response Parser
 * ==============================================================================
 * High-performance, lightweight parser supporting:
 * 1. Plain Markdown with closing <meta> JSON block:
 *    [Conversational Response in Markdown]
 *    <meta>{ "confidence_score": 35, "questions": [...] }</meta>
 * 2. Pure JSON payloads with conversational "greeting"
 * 3. Legacy %%%SYSTEM_CMD%%% blocks for backwards compatibility
 * ==============================================================================
 */

/**
 * Resilient JSON parser that handles code fences and minor JSON quirks
 * @param {string} raw 
 * @returns {Object | null}
 */
export function safeJsonParse(raw) {
  if (!raw || typeof raw !== 'string') return null;

  const clean = raw.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch {}

  // Remove trailing commas and sanitize control characters
  try {
    const fixed = clean
      .replace(/,\s*([\]}])/g, '$1')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''));
    return JSON.parse(fixed);
  } catch {}

  // Regex field extraction fallback
  try {
    const result = {};
    const extractField = (key, isInt = false, isBool = false) => {
      if (isInt) {
        const m = clean.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`));
        if (m) result[key] = parseInt(m[1], 10);
      } else if (isBool) {
        const m = clean.match(new RegExp(`"${key}"\\s*:\\s*(true|false)`, 'i'));
        if (m) result[key] = m[1].toLowerCase() === 'true';
      } else {
        const m = clean.match(new RegExp(`"${key}"\\s*:\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`));
        if (m) {
          try {
            result[key] = JSON.parse(`"${m[1]}"`);
          } catch {
            result[key] = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          }
        }
      }
    };

    extractField('greeting');
    extractField('suggested_title');
    extractField('confidence_score', true);
    extractField('current_branch');
    extractField('cta_label');
    extractField('ready_for_vision', false, true);
    extractField('plan_markdown');

    if (result.suggested_title) {
      result.suggested_title = cleanSuggestedTitle(result.suggested_title);
    }

    const qsMatch = clean.match(/"questions"\s*:\s*(\[[\s\S]*?\])\s*(?:,|}|\n)/);
    if (qsMatch) {
      try {
        result.questions = JSON.parse(qsMatch[1]);
      } catch {}
    }

    if (Object.keys(result).length > 0) return result;
  } catch {}

  return null;
}

/**
 * Sanitizes project titles, removing runaway repeated n-gram loops and capping length
 * @param {string} title 
 * @returns {string}
 */
export function cleanSuggestedTitle(title) {
  if (!title || typeof title !== 'string') return '';
  const cleaned = title.trim().replace(/^["']|["']$/g, '');
  const words = cleaned.split(/\s+/);
  const deduped = [];
  for (let i = 0; i < words.length; i++) {
    if (i > 0 && words[i].toLowerCase() === words[i - 1].toLowerCase()) continue;
    if (i >= 3 && 
        words[i].toLowerCase() === words[i - 3].toLowerCase() &&
        words[i - 1].toLowerCase() === words[i - 4].toLowerCase() &&
        words[i - 2].toLowerCase() === words[i - 5].toLowerCase()) {
      break;
    }
    deduped.push(words[i]);
    if (deduped.length >= 6) break;
  }
  return deduped.join(' ').slice(0, 45).trim();
}

/**
 * Normalizes question objects to { id, question, options[] } shape
 * @param {Array} rawQuestions
 * @returns {Array<{ id: string, question: string, options: string[] }>}
 */
function normalizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];
  return rawQuestions
    .map((q, idx) => ({
      id: q.id || (q.question_number != null ? `q${q.question_number}` : `q${idx + 1}`),
      question: q.question || q.question_text || '',
      options: Array.isArray(q.options) ? q.options : [],
    }))
    .filter(q => q.question && q.question.length > 3 && q.options.length >= 2);
}

/**
 * Extracts structured questions from plain text or markdown lists
 * @param {string} text 
 * @returns {{ questions: Array<{ id: string, question: string, options: string[] }>, strippedText: string }}
 */
export function extractStructuredQuestionsFromText(text) {
  if (!text || typeof text !== 'string') return { questions: [], strippedText: text || '' };

  const lines = text.split('\n');
  const questions = [];
  let currentQ = null;
  const nonQuestionLines = [];
  let inQBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isQ = /^(?:###\s+)?(?:\*\*)?(?:(?:\d+\.|\d+\)|\?|Question\s+\d+:?))\s*(?:\*\*)?\s*(.+)/i.test(trimmed);

    if (isQ && (trimmed.includes('?') || trimmed.includes(':') || trimmed.includes('**'))) {
      inQBlock = true;
      if (currentQ && currentQ.question) questions.push(currentQ);
      const cleanQ = trimmed
        .replace(/^(?:###\s+)?(?:\*\*)?(?:(?:\d+\.|\d+\)|\?|Question\s+\d+:?))\s*(?:\*\*)?\s*/i, '')
        .replace(/^\*+|\*+$/g, '')
        .trim();
      currentQ = { id: `q${questions.length + 1}`, question: cleanQ, options: [] };
      continue;
    }

    const isOpt = /^(?:[-*•]\s+)?(?:\*\*)?(?:(?:Option|Choice)\s+)?(?:[A-DА-Я0-9]|\d+)[.:)]\s*(?:\*\*)?\s*(.+)/i.test(trimmed) ||
                  /^(?:[-*•]\s+)\*\*(?:(?:Option|Choice)\s+)?[A-DА-Я0-9\d]+:\*\*\s*(.+)/i.test(trimmed);

    if (currentQ && isOpt) {
      const cleanOpt = trimmed
        .replace(/^(?:[-*•]\s+)?(?:\*\*)?(?:(?:Option|Choice)\s+)?[A-DА-Я0-9\d]+[.:)]\s*(?:\*\*)?\s*/i, '')
        .replace(/^(?:[-*•]\s+)\*\*(?:(?:Option|Choice)\s+)?[A-DА-Я0-9\d]+:\*\*\s*/i, '')
        .replace(/^\*+|\*+$/g, '')
        .trim();
      if (cleanOpt) currentQ.options.push(cleanOpt);
      continue;
    }

    if (currentQ && currentQ.options.length > 0 && trimmed && !trimmed.startsWith('---') && !trimmed.toLowerCase().includes('select') && !trimmed.toLowerCase().includes('choose')) {
      const lastIdx = currentQ.options.length - 1;
      currentQ.options[lastIdx] = `${currentQ.options[lastIdx]} ${trimmed}`.trim();
      continue;
    }

    if (!inQBlock) nonQuestionLines.push(line);
  }

  if (currentQ && currentQ.question) questions.push(currentQ);

  const validQuestions = questions.filter(q => q.question && q.question.length > 5).map((q, idx) => ({
    id: q.id || `q${idx + 1}`,
    question: q.question,
    options: q.options.length >= 2 ? q.options.slice(0, 3) : [
      'Recommended Standard Approach',
      'High-Performance / Scalable Setup',
      'Minimal / Quick Delivery Setup',
    ],
  }));

  return {
    questions: validQuestions,
    strippedText: validQuestions.length > 0 ? nonQuestionLines.join('\n').trim() : text.trim(),
  };
}

/**
 * Parses conversational text and structured alignment commands
 * @param {string} text 
 * @returns {{ cleanText: string, commands: Object | null }}
 */
export function parseSystemCommands(text) {
  if (!text || typeof text !== 'string') {
    return { cleanText: text || '', commands: null };
  }

  const trimmed = text.trim();

  // 1. Primary: Plain Markdown ending with a <meta>...</meta> block
  const metaMatch = text.match(/<meta>([\s\S]*?)<\/meta>/i);
  if (metaMatch) {
    const cleanText = text.replace(/<meta>[\s\S]*?<\/meta>/i, '').trim();
    const commands = safeJsonParse(metaMatch[1]);
    if (commands) {
      if (commands.questions) commands.questions = normalizeQuestions(commands.questions);
      if (commands.suggested_title) commands.suggested_title = cleanSuggestedTitle(commands.suggested_title);
      return { cleanText, commands };
    }
  }

  // 2. Legacy %%%SYSTEM_CMD%%% tag
  const cmdMatch = text.match(/%%%SYSTEM_CMD%%%([\s\S]*?)(?:%%%SYSTEM_CMD%%%|$)/);
  if (cmdMatch) {
    const cleanText = text.replace(/%%%SYSTEM_CMD%%%[\s\S]*$/, '').trim();
    const commands = safeJsonParse(cmdMatch[1]);
    if (commands) {
      if (commands.questions) commands.questions = normalizeQuestions(commands.questions);
      if (commands.suggested_title) commands.suggested_title = cleanSuggestedTitle(commands.suggested_title);
      return { cleanText, commands };
    }
  }

  // 3. Pure JSON or fenced JSON response (from JSON-enforcing models or stored database sessions)
  if (trimmed.startsWith('{') || trimmed.startsWith('```json') || trimmed.startsWith('```')) {
    const parsedJson = safeJsonParse(trimmed);
    if (parsedJson && typeof parsedJson === 'object') {
      if (parsedJson.greeting || parsedJson.questions || parsedJson.plan_markdown || parsedJson.confidence_score !== undefined) {
        if (parsedJson.questions) {
          parsedJson.questions = normalizeQuestions(parsedJson.questions);
        }
        if (parsedJson.suggested_title) {
          parsedJson.suggested_title = cleanSuggestedTitle(parsedJson.suggested_title);
        }
        const cleanText = parsedJson.plan_markdown
          ? `${parsedJson.greeting ? `${parsedJson.greeting}\n\n---\n\n` : ''}${parsedJson.plan_markdown}`
          : (parsedJson.greeting || 'Here are the next steps:');
        return {
          cleanText,
          commands: parsedJson,
        };
      }

      // Foreign arbitrary JSON object fallback
      const cleanTitle = parsedJson.pageTitle || parsedJson.title || parsedJson.name || 'Project Architecture';
      let planMarkdown = `# ${cleanTitle}\n\n`;
      if (Array.isArray(parsedJson.sections)) {
        parsedJson.sections.forEach((s) => {
          planMarkdown += `## ${s.type || s.headline || 'Section'}\n${s.headline ? `**Headline:** ${s.headline}\n` : ''}`;
          if (Array.isArray(s.features)) {
            s.features.forEach((f) => {
              planMarkdown += `- **${f.title || 'Feature'}:** ${f.description || ''}\n`;
            });
          }
          planMarkdown += '\n';
        });
      } else {
        planMarkdown += Object.entries(parsedJson)
          .map(([k, v]) => `## ${k}\n${typeof v === 'object' ? JSON.stringify(v, null, 2) : v}`)
          .join('\n\n');
      }

      return {
        cleanText: `I've analyzed your requirements and generated the project architecture for "${cleanTitle}".`,
        commands: {
          greeting: `I've analyzed your requirements and generated the project architecture for "${cleanTitle}".`,
          suggested_title: cleanTitle,
          confidence_score: 95,
          current_branch: 'Master Architecture & Scope',
          ready_for_vision: true,
          cta_label: 'Cook',
          questions: [],
          plan_markdown: planMarkdown.trim(),
        },
      };
    }
  }

  // 4. Inline question extraction fallback
  const { questions: textQuestions, strippedText } = extractStructuredQuestionsFromText(trimmed);
  if (textQuestions.length > 0) {
    return {
      cleanText: strippedText,
      commands: {
        confidence_score: 35,
        current_branch: 'Project Scope & Strategy',
        questions: textQuestions,
      },
    };
  }

  return { cleanText: trimmed, commands: null };
}
