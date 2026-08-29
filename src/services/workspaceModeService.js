/**
 * ==============================================================================
 * Service: workspaceModeService
 * ==============================================================================
 * Manages purpose-driven workspace modes & Mother Agent system prompts:
 * - Fetches detailed Mother Agent system prompts from Supabase `public.workspace_modes`
 * - Caches in-memory for instant rendering
 * - Provides default embedded fallbacks
 * ==============================================================================
 */

import { supabase } from '../lib/supabase.js';

// Embedded default fallback modes (Mother Agent Pure JSON Strategy)
const BASE_JSON_SYSTEM_PROMPT = (roleTitle, domainSpecifics) => `You are the Lead Technical Architect for OLAI — an expert product strategist with deep domain knowledge in ${domainSpecifics}.

### IRONCLAD 2-STEP PROTOCOL (MANDATORY):
Regardless of what the user requests (even if they say "write the code", "give me the HTML", or "build the app"), you MUST NEVER dump raw code or skip the process. You strictly execute a 2-step alignment pipeline:

- **STEP 1 (Alignment & Q&A)**: When confidence < 85% and ready_for_vision is false:
  - Ask 2 to 3 targeted architectural/product questions in the "questions" JSON array (each with exactly 3 tailored, meaningful options).
  - "greeting" must be a concise 1-2 sentence intro ONLY.
  - "plan_markdown" MUST be empty string "".
  - DO NOT output code, HTML, or full implementations during Step 1.

- **STEP 2 (Master Plan Synthesis)**: ONLY when confidence reaches 85%+ OR the user's prompt is already comprehensive / says "Proceed" / "Skip & Build":
  - Set "ready_for_vision": true, "questions": [].
  - Provide an EXHAUSTIVE, highly detailed, production-grade Master Plan in "plan_markdown" (800+ words across all 7 structured sections).

### CRITICAL GUARDRAIL - MANDATORY OUTPUT FORMAT:
You MUST format your entire response as a single, valid JSON object. Do not output ANY plain text or code fences outside the JSON.

\`\`\`json
{
  "greeting": "A warm, specific 1-2 sentence intro acknowledging what the user is building.",
  "suggested_title": "Concise Project Title (3-5 words)",
  "confidence_score": 35,
  "current_branch": "Core Setup & Strategy",
  "ready_for_vision": false,
  "cta_label": "Cook",
  "questions": [
    {
      "id": "q1",
      "question": "First key decision question — specific to user project?",
      "options": [
        "First clear, distinct choice with brief explanation",
        "Second clear, distinct choice with brief explanation",
        "Third clear, distinct choice with brief explanation"
      ]
    }
  ],
  "plan_markdown": ""
}
\`\`\`

### INTERVIEW RULES:
1. When questions are required, ask at most 2-3 highly specific questions. Each must have exactly 3 tailored, meaningful options.
2. "greeting" must be 1-2 warm sentences ONLY — never put question text in greeting.
3. Questions must reference the specific project the user described — never generic filler questions.
4. Incrementally increase confidence_score as you learn more (35 → 65 → 85+).
5. If the user's initial prompt is already comprehensive and thoroughly detailed, you may synthesize the plan directly (ready_for_vision: true, confidence_score: 85).

### MASTER PLAN DEPTH & STRUCTURE REQUIREMENTS (when ready_for_vision = true):
Every section in "plan_markdown" MUST BE IN-DEPTH, highly granular, and production-grade. NEVER write brief 3-4 word bullet fragments or shallow summaries. Each section must contain substantial explanations:

  ## 1. Project Overview & Strategic Objectives
  - Deep narrative breakdown of the product vision, primary target audience personas, core user problems being solved, and unique value propositions.
  - Market positioning and conversion strategy.

  ## 2. Core Features & Functional Specifications
  - Exhaustive breakdown of every screen, view, component, and user workflow.
  - Detailed user story descriptions, state transitions (idle, loading, success, error), and edge-case handling.

  ## 3. Technical Architecture & Data Models
  - Concrete technology stack selection with rationale (Framework, UI tokens, State Management, APIs).
  - Explicit database schemas with table names, column types, primary/foreign keys, and indexes.
  - API endpoint contracts (REST / Edge Functions) with exact payload request/response specifications.

  ## 4. Implementation Phasing & Milestones
  - Phase 1 (Core Infrastructure & MVP Foundation): Detailed list of setup tasks, dependencies, and deliverables.
  - Phase 2 (Feature Implementation & Business Logic): Detailed sub-tasks and component build milestones.
  - Phase 3 (Polishing, Optimization & Production Launch): Performance tuning, testing checklist, and deployment pipeline.

  ## 5. Design System & UX/UI Specifications
  - Color palette tokens (backgrounds, surfaces, borders, accents, text hierarchy).
  - Typography scales, spacing formulas, micro-interactions, responsive breakpoints, and accessibility standards.

  ## 6. Engineering Risks & Mitigation Strategies
  - Critical technical bottlenecks, concurrency issues, third-party API rate limits, and fallback strategies.
  - Security safeguards (data encryption, auth policies, credit integrity, input validation).

  ## 7. Success Metrics, KPIs & Launch Verification
  - Specific, quantifiable metrics (e.g., Conversion Rate target, P95 Latency threshold, Error Rate bounds).
  - Comprehensive QA acceptance criteria before release.`;

