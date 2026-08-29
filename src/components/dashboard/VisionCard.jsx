/**
 * ==============================================================================
 * Component: VisionCard
 * ==============================================================================
 * Renders the synthesized Master Vision document in a formatted card:
 * - Clean document layout with copy support
 * - Dynamic Action CTA button (e.g., 'Cook & Build ⚡', 'Begin Execution 🚀')
 *   derived directly from the Mother Agent API response
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Sparkles, Copy, Check, ArrowRight, FileText } from 'lucide-react';

export default function VisionCard({
  visionContent,
  ctaLabel = 'Cook & Build ⚡',
  onProceed,
  isExecuting = false,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!visionContent) return;
    navigator.clipboard.writeText(visionContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!visionContent) return null;

  return (
    <div className="w-full my-6 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121316] shadow-sm transition-all overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Top Header Banner */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 flex items-center justify-center shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-zinc-100">
              Master Project Vision
            </h3>
            <p className="text-[10.5px] text-slate-400 dark:text-zinc-500">
              Synthesized by Mother Agent with 85%+ alignment confidence
            </p>
          </div>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? 'Copied' : 'Copy Vision'}</span>
        </button>
      </div>

      {/* Rendered Vision Content */}
      <div className="p-6 max-h-[500px] overflow-y-auto space-y-4 text-xs sm:text-[13px] text-slate-800 dark:text-zinc-200 leading-relaxed font-normal whitespace-pre-wrap selection:bg-slate-200 dark:selection:bg-zinc-800">
        {visionContent}
      </div>

      {/* Action Footer with Dynamic CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
          <FileText className="h-3.5 w-3.5" />
          <span>Vision approved. Ready to deploy multi-level execution graph.</span>
        </div>

        <button
          type="button"
          onClick={onProceed}
          disabled={isExecuting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
