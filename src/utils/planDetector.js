/**
 * ==============================================================================
 * Utility: planDetector
 * ==============================================================================
 * Detects whether chat content represents a finalized comprehensive project plan.
 * Matches:
 * - Standard plan headers: '## Project Plan: ...', 'Comprehensive Plan', 'Implementation Roadmap'
 * - Multi-phase breakdown: Phase 1, Phase 2, etc. (at least 2 phases)
 * - Structural keywords: Deliverables, Tech stack, Roadmap
 * ==============================================================================
 */

export function detectFinalizedPlan(text) {
  if (!text || typeof text !== 'string') return false;

  // Header or title pattern: Project Plan, Architecture Plan, Implementation Plan, etc.
  const hasPlanHeader = /(?:##\s+)?(?:\*\*)?(?:Project Plan|Comprehensive Plan|Implementation Roadmap|Development Plan|Architectural Plan|System Plan|Execution Plan|Landing Page Plan)/i.test(text);

  // Multiple phases, milestones, or steps
  const phaseMatches = text.match(/(?:Phase\s+\d+|Step\s+\d+|Milestone\s+\d+|Sprint\s+\d+)/gi);
  const phaseCount = phaseMatches ? phaseMatches.length : 0;

  // Plan structural keywords
  const hasPlanStructure = /(?:deliverables?|tech(?:nology)?\s+stack|roadmap|development roadmap|deliverable:)/i.test(text);

  return Boolean((hasPlanHeader && phaseCount >= 2) || (phaseCount >= 3 && hasPlanStructure) || (hasPlanHeader && hasPlanStructure));
}
