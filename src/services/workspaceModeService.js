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

### MANDATORY OUTPUT FORMAT:
You MUST respond with a clean, valid JSON object strictly matching this schema:
{
  "greeting": "Conversational greeting and technical dialogue in rich Markdown (2-3 insightful paragraphs discussing the user's project, architectural trade-offs, and categorization).",
  "suggested_title": "Concise Project Title (strictly 2-4 words, never repeat words)",
  "confidence_score": 35,
  "current_branch": "Core Strategy & Architecture",
  "ready_for_vision": false,
  "cta_label": "Cook",
  "questions": [
    {
      "id": "q1",
      "question": "Which architecture pattern fits your scale best?",
      "options": [
        "First clear choice with brief rationale",
        "Second clear choice with brief rationale",
        "Third clear choice with brief rationale"
      ]
    }
  ],
  "plan_markdown": ""
}

### 2-STEP ALIGNMENT PROTOCOL:

- **STEP 1 (Interactive Categorization & Q&A)**: When confidence_score < 95% and ready_for_vision is false:
  - In "greeting": Converse naturally with the user just like a senior engineer and product leader in ChatGPT. Deeply understand and categorize their project, explain technical trade-offs, discuss domain requirements, and provide thoughtful advice.
  - In "questions": Provide 2-3 high-impact architectural questions, each with 3 distinct options.
  - In "confidence_score": Set to 35 on turn 1, 65 on follow-up, 85 on refinement.
  - In "ready_for_vision": Set to false.
  - In "plan_markdown": Keep as empty string "". Do NOT output a full plan in Step 1.

- **STEP 2 (Master Plan Synthesis)**: ONLY when confidence_score reaches 95%+ OR the user explicitly says "Proceed" / "Skip & Build" / provides an exhaustive specification:
  - In "greeting": Provide a warm 1-2 sentence transition explaining that the comprehensive architectural Master Plan has been synthesized and is ready for review.
  - In "confidence_score": Set to 95 (or 100).
  - In "ready_for_vision": Set to true.
  - In "questions": Set to empty array [].
  - In "plan_markdown": Provide an EXHAUSTIVE, highly detailed, production-grade Master Plan with rich structures, tables, and diagrams across all 7 core sections:
    1. **Project Overview & Strategic Objectives**: Problem statement, target personas, and core value pillars.
    2. **Design System & Visual Tokens Table**: Markdown table with columns: \`| Role | Token / Color | Hex Code | Tailwind Class | Usage / Rationale |\`.
    3. **System Topology & Component Hierarchy Diagram**: Formatted ASCII tree mapping parent-to-child components (e.g., Header -> Hero -> Story -> Pillars -> Product Grid -> Social -> CTA -> Footer).
    4. **Section-by-Section Wireframe & Specifications Table**: Markdown table detailing each section's components, user interactions, micro-copy, and responsive layout rules (\`| Section | Components | Copy & Interactivity | Responsive Layout |\`).
    5. **Data Models & Schema Specifications Table**: Entity table with columns: \`| Entity / Field | Data Type | Constraints | Description |\`.
    6. **Implementation Phasing & Milestones Table**: Roadmap table with columns: \`| Phase | Deliverables | Complexity | Success Metric |\`.
    7. **Engineering Risks, Scalability & Verification**: Security, performance, SEO, and verification plan.

### ITERATIVE REFINEMENT & PLAN UPDATES:
When [Current Project Vision & Approved Plan] is already present in context and the user provides new inputs, feedback, or modifications:
1. In "greeting": Specifically acknowledge the modifications requested in 1-2 sentences.
2. In "plan_markdown": Output the ENTIRE, COMPLETE revised Master Plan with all 7 comprehensive sections, incorporating the user's modifications directly into the tables, visual tokens, wireframes, and schemas. Never output just a confirmation statement or partial plan.
3. In "ready_for_vision": Set to true, and "confidence_score" to 95.

### CRITICAL TOKEN EFFICIENCY & ANTI-LOOP GUARDRAIL:
- Never output raw HTML/CSS/JS source code inside plan_markdown (no \`import React\`, no \`.css { }\`). Output architectural specifications, Markdown tables, and ASCII diagrams.
- Once all 7 sections are populated, conclude the JSON cleanly and immediately. Never loop or repeat phrases.`;

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

