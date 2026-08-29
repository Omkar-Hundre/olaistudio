/**
 * ==============================================================================
 * Component: DevPayloadInspector
 * ==============================================================================
 * Developer Live Payload & Memory Inspection Drawer (Dev Only)
 * - Renders a sleek floating debug trigger in the bottom corner during local development
 * - Allows real-time inspection of:
 *   1. Active System Instruction (character count & token estimate)
 *   2. Multi-turn Sanitized Wire Payload (messages, roles, lengths)
 *   3. 3-Level Memory State (L1 React state, L2 Node state, L3 Session meta)
 *   4. Raw Parsed System Commands & Token Budget metrics
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Terminal, X, Copy, Check, ShieldAlert, Cpu, Database, Eye } from 'lucide-react';
import { estimateTokens } from '../../utils/tokenBudget';

export default function DevPayloadInspector({
  activeMode,
  messages = [],
  alignmentScore = 35,
  currentBranch = '',
  visionContent = '',
  activeQuestions = [],
  selectedModel,
  sessionId,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('payload'); // 'payload' | 'system' | 'memory'
  const [copied, setCopied] = useState(false);

  // Active only in development mode
  if (!import.meta.env.DEV) return null;

  // Compute live sanitized payload as sent to ai-proxy
  const wirePayload = messages.map((m) => {
    let content = m.role === 'assistant'
      ? (m.displayContent || m.content || '')
      : (m.content || '');

    if (m.role === 'user' && typeof content === 'string') {
      content = content.replace(/^\[Mode:\s*[^\]]+\]\n?/i, '').trim();
    }

    return {
      role: m.role,
      content,
    };
  });

  const systemPromptText = activeMode?.systemPrompt || '';
  const globalContextText = visionContent
    ? `[Current Project Vision & Approved Plan]\n${visionContent}`
    : `[Project Focus]: Active Chat`;
  const parentContextText = currentBranch
    ? `[Current Focus Area]: ${currentBranch} (Alignment: ${alignmentScore || 35}%)`
    : '';

  const totalPayloadChars = JSON.stringify(wirePayload).length + systemPromptText.length + globalContextText.length;
  const totalTokensEst = estimateTokens(JSON.stringify(wirePayload) + systemPromptText + globalContextText);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Floating Trigger Button in Bottom Corner */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-3 right-3 z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 dark:bg-zinc-800/90 text-white dark:text-zinc-200 text-[11px] font-mono shadow-md border border-slate-700/60 dark:border-zinc-700 hover:bg-slate-800 cursor-pointer backdrop-blur-xs transition-all hover:scale-105"
        title="Inspect Prompt & Memory Payload (Dev Mode)"
      >
        <Terminal className="h-3 w-3 text-cyan-400" />
        <span>Inspect ({totalTokensEst} tok)</span>
      </button>

      {/* Slide-Over Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-[#121316] border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            
            {/* Top Header Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-md bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                  <Terminal className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    Live Payload & Memory Inspector
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-mono">
                      DEV ONLY
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                    Model: {selectedModel?.name || 'Olai M1'} ({selectedModel?.rawModel || 'gemini-2.0-flash'}) • {totalPayloadChars} chars (~{totalTokensEst} tokens)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy({
                    systemPrompt: systemPromptText,
                    globalContext: globalContextText,
                    parentContext: parentContextText,
                    messages: wirePayload,
                  })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 text-[11px] font-mono text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy Payload'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30 text-xs font-medium font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('payload')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'payload'
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                Wire Messages ({wirePayload.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('system')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'system'
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                System Instruction ({systemPromptText.length} chars)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('memory')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'memory'
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                3-Level Memory
              </button>
            </div>

            {/* Tab Body Content */}
            <div className="flex-1 overflow-y-auto p-5 font-mono text-xs leading-relaxed space-y-4 max-h-[60vh]">
              {activeTab === 'payload' && (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-2">
                    <span>Cleaned Conversation Turns Passed to Model:</span>
                    <span>{wirePayload.length} turns</span>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 dark:bg-zinc-950 text-[11px] overflow-x-auto leading-relaxed selection:bg-cyan-800">
                    {JSON.stringify(wirePayload, null, 2)}
                  </pre>
                </div>
              )}

              {activeTab === 'system' && (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mb-2">
                    <span>Injected System Prompt ({activeMode?.name}):</span>
                    <span>{estimateTokens(systemPromptText)} tokens</span>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 dark:bg-zinc-950 text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed selection:bg-cyan-800">
                    {systemPromptText}
                  </pre>
                </div>
              )}

              {activeTab === 'memory' && (
                <div className="space-y-4">
                  {/* Level 1 */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-zinc-100 mb-1">
                      <Cpu className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Level 1: React Working Memory</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                      Messages in state: {messages.length} • Alignment Score: {alignmentScore ?? 35}% • Active Questions: {activeQuestions.length}
                    </p>
                  </div>

                  {/* Level 2 */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-zinc-100 mb-1">
                      <Database className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Level 2: Root Node Persistence (workflow_nodes)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                      Session ID: {sessionId || 'Unassigned (Pre-call)'} • Focus Branch: {currentBranch || 'Core Setup'}
                    </p>
                  </div>

                  {/* Level 3 */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-zinc-100 mb-1">
                      <Eye className="h-3.5 w-3.5 text-amber-500" />
                      <span>Level 3: Session Vision & Strategy (workflow_sessions)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                      Vision Content: {visionContent ? `${visionContent.length} chars (Ready for review)` : 'Not yet generated (Confidence < 85%)'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-[10.5px] font-mono text-slate-500 dark:text-zinc-400">
              <span>Token Budget: Safe ({totalTokensEst} / 102,400 max)</span>
              <span>100% Offline Inspection</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
