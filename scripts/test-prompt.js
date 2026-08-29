/**
 * ==============================================================================
 * Interactive Custom Prompt & Payload Tester (Zero Cost)
 * ==============================================================================
 * Usage:
 *   node scripts/test-prompt.js "Your custom prompt here" [mode]
 *
 * Example:
 *   node scripts/test-prompt.js "Create a real-time collaborative whiteboard" architecture
 * ==============================================================================
 */

import { DEFAULT_WORKSPACE_MODES } from '../src/services/workspaceModeService.js';
import { calculateTokenBudget, estimateTokens } from '../src/utils/tokenBudget.js';

const userPromptArg = process.argv[2] || 'I want to build a real-time collaborative workspace app with live video.';
const modeArg = process.argv[3] || 'product';

const selectedMode = DEFAULT_WORKSPACE_MODES.find(m => m.id === modeArg) || DEFAULT_WORKSPACE_MODES[0];

console.log('\n' + '═'.repeat(78));
console.log('  🧪 INTERACTIVE PROMPT & PAYLOAD TESTER');
console.log('═'.repeat(78));

console.log(`\n📌 Input Prompt : "${userPromptArg}"`);
console.log(`🎯 Active Mode  : ${selectedMode.name} (${selectedMode.id})`);
console.log(`⚡ Model Target : Olai M1 (gemini-2.0-flash)\n`);

// 1. Level 1 Prompt Payload
const userMessage = {
  role: 'user',
  content: userPromptArg,
};

const systemPrompt = selectedMode.systemPrompt;
const globalContext = '[Project Focus]: New Conversation';

const budget = calculateTokenBudget({
  messages: [userMessage],
  systemPrompt,
  globalContext,
  parentContext: '',
  model: 'gemini-2.0-flash',
});

console.log('┌─────────────────────────────────────────────────────────────────────────────');
console.log('│ 1. PAYLOAD METRICS & CHARACTER BREAKDOWN');
console.log('├─────────────────────────────────────────────────────────────────────────────');
console.log(`│ • User Prompt Characters      : ${userPromptArg.length} chars (~${estimateTokens(userPromptArg)} tokens)`);
console.log(`│ • System Instruction Length   : ${systemPrompt.length} chars (~${estimateTokens(systemPrompt)} tokens)`);
console.log(`│ • Global Context Length       : ${globalContext.length} chars (~${estimateTokens(globalContext)} tokens)`);
console.log(`│ • Total Wire Tokens Estimated : ${budget.totalTokens} tokens (Safe: ${budget.maxSafeTokens} max)`);
console.log('└─────────────────────────────────────────────────────────────────────────────\n');

console.log('┌─────────────────────────────────────────────────────────────────────────────');
console.log('│ 2. EXACT JSON WIRE PAYLOAD PASSED TO AI-PROXY');
console.log('├─────────────────────────────────────────────────────────────────────────────');
const wireBody = {
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  isPlatform: true,
  systemPrompt: systemPrompt,
  globalContext: globalContext,
  parentContext: '',
  messages: [userMessage],
};
console.log(JSON.stringify(wireBody, null, 2));
console.log('└─────────────────────────────────────────────────────────────────────────────\n');

console.log('┌─────────────────────────────────────────────────────────────────────────────');
console.log('│ 3. EXPECTED STEP 1 MODEL OUTPUT SCHEMA');
console.log('├─────────────────────────────────────────────────────────────────────────────');
console.log(`{
  "greeting": "1-2 sentence acknowledgement tailored to: ${userPromptArg.slice(0, 30)}...",
  "suggested_title": "Concise Project Title",
  "confidence_score": 35,
  "current_branch": "Core Setup & Strategy",
  "ready_for_vision": false,
  "cta_label": "Cook",
  "questions": [
    { "id": "q1", "question": "...", "options": ["Choice A", "Choice B", "Choice C"] },
    { "id": "q2", "question": "...", "options": ["Choice A", "Choice B", "Choice C"] }
  ],
  "plan_markdown": ""
}`);
console.log('└─────────────────────────────────────────────────────────────────────────────\n');
