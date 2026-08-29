/**
 * ==============================================================================
 * System Command & Structured Response Parser
 * ==============================================================================
 * High-performance parser that:
 * 1. Supports deterministic Pure JSON payloads from AI modes
 * 2. Rapidly extracts markdown questions and options (Option 1, Choice A, A:, 1., etc.)
 * 3. Strips question lists from completed assistant chat bubbles so the modal renders cleanly
 * ==============================================================================
 */

/**
 * Robust JSON cleanser and extractor
 * @param {string} raw 
 * @returns {Object | null}
 */
export function safeJsonParse(raw) {
  if (!raw || typeof raw !== 'string') return null;

  // 1. Clean markdown code fences and whitespace
  let clean = raw.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  // 2. Direct JSON parse
  try {
    return JSON.parse(clean);
  } catch {}

  // 3. Remove trailing commas before closing braces/brackets and fix unescaped newlines in JSON strings
  try {
    const fixedTrailingCommas = clean
      .replace(/,\s*([\]}])/g, '$1')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''));
    return JSON.parse(fixedTrailingCommas);
  } catch {}

  // 4. Try escaping unescaped newlines inside JSON string literals
  try {
    const fixedNewlines = clean.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/gs, (match) => {
      return match.replace(/\r?\n/g, '\\n').replace(/\t/g, '\\t');
    });
    return JSON.parse(fixedNewlines);
  } catch {}

  // 5. Regex extraction fallback
  try {
    const extracted = {};

    const greetingMatch = clean.match(/"greeting"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
    if (greetingMatch) {
      try {
        extracted.greeting = JSON.parse(`"${greetingMatch[1]}"`);
      } catch {
        extracted.greeting = greetingMatch[1];
      }
    }

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

    // Resilient plan_markdown extractor (handles multi-line, escaped/unescaped)
    const planMatch = clean.match(/"plan_markdown"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"[a-zA-Z_]+"|\s*})/);
    if (planMatch) {
      try {
        extracted.plan_markdown = JSON.parse(`"${planMatch[1].replace(/\r?\n/g, '\\n')}"`);
      } catch {
        extracted.plan_markdown = planMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
    } else {
      // Fallback for plan_markdown if standard match misses
      const altPlanMatch = clean.match(/"plan_markdown"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
      if (altPlanMatch) {
        try {
          extracted.plan_markdown = JSON.parse(`"${altPlanMatch[1]}"`);
        } catch {
          extracted.plan_markdown = altPlanMatch[1];
        }
      }
    }

    const questionsBlockMatch = clean.match(/"questions"\s*:\s*(\[[\s\S]*?\])\s*(?:,|}|\n)/);
    if (questionsBlockMatch) {
      try {
        const rawQs = JSON.parse(questionsBlockMatch[1]);
        // Normalize any variant key names (question_text, question_number) to standard shape
        extracted.questions = rawQs.map((q, idx) => ({
          id: q.id || (q.question_number != null ? `q${q.question_number}` : `q${idx + 1}`),
          question: q.question || q.question_text || '',
          options: Array.isArray(q.options) ? q.options : [],
        }));
      } catch {
        // plain regex fallback
      }
    }

    if (Object.keys(extracted).length > 0) {
      return extracted;
    }
  } catch {}

  return null;
}

