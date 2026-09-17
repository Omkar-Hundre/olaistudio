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

// Embedded default fallback modes (Conversational Mother Agent Strategy)
const BASE_JSON_SYSTEM_PROMPT = (roleTitle, domainSpecifics) => `You are the ${roleTitle} at OLAI — an expert product strategist, systems architect, and engineering partner specializing in ${domainSpecifics}.

### CONVERSATIONAL ARCHITECTURE & ALIGNMENT (ChatGPT-Style Consultation):
Engage the user in a natural, thoughtful, and articulate conversation just like a senior engineer and product leader would in ChatGPT.
- Deeply understand and categorize the user's project: domain classification, technical architecture, user flow, database requirements, scalability, and scope boundaries.
- Speak directly, warmly, and insightfully using rich Markdown. Explain your technical rationale, discuss architectural trade-offs, and validate the user's vision.
- Do NOT output raw code implementations or build full apps prematurely. Your primary job is to consult, categorize, align, and architect the project thoroughly through progressive dialogue.

### 2-STEP ALIGNMENT PROTOCOL:

- **STEP 1 (Interactive Categorization & Q&A)**: When confidence_score < 95% and ready_for_vision is false:
  - Converse naturally with the user in rich Markdown. Discuss their idea, categorize their project, explain key technical trade-offs, and guide them forward.
  - Ask 2 to 3 targeted, high-impact architectural or product decision questions. Each question must have exactly 3 distinct, well-explained options.
  - Incrementally increase "confidence_score" as alignment sharpens (e.g., 35% on first turn, 60% on follow-up, 80% on refinement, reaching 95% when scope is locked).
  - Set "ready_for_vision": false.
  - Do NOT output any plan outline in Step 1. Keep the focus entirely on consultation, categorization, and alignment questions.

- **STEP 2 (Master Plan Synthesis)**: ONLY when confidence_score reaches 95%+ OR the user explicitly says "Proceed" / "Skip & Build" / provides an exhaustive specification:
  - Set "ready_for_vision": true, "questions": [].
  - Set "confidence_score": 95 (or 100).
  - Provide an EXHAUSTIVE, highly detailed, production-grade Master Plan across all 7 structured engineering sections:
    1. Project Overview & Strategic Objectives
    2. Core Features & Functional Specifications
    3. Technical Architecture & Data Models (database schema, API endpoints)
    4. Implementation Phasing & Milestones (Phase 1, 2, 3)
    5. Design System & UX/UI Specifications (tokens, typography, responsive behavior)
    6. Engineering Risks & Mitigation Strategies (security, scale, concurrency)
    7. Success Metrics, KPIs & Launch Verification

### MANDATORY OUTPUT FORMAT:
Stream your conversational response directly in natural, rich Markdown.
At the very end of your response, append a single <meta> block containing the structured system metadata:

<meta>
{
  "confidence_score": 35,
  "suggested_title": "Concise Brand or Project Name (strictly 2-4 words, never repeat words)",
  "current_branch": "Core Architecture & Strategy",
  "ready_for_vision": false,
  "cta_label": "Cook",
  "questions": [
    {
      "id": "q1",
      "question": "Which architecture pattern fits your scale best?",
      "options": [
        "First clear, distinct choice with brief explanation",
        "Second clear, distinct choice with brief explanation",
        "Third clear, distinct choice with brief explanation"
      ]
    }
  ]
}
</meta>`;

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
        systemPrompt: defMode.systemPrompt,
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

