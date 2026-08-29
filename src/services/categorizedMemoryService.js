/**
 * ==============================================================================
 * Service: categorizedMemoryService
 * ==============================================================================
 * Formulates and formats 3-Level Categorized Memory into clean, narrative
 * paragraphs for storage in Supabase and injection into AI Edge Functions:
 * - Level 1: Working Turn Memory (Live React State)
 * - Level 2: Branch & Node Context Memory (`workflow_nodes.input_context`)
 * - Level 3: Strategic Master Project Memory (`workflow_sessions.global_context`)
 * ==============================================================================
 */

/**
 * Builds categorized narrative memory paragraphs for a conversation session
 * @param {Object} params
 * @param {Array} [params.messages=[]]
 * @param {string} [params.sessionTitle='']
 * @param {string} [params.currentBranch='']
 * @param {number} [params.confidenceScore=35]
 * @param {string} [params.visionContent='']
 * @param {Array} [params.activeQuestions=[]]
 * @returns {{ narrative: string, structured: Object, nodeContext: string }}
 */
export function buildCategorizedMemory({
  messages = [],
  sessionTitle = '',
  currentBranch = '',
  confidenceScore = 35,
  visionContent = '',
  activeQuestions = [],
}) {
  // 1. Extract explicit user decisions and answers from conversation turns
  const userChoices = [];
  messages.forEach((m) => {
    if (m.role === 'user' && typeof m.content === 'string') {
      const choiceLines = m.content
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('→ Selected:') || l.startsWith('1.') || l.startsWith('2.') || l.startsWith('3.'));

      if (choiceLines.length > 0) {
        userChoices.push(...choiceLines);
      }
    }
  });

  // 2. Format Level 3 Strategic Global Memory Paragraphs
  const projectGoal = sessionTitle && sessionTitle !== 'New Session' && sessionTitle !== 'New Conversation'
    ? `The project is targeted at building "${sessionTitle}". Current scope alignment is at ${confidenceScore}%.`
    : `Project initialization phase with initial alignment baseline at ${confidenceScore}%.`;

  const branchSummary = currentBranch
    ? `Active execution focus is centered on "${currentBranch}".`
    : `Active focus is centered on Core Setup & Architecture.`;

  const decisionsSummary = userChoices.length > 0
    ? userChoices.map((c) => `  • ${c}`).join('\n')
    : `  • No locked architectural constraints yet. Actively refining scope.`;

  const visionSummary = visionContent
    ? visionContent.slice(0, 1000) + (visionContent.length > 1000 ? '\n[...continued in VisionCard]' : '')
    : `Master Plan pending synthesis (unlocks automatically when alignment >= 85%).`;

  const narrative = `### 1. PROJECT GOAL & STRATEGIC VISION
${projectGoal}

### 2. ACTIVE FOCUS & EXECUTION BRANCH
${branchSummary}

### 3. RECORDED ARCHITECTURAL DECISIONS & SCOPE
${decisionsSummary}

### 4. CURRENT MASTER PLAN STATUS
${visionSummary}`;

  // 3. Format Level 2 Node Context (for workflow_nodes.input_context)
  const nodeContext = `[PROJECT SCOPE]: ${sessionTitle || 'New Project'}
[CURRENT BRANCH]: ${currentBranch || 'Core Architecture'} (Alignment: ${confidenceScore}%)
[DECISION HIGHLIGHTS]:
${decisionsSummary}`;

  return {
    narrative,
    nodeContext,
    structured: {
      projectTitle: sessionTitle,
      confidenceScore,
      currentBranch,
      decisionsCount: userChoices.length,
      hasVision: Boolean(visionContent),
      lastUpdated: new Date().toISOString(),
    },
  };
}
