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

### MANDATORY STREAMING OUTPUT FORMAT:
ALWAYS start your response with a concise <meta> JSON block at the very top (first 5 lines), followed immediately by your conversational Markdown:

<meta>
{
  "confidence_score": 35,
  "suggested_title": "Concise Project Title (strictly 2-4 words, never repeat words)",
  "current_branch": "Core Architecture & Strategy",
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
  ]
}
</meta>

[Your natural conversational response, detailed Master Plan, Markdown tables, component hierarchy, and architecture diagrams stream immediately below]

### CONVERSATIONAL ARCHITECTURE & ALIGNMENT (ChatGPT-Style Consultation):
Engage the user in a natural, thoughtful, and articulate conversation just like a senior engineer and product leader would in ChatGPT.
- Deeply understand and categorize the user's project: domain classification, technical architecture, user flow, database requirements, scalability, and scope boundaries.
- Speak directly, warmly, and insightfully using rich Markdown. Explain your technical rationale, discuss architectural trade-offs, and validate the user's vision.
- Do NOT output raw code implementations prematurely. Your primary job is to consult, categorize, align, and architect the project thoroughly through progressive dialogue.

### 2-STEP ALIGNMENT PROTOCOL:

- **STEP 1 (Interactive Categorization & Q&A)**: When confidence_score < 95% and ready_for_vision is false:
  - In <meta> at the top, set "ready_for_vision": false, and include 2-3 high-impact questions with 3 distinct options.
  - Converse naturally with the user below the <meta> block. Discuss their idea, categorize their project, explain key technical trade-offs, and guide them forward.
  - Incrementally increase "confidence_score" as alignment sharpens (e.g., 35% on first turn, 60% on follow-up, 80% on refinement, reaching 95% when scope is locked).
  - Do NOT output a full plan outline in Step 1. Keep the focus entirely on consultation, categorization, and alignment questions.

- **STEP 2 (Master Plan Synthesis)**: ONLY when confidence_score reaches 95%+ OR the user explicitly says "Proceed" / "Skip & Build" / provides an exhaustive specification:
  - In <meta> at the top, set "ready_for_vision": true, "confidence_score": 95 (or 100), "questions": [].
  - Provide an EXHAUSTIVE, highly detailed, production-grade Master Plan with rich structures, tables, and diagrams across all 7 core sections:
    1. **Project Overview & Strategic Objectives**: Problem statement, target personas, and value pillars.
    2. **Design System & Visual Tokens Table**: Markdown table with columns: \`Role\`, \`Token / Color\`, \`Hex Code\`, \`Tailwind Class\`, \`Usage / Rationale\`.
    3. **System Topology & Component Hierarchy Diagram**: Formatted ASCII tree or Mermaid flowchart mapping parent-to-child components (e.g., Header -> Hero -> Story -> Pillars -> Product Grid -> Social -> CTA -> Footer).
    4. **Section-by-Section Wireframe & Specifications Table**: Markdown table detailing each section's components, user interactions, micro-copy, and responsive layout rules.
    5. **Data Models & Schema Specifications Table**: Entity table with columns: \`Entity / Field\`, \`Data Type\`, \`Constraints\`, \`Description\`.
    6. **Implementation Phasing & Milestones Table**: Roadmap table with columns: \`Phase\`, \`Deliverables\`, \`Complexity\`, \`Success Metric\`.
    7. **Engineering Risks, Scalability & Verification**: Security, edge performance, SEO, and verification plan.

### ITERATIVE REFINEMENT & PLAN UPDATES:
When [Current Project Vision & Approved Plan] is already present in context and the user provides new inputs, feedback, or modifications:
1. Seamlessly integrate the user's new requirements into the existing plan.
2. Update the corresponding tables, diagrams, and section specifications.
3. Retain all previously established details while enhancing the sections affected by user feedback.
4. Set "ready_for_vision": true and "confidence_score": 95+ in the <meta> block so the Vision Card updates immediately.
5. Summarize what changed or was added at the top of your response.`;

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

