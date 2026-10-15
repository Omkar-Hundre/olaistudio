/**
 * ==============================================================================
 * Utility: planDetector
 * ==============================================================================
 * Detects whether a chat response is a finalized comprehensive project plan.
 * Signals checked (any strong combo triggers a true):
 *  - Plan headers: "Project Plan", "Landing Page Plan", "Optimized ... Plan", etc.
 *  - Numbered section structure: 4+ sequential numbered items (1. … 2. … 3. …)
 *  - Phase/Step/Milestone counts: Phase 1 / Step 1 / Milestone 1 (≥2 matches)
 *  - Landing page vocabulary: Hero, CTA, Footer, Testimonial, Navigation
 *  - Structural plan keywords: Deliverables, Tech Stack, Roadmap, Blueprint
 * ==============================================================================
 */

export function detectFinalizedPlan(text) {
  if (!text || typeof text !== 'string' || text.length < 200) return false;

  // 1. Plan header — broad, covers "## Project Plan:", "Optimized Landing Page Plan: X", etc.
  const hasPlanHeader = /(?:(?:##|###|\*\*)\s*)?(?:optimized\s+)?(?:project|landing\s+page|architecture|implementation|development|execution|comprehensive|system|product|design)\s+plan\b/i.test(text);

  // 2. Phase / Step / Milestone / Sprint counts (classic decomposition)
  const phaseMatches = text.match(/\b(?:Phase|Step|Milestone|Sprint)\s+\d+/gi);
  const phaseCount = phaseMatches ? phaseMatches.length : 0;

  // 3. Numbered section structure — matches "1. Title", "1. **Bold Title**", etc.
  const numberedSections = text.match(/^\s*\d{1,2}\.\s+\S/gm);
  const sectionCount = numberedSections ? numberedSections.length : 0;

  // 4. Landing page vocabulary signals
  const hasLandingVocab = /\b(?:hero\s+section|navigation\s+bar|cta\s+(?:button|banner)|footer|testimonial|social\s+proof|trust\s+(?:strip|badge)|faq\s+section|pricing\s+(?:section|page))\b/i.test(text);

  // 5. Generic plan structure keywords
  const hasPlanStructure = /\b(?:deliverables?|tech(?:nology)?\s+stack|roadmap|blueprint|implementation\s+phases?|release\s+criteria|acceptance\s+criteria)\b/i.test(text);

  // Decision matrix — any of these combos = it's a plan
  const isNumberedSectionPlan  = sectionCount >= 4 && (hasPlanHeader || hasLandingVocab);
  const isClassicPhasePlan     = phaseCount >= 2 && (hasPlanHeader || hasPlanStructure);
  const isLandingPageBlueprint = hasLandingVocab && sectionCount >= 3;
  // Two strong independent signals together are always a plan
  const isHeaderPlusVocab      = hasPlanHeader && hasLandingVocab;

  return Boolean(isNumberedSectionPlan || isClassicPhasePlan || isLandingPageBlueprint || isHeaderPlusVocab);

}
