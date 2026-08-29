/**
 * ==============================================================================
 * Component: ChatWorkspace (Frontier Reference Design)
 * ==============================================================================
 * Features:
 * - "Experience the frontier" elegant typography headline
 * - Clean, spacious input card with "Ask anything" prompt
 * - Bottom toolbar pills: "App files", "⚡ Olai M1", "..." and Send trigger
 * - 6 Quick-Start Template Cards Grid (Landing page, Dashboard, Game, Design to Code, etc.)
 * - Bottom-Right floating Community / Video preview callout card
 * - Dynamic model discovery from user API keys with Olai M1 credit model
 * - Interactive conversation stream with instant proxy dispatch
 * ==============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { sendProxyChatMessage } from '../../services/aiProxyService';
import { getUserApiKeys } from '../../services/apiKeyService';
import * as modelHealthService from '../../services/modelHealthService';
import {
  Paperclip,
  ArrowUp,
  Sparkles,
  ChevronDown,
  Cpu,
  Bot,
  User,
  Check,
  Copy,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Layout,
  BarChart3,
  Gamepad2,
  Scan,
  Database,
  Store,
  Zap,
  MoreHorizontal,
  Layers,
  SendHorizontal
} from 'lucide-react';

const ROTATING_PLACEHOLDERS = [
  'Ask anything',
  'Create a high-performance landing page...',
  'Generate an interactive analytics dashboard...',
  'Build a full-stack SaaS application with Supabase...',
];

const TEMPLATE_CARDS = [
  {
    id: 'landing-page',
    title: 'Create a landing page',
    subtitle: 'Create a sleek, modern landing page',
    prompt: 'Create a sleek, high-converting modern landing page for an AI developer platform with hero, features, and pricing.',
    icon: Layout,
  },
  {
    id: 'dashboard',
    title: 'Build a dashboard',
    subtitle: 'Turn data into interactive charts',
    prompt: 'Build an interactive SaaS analytics dashboard with real-time charts, metrics cards, and recent user activity.',
    icon: BarChart3,
  },
  {
    id: 'game',
    title: 'Make a game',
    subtitle: 'Build a playable browser game',
    prompt: 'Create a complete, fun and playable arcade browser game with high scores and keyboard controls.',
    icon: Gamepad2,
  },
  {
    id: 'design-to-code',
    title: 'Design to Code',
    subtitle: 'Upload an image and have AI build it',
    prompt: 'Convert the following UI mockups into clean, responsive Tailwind CSS components with accessible markup.',
    icon: Scan,
  },
  {
    id: 'fullstack-app',
    title: 'Build a fullstack app',
    subtitle: 'Create a templated full-stack app',
    prompt: 'Architect and generate a complete full-stack web application with Supabase auth, database RLS, and React frontend.',
    icon: Database,
  },
  {
    id: 'storefront',
    title: 'Launch a storefront',
    subtitle: 'Create a beautiful online shop',
    prompt: 'Design a high-end luxury e-commerce storefront with product filters, cart drawer, and checkout flow.',
    icon: Store,
  },
];

export default function ChatWorkspace({ onCreditDeducted }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showCalloutCard, setShowCalloutCard] = useState(true);

  // Rotating Placeholder State
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isPlaceholderFading, setIsPlaceholderFading] = useState(false);

  // Attachment state
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const modelDropdownRef = useRef(null);

  // Model Selection State (Default: Olai M1)
  const [selectedModel, setSelectedModel] = useState({
    id: 'olai-m1',
    name: 'Olai M1',
    provider: 'gemini',
    rawModel: 'gemini-2.0-flash',
    isPlatform: true,
    creditCost: '1 credit/query',
  });

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState([
    {
      id: 'olai-m1',
      name: 'Olai M1',
      provider: 'gemini',
      rawModel: 'gemini-2.0-flash',
      isPlatform: true,
      creditCost: '1 credit/query',
    },
  ]);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Rotating placeholder interval
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaceholderFading(true);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
        setIsPlaceholderFading(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Click outside detection for model dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  // Load and verify all available models from user API keys
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    async function loadAllVerifiedModels() {
      const list = [
        {
          id: 'olai-m1',
          name: 'Olai M1',
          provider: 'gemini',
          rawModel: 'gemini-2.0-flash',
          isPlatform: true,
          creditCost: '1 credit/query',
        },
      ];

      const { keys } = await getUserApiKeys(user.id);
      if (!keys) return;

      if (keys.geminiKey) {
        const geminiCheck = await modelHealthService.verifyGeminiKey(keys.geminiKey);
        if (isMounted && geminiCheck.isValid && geminiCheck.models?.length > 0) {
          geminiCheck.models.forEach((modelName) => {
            const formatted = modelName.replace('gemini-', 'Gemini ').replace('-', ' ');
            list.push({
              id: `gemini-${modelName}`,
              name: formatted.charAt(0).toUpperCase() + formatted.slice(1),
              provider: 'gemini',
              rawModel: modelName,
              isPlatform: false,
              creditCost: '',
            });
          });
        }
      }

      if (keys.openaiKey) {
        const openaiCheck = await modelHealthService.verifyOpenAIKey(keys.openaiKey);
        if (isMounted && openaiCheck.isValid && openaiCheck.models?.length > 0) {
          openaiCheck.models.forEach((modelName) => {
            list.push({
              id: `openai-${modelName}`,
              name: `OpenAI ${modelName}`,
              provider: 'openai',
              rawModel: modelName,
              isPlatform: false,
              creditCost: '',
            });
          });
        }
      }

      if (keys.claudeKey) {
        const claudeCheck = await modelHealthService.verifyClaudeKey(keys.claudeKey);
        if (isMounted && claudeCheck.isValid && claudeCheck.models?.length > 0) {
          claudeCheck.models.forEach((modelName) => {
            list.push({
              id: `claude-${modelName}`,
              name: `Claude ${modelName.replace('claude-', '')}`,
              provider: 'claude',
              rawModel: modelName,
              isPlatform: false,
              creditCost: '',
            });
          });
        }
      }

      if (isMounted) {
        setAvailableModels(list);
      }
    }

    loadAllVerifiedModels();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Auto-grow textarea
  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Handle file attachment
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments = files.map((file) => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type.startsWith('image/') ? 'image' : 'file',
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Send Message
  const handleSendMessage = async (textToSend = null) => {
    const cleanPrompt = (textToSend || prompt).trim();
    if (!cleanPrompt || isSending) return;

    setErrorMessage('');
    const userMessage = {
      role: 'user',
      content: cleanPrompt,
      attachments: [...attachments],
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setPrompt('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsSending(true);

    const apiPayload = updatedHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await sendProxyChatMessage({
      messages: apiPayload,
      provider: selectedModel.provider,
      model: selectedModel.rawModel,
    });

    setIsSending(false);

    if (result.error) {
      setErrorMessage(result.error);
    } else {
      const assistantMessage = {
        role: 'assistant',
        content: result.reply,
        modelName: selectedModel.name,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (onCreditDeducted && selectedModel.isPlatform) {
        onCreditDeducted();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isInitialEmptyState = messages.length === 0;

  return (
    <div className="relative flex h-full w-full flex-col overflow-y-auto bg-[#FAFAFA] dark:bg-[#0E0F12] transition-colors">
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />

      {/* =========================================================================
          ACTIVE CONVERSATION STREAM (When messages exist)
          ========================================================================= */}
      {!isInitialEmptyState && (
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="max-w-3xl mx-auto space-y-6 pb-6">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 font-semibold text-xs shadow-xs mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`flex flex-col space-y-1.5 max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900'
                          : 'bg-white dark:bg-[#121316] text-slate-900 dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-800'
                      }`}
                    >
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-white/20 dark:border-zinc-700">
                          {msg.attachments.map((att, attIdx) => (
                            <span
                              key={attIdx}
                              className="inline-flex items-center gap-1 rounded-md bg-black/10 dark:bg-white/10 px-2 py-0.5 text-[10.5px]"
                            >
                              <FileText className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{att.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400 dark:text-zinc-500">
                      {!isUser && <span>{msg.modelName || selectedModel.name}</span>}
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.content, idx)}
                          className="hover:text-slate-700 dark:hover:text-zinc-300 ml-1 transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedIndex === idx ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-xs mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-3 animate-in fade-in">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 text-xs">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white dark:bg-[#121316] border border-slate-200/80 dark:border-zinc-800 px-4 py-2.5 text-xs text-slate-500 dark:text-zinc-400 shadow-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-700 dark:text-zinc-300" />
                  <span>{selectedModel.name} is thinking...</span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 max-w-xl mx-auto">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* =========================================================================
          CENTER HERO & PROMPT COMPOSER
          ========================================================================= */}
      <div
        className={`relative z-20 flex w-full max-w-2xl flex-col mx-auto px-4 md:px-6 transition-all duration-300 ${
          isInitialEmptyState
            ? 'flex-1 items-center justify-center my-auto py-8'
            : 'shrink-0 pb-6'
        }`}
      >
        
        {/* Headline: "Experience the frontier" (Italics Serif) */}
        {isInitialEmptyState && (
          <div className="text-center mb-7 animate-in fade-in zoom-in-95 duration-300">
            <h1 className="text-3xl sm:text-4xl text-slate-900 dark:text-zinc-100 font-serif tracking-normal">
              Experience the <span className="italic font-normal">frontier</span>
            </h1>
          </div>
        )}

        {/* Main Input Composer Card */}
        <div className="relative w-full rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121316] shadow-xs p-3 sm:p-3.5 transition-all">
          
          {/* Top Line: Pen/Sparkle + Textarea */}
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-slate-400 dark:text-zinc-500 mt-1 shrink-0" />
            
            <div className="relative flex-1 min-h-[42px]">
              <textarea
                ref={textareaRef}
                rows={1}
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                className="w-full resize-none border-0 bg-transparent py-0 px-0 text-xs sm:text-[13.5px] text-slate-900 dark:text-zinc-100 focus:outline-none max-h-36 overflow-y-auto leading-relaxed z-10 relative"
              />

              {!prompt && (
                <div
                  className={`pointer-events-none absolute inset-0 flex items-center text-xs sm:text-[13.5px] text-slate-400 dark:text-zinc-500 transition-opacity duration-300 select-none ${
                    isPlaceholderFading ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {ROTATING_PLACEHOLDERS[placeholderIndex]}
                </div>
              )}
            </div>
          </div>

          {/* Attachment Preview Chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 my-2 px-1">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 px-2.5 py-1 text-xs text-slate-700 dark:text-zinc-300 shadow-2xs"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  <span className="truncate max-w-[140px] font-medium">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 ml-1 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Toolbar: Left Pills (App files, Olai M1, ...) and Right Buttons */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-zinc-800/70">
            
            {/* Left Controls */}
            <div className="flex items-center gap-1.5">
              
              {/* App files pill */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11.5px]">App files</span>
              </button>

              {/* Model selection pill (Olai M1) */}
              <div className="relative" ref={modelDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Zap className="h-3 w-3 text-slate-500" />
                  <span className="text-[11.5px] font-medium">{selectedModel.name}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isModelDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-68 max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121316] p-1.5 shadow-xl animate-in zoom-in-95">
                    <div className="px-2 py-1 text-[10.5px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      Select Model ({availableModels.length})
                    </div>
                    <div className="space-y-0.5">
                      {availableModels.map((m) => {
                        const isSelected = selectedModel.id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setSelectedModel(m);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100'
                                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
                            }`}
                          >
                            <div className="flex flex-col text-left overflow-hidden">
                              <span className="truncate font-medium">{m.name}</span>
                              {m.creditCost && (
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                                  {m.creditCost}
                                </span>
                              )}
                            </div>
                            {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-slate-900 dark:text-zinc-100 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ... Options Pill */}
              <button
                type="button"
                className="flex items-center justify-center h-6.5 w-6.5 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="More settings"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5">
              {/* Layers Icon */}
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Canvas Layout"
              >
                <Layers className="h-4 w-4" />
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!prompt.trim() || isSending}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 shadow-xs hover:bg-slate-800 dark:hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-35 disabled:scale-100 cursor-pointer"
                title="Send"
              >
                {isSending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <SendHorizontal className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================================
            QUICK START TEMPLATE CARDS GRID (2 cols x 3 rows)
            ===================================================================== */}
        {isInitialEmptyState && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-4 animate-in fade-in duration-300">
            {TEMPLATE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    setPrompt(card.prompt);
                    textareaRef.current?.focus();
                  }}
                  className="flex items-start gap-3 rounded-xl border border-slate-200/80 dark:border-zinc-800/90 bg-white dark:bg-[#121316] p-3 text-left transition-all hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-2xs active:scale-[0.99] cursor-pointer group"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200/70 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-100 transition-colors mt-0.5">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
                      {card.title}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                      {card.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* =========================================================================
          FLOATING BOTTOM-RIGHT COMMUNITY / VIDEO CARD
          ========================================================================= */}
      {isInitialEmptyState && showCalloutCard && (
        <div className="fixed bottom-5 right-5 z-40 w-64 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121316] shadow-xl p-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Card Image Banner */}
          <div className="relative h-24 w-full overflow-hidden rounded-xl bg-slate-900 dark:bg-zinc-800 flex items-center justify-center text-white text-xs font-semibold">
            <img
              src="/Olai Logo.png"
              alt="Olai Preview"
              className="h-10 w-auto object-contain opacity-90"
            />
          </div>

          <div className="mt-2.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
              Join us on YouTube
            </h4>
            <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 mt-1 leading-snug">
              Product walkthroughs, model analysis, and researcher insights from the frontier.
            </p>

            <div className="mt-3 flex flex-col gap-1.5">
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center rounded-lg bg-slate-900 dark:bg-zinc-100 py-1.5 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Watch Now
              </a>
              <button
                type="button"
                onClick={() => setShowCalloutCard(false)}
                className="flex w-full items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Hide This
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