/**
 * Extracts structured questions and options from plain text or markdown lists
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

    // Check for question header:
    // e.g. "1. **When lots of people...**", "1. To begin...", "### 1. ...", "Question 1: ..."
    const isQuestionLine = /^(?:###\s+)?(?:\*\*)?(?:(?:\d+\.|\d+\)|\?|Question\s+\d+:?))\s*(?:\*\*)?\s*(.+)/i.test(trimmed);

    if (isQuestionLine && (trimmed.includes('?') || trimmed.includes(':') || trimmed.includes('**'))) {
      isInQuestionsBlock = true;
      if (currentQ && currentQ.question) {
        questions.push(currentQ);
      }
      
      const cleanQuestionTitle = trimmed
        .replace(/^(?:###\s+)?(?:\*\*)?(?:(?:\d+\.|\d+\)|\?|Question\s+\d+:?))\s*(?:\*\*)?\s*/i, '')
        .replace(/^\*+|\*+$/g, '')
        .trim();

      currentQ = {
        id: `q${questions.length + 1}`,
        question: cleanQuestionTitle,
        options: [],
      };
      continue;
    }

    // Check for option line:
    // e.g. "* **Option 1:** ...", "* **Choice A:** ...", "* **A:** ...", "- A) ...", "A. ..."
    const isOptionLine = /^(?:[-*•]\s+)?(?:\*\*)?(?:(?:Option|Choice)\s+)?(?:[A-DА-Я0-9]|\d+)[.:)]\s*(?:\*\*)?\s*(.+)/i.test(trimmed) ||
                         /^(?:[-*•]\s+)\*\*(?:(?:Option|Choice)\s+)?[A-DА-Я0-9\d]+:\*\*\s*(.+)/i.test(trimmed);

    if (currentQ && isOptionLine) {
      const cleanOption = trimmed
        .replace(/^(?:[-*•]\s+)?(?:\*\*)?(?:(?:Option|Choice)\s+)?[A-DА-Я0-9\d]+[.:)]\s*(?:\*\*)?\s*/i, '')
        .replace(/^(?:[-*•]\s+)\*\*(?:(?:Option|Choice)\s+)?[A-DА-Я0-9\d]+:\*\*\s*/i, '')
        .replace(/^\*+|\*+$/g, '')
        .trim();

      if (cleanOption) {
        currentQ.options.push(cleanOption);
      }
      continue;
    }

    // Continuation line for a previous option (if indented or wrapping)
    if (currentQ && currentQ.options.length > 0 && trimmed && !trimmed.startsWith('---') && !trimmed.startsWith('***') && !trimmed.toLowerCase().includes('please choose') && !trimmed.toLowerCase().includes('select')) {
      const lastIdx = currentQ.options.length - 1;
      currentQ.options[lastIdx] = `${currentQ.options[lastIdx]} ${trimmed}`.trim();
      continue;
    }

    // Trailing instructions like "Please choose the option..."
    if (isInQuestionsBlock && (trimmed.toLowerCase().includes('select') || trimmed.toLowerCase().includes('choose'))) {
      continue;
    }

    if (!isInQuestionsBlock) {
      nonQuestionLines.push(line);
    }
  }

  if (currentQ && currentQ.question) {
    questions.push(currentQ);
  }

  // Ensure every question has valid options
  const validQuestions = questions.filter(q => q.question && q.question.length > 5).map((q, idx) => ({
    id: q.id || `q${idx + 1}`,
    question: q.question,
    options: q.options.length >= 2 ? q.options.slice(0, 3) : [
      'Recommended Standard Approach',
      'High-Performance / Scalable Setup',
      'Minimal / Quick Delivery Setup',
    ],
  }));

  const strippedText = validQuestions.length > 0
    ? nonQuestionLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
    : text.trim();

  return { questions: validQuestions, strippedText };
}

/**
 * Normalizes AI questions into standard { id, question, options[] } shape
 * regardless of what keys the model used (question_text, question_number, etc.)
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
 * Helper to humanize object keys: camelCase / snake_case -> Title Case
 * @param {string} key 
 * @returns {string}
 */
