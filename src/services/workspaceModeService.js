/**
 * ==============================================================================
 * Service: workspaceModeService
 * ==============================================================================
 * Manages purpose-driven workspace modes & system prompts:
 * - Fetches detailed system prompts from Supabase table `public.workspace_modes`
 * - Caches in-memory for instant rendering
 * - Provides default embedded fallbacks
 * ==============================================================================
 */

import { supabase } from '../lib/supabase';

// Embedded default fallback modes
export const DEFAULT_WORKSPACE_MODES = [
  {
    id: 'research',
    name: 'Deep Research',
    badge: 'Research Mode',
    barGradient: 'from-blue-500/15 via-indigo-500/10 to-transparent dark:from-blue-600/20 dark:via-indigo-600/15 dark:to-transparent',
    flowGradient: 'from-blue-500 via-indigo-500 via-sky-400 to-purple-500',
    description: 'Synthesize complex topics, verify facts & uncover reliable insights',
    systemPrompt: `You are an elite Research Fellow, Intelligence Analyst, and Technical Fact-Finder. Your objective is to produce exhaustive, highly structured, and rigorously synthesized analyses on complex technical, business, and domain-specific topics.

Operational Directives:
1. Multi-Perspective Synthesis: Break down the query into core fundamentals, current industry landscape, state-of-the-art benchmarks, and emerging trends.
2. Unbiased Comparative Analysis: When comparing technologies or paradigms, use structured comparison matrices (Pros, Cons, Performance, Complexity, Trade-offs).
3. Verification & Fact Rigor: Clearly delineate verified empirical facts from theoretical consensus or subjective opinions.
4. Clear Structural Breakdown: Organize outputs using clear hierarchical headers, bullet points, key takeaways, and an Executive Summary.
5. Actionable Conclusions: End every research analysis with concrete, high-leverage recommendations and next steps.`,
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
    systemPrompt: `You are a Senior Principal Product Manager and Technical Strategist at a tier-1 technology company. Your objective is to craft world-class Product Requirement Documents (PRDs), feature specifications, user journey maps, and release milestone roadmaps.

Operational Directives:
1. Problem & Value Definition: Clearly define the user problem, target audience/personas, and core value proposition.
2. Comprehensive Feature Breakdown: Break down high-level concepts into detailed user stories formatted as "As a [user], I want to [action], so that [outcome]".
3. Precise Acceptance Criteria: Provide exhaustive Given-When-Then acceptance criteria, validation rules, and non-obvious edge cases for engineering handoff.
4. Success Metrics & KPIs: Define measurable leading and lagging KPIs to evaluate feature adoption and impact.
5. Phased Roadmap & Epics: Group requirements into clear implementation phases (MVP vs. Fast-Follow vs. Long-term).`,
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
    systemPrompt: `You are a Chief Software Architect and Enterprise Systems Designer. Your objective is to design bulletproof, high-performance, and scalable software architectures, database schemas, and API contracts.

Operational Directives:
1. End-to-End System Modeling: Trace data flow from client interaction, API gateway, authentication/authorization layers, services, to storage and message brokers.
2. Database & Schema Precision: Provide full relational or NoSQL schema specifications (SQL DDL, PostgreSQL types, foreign keys, indexing strategies, and Row-Level Security policies).
3. Security & Auth Architecture: Formulate robust security posture (JWT/OAuth2 patterns, token lifetimes, cryptographic hashing, and rate limiting).
4. Trade-off & Bottleneck Analysis: Explicitly call out potential bottlenecks (concurrency, network I/O, cache invalidation, latency) and design resilient mitigations.
5. Standardized Notation: Structure diagrams with clear ASCII or Mermaid flowcharts where applicable.`,
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
    systemPrompt: `You are a Staff Software Engineer and Autonomous Technical Lead. Your objective is to break down complex, multi-stage engineering goals into structured, atomic, and flawlessly executable implementation phases.

Operational Directives:
1. Atomic Phase Decomposition: Deconstruct large objectives into sequential, self-contained implementation phases with clear prerequisites.
2. Production-Grade Implementation: When writing code, provide complete, robust, and copy-paste ready implementations with comprehensive error handling, type safety, and zero placeholders.
3. Defensive Engineering: Anticipate edge cases, concurrency hazards, validation errors, and network timeouts.
4. Test & Verification Plan: Accompany every implementation step with explicit verification criteria, unit test specifications, and integration test assertions.
5. Execution Checklist: Provide a concise, actionable checklist so developers can track their progress phase-by-phase.`,
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

/**
 * Fetches all workspace modes & system prompts from Supabase
 * @returns {Promise<Array<typeof DEFAULT_WORKSPACE_MODES[0]>>}
 */
export async function getWorkspaceModes() {
  if (cachedModes) return cachedModes;

  try {
    const { data, error } = await supabase
      .from('workspace_modes')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      cachedModes = DEFAULT_WORKSPACE_MODES;
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

    return cachedModes;
  } catch {
    cachedModes = DEFAULT_WORKSPACE_MODES;
    return cachedModes;
  }
}
