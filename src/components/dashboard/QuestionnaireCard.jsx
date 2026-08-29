/**
 * ==============================================================================
 * Component: QuestionnaireCard
 * ==============================================================================
 * Interactive 4-Option Stepper Questionnaire for Mother Agent interviews:
 * - Displays 1 question at a time with clean step indicators
 * - 3 pre-suggested structured choices + 1 custom write-in input box
 * - Sleek minimal SaaS design with smooth transitions and Back/Next/Submit navigation
 * - No technical AI jargon (Rule 16)
 * ==============================================================================
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, SendHorizontal, Check, Edit3 } from 'lucide-react';

export default function QuestionnaireCard({ questions = [], onSubmit, isSending = false }) {
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
    <div className="w-full my-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#121316]/90 backdrop-blur-md p-5 shadow-xs transition-all animate-in fade-in duration-300">
      {/* Header: Progress & Step Counter */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/60 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
            Project Details
          </span>
          <span className="text-[10.5px] text-slate-400 dark:text-zinc-500">
            • Question {currentIndex + 1} of {totalQuestions}
          </span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-5 bg-slate-900 dark:bg-zinc-100'
                  : answers[questions[idx].id]
                  ? 'w-1.5 bg-slate-400 dark:bg-zinc-600'
                  : 'w-1.5 bg-slate-200 dark:bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question Title */}
      <div className="mb-4">
        <h4 className="text-sm sm:text-[14.5px] font-medium text-slate-900 dark:text-zinc-100 leading-snug">
          {currentQ.question}
        </h4>
      </div>

      {/* 4 Options Grid */}
      <div className="space-y-2.5 mb-5">
        {/* Pre-suggested Options (1-3) */}
        {currentQ.options?.map((option, optIdx) => {
          const isSelected = currentAnswer === option;
          return (
            <button
              key={optIdx}
              type="button"
              onClick={() => handleSelectOption(option)}
              className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-xl border text-xs sm:text-[12.5px] transition-all cursor-pointer ${
                isSelected
                  ? 'border-slate-900 dark:border-zinc-100 bg-slate-900/[0.03] dark:bg-zinc-100/[0.04] text-slate-900 dark:text-zinc-100 font-medium ring-1 ring-slate-900/10 dark:ring-zinc-100/10'
                  : 'border-slate-200/70 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/30 text-slate-700 dark:text-zinc-300'
              }`}
            >
              <span className="flex-1 pr-3 leading-relaxed">{option}</span>
              <div
                className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-slate-900'
                    : 'border-slate-300 dark:border-zinc-700'
                }`}
              >
                {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}

        {/* Option 4: Custom Input Box */}
        <div
          className={`rounded-xl border p-3 transition-all ${
            currentAnswer.startsWith('Custom:')
              ? 'border-slate-900 dark:border-zinc-100 bg-slate-900/[0.03] dark:bg-zinc-100/[0.04] ring-1 ring-slate-900/10 dark:ring-zinc-100/10'
              : 'border-slate-200/70 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Edit3 className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
            <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
              Custom Specification / Other
            </span>
          </div>
          <input
            type="text"
            value={currentCustomText}
            onChange={handleCustomInputChange}
            placeholder="Type your own custom requirement..."
            className="w-full bg-transparent border-0 px-1 py-1 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-hidden focus:ring-0"
          />
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/60">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentIndex === 0 || isSending}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
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
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={!isCurrentAnswered || isSending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <span>Submit</span>
              <SendHorizontal className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