function humanizeKey(key) {
  if (!key || typeof key !== 'string') return '';
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/**
 * Universal JSON to Markdown Converter:
 * Recursively and generically converts ANY arbitrary JSON structure (regardless of domain, 
 * problem type, industry, or format) into a beautifully formatted, hierarchical Markdown document.
 * @param {Object | Array} data
 * @param {number} [depth=1]
 * @returns {string}
 */
export function convertArbitraryJsonToMarkdown(data, depth = 1) {
  if (data === null || data === undefined) return '';
  if (typeof data !== 'object') return String(data);

  if (Array.isArray(data)) {
    return data
      .map((item, idx) => {
        if (typeof item !== 'object' || item === null) {
          return `- ${item}`;
        }
        const itemTitle = item.title || item.name || item.type || item.heading || item.label || `Item ${idx + 1}`;
        const remainingProps = Object.entries(item).filter(([k]) => !['title', 'name', 'type', 'heading', 'label'].includes(k));
        
        let out = `### ${itemTitle}\n`;
        for (const [k, v] of remainingProps) {
          if (typeof v === 'object' && v !== null) {
            out += `**${humanizeKey(k)}:**\n${convertArbitraryJsonToMarkdown(v, depth + 1)}\n`;
          } else {
            out += `- **${humanizeKey(k)}:** ${v}\n`;
          }
        }
        return out;
      })
      .join('\n');
  }

  // Object handling
  let markdown = '';
  const entries = Object.entries(data);

  for (const [key, value] of entries) {
    const formattedKey = humanizeKey(key);
    if (value === null || value === undefined) continue;

    if (typeof value !== 'object') {
      markdown += `- **${formattedKey}:** ${value}\n`;
    } else if (Array.isArray(value)) {
      markdown += `\n## ${formattedKey}\n\n${convertArbitraryJsonToMarkdown(value, depth + 1)}\n`;
    } else {
      markdown += `\n## ${formattedKey}\n\n${convertArbitraryJsonToMarkdown(value, depth + 1)}\n`;
    }
  }

  return markdown.trim();
}

/**
 * Parses structured JSON response or system commands from AI output
 * @param {string} text 
 * @returns {{ cleanText: string, commands: Object | null }}
 */
export function parseSystemCommands(text) {
  if (!text || typeof text !== 'string') {
    return { cleanText: text || '', commands: null };
  }

  const trimmed = text.trim();

  // 1. Check if the entire response is a pure JSON payload (or markdown-fenced ```json { ... } ```)
  if (trimmed.startsWith('{') || trimmed.startsWith('```json') || trimmed.startsWith('```')) {
    const parsedJson = safeJsonParse(trimmed);
    if (parsedJson && typeof parsedJson === 'object') {
      // Case A: Standard Mother Agent JSON schema
      if (parsedJson.greeting || parsedJson.questions || parsedJson.plan_markdown || parsedJson.confidence_score !== undefined) {
        if (parsedJson.questions) {
          parsedJson.questions = normalizeQuestions(parsedJson.questions);
        }
        const cleanGreeting = parsedJson.greeting || parsedJson.plan_markdown || 'Here are the next steps for your project:';
        return {
          cleanText: cleanGreeting,
          commands: parsedJson,
        };
      }

      // Case B: Truly Universal Arbitrary JSON Handling (No hardcoded domain/problem keys!)
      // Handles any problem: Web apps, mobile, CLI, ML pipelines, e-commerce, cloud architecture, etc.
      const candidateTitle = parsedJson.title || parsedJson.pageTitle || parsedJson.name || parsedJson.project || parsedJson.companyName || parsedJson.appName || parsedJson.serviceName || Object.keys(parsedJson)[0] || 'Project Architecture';
      const cleanTitle = typeof candidateTitle === 'string' ? candidateTitle.slice(0, 48) : 'Project Architecture';
      const universalPlan = convertArbitraryJsonToMarkdown(parsedJson);

      const defaultQuestions = [
        {
          id: 'q1',
          question: `Which core framework & styling setup should we use for ${cleanTitle}?`,
          options: [
            'Next.js 15 (App Router) + Tailwind CSS + Lucide Icons (Production Standard)',
            'Vite + React 19 + Vanilla CSS (Ultra Lightweight & Fast)',
            'Astro / Svelte for maximum SEO & static performance',
          ],
        },
        {
          id: 'q2',
          question: `What backend data & conversion workflow should be integrated?`,
          options: [
            'Supabase Database & Edge Functions (Realtime)',
            'Stripe Checkout & Email Capture Webhooks for instant conversion',
            'Lightweight Headless API / REST endpoints',
          ],
        },
      ];

      const normalizedCommand = {
        greeting: `I've structured the preliminary architecture for "${cleanTitle}". Please confirm these key technical choices to finalize the plan:`,
        suggested_title: cleanTitle,
        confidence_score: 50,
        current_branch: 'Architecture & Technical Stack',
        ready_for_vision: false,
        cta_label: 'Cook',
        questions: defaultQuestions,
        plan_markdown: `# ${cleanTitle}\n\n${universalPlan}`,
      };

      return {
        cleanText: normalizedCommand.greeting,
        commands: normalizedCommand,
      };
    }
  }

  // 2. Check for hidden %%%SYSTEM_CMD%%% tag
  let cleanText = text.replace(/%%%SYSTEM_CMD%%%[\s\S]*$/, '').trim();
  const match = text.match(/%%%SYSTEM_CMD%%%([\s\S]*?)(?:%%%SYSTEM_CMD%%%|$)/);

  let commands = null;
  if (match) {
    commands = safeJsonParse(match[1].trim());
  }

  // 3. Fallback: extract questions from text if inline markdown questions are present
  const { questions: textQuestions, strippedText } = extractStructuredQuestionsFromText(cleanText);

  if (textQuestions.length > 0) {
    cleanText = strippedText;
    if (!commands) {
      commands = {
        confidence_score: 35,
        current_branch: 'Project Scope & Setup',
        questions: textQuestions,
      };
    } else if (!commands.questions || commands.questions.length === 0) {
      commands.questions = textQuestions;
    }
  }

  return { cleanText, commands };
}
