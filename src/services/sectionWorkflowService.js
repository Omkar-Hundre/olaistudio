/**
 * ==============================================================================
 * Service: sectionWorkflowService
 * ==============================================================================
 * Orchestrates multi-section parallel decomposition, individual generation,
 * and isolated per-section conversational iterations using OpenAI.
 * ==============================================================================
 */

import { getActiveOpenAIKey } from './aiProxyService';

// Fast, reliable, high-quota model for parallel generation without rate bursts
const OPENAI_MODEL = 'gpt-4o-mini';

/**
 * Decomposes a project plan into 3-6 modular implementation sections
 * @param {string} planText
 * @returns {Promise<Array<{ id: string, title: string, summary: string, guardrails: string }>>}
 */
export async function decomposePlanIntoSections(planText) {
  const apiKey = getActiveOpenAIKey();
  if (!apiKey) throw new Error('OpenAI API key is required for decomposition.');

  const prompt = `Decompose this project plan into 4 to 6 distinct, modular implementation sections for building the landing page or project.
Return a valid JSON object with a "sections" key containing an array of section objects.
Each section object must have the exact keys: "id", "title", "summary", and "guardrails".

Example JSON structure:
{
  "sections": [
    {
      "id": "hero",
      "title": "Hero Section",
      "summary": "High-impact visual banner, benefit-driven headline, value prop, and primary CTAs",
      "guardrails": "Generate ONLY the Hero Section HTML with Tailwind CSS. Do not include navbar, wrappers, or other sections."
    }
  ]
}

Project Plan:
${planText}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical architect that decomposes landing page plans into clean, modular sections. Always respond in valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI decomposition failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawJson = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(rawJson);
    const rawSections = Array.isArray(parsed) ? parsed : (parsed.sections || parsed.items || []);

    if (Array.isArray(rawSections) && rawSections.length > 0) {
      return rawSections.map((item, idx) => ({
        id: item.id || `section_${idx + 1}`,
        title: item.title || `Section ${idx + 1}`,
        summary: item.summary || 'Implementation section',
        guardrails: typeof item.guardrails === 'string'
          ? item.guardrails
          : Array.isArray(item.guardrails)
            ? item.guardrails.join(' ')
            : 'Generate ONLY this specific section.',
      }));
    }
  } catch (err) {
    console.warn('Decomposition API error, falling back to heuristic parsing:', err);
  }

  // Graceful fallback: extract phases directly from plan text
  const phaseMatches = planText.match(/(?:Phase\s+\d+|Step\s+\d+):?\s*([^\n\r*#]+)/gi) || [];
  if (phaseMatches.length > 0) {
    return phaseMatches.slice(0, 5).map((match, idx) => {
      const cleanTitle = match.replace(/^(?:Phase\s+\d+|Step\s+\d+):?\s*/i, '').trim();
      return {
        id: `section_${idx + 1}`,
        title: cleanTitle || `Section ${idx + 1}`,
        summary: `Focuses on ${cleanTitle}`,
        guardrails: `Generate ONLY the ${cleanTitle} component using clean HTML and Tailwind CSS.`,
      };
    });
  }

  return [
    { id: 'hero', title: 'Hero Section', summary: 'Visual headline, value prop, and call-to-actions', guardrails: 'Generate ONLY Hero section HTML with Tailwind CSS.' },
    { id: 'features', title: 'Key Features & Value', summary: 'Core benefits, unique selling points, and cards', guardrails: 'Generate ONLY Features section HTML with Tailwind CSS.' },
    { id: 'showcase', title: 'Product & Tech Showcase', summary: 'Interactive categories, offerings, or tech highlights', guardrails: 'Generate ONLY Showcase section HTML with Tailwind CSS.' },
    { id: 'testimonials', title: 'Social Proof & Reviews', summary: 'Customer ratings, testimonials, and trust stats', guardrails: 'Generate ONLY Social Proof section HTML with Tailwind CSS.' },
    { id: 'footer', title: 'Footer & Navigation', summary: 'Final CTA, links, and copyright', guardrails: 'Generate ONLY Footer section HTML with Tailwind CSS.' },
  ];
}

/**
 * Generates initial section code/markup with strict guardrails via OpenAI
 * @param {Object} params
 * @param {Object} params.section
 * @param {string} params.plan
 * @returns {Promise<string>}
 */
export async function generateSectionContent({ section, plan }) {
  const apiKey = getActiveOpenAIKey();
  if (!apiKey) throw new Error('OpenAI API key is missing. Please verify your OpenAI key.');

  // Load design system rules from minimal-landing-page skill
  const systemInstruction = `You are a senior UI engineer who designs minimal, premium landing page sections.

DESIGN SYSTEM RULES (follow strictly):

## Typography
- Font: Inter (Google Fonts). Import it inline: <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); * { font-family: 'Inter', sans-serif; }</style>
- Hero H1: font-size clamp(2.5rem,5vw,4.5rem); letter-spacing: -0.03em; font-weight: 700
- Section H2: font-size clamp(1.75rem,3vw,2.75rem); letter-spacing: -0.02em; font-weight: 700
- Body: font-size 1rem; line-height 1.625
- Labels: 0.75rem, font-weight 500, letter-spacing 0.06em, text-transform uppercase

