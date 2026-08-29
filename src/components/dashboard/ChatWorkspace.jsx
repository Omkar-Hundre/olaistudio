/**
 * ==============================================================================
 * Component: ChatWorkspace (Purpose-Driven Frontier Workspace)
 * ==============================================================================
 * Features:
 * - "Experience the frontier" elegant typography headline
 * - Pixel-perfect baseline & vertical alignment for Sparkles icon and animated placeholders
 * - Liquid animated flowing gradient border wrapping the entire chatbar
 * - Attached Full-Width Mode Bar with smooth sliding transition and one-click dismiss (✕)
 * - Auto-expanding prompt textarea with sleek custom scrollbar
 * - 3 General Accessible Suggestions per mode in a clean vertical stack with line dividers
 * - Responsive model selection and instant proxy execution
 * ==============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { sendProxyChatMessage, sendStreamingProxyChatMessage } from '../../services/aiProxyService';
import { getUserApiKeys } from '../../services/apiKeyService';
import * as modelHealthService from '../../services/modelHealthService';
import { getWorkspaceModes, DEFAULT_WORKSPACE_MODES } from '../../services/workspaceModeService';
import { getPlatformModels } from '../../services/platformModelService';
import { parseLocalFile } from '../../utils/fileParser';
import { uploadFilesSecurely } from '../../services/s3Service';
import { parseSystemCommands } from '../../utils/systemCommandParser';
import { createWorkflowSession, updateWorkflowSession, getWorkflowSession, saveRootSessionState } from '../../services/workflowService';
import { supabase } from '../../lib/supabase';
import QuestionnaireCard from './QuestionnaireCard';
import VisionCard from './VisionCard';
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
  SendHorizontal,
  RotateCw,
} from 'lucide-react';

const MODE_ICONS = {
  research: Search,
  product: Compass,
  architecture: Layers,
  execution: Cpu,
};

const DEFAULT_PLACEHOLDERS = [
  'Ask Olai M1 anything or choose a mode below...',
  'Research a breakthrough idea or technical concept...',
  'Plan your next product architecture and database...',
  'Break down a complex engineering task into stages...',
];

export default function ChatWorkspace({
  activeSessionId = null,
  onCreditDeducted,
  onSessionCreated,
}) {
  const { user } = useAuth();
  const [workspaceModes, setWorkspaceModes] = useState(DEFAULT_WORKSPACE_MODES);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showCalloutCard, setShowCalloutCard] = useState(true);

  // Mother Agent Workflow & Alignment State
  const sessionIdRef = useRef(activeSessionId);
  const [sessionId, setSessionId] = useState(activeSessionId);
  const [alignmentScore, setAlignmentScore] = useState(null);
  const [currentBranch, setCurrentBranch] = useState('');
  const [sessionTitle, setSessionTitle] = useState('New Session');
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [visionContent, setVisionContent] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Cook');
  const [isExecuting, setIsExecuting] = useState(false);

  // Active Mode State
  const [activeMode, setActiveMode] = useState(null);

  // Load existing session data when activeSessionId changes
  useEffect(() => {
    sessionIdRef.current = activeSessionId;
    setSessionId(activeSessionId);
    if (activeSessionId) {
      getWorkflowSession(activeSessionId).then(({ session }) => {
        if (session) {
          setAlignmentScore(session.confidence_score ?? 35);
          setSessionTitle(session.title || 'New Session');
          if (session.vision_content) {
            setVisionContent(session.vision_content);
          }
        }
      });

      supabase
        .from('workflow_nodes')
        .select('conversation_history, hidden_commands')
        .eq('session_id', activeSessionId)
        .order('depth', { ascending: true })
        .limit(1)
        .then(({ data: nodes }) => {
          const rootNode = nodes?.[0];
          if (rootNode?.conversation_history && Array.isArray(rootNode.conversation_history)) {
            setMessages(rootNode.conversation_history);
          }
          if (rootNode?.hidden_commands) {
            const cmd = rootNode.hidden_commands;
            if (cmd.current_branch) setCurrentBranch(cmd.current_branch);
            if (cmd.questions && Array.isArray(cmd.questions)) setActiveQuestions(cmd.questions);
            if (cmd.cta_label) setCtaLabel(cmd.cta_label);
          }
        });
    } else {
      setMessages([]);
      setAlignmentScore(null);
      setCurrentBranch('');
      setActiveQuestions([]);
      setVisionContent('');
      setErrorMessage('');
    }
  }, [activeSessionId]);

  // Load and sync modes from Supabase
  useEffect(() => {
    let isMounted = true;
    getWorkspaceModes().then((modes) => {
      if (isMounted && modes) {
        setWorkspaceModes(modes);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
      // 1. Fetch dynamic platform models (e.g. Olai M1)
      const platformModels = await getPlatformModels();
      const list = [...platformModels];

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
        
        // Ensure the default selected model is updated with dynamic DB values
        setSelectedModel((prev) => {
          const updatedPlatformModel = list.find(m => m.id === prev.id);
          return updatedPlatformModel || prev;
        });
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
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const parsedFiles = await Promise.all(files.map(f => parseLocalFile(f)));
      setAttachments((prev) => [...prev, ...parsedFiles]);
    } catch (err) {
      setErrorMessage(err.message);
    }

    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Send Message
  const handleSendMessage = async (textToSend = null, displayOverride = null) => {
    const rawText = (textToSend || prompt).trim();
    if ((!rawText && attachments.length === 0) || isSending) return;

    setErrorMessage('');
    setIsSending(true);

    let finalContent = activeMode ? `[Mode: ${activeMode.name}]\n${rawText}` : rawText;
    let uploadedS3Refs = [];

    // JIT S3 Uploading and Context Injection
    if (attachments.length > 0) {
      try {
        const rawFiles = attachments.map(a => a.file);
        uploadedS3Refs = await uploadFilesSecurely(rawFiles);
        
        // Append parsed text content to final prompt
        attachments.forEach(att => {
          if (att.textContent) {
            finalContent += `\n\n--- File Content: ${att.name} ---\n${att.textContent}`;
          }
        });
      } catch (err) {
        setErrorMessage(`Upload failed: ${err.message}`);
        setIsSending(false);
        return;
      }
    }

    const userMessage = {
      role: 'user',
      content: finalContent,
      displayContent: displayOverride || rawText,
      modeName: activeMode?.name,
      attachments: attachments.map(a => ({ name: a.name, type: a.type })),
      s3Refs: uploadedS3Refs,
      timestamp: new Date().toISOString(),
    };

    const assistantPlaceholder = {
      role: 'assistant',
      content: '',
      modelName: selectedModel.name,
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    const updatedHistory = [...messages, userMessage];
    setMessages([...updatedHistory, assistantPlaceholder]);
    setPrompt('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const apiPayload = updatedHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let activeSessionId = sessionIdRef.current;
    if (!activeSessionId) {
      if (alignmentScore === null) setAlignmentScore(35);
      const sessionResult = await createWorkflowSession({
        title: 'New Conversation',
        mode: activeMode?.id || 'research',
      });
      if (sessionResult.session) {
        activeSessionId = sessionResult.session.id;
        sessionIdRef.current = activeSessionId;
        setSessionId(activeSessionId);
      }
    }

    const startTime = performance.now();
    let firstChunkTime = null;

    try {
      await sendStreamingProxyChatMessage({
        messages: apiPayload,
        provider: selectedModel.provider,
        model: selectedModel.rawModel,
        systemPrompt: activeMode?.systemPrompt || '',
        onChunk: (_delta, accumulatedFullText) => {
          if (!firstChunkTime) {
            firstChunkTime = performance.now();
            console.log(`[AI Performance] ⚡ TTFT (Time to First Token): ${Math.round(firstChunkTime - startTime)}ms`);
          }

          let cleanStreamingText = '';
          
          // If response is streaming JSON, extract greeting preview dynamically
          const greetingMatch = accumulatedFullText.match(/"greeting"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
          if (greetingMatch) {
            cleanStreamingText = greetingMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          } else if (accumulatedFullText.trim().startsWith('{') || accumulatedFullText.trim().startsWith('```')) {
            cleanStreamingText = 'Analyzing requirements and preparing questions...';
          } else {
            cleanStreamingText = accumulatedFullText.replace(/%%%SYSTEM_CMD%%%[\s\S]*$/, '').trim();
          }

          setMessages((prev) => {
            const next = [...prev];
            if (next.length > 0) {
              next[next.length - 1] = {
                ...next[next.length - 1],
                content: accumulatedFullText,
                displayContent: cleanStreamingText,
              };
            }
            return next;
          });
        },
        onDone: ({ fullText }) => {
          const doneTime = performance.now();
          console.log(`[AI Performance] 🏁 Stream Completed in: ${Math.round(doneTime - startTime)}ms`);

          setIsSending(false);
          const parseStart = performance.now();
          const { cleanText, commands } = parseSystemCommands(fullText);
          const parseEnd = performance.now();
          console.log(`[AI Performance] 🎯 Modal Parsed in: ${(parseEnd - parseStart).toFixed(2)}ms`);

          const fullContent = fullText.replace(/%%%SYSTEM_CMD%%%[\s\S]*$/, '').trim();

          const finalAssistantMessage = {
            role: 'assistant',
            content: fullContent,
            displayContent: cleanText,
            modelName: selectedModel.name,
            timestamp: new Date().toISOString(),
            durationMs: Math.round(doneTime - startTime),
            rawThinkingContent: commands?.greeting ? `Analyzed scope for "${commands.suggested_title || 'Project'}" with ${commands.questions?.length || 0} questions ready.` : '',
            isStreaming: false,
          };

          setMessages((prev) => {
            const next = [...prev];
            if (next.length > 0) {
              next[next.length - 1] = finalAssistantMessage;
            }
            return next;
          });

          let targetScore = alignmentScore || 35;
          let targetBranch = currentBranch;
          let targetQuestions = [];
          let targetVision = visionContent;
          let targetCta = ctaLabel;

          if (commands) {
            if (commands.confidence_score !== undefined) {
              targetScore = commands.confidence_score;
              setAlignmentScore(commands.confidence_score);
              if (activeSessionId) {
                updateWorkflowSession(activeSessionId, { confidence_score: commands.confidence_score });
              }
            }
            if (commands.current_branch) {
              targetBranch = commands.current_branch;
              setCurrentBranch(commands.current_branch);
            }
            
            const fallbackTitle = (rawText || '').split('\n')[0].slice(0, 42).trim() || 'Project Chat';
            const finalTitle = commands?.suggested_title || (sessionTitle && sessionTitle !== 'New Session' && sessionTitle !== 'New Conversation' ? sessionTitle : fallbackTitle);
            setSessionTitle(finalTitle);
            if (activeSessionId) {
              updateWorkflowSession(activeSessionId, { title: finalTitle });
            }

            if (commands.questions && Array.isArray(commands.questions) && commands.questions.length > 0) {
              targetQuestions = commands.questions;
              setActiveQuestions(commands.questions);
            } else {
              setActiveQuestions([]);
            }
            if (commands.ready_for_vision || (commands.confidence_score !== undefined && commands.confidence_score >= 85)) {
              targetVision = commands.plan_markdown || cleanText;
              setVisionContent(targetVision);
              setActiveQuestions([]);
              if (commands.cta_label) {
                targetCta = commands.cta_label;
                setCtaLabel(commands.cta_label);
              }
              if (activeSessionId) {
                updateWorkflowSession(activeSessionId, {
                  vision_content: targetVision,
                  status: 'vision_ready',
                  confidence_score: Math.max(85, commands.confidence_score || 85),
                });
              }
            }
          } else {
            const fallbackTitle = (rawText || '').split('\n')[0].slice(0, 42).trim() || 'Project Chat';
            setSessionTitle(fallbackTitle);
            if (activeSessionId) {
              updateWorkflowSession(activeSessionId, { title: fallbackTitle });
            }
          }

          // Persist root node turn and conversation history to Supabase
          if (activeSessionId) {
            saveRootSessionState({
              sessionId: activeSessionId,
              messages: [...updatedHistory, finalAssistantMessage],
              confidenceScore: targetScore,
              currentBranch: targetBranch,
              visionContent: targetVision,
              questions: targetQuestions,
              ctaLabel: targetCta,
            });

            if (onSessionCreated) {
              onSessionCreated(activeSessionId);
            }
          }

          if (onCreditDeducted && selectedModel.isPlatform) {
            onCreditDeducted();
          }
        },
        onError: (err) => {
          setIsSending(false);
          setErrorMessage(err);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && !last.content) {
              return prev.slice(0, -1);
            }
            return prev;
          });
        },
      });
    } catch (err) {
      console.error('Chat stream execution error:', err);
      setErrorMessage(err?.message || 'Unexpected communication error');
    } finally {
      setIsSending(false);
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

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setErrorMessage('');
      // Remove failed assistant message if present
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant') {
          return prev.slice(0, -1);
        }
        return prev;
      });
      handleSendMessage(lastUserMsg.displayContent || lastUserMsg.content);
    }
  };

  const isInitialEmptyState = messages.length === 0;

  return (
    <div className="relative flex h-full w-full flex-col overflow-y-auto bg-[#F8F9FA] dark:bg-[#13151A] transition-colors">
      
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
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 md:px-10">
          <div className="max-w-5xl mx-auto space-y-6 pb-6">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 dark:bg-zinc-700 text-white dark:text-zinc-100 font-semibold text-xs shadow-xs mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`flex flex-col space-y-1.5 max-w-[90%] sm:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-5 py-3.5 text-xs sm:text-[13.5px] leading-relaxed shadow-xs transition-colors ${
                        isUser
                          ? 'bg-slate-100 dark:bg-[#1E222B] text-slate-900 dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-800'
                          : 'bg-white dark:bg-[#1A1D24] text-slate-900 dark:text-zinc-100 border border-slate-200/70 dark:border-zinc-800/80'
                      }`}
                    >
                      {/* Attached files preview */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-slate-200 dark:border-zinc-700">
                          {msg.attachments.map((att, attIdx) => (
                            <span
                              key={attIdx}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 text-[10.5px] text-slate-700 dark:text-zinc-300"
                            >
                              <FileText className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{att.name}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Mode Badge Tag in Chat */}
                      {msg.modeName && (
                        <div className="inline-block rounded-md bg-slate-200/70 dark:bg-zinc-800/90 px-2 py-0.5 text-[10.5px] font-medium text-slate-700 dark:text-zinc-300 mb-1.5 border border-slate-200/80 dark:border-zinc-700/50">
                          Mode: {msg.modeName}
                        </div>
                      )}

                      {!isUser && msg.rawThinkingContent && (
                        <details className="mb-2 group">
                          <summary className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 cursor-pointer select-none list-none">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            <span>Thinking details {msg.durationMs ? `(${Math.round(msg.durationMs)}ms)` : ''}</span>
                            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="mt-1.5 pl-3 border-l-2 border-slate-200 dark:border-zinc-700 text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                            {msg.rawThinkingContent}
                          </div>
                        </details>
                      )}

                      {!isUser && msg.isStreaming ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 py-0.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-700 dark:text-zinc-300" />
                          <span className="font-medium text-slate-700 dark:text-zinc-300">
                            {msg.displayContent || 'Reasoning through requirements...'}
                          </span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">
                          {msg.displayContent || msg.content}
                        </p>
                      )}
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
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold text-xs mt-0.5 border border-slate-300/50 dark:border-zinc-700/50">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && !messages[messages.length - 1]?.isStreaming && (
              <div className="flex items-center gap-3 animate-in fade-in">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 dark:bg-zinc-700 text-white dark:text-zinc-100 text-xs">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white dark:bg-[#1A1D24] border border-slate-200/80 dark:border-zinc-800 px-4 py-2.5 text-xs text-slate-500 dark:text-zinc-400 shadow-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-700 dark:text-zinc-300" />
                  <span>{selectedModel.name} is thinking...</span>
                </div>
              </div>
            )}

            {/* Error Display with Direct Retry Button */}
            {errorMessage && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-50/80 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300 w-full animate-in fade-in">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="truncate">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isSending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Active Questionnaire Card with Integrated Alignment Meter, Skip Button & Simplify Action */}
            {activeQuestions && activeQuestions.length > 0 && !isSending && (
              <QuestionnaireCard
                questions={activeQuestions}
                alignmentScore={alignmentScore ?? 35}
                currentBranch={currentBranch}
                onSkip={() => handleSendMessage('Proceed immediately: finalize and generate the complete plan with all current context.')}
                onSimplify={() => {
                  const currentQuestionsText = activeQuestions
                    .map((q, i) => `${i + 1}. ${q.question}\nOptions: ${(q.options || []).join(', ')}`)
                    .join('\n\n');
                  handleSendMessage(
                    `I did not understand the previous options:\n\n${currentQuestionsText}\n\nPlease ask these exact questions again using simpler, plain English terms, and provide beginner-friendly, non-technical choices.`,
                    "I didn't understand the previous options. Please explain them in simpler terms."
                  );
                }}
                onSubmit={(clarificationsPayload) => {
                  setActiveQuestions([]);
                  handleSendMessage(clarificationsPayload);
                }}
                isSending={isSending}
              />
            )}

            {/* Synthesized Master Vision Card */}
            {visionContent && (
              <VisionCard
                visionContent={visionContent}
                ctaLabel={ctaLabel}
                onProceed={() => {
                  setIsExecuting(true);
                }}
                isExecuting={isExecuting}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* =========================================================================
          CENTER HERO & PROMPT COMPOSER
          ========================================================================= */}
      <div
        className={`relative z-20 flex w-full flex-col mx-auto px-4 md:px-8 transition-all duration-300 ${
          isInitialEmptyState
            ? 'max-w-2xl flex-1 items-center justify-center my-auto py-8'
            : 'max-w-4xl shrink-0 pb-6'
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

        {/* Outer Liquid Flowing Border Wrapper */}
        <div className="relative w-full group">
          
          {/* Animated Liquid Flow Gradient Border */}
          <div
            className={`absolute -inset-[2px] rounded-2xl bg-gradient-to-r ${
              activeMode ? activeMode.flowGradient : 'from-blue-500 via-indigo-500 via-sky-400 to-purple-500'
            } opacity-50 dark:opacity-40 blur-xs animate-liquid-flow transition-all duration-500 pointer-events-none`}
          />

          {/* Main Input Composer Card */}
          <div className="relative w-full rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121316] shadow-sm transition-all">
            
            {/* Attached Full-Width Mode Bar */}
            {activeMode && (() => {
              const ActiveIcon = MODE_ICONS[activeMode.id] || Search;
              return (
                <div
                  className={`w-full px-4 py-2 flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-800 bg-gradient-to-r ${activeMode.barGradient} rounded-t-[15px] animate-in slide-in-from-top-2 fade-in duration-300`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <ActiveIcon className="h-4 w-4 text-slate-700 dark:text-zinc-300 shrink-0" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                      {activeMode.badge}
                    </span>
                  </div>

                  {/* Dismiss Mode Button */}
                  <button
                    type="button"
                    onClick={() => setActiveMode(null)}
                    className="flex h-5 w-5 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                    title="Exit mode"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })()}

            {/* Input Composer Body */}
            <div className="p-3 sm:p-3.5">
              
              {/* Sparkles + Textarea Row (Pixel-Perfect Vertically Aligned) */}
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                
                <div className="relative flex-1 flex items-center min-h-[38px]">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={prompt}
                    onChange={handlePromptChange}
                    onKeyDown={handleKeyDown}
                    maxLength={32000}
                    className="w-full resize-none border-0 bg-transparent py-2 px-0 text-xs sm:text-[13.5px] leading-5 text-slate-900 dark:text-zinc-100 focus:outline-none max-h-[180px] overflow-y-auto z-10 relative custom-scrollbar"
                  />

                  {!prompt && (
                    <div
                      className={`pointer-events-none absolute inset-y-0 left-0 flex items-center text-xs sm:text-[13.5px] leading-5 text-slate-400 dark:text-zinc-500 transition-opacity duration-300 select-none truncate max-w-full ${
                        isPlaceholderFading ? 'opacity-0' : 'opacity-100'
                      }`}
                    >
                      {currentPlaceholders[placeholderIndex]}
                    </div>
                  )}
                </div>
              </div>

              {/* Character Limit Warning (Appears when nearing the 32k limit) */}
              {prompt.length > 25000 && (
                <div className="flex justify-end mt-1 px-1">
                  <span className={`text-[10px] font-mono ${prompt.length >= 32000 ? 'text-red-500 font-bold' : 'text-amber-500'}`}>
                    {prompt.length.toLocaleString()} / 32,000
                  </span>
                </div>
              )}

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
          </div>
        </div>

        {/* =====================================================================
            BELOW CARDS / 3 GENERAL SUGGESTIONS (BORDERLESS VERTICAL STACK)
            ===================================================================== */}
        {isInitialEmptyState && (
          <div className="w-full mt-3">
            {activeMode ? (
              /* 3 General Suggestions in a pure Vertical Stack with line dividers only */
              <div className="w-full divide-y divide-slate-200/60 dark:divide-zinc-800/70 px-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeMode.suggestions.slice(0, 3).map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="w-full flex items-center justify-between py-2 px-2 text-left text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/50 dark:hover:bg-zinc-800/40 rounded-md transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <span className="text-slate-400 dark:text-zinc-500 text-xs shrink-0 group-hover:text-slate-700 dark:group-hover:text-zinc-200">
                        ✦
                      </span>
                      <span className="truncate">
                        {suggestion}
                      </span>
                    </div>
                    <ArrowUp className="h-3.5 w-3.5 opacity-0 -rotate-45 group-hover:opacity-100 text-slate-400 dark:text-zinc-500 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              /* 4 Core Purpose-Driven Mode Cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full animate-in fade-in duration-300">
                {workspaceModes.map((mode) => {
                  const Icon = MODE_ICONS[mode.id] || Search;
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
                      <Icon className="h-4 w-4 text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-100 transition-colors mt-0.5 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
                          {mode.title || mode.name}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                          {mode.description || mode.subtitle}
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
