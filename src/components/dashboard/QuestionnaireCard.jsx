/**
 * ==============================================================================
 * Component: QuestionnaireCard
 * ==============================================================================
 * Interactive Tile-View Questionnaire & Alignment Card:
 * - Appears right below the response turn
 * - Integrates real-time alignment meter (35% -> 85%+) & "Skip & Build" button
 * - Tile-based selectable options (3 tailored choices + 1 custom input)
 * - 100% responsive, sleek dark obsidian / light slate SaaS design
 * ==============================================================================
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, SendHorizontal, Check, Edit3, Zap } from 'lucide-react';

export default function QuestionnaireCard({
  questions = [],
  alignmentScore = 35,
  currentBranch = '',
  onSubmit,
  onSkip,
  isSending = false,
}) {
  if (!questions || questions.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [customInputs, setCustomInputs] = useState({});

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const currentAnswer = answers[currentQ?.id] || '';
  const currentCustomText = customInputs[currentQ?.id] || '';

  const handleSelectOption = (optionText) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionText,
    }));
  };

  const handleCustomInputChange = (e) => {
    const text = e.target.value;
    setCustomInputs((prev) => ({
      ...prev,
      [currentQ.id]: text,
    }));
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: text.trim() ? `Custom: ${text.trim()}` : '',
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitAll = () => {
    const compiledParts = questions.map((q, idx) => {
      const ans = answers[q.id] || 'Recommended default';
      return `${idx + 1}. ${q.question}\n→ Selected: ${ans}`;
    });

    const finalResponse = `Here are my choices:\n\n${compiledParts.join('\n\n')}`;
    if (onSubmit) {
      onSubmit(finalResponse);
    }
  };

  const isCurrentAnswered = Boolean(currentAnswer);

  return (
    <div className="w-full my-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#1A1D24] shadow-sm transition-all overflow-hidden animate-in fade-in duration-300">
      
      {/* Top Bar: Alignment Score + Current Focus + Skip Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 dark:border-zinc-800/70 bg-slate-50/70 dark:bg-[#1E222B]/60">
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-[190px]">
          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 whitespace-nowrap">
            Alignment {alignmentScore}%
          </span>
          <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-slate-700 to-slate-900 dark:from-zinc-300 dark:to-white transition-all duration-700 ease-out rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, alignmentScore))}%` }}
            />
          </div>
        </div>

        {currentBranch && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 truncate">
            <span className="text-slate-400 dark:text-zinc-500">Focus:</span>
            <span className="font-medium text-slate-700 dark:text-zinc-300 truncate">{currentBranch}</span>
          </div>
        )}

        {onSkip && alignmentScore < 85 && (
          <button
            type="button"
            onClick={onSkip}
            disabled={isSending}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50 ml-auto sm:ml-0"
            title="Bypass remaining questions and generate plan immediately"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
            <span>Skip & Build</span>
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <div className="flex items-center gap-1.5">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-5 bg-slate-900 dark:bg-zinc-100'
                    : answers[questions[idx].id]
                    ? 'w-1.5 bg-slate-400 dark:bg-zinc-500'
                    : 'w-1.5 bg-slate-200 dark:bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question Title */}
        <h4 className="text-sm sm:text-[15px] font-medium text-slate-900 dark:text-zinc-100 leading-snug mb-5">
          {currentQ.question}
        </h4>

        {/* Options Grid (Tiles View) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Pre-suggested Options (1-3) */}
          {currentQ.options?.map((option, optIdx) => {
            const isSelected = currentAnswer === option;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(option)}
                className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 dark:border-zinc-100 bg-slate-900/[0.04] dark:bg-zinc-100/[0.06] text-slate-900 dark:text-zinc-100 font-medium ring-1 ring-slate-900/10 dark:ring-zinc-100/20'
                    : 'border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-[#1E222B]/40 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
                    0{optIdx + 1}
                  </span>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-slate-900'
                        : 'border-slate-300 dark:border-zinc-700'
                    }`}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                </div>
                <span className="text-xs sm:text-[13px] leading-relaxed">{option}</span>
              </button>
            );
          })}

          {/* Option 4: Custom Input Box Tile */}
          <div
            className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
              currentAnswer.startsWith('Custom:')
                ? 'border-slate-900 dark:border-zinc-100 bg-slate-900/[0.04] dark:bg-zinc-100/[0.06] ring-1 ring-slate-900/10 dark:ring-zinc-100/20'
                : 'border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-[#1E222B]/40'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Edit3 className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                04 • Custom
              </span>
            </div>
            <input
              type="text"
              value={currentCustomText}
              onChange={handleCustomInputChange}
              placeholder="Type your own requirement..."
              className="w-full bg-transparent border-0 px-1 py-1 text-xs sm:text-[13px] text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-hidden focus:ring-0"
            />
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/70">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentIndex === 0 || isSending}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            {!isLastQuestion ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isCurrentAnswered || isSending}
                className="inline-flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitAll}
                disabled={!isCurrentAnswered || isSending}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span>Submit</span>
                <SendHorizontal className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
