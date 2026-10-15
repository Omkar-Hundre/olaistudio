/**
 * ==============================================================================
 * Service: sectionWorkflowService
 * ==============================================================================
 * Orchestrates multi-section parallel decomposition, individual generation,
 * and isolated per-section conversational iterations.
 * ==============================================================================
 */

import { getActiveGeminiKey } from './aiProxyService';

const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Decomposes a project plan into 3-6 modular implementation sections
 * @param {string} planText
 * @returns {Promise<Array<{ id: string, title: string, summary: string, guardrails: string }>>}
 */
export async function decomposePlanIntoSections(planText) {
  const apiKey = getActiveGeminiKey();
  if (!apiKey) throw new Error('Gemini API key is required for decomposition.');

  const prompt = `Decompose this project plan into 4 to 6 distinct, modular implementation sections for building the landing page or project.
Return ONLY a valid JSON array of objects with the exact keys "id", "title", "summary", and "guardrails". No markdown formatting, just raw JSON.

Example format:
[
  {
    "id": "hero",
    "title": "Hero Section",
    "summary": "High-impact visual banner, benefit-driven headline, value prop, and primary CTAs",
    "guardrails": "Generate ONLY the Hero Section HTML with Tailwind CSS. Do not include navbar, wrappers, or other sections."
  }
]

Project Plan:
${planText}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Decomposition failed with status ${res.status}`);
    }

    const data = await res.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const parsed = JSON.parse(rawJson);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        id: item.id || `section_${idx + 1}`,
        title: item.title || `Section ${idx + 1}`,
        summary: item.summary || 'Implementation section',
        guardrails: item.guardrails || 'Generate ONLY this specific section.',
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
 * Generates initial section code/markup with strict guardrails
 * @param {Object} params
 * @param {Object} params.section
 * @param {string} params.plan
 * @returns {Promise<string>}
 */
export async function generateSectionContent({ section, plan }) {
  const apiKey = getActiveGeminiKey();
  if (!apiKey) throw new Error('API key missing');

  const systemInstruction = `You are a Principal UI Engineer specializing in landing pages and modular frontend architecture.
Strict Guardrails:
1. Generate ONLY the clean, semantic HTML markup for the "${section.title}" using Tailwind CSS styling.
2. Do NOT output a full <!DOCTYPE html> wrapper or enclosing <body> tags.
3. Do NOT implement any other sections. Focus 100% on "${section.title}".
4. Use modern, premium SaaS aesthetics: sleek typography, subtle borders (slate-200/zinc-800), generous padding, accessible contrast, and realistic copy.
5. Return ONLY the code inside a standard html code block (\`\`\`html ... \`\`\`) with a 1-sentence friendly overview summary before it.`;

  const userPrompt = `Project Plan & Brand Context:
${plan}

Section to Build: ${section.title}
Role & Purpose: ${section.summary}
Guardrail Instructions: ${section.guardrails}

Please generate the complete, production-ready HTML markup for this section now.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        thinkingConfig: { thinkingBudget: 0 },
      },
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Generation failed for ${section.title}: ${errText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Executes a follow-up conversation prompt for a single isolated section
 * @param {Object} params
 * @param {Object} params.section
 * @param {Array<{ role: string, content: string }>} params.history
 * @param {string} params.userMessage
 * @returns {Promise<string>}
 */
export async function chatWithSection({ section, history = [], userMessage }) {
  const apiKey = getActiveGeminiKey();
  if (!apiKey) throw new Error('API key missing');

  const systemInstruction = `You are an expert engineer dedicated strictly to the "${section.title}".
Your task is to update, refine, or answer questions specifically regarding this section's HTML markup and design.
Always return the revised section HTML code when asked to change or improve the design.
Guardrails: Never drift into other sections of the landing page. Focus solely on ${section.title}.`;

  const contents = [];
  for (const msg of history) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        thinkingConfig: { thinkingBudget: 0 },
      },
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Section chat failed: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
