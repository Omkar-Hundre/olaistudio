/**
 * ==============================================================================
 * Component: VisionCard
 * ==============================================================================
 * Renders the synthesized Project Plan document in a formatted card:
 * - Clean document layout with copy support
 * - Interactive inline Plan Editor (allows user to update/tweak any section of the plan)
 * - Single-word dynamic action button (e.g., 'Cook', 'Build', 'Start', 'Begin')
 *   strictly adhering to Rule 16 (No technical jargon)
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Sparkles, Copy, Check, ArrowRight, FileText, Edit3, X, Save } from 'lucide-react';
import MarkdownRenderer from '../ui/MarkdownRenderer.jsx';

export default function VisionCard({
  visionContent,
  ctaLabel = 'Cook',
  onProceed,
  onUpdatePlan,
  isExecuting = false,
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(visionContent || '');

  const handleCopy = () => {
    if (!visionContent) return;
    navigator.clipboard.writeText(visionContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    if (onUpdatePlan && editedContent.trim()) {
      onUpdatePlan(editedContent.trim());
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(visionContent || '');
    setIsEditing(false);
  };

  // Rule 16: Ensure single-word action label with no emojis or jargon sentences
  const singleWordCta = typeof ctaLabel === 'string'
    ? ctaLabel.trim().split(/[\s&⚡🚀]+/)[0] || 'Cook'
    : 'Cook';

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
              Project Plan
            </h3>
            <p className="text-[10.5px] text-slate-400 dark:text-zinc-500">
              {isEditing ? 'Editing plan parameters' : 'Plan ready for review'}
            </p>
          </div>
        </div>

        {/* Action Controls: Edit & Copy */}
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditedContent(visionContent);
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
                title="Edit Plan"
              >
                <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                <span>Edit Plan</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <Save className="h-3 w-3" />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rendered or Editable Vision Content */}
      {isEditing ? (
        <div className="p-4 sm:p-5">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={14}
            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/60 dark:bg-zinc-900/60 p-4 text-xs sm:text-[13px] text-slate-900 dark:text-zinc-100 leading-relaxed font-mono focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-500 custom-scrollbar"
            placeholder="Edit your plan markdown here..."
          />
        </div>
      ) : (
        <div className="p-6 max-h-[550px] overflow-y-auto space-y-4 text-xs sm:text-[13px] text-slate-800 dark:text-zinc-200 leading-relaxed font-normal selection:bg-slate-200 dark:selection:bg-zinc-800 custom-scrollbar">
          <MarkdownRenderer content={visionContent} />
        </div>
      )}

      {/* Action Footer with Single-Word CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
          <FileText className="h-3.5 w-3.5" />
          <span>{isEditing ? 'Make your adjustments above and click Save' : 'Plan finalized. Ready to proceed.'}</span>
        </div>

        <button
          type="button"
          onClick={onProceed}
          disabled={isExecuting || isEditing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <span>{singleWordCta}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