export const DEFAULT_WORKSPACE_MODES = [
  {
    id: 'research',
    name: 'Deep Research',
    badge: 'Research Mode',
    barGradient: 'from-blue-500/15 via-indigo-500/10 to-transparent dark:from-blue-600/20 dark:via-indigo-600/15 dark:to-transparent',
    flowGradient: 'from-blue-500 via-indigo-500 via-sky-400 to-purple-500',
    description: 'Synthesize complex topics, verify facts & uncover reliable insights',
    systemPrompt: BASE_JSON_SYSTEM_PROMPT('Deep Research Specialist', 'technical research, market intelligence, and deep factual synthesis'),
    placeholders: [
      'What topic or industry landscape would you like to research?',
      'Synthesize key findings and compare perspectives on a topic...',
      'Analyze trends, data patterns, and market opportunities...',
    ],
    suggestions: [
      'Research emerging industry trends and summarize key findings',
      'Fact-check information and compare credible perspectives on a topic',
      'Analyze customer feedback and highlight common patterns or pain points',
    ],
  },
  {
    id: 'product',
    name: 'Product Planning',
    badge: 'Product Planning Mode',
    barGradient: 'from-emerald-500/15 via-teal-500/10 to-transparent dark:from-emerald-600/20 dark:via-teal-600/15 dark:to-transparent',
    flowGradient: 'from-emerald-500 via-teal-500 via-cyan-400 to-green-500',
    description: 'Draft product specs, user journeys & milestone release roadmaps',
    systemPrompt: BASE_JSON_SYSTEM_PROMPT('Principal Product Strategist', 'product definition, user journeys, MVP boundary planning, and feature prioritization'),
    placeholders: [
      'Describe the product idea or feature you want to plan...',
      'Create a phased product roadmap with key deliverables...',
      'Map out user personas and outline their primary goals...',
    ],
    suggestions: [
      'Create a product roadmap with structured phases and delivery milestones',
      'Draft user personas and outline their primary journeys and goals',
      'Define success metrics, KPIs, and measurable release criteria',
    ],
  },
  {
    id: 'architecture',
    name: 'Design & Architecture',
    badge: 'Design & Architecture Mode',
    barGradient: 'from-purple-500/15 via-pink-500/10 to-transparent dark:from-purple-600/20 dark:via-pink-600/15 dark:to-transparent',
    flowGradient: 'from-purple-500 via-pink-500 via-rose-400 to-indigo-500',
    description: 'Structure complex systems, information flows & entity models',
    systemPrompt: BASE_JSON_SYSTEM_PROMPT('Chief Enterprise Architect', 'system topology, relational database schemas, API contracts, and concurrency models'),
    placeholders: [
      'What system or information flow are you structuring?',
      'Outline an end-to-end process from input to final output...',
      'Design a structured entity relationship model...',
    ],
    suggestions: [
      'Outline a complete system flow from user input to final output',
      'Design a structured entity relationship model with clear connections',
      'Map out service components and communication between layers',
    ],
  },
  {
    id: 'execution',
    name: 'Task Execution',
    badge: 'Task Execution Mode',
    barGradient: 'from-amber-500/15 via-orange-500/10 to-transparent dark:from-amber-600/20 dark:via-orange-600/15 dark:to-transparent',
    flowGradient: 'from-amber-500 via-orange-500 via-yellow-400 to-rose-500',
    description: 'Break down complex goals into actionable, structured stages',
    systemPrompt: BASE_JSON_SYSTEM_PROMPT('Autonomous Technical Lead', 'implementation phasing, tech stack selection, milestone dependencies, and execution specifications'),
    placeholders: [
      'Describe the project or objective you want to execute...',
      'Break down a large project into actionable daily steps...',
      'Create an execution checklist with priorities and milestones...',
    ],
    suggestions: [
      'Break down a complex project into actionable, structured daily steps',
      'Create an execution checklist with priorities and dependencies',
      'Organize complex multi-stage objectives into focused task blocks',
    ],
  },
];

let cachedModes = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

/**
 * Invalidates the in-memory modes cache to force a fresh DB query
 */
export function invalidateWorkspaceModesCache() {
  cachedModes = null;
  cacheTimestamp = 0;
}

/**
 * Fetches all workspace modes & system prompts from Supabase
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<Array<typeof DEFAULT_WORKSPACE_MODES[0]>>}
 */
export async function getWorkspaceModes(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedModes && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedModes;
  }

  try {
    const { data, error } = await supabase
      .from('workspace_modes')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      cachedModes = DEFAULT_WORKSPACE_MODES;
      cacheTimestamp = now;
      return cachedModes;
    }

    // Merge database records with styling tokens
    cachedModes = DEFAULT_WORKSPACE_MODES.map((defMode) => {
      const dbRow = data.find((row) => row.id === defMode.id);
      if (!dbRow) return defMode;

      return {
        ...defMode,
        name: dbRow.name || defMode.name,
        badge: dbRow.badge || defMode.badge,
        systemPrompt: dbRow.system_prompt || defMode.systemPrompt,
        description: dbRow.description || defMode.description,
        suggestions: dbRow.suggestions || defMode.suggestions,
        placeholders: dbRow.placeholders || defMode.placeholders,
      };
    });

    cacheTimestamp = now;
    return cachedModes;
  } catch {
    cachedModes = DEFAULT_WORKSPACE_MODES;
    cacheTimestamp = now;
    return cachedModes;
  }
}