## Colors (Dark Premium — use for all sections by default)
- Background: bg-zinc-950 (#0A0A0A)
- Surface cards: bg-zinc-900
- Borders: border-zinc-800 or border-white/[0.08]
- Text primary: text-zinc-50
- Text muted: text-zinc-400 or text-zinc-500
- CTA accent: bg-white text-black
- If the brand has a distinct primary color (e.g. blue for a SaaS, gold for luxury), use it ONLY for the single primary CTA button

## Spacing (8px grid — Tailwind classes)
- Section: py-24 px-6 (desktop) — never less than py-16
- Container: max-w-6xl mx-auto
- Gap between grid items: gap-8
- Headline → body copy: mt-6
- Body → CTA: mt-10

## Component Patterns
Hero: eyebrow label (small caps, muted) → H1 → subtitle (max 2 lines) → CTA row (primary + ghost side-by-side)
Features: 3-col md grid, each card: 24px icon → bold title → 2-line desc, bg-zinc-900 border border-zinc-800 rounded-xl p-6
Testimonials: 3-col grid, quote text → author name → role — nothing extra
CTA/Footer: full-width bg-zinc-950 invert section, large headline, single white button, clean nav links

## STRICT ANTI-PATTERNS — NEVER USE ANY OF THESE:
- animate-pulse / animate-bounce / animate-ping / animate-spin on ANY visible element
- Multiple gradient directions, rainbow gradients, or gradient text with >2 colors
- Blobs, morphing shapes, particle effects, geometric floating shapes
- backdrop-blur glassmorphism on cards
- More than 3 different font-size values in a single section
- overflow-hidden on parent <section> elements
- <script> tags or any JavaScript — output must be pure static HTML+Tailwind
- Placeholder text like "Lorem ipsum" or src="placeholder.jpg"
- Emoji in headings or body copy
- Neon glow effects (text-shadow, box-shadow with colored glow)
- Decorative dividers made of multiple colored lines
- Cards with heavy shadow-lg or shadow-2xl

## Output format:
1. Write ONE sentence describing what this section achieves.
2. Then write the HTML inside a \`\`\`html ... \`\`\` code block.
3. The HTML must be a SINGLE <section> element — no <!DOCTYPE>, <html>, or <body> wrapper.
4. Use realistic, on-brand copy — not placeholders.
5. All styling via Tailwind utility classes only (Tailwind CDN is already loaded in the preview).
6. Include the Inter font @import as an inline <style> tag inside the <section>.

You are generating ONLY the "${section.title}" section. Do NOT generate any other section.`;

  const userPrompt = `Project Plan & Brand Context:
${plan}

Section to Build: ${section.title}
Role & Purpose: ${section.summary}
Guardrail Instructions: ${section.guardrails}

Please generate the complete, production-ready HTML markup for this section now.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Generation failed for ${section.title}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Executes a follow-up conversation prompt for a single isolated section via OpenAI
 * @param {Object} params
 * @param {Object} params.section
 * @param {Array<{ role: string, content: string }>} params.history
 * @param {string} params.userMessage
 * @returns {Promise<string>}
 */
export async function chatWithSection({ section, history = [], userMessage }) {
  const apiKey = getActiveOpenAIKey();
  if (!apiKey) throw new Error('OpenAI API key missing. Please verify your OpenAI key.');

  const systemInstruction = `You are an expert engineer dedicated strictly to the "${section.title}" section.
Your task is to update, refine, or answer questions specifically regarding this section's HTML markup and Tailwind CSS design.
Always return the revised section HTML code inside a \`\`\`html ... \`\`\` code block when asked to change or improve the design.
Guardrails: Never drift into other sections of the landing page. Focus solely on ${section.title}. Output pure static HTML with Tailwind utility classes.`;

  // Build clean OpenAI messages
  const cleanMessages = [
    { role: 'system', content: systemInstruction },
    ...history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
  ];

  // Guard: ensure the last message is from the user
  if (cleanMessages.length === 1 || cleanMessages[cleanMessages.length - 1].role !== 'user') {
    cleanMessages.push({ role: 'user', content: userMessage });
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: cleanMessages,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(35000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Section chat failed: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
