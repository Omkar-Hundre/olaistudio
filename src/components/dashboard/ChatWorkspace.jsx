/**
 * ==============================================================================
 * Component: ChatWorkspace (Purpose-Driven Frontier Workspace)
 * ==============================================================================
 * Features:
 * - "Experience the frontier" elegant typography headline
 * - Pixel-perfect baseline & vertical alignment for Sparkles icon and animated placeholders
 * - Auto-expanding prompt textarea with sleek custom scrollbar
 * - Core Purpose-Driven Modes (Deep Research, Product Planning, Architecture Design, Task Execution)
 * - Attached gradient Mode Bar on the chat composer with one-click dismiss (✕)
 * - Dynamic mode-specific suggestions & rotating placeholders
 * - Responsive model selection and instant proxy execution
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
  Search,
  Compass,
  Layers,
  Zap,
  MoreHorizontal,
  SendHorizontal
} from 'lucide-react';

const WORKSPACE_MODES = [
  {
    id: 'research',
    name: 'Deep Research',
    badge: 'Research Mode',
    gradient: 'from-blue-500/15 via-indigo-500/15 to-purple-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
    icon: Search,
    title: 'Deep Research & Analysis',
    subtitle: 'Synthesize complex topics, verify sources & uncover technical insights',
    placeholders: [
      'What technical topic or market landscape would you like to research?',
      'Compare modern state management approaches in React 19...',
      'Analyze trade-offs between PostgreSQL vector indexing and Pinecone...',
      'Synthesize the latest advancements in LLM reasoning engines...',
    ],
    suggestions: [
      'Compare PostgreSQL vs DynamoDB for high-throughput SaaS',
      'Analyze latest WebAssembly runtime performance benchmarks',
      'Deep-dive into Supabase RLS security and indexing best practices',
      'Synthesize state of generative AI coding assistants in 2026',
    ],
  },
  {
    id: 'product',
    name: 'Product Planning',
    badge: 'Product Planning Mode',
    gradient: 'from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border-teal-500/30 text-teal-700 dark:text-teal-300',
    icon: Compass,
    title: 'Product & Feature Planning',
    subtitle: 'Draft PRDs, user flows, acceptance criteria & milestone roadmaps',
    placeholders: [
      'Describe the product idea or feature you want to plan...',
      'Draft a comprehensive PRD with user stories and edge cases...',
      'Define milestone timeline for our MVP release...',
      'Map out complete user onboarding flow and conversion funnel...',
    ],
    suggestions: [
      'Draft comprehensive PRD with acceptance criteria & edge cases',
      'Create user onboarding journey & milestone timeline roadmap',
      'Break down full MVP requirements into sprint-ready epics',
      'Define KPI metrics & event analytics schema for user retention',
    ],
  },
  {
    id: 'architecture',
    name: 'System Architecture',
    badge: 'Architecture Design Mode',
    gradient: 'from-purple-500/15 via-pink-500/15 to-rose-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300',
    icon: Layers,
    title: 'System & Architecture Design',
    subtitle: 'Architect full-stack database schemas, auth workflows & APIs',
    placeholders: [
      'What system or database structure are you designing?',
      'Design a multi-tenant PostgreSQL schema with RLS...',
      'Architect an event-driven background worker pipeline...',
      'Model secure OAuth2 + session token auth flow...',
    ],
    suggestions: [
      'Design multi-tenant PostgreSQL schema with RLS and foreign keys',
      'Architect real-time WebSocket event dispatch pipeline',
      'Model secure OAuth2 + session token auth flow with revocation',
      'Design resilient distributed caching strategy with Redis',
    ],
  },
  {
    id: 'execution',
    name: 'Task Execution',
    badge: 'Complex Task Execution Mode',
    gradient: 'from-amber-500/15 via-orange-500/15 to-red-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300',
    icon: Cpu,
    title: 'Autonomous Task Execution',
    subtitle: 'Break down complex multi-step coding tasks and implement end-to-end',
    placeholders: [
      'Describe the multi-step feature or implementation task...',
      'Execute end-to-end refactor of auth and session management...',
      'Generate end-to-end integration test suite with mocking...',
      'Implement webhook ingestion with idempotent retry logic...',
    ],
    suggestions: [
      'Plan and generate full-stack CRUD feature with validation',
      'Step-by-step migration from REST endpoints to GraphQL schema',
      'Implement robust rate-limiting and audit logging middleware',
      'Create complete end-to-end automated testing workflow',
    ],
  },
];

const DEFAULT_PLACEHOLDERS = [
  'Ask Olai M1 anything or pick a mode below...',
  'Research a breakthrough idea or technical concept...',
  'Plan your next product architecture and database...',
  'Break down a complex engineering task into stages...',
];

export default function ChatWorkspace({ onCreditDeducted }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showCalloutCard, setShowCalloutCard] = useState(true);

  // Active Mode State
  const [activeMode, setActiveMode] = useState(null);

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
    creditCost: 'Default • High-speed platform intelligence',
  });

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState([
    {
      id: 'olai-m1',
      name: 'Olai M1',
      provider: 'gemini',
      rawModel: 'gemini-2.0-flash',
      isPlatform: true,
      creditCost: 'Default • High-speed platform intelligence',
    },
  ]);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Current active placeholder set
  const currentPlaceholders = activeMode ? activeMode.placeholders : DEFAULT_PLACEHOLDERS;

  // Rotating placeholder interval
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaceholderFading(true);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % currentPlaceholders.length);
        setIsPlaceholderFading(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentPlaceholders.length]);

  // Reset placeholder index when active mode changes
  useEffect(() => {
    setPlaceholderIndex(0);
  }, [activeMode]);

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

  // Auto-grow textarea height dynamically based on value changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const nextHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(nextHeight, 180)}px`;
  }, [prompt]);

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
          creditCost: 'Default • High-speed platform intelligence',
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
              creditCost: 'Custom Key • Google AI Ultra-low latency',
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
              creditCost: 'Custom Key • OpenAI Core Reasoning',
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
              creditCost: 'Custom Key • Anthropic Frontier Accuracy',
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

  // Handle manual changes to prompt text
  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
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
    const rawText = (textToSend || prompt).trim();
    if (!rawText || isSending) return;

    setErrorMessage('');
    
    // Prefix context if in a specialized mode
    const finalContent = activeMode
      ? `[Mode: ${activeMode.name}]\n${rawText}`
      : rawText;

    const userMessage = {
      role: 'user',
      content: finalContent,
      displayContent: rawText,
      modeName: activeMode?.name,
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
                      {/* Attached files preview */}
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

                      {/* Mode Badge Tag in Chat */}
                      {msg.modeName && (
                        <div className="inline-block rounded-md bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                          Mode: {msg.modeName}
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{msg.displayContent || msg.content}</p>
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
          
          {/* Active Mode Bar Attached on Top */}
          {activeMode && (
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800/80 animate-in slide-in-from-top-1 fade-in duration-200">
              <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium bg-gradient-to-r ${activeMode.gradient} border shadow-2xs`}>
                <activeMode.icon className="h-3.5 w-3.5" />
                <span>{activeMode.badge}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveMode(null)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Deselect mode"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Top Line: Sparkles + Textarea + Aligned Placeholder */}
          <div className="flex items-start gap-2.5 pt-0.5">
            <Sparkles className="h-4 w-4 text-slate-400 dark:text-zinc-500 mt-[2px] shrink-0 self-start" />
            
            <div className="relative flex-1 min-h-[40px]">
              <textarea
                ref={textareaRef}
                rows={1}
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                className="w-full resize-none border-0 bg-transparent py-0 px-0 text-xs sm:text-[13.5px] leading-5 text-slate-900 dark:text-zinc-100 focus:outline-none max-h-[180px] overflow-y-auto z-10 relative custom-scrollbar"
              />

              {!prompt && (
                <div
                  className={`pointer-events-none absolute top-0 left-0 text-xs sm:text-[13.5px] leading-5 text-slate-400 dark:text-zinc-500 transition-opacity duration-300 select-none truncate max-w-full ${
                    isPlaceholderFading ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {currentPlaceholders[placeholderIndex]}
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
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-72 max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121316] p-1.5 shadow-xl animate-in zoom-in-95">
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
            BELOW CARDS / MODE-SPECIFIC PROMPT SUGGESTIONS
            ===================================================================== */}
        {isInitialEmptyState && (
          <div className="w-full mt-4">
            {activeMode ? (
              /* Mode Specific Subtitle Task Suggestions */
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    {activeMode.name} Suggestions
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveMode(null)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    View all modes
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeMode.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(suggestion);
                        textareaRef.current?.focus();
                      }}
                      className="flex items-start gap-2.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-[#121316]/90 p-2.5 text-left transition-all hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-2xs active:scale-[0.99] cursor-pointer group"
                    >
                      <span className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5 group-hover:text-slate-800 dark:group-hover:text-zinc-200 transition-colors">
                        ✦
                      </span>
                      <span className="text-xs text-slate-700 dark:text-zinc-300 leading-snug group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {suggestion}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* 4 Core Purpose-Driven Mode Cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full animate-in fade-in duration-300">
                {WORKSPACE_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setActiveMode(mode);
                        textareaRef.current?.focus();
                      }}
                      className="flex items-start gap-3 rounded-xl border border-slate-200/80 dark:border-zinc-800/90 bg-white dark:bg-[#121316] p-3 text-left transition-all hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-2xs active:scale-[0.99] cursor-pointer group"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200/70 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-100 transition-colors mt-0.5">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
                          {mode.title}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                          {mode.subtitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
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
