import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Eye,
  Loader2,
  SendHorizontal,
  Copy,
  Check,
  Code2,
  FileText,
  RotateCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import { chatWithSection } from '../../services/sectionWorkflowService';

/**
 * Extracts clean HTML from a Gemini response.
 * Strips markdown code fences and leading preamble sentence.
 */
function extractHtml(text) {
  if (!text) return '';
  // Try to pull content from a ```html ... ``` block
  const match = text.match(/```(?:html|jsx|xml)?\s*([\s\S]*?)```/i);
  if (match) return match[1].trim();
  // If response itself looks like raw HTML (starts with <)
  if (/^\s*</.test(text.trim())) return text.trim();
  return text;
}

export default function SectionWorkflowDeck({
  sections = [],
  onUpdateSection,
  onOpenPreview,
  projectTitle = 'Project',
}) {
  const [activeTab, setActiveTab] = useState({}); // sectionId -> 'chat' | 'code'
  const [inputs, setInputs] = useState({}); // sectionId -> text
  const [copiedId, setCopiedId] = useState(null);
  const scrollRefs = useRef({});

  // Auto-scroll each section card to bottom when its messages update
  useEffect(() => {
    sections.forEach(s => {
      const el = scrollRefs.current[s.id];
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [sections]);

  const handleInputChange = (sectionId, value) => {
    setInputs(prev => ({ ...prev, [sectionId]: value }));
  };

  const handleCopySectionCode = (sectionId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(sectionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSectionSendMessage = async (section) => {
    const text = (inputs[section.id] || '').trim();
    if (!text || section.isGenerating) return;

    // Clear input
    setInputs(prev => ({ ...prev, [section.id]: '' }));

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    // Only pass existing messages (no pending assistant placeholder) as history
    const existingHistory = (section.messages || []).filter(m => m.role === 'user' || m.role === 'assistant');
    const updatedHistory = [...existingHistory, userMessage];

    // Optimistically update section with user message
    onUpdateSection(section.id, {
      messages: updatedHistory,
      isGenerating: true,
    });

    try {
      const reply = await chatWithSection({
        section,
        history: updatedHistory,  // history already has the new user msg
        userMessage: text,        // used as fallback guard in service
      });

      const cleanHtml = extractHtml(reply);

      const assistantMessage = {
        role: 'assistant',
        content: reply,           // full reply (markdown + HTML) for chat display
        timestamp: new Date().toISOString(),
      };

      onUpdateSection(section.id, {
        content: cleanHtml || reply,  // clean HTML for code tab & preview
        messages: [...updatedHistory, assistantMessage],
        isGenerating: false,
      });
    } catch (err) {
      console.error(`Error chatting with section ${section.id}:`, err);
      onUpdateSection(section.id, {
        isGenerating: false,
        error: err.message || 'Failed to update section',
      });
    }
  };

  return (
    <div className="w-full my-6 space-y-4 animate-in fade-in duration-300">
      {/* Top Deck Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 flex items-center justify-center shadow-xs shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Modular Section Workflows
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-semibold text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60">
                {sections.length} Sections
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Iterate on individual landing page sections in parallel
            </p>
          </div>
        </div>

        {/* Live Preview Button */}
        <button
          type="button"
          onClick={onOpenPreview}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Preview Landing Page</span>
        </button>
      </div>

      {/* Horizontal Scroll Deck */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar snap-x snap-mandatory">
        {sections.map((section, idx) => {
          const isCodeTab = activeTab[section.id] === 'code';
          const sectionMessages = section.messages || [];

          return (
            <div
              key={section.id}
              className="flex flex-col w-[360px] sm:w-[420px] shrink-0 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#15171C] shadow-sm overflow-hidden snap-start transition-all"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-200 dark:bg-zinc-800 text-[10px] font-semibold text-slate-700 dark:text-zinc-300">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                      {section.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-[200px]">
                      {section.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {section.isGenerating && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium px-2 py-0.5 rounded bg-amber-500/10">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Generating</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab(prev => ({ ...prev, [section.id]: isCodeTab ? 'chat' : 'code' }))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer text-[10.5px]"
                    title={isCodeTab ? 'View Chat' : 'View Code'}
                  >
                    {isCodeTab ? <FileText className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopySectionCode(section.id, section.content || '')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                    title="Copy Section Markup"
                  >
                    {copiedId === section.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Card Chat Body */}
              <div
                ref={el => (scrollRefs.current[section.id] = el)}
                className="min-h-[160px] max-h-[420px] overflow-y-auto p-4 space-y-3.5 text-xs text-slate-800 dark:text-zinc-200 custom-scrollbar"
              >
                {isCodeTab ? (
                  <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-zinc-300 overflow-x-auto">
                    <pre>{section.content || 'Generating section code...'}</pre>
                  </div>
                ) : (
                  <>
                    {sectionMessages.length === 0 && section.isGenerating && (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400 dark:text-zinc-500 gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-600 dark:text-zinc-400" />
                        <span className="text-xs">Generating {section.title}...</span>
                      </div>
                    )}

                    {sectionMessages.map((msg, mIdx) => (
                      <div
                        key={mIdx}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-900'
                              : 'bg-slate-50 dark:bg-zinc-900/70 border border-slate-200/60 dark:border-zinc-800 text-slate-800 dark:text-zinc-200'
                          }`}
                        >
                          {msg.role === 'user' ? (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            <MarkdownRenderer content={msg.content} />
                          )}
                        </div>
                        <span className="text-[9.5px] text-slate-400 dark:text-zinc-600 mt-1 px-1">
                          {msg.role === 'user' ? 'You' : section.title}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Card Footer: Individual Chat Input */}
              <div className="p-3 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSectionSendMessage(section);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputs[section.id] || ''}
                    onChange={(e) => handleInputChange(section.id, e.target.value)}
                    placeholder={`Refine ${section.title}...`}
                    disabled={section.isGenerating}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-600 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputs[section.id]?.trim() || section.isGenerating}
                    className="p-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                    title="Send section prompt"
                  >
                    {section.isGenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <SendHorizontal className="h-3.5 w-3.5" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
