/**
 * ==============================================================================
 * Component: SettingsModal (Clean, Compact, Fully Responsive)
 * ==============================================================================
 * Centralized Settings dialog consolidating all system preferences & account options:
 * - Truly responsive: Clean Mobile Selector (zero awkward horizontal scroll) & Desktop Sidebar
 * - Profile & Personal Details
 * - Appearance & Color Theme (Light / Dark / System)
 * - Compact AI Models & API Keys with inline Test buttons, subtle verification labels,
 *   dropdown of available models, and auto-save upon verification.
 * - Knowledge Base & Memory Preferences
 * - Activity Logs & Security
 * ==============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import * as apiKeyService from '../../services/apiKeyService';
import * as modelHealthService from '../../services/modelHealthService';
import * as activityLogService from '../../services/activityLogService';
import { ThemeSegmentedSelector } from '../common/ThemeToggle';
import {
  X,
  User,
  Cpu,
  Database,
  ScrollText,
  Palette,
  LogOut,
  Save,
  Check,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, defaultTab = 'profile' }) {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Profile Save State
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // API Keys State
  const [apiKeys, setApiKeys] = useState({
    openaiKey: '',
    claudeKey: '',
    geminiKey: '',
  });

  const [showKeys, setShowKeys] = useState({
    openai: false,
    claude: false,
    gemini: false,
  });

  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [keysSuccessMessage, setKeysSuccessMessage] = useState('');
  const [keysErrorMessage, setKeysErrorMessage] = useState('');

  // Provider Health Verification State
  const [providerHealth, setProviderHealth] = useState({
    openai: { status: 'idle', models: [], error: '' }, // 'idle' | 'testing' | 'valid' | 'invalid'
    claude: { status: 'idle', models: [], error: '' },
    gemini: { status: 'idle', models: [], error: '' },
  });

  const [expandedModels, setExpandedModels] = useState({
    openai: false,
    claude: false,
    gemini: false,
  });

  // Activity Logs State
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingLogs(true);
    const { logs } = await activityLogService.getUserActivityLogs(user.id);
    if (logs) setActivityLogs(logs);
    setIsLoadingLogs(false);
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && activeTab === 'logs') {
      fetchActivityLogs();
    }
  }, [isOpen, activeTab, fetchActivityLogs]);

  // Verify and auto-save single provider key to Supabase
  const handleVerifyAndSave = useCallback(async (provider, key) => {
    const cleanKey = (key || '').trim();
    if (!cleanKey) {
      setProviderHealth((prev) => ({
        ...prev,
        [provider]: { status: 'idle', models: [], error: '' },
      }));
      return;
    }

    setProviderHealth((prev) => ({
      ...prev,
      [provider]: { status: 'testing', models: [], error: '' },
    }));

    let result = { isValid: false, models: [], error: '' };

    if (provider === 'openai') {
      result = await modelHealthService.verifyOpenAIKey(cleanKey);
    } else if (provider === 'claude') {
      result = await modelHealthService.verifyClaudeKey(cleanKey);
    } else if (provider === 'gemini') {
      result = await modelHealthService.verifyGeminiKey(cleanKey);
    }

    setProviderHealth((prev) => ({
      ...prev,
      [provider]: {
        status: result.isValid ? 'valid' : 'invalid',
        models: result.models || [],
        error: result.error || '',
      },
    }));

    // Auto-save to Supabase once verified
    if (result.isValid && user?.id) {
      setApiKeys((current) => {
        const updated = {
          ...current,
          [provider === 'openai' ? 'openaiKey' : provider === 'claude' ? 'claudeKey' : 'geminiKey']: cleanKey,
        };
        apiKeyService.saveUserApiKeys(user.id, updated);
        return updated;
      });
    }
  }, [user?.id]);

  // Load API keys from Supabase / localStorage on modal open
  useEffect(() => {
    if (isOpen && user?.id) {
      let isMounted = true;
      setIsLoadingKeys(true);
      setKeysSuccessMessage('');
      setKeysErrorMessage('');

      apiKeyService
        .getUserApiKeys(user.id)
        .then(({ keys, error }) => {
          if (isMounted && keys) {
            setApiKeys(keys);
            // Run verification on saved keys
            if (keys.openaiKey) handleVerifyAndSave('openai', keys.openaiKey);
            if (keys.claudeKey) handleVerifyAndSave('claude', keys.claudeKey);
            if (keys.geminiKey) handleVerifyAndSave('gemini', keys.geminiKey);
          }
          if (isMounted && error) {
            console.warn('Failed to load user API keys:', error);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingKeys(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, user?.id, handleVerifyAndSave]);

  if (!isOpen) return null;

  const displayName = profile?.name || user?.user_metadata?.full_name || '';
  const displayEmail = user?.email || profile?.email || '';
  const displayDob = profile?.dob || user?.user_metadata?.dob || '';
  const displayPhone = profile?.phone || user?.user_metadata?.phone || '';

  const tabs = [
    { id: 'profile', label: 'Profile & Account', icon: User },
    { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
    { id: 'models', label: 'Models & API Keys', icon: Cpu },
    { id: 'memory', label: 'Knowledge Base', icon: Database },
    { id: 'logs', label: 'Activity Logs', icon: ScrollText },
  ];

  const ActiveIcon = tabs.find((t) => t.id === activeTab)?.icon || User;

  const handleProfileSave = (e) => {
    e.preventDefault();
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 2000);
  };

  const handleSaveAllKeys = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSavingKeys(true);
    setKeysSuccessMessage('');
    setKeysErrorMessage('');

    const { success, error } = await apiKeyService.saveUserApiKeys(user.id, apiKeys);

    setIsSavingKeys(false);
    if (success) {
      setKeysSuccessMessage('API Keys saved.');
      setTimeout(() => setKeysSuccessMessage(''), 3000);
    } else {
      setKeysErrorMessage(error?.message || 'Failed to save API keys.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative flex flex-col md:flex-row h-[88vh] max-h-[640px] md:h-[580px] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121316] shadow-2xl animate-in zoom-in-95 transition-all my-auto">
        
        {/* --- DESKTOP SIDEBAR (md and up) --- */}
        <div className="hidden md:flex w-52 shrink-0 border-r border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-[#0E0F12] p-3 flex-col justify-between transition-colors">
          <div>
            <div className="px-3 py-2 text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              Settings
            </div>
            
            <nav className="mt-2 space-y-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-200/90 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-slate-900 dark:text-zinc-100' : 'text-slate-500 dark:text-zinc-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Desktop Sign Out */}
          <div className="border-t border-slate-200/70 dark:border-zinc-800 pt-2">
            <button
              type="button"
              onClick={() => {
                signOut();
                onClose();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-[#121316] transition-colors">
          
          {/* Header Bar */}
          <div className="flex h-13 shrink-0 items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <ActiveIcon className="h-4 w-4 text-slate-700 dark:text-zinc-300 md:hidden" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              aria-label="Close Settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* --- MOBILE SECTION SELECTOR (Clean drop selector, NO horizontal scrolling) --- */}
          <div className="md:hidden border-b border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-[#0E0F12] p-2.5 transition-colors">
            <div className="relative">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-slate-800 dark:focus:ring-zinc-400 shadow-2xs cursor-pointer"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-800 dark:text-zinc-200 text-xs">
            
            {/* 1. PROFILE & ACCOUNT TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSave} className="space-y-4 max-w-md">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue={displayName}
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:border-slate-800 dark:focus:border-zinc-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={displayEmail}
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 px-3 py-2 text-xs text-slate-500 dark:text-zinc-500 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      defaultValue={displayDob}
                      className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:border-slate-800 dark:focus:border-zinc-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      defaultValue={displayPhone}
                      className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:border-slate-800 dark:focus:border-zinc-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 px-3.5 py-2 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
                  >
                    {isProfileSaved ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-600" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* 2. APPEARANCE & THEME TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-4 max-w-md">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">Theme Preferences</h4>
                  <p className="mt-1 text-slate-500 dark:text-zinc-400 text-xs leading-relaxed">
                    Customize how Olai looks on your device. Choose clean light mode, high-contrast obsidian dark mode, or follow your operating system settings.
                  </p>
                </div>

                <div className="pt-2">
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-2">Interface Theme</label>
                  <ThemeSegmentedSelector />
                </div>
              </div>
            )}

            {/* 3. MODELS & API KEYS TAB (COMPACT & SUBTLE) */}
            {activeTab === 'models' && (
              <form onSubmit={handleSaveAllKeys} className="space-y-4 max-w-md">
                
                {/* Information Callout Banner */}
                <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-50/60 dark:bg-blue-950/30 p-3 text-blue-900 dark:text-blue-200">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <p className="text-[11.5px] leading-relaxed">
                    Use your API key's to reduce the credit usage of Olai and Chat with the model's you enjoy the most!
                  </p>
                </div>

                {/* Notifications */}
                {keysSuccessMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{keysSuccessMessage}</span>
                  </div>
                )}

                {keysErrorMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{keysErrorMessage}</span>
                  </div>
                )}

                <div className="space-y-3.5">
                  
                  {/* --- 1. OPENAI API KEY --- */}
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                      OpenAI API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showKeys.openai ? 'text' : 'password'}
                        placeholder="sk-proj-..."
                        value={apiKeys.openaiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setApiKeys((prev) => ({ ...prev, openaiKey: val }));
                          if (!val) {
                            setProviderHealth((prev) => ({
                              ...prev,
                              openai: { status: 'idle', models: [], error: '' },
                            }));
                          }
                        }}
                        onBlur={() => handleVerifyAndSave('openai', apiKeys.openaiKey)}
                        disabled={isLoadingKeys}
                        className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2 pl-3 pr-20 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-slate-800 dark:focus:border-zinc-500 focus:outline-none transition-colors"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleVerifyAndSave('openai', apiKeys.openaiKey)}
                          disabled={providerHealth.openai.status === 'testing' || !apiKeys.openaiKey}
                          className="rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          {providerHealth.openai.status === 'testing' ? (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                          ) : (
                            <span>Test</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowKeys((prev) => ({ ...prev, openai: !prev.openai }))}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                        >
                          {showKeys.openai ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Subtle verification label */}
                    {providerHealth.openai.status === 'valid' && (
                      <div className="mt-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <span>✓ Verified ({providerHealth.openai.models.length} models available)</span>
                          {providerHealth.openai.models.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedModels((prev) => ({ ...prev, openai: !prev.openai }))}
                              className="text-[10.5px] text-slate-500 dark:text-zinc-400 hover:underline cursor-pointer"
                            >
                              {expandedModels.openai ? 'Hide models' : 'View models'}
                            </button>
                          )}
                        </div>
                        {expandedModels.openai && (
                          <div className="flex flex-wrap gap-1 pt-1 animate-in fade-in duration-150">
                            {providerHealth.openai.models.map((mod) => (
                              <span key={mod} className="rounded bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                                {mod}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {providerHealth.openai.status === 'invalid' && (
                      <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                        {providerHealth.openai.error || 'Invalid API key'}
                      </p>
                    )}
                  </div>

                  {/* --- 2. ANTHROPIC CLAUDE KEY --- */}
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                      Anthropic Claude Key
                    </label>
                    <div className="relative">
                      <input
                        type={showKeys.claude ? 'text' : 'password'}
                        placeholder="sk-ant-..."
                        value={apiKeys.claudeKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setApiKeys((prev) => ({ ...prev, claudeKey: val }));
                          if (!val) {
                            setProviderHealth((prev) => ({
                              ...prev,
                              claude: { status: 'idle', models: [], error: '' },
                            }));
                          }
                        }}
                        onBlur={() => handleVerifyAndSave('claude', apiKeys.claudeKey)}
                        disabled={isLoadingKeys}
                        className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2 pl-3 pr-20 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-slate-800 dark:focus:border-zinc-500 focus:outline-none transition-colors"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleVerifyAndSave('claude', apiKeys.claudeKey)}
                          disabled={providerHealth.claude.status === 'testing' || !apiKeys.claudeKey}
                          className="rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          {providerHealth.claude.status === 'testing' ? (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                          ) : (
                            <span>Test</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowKeys((prev) => ({ ...prev, claude: !prev.claude }))}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                        >
                          {showKeys.claude ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Subtle verification label */}
                    {providerHealth.claude.status === 'valid' && (
                      <div className="mt-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <span>✓ Verified ({providerHealth.claude.models.length} models available)</span>
                          {providerHealth.claude.models.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedModels((prev) => ({ ...prev, claude: !prev.claude }))}
                              className="text-[10.5px] text-slate-500 dark:text-zinc-400 hover:underline cursor-pointer"
                            >
                              {expandedModels.claude ? 'Hide models' : 'View models'}
                            </button>
                          )}
                        </div>
                        {expandedModels.claude && (
                          <div className="flex flex-wrap gap-1 pt-1 animate-in fade-in duration-150">
                            {providerHealth.claude.models.map((mod) => (
                              <span key={mod} className="rounded bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                                {mod}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {providerHealth.claude.status === 'invalid' && (
                      <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                        {providerHealth.claude.error || 'Invalid API key'}
                      </p>
                    )}
                  </div>

                  {/* --- 3. GOOGLE GEMINI KEY --- */}
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                      Google Gemini Key
                    </label>
                    <div className="relative">
                      <input
                        type={showKeys.gemini ? 'text' : 'password'}
                        placeholder="AIzaSy..."
                        value={apiKeys.geminiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setApiKeys((prev) => ({ ...prev, geminiKey: val }));
                          if (!val) {
                            setProviderHealth((prev) => ({
                              ...prev,
                              gemini: { status: 'idle', models: [], error: '' },
                            }));
                          }
                        }}
                        onBlur={() => handleVerifyAndSave('gemini', apiKeys.geminiKey)}
                        disabled={isLoadingKeys}
                        className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2 pl-3 pr-20 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-slate-800 dark:focus:border-zinc-500 focus:outline-none transition-colors"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleVerifyAndSave('gemini', apiKeys.geminiKey)}
                          disabled={providerHealth.gemini.status === 'testing' || !apiKeys.geminiKey}
                          className="rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 cursor-pointer"
                        >
                          {providerHealth.gemini.status === 'testing' ? (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                          ) : (
                            <span>Test</span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowKeys((prev) => ({ ...prev, gemini: !prev.gemini }))}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                        >
                          {showKeys.gemini ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Subtle verification label */}
                    {providerHealth.gemini.status === 'valid' && (
                      <div className="mt-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <span>✓ Verified ({providerHealth.gemini.models.length} models available)</span>
                          {providerHealth.gemini.models.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedModels((prev) => ({ ...prev, gemini: !prev.gemini }))}
                              className="text-[10.5px] text-slate-500 dark:text-zinc-400 hover:underline cursor-pointer"
                            >
                              {expandedModels.gemini ? 'Hide models' : 'View models'}
                            </button>
                          )}
                        </div>
                        {expandedModels.gemini && (
                          <div className="flex flex-wrap gap-1 pt-1 animate-in fade-in duration-150">
                            {providerHealth.gemini.models.map((mod) => (
                              <span key={mod} className="rounded bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                                {mod}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {providerHealth.gemini.status === 'invalid' && (
                      <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                        {providerHealth.gemini.error || 'Invalid API key'}
                      </p>
                    )}
                  </div>

                </div>

                {/* Save Keys Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingKeys || isLoadingKeys}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 px-3.5 py-2 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
                  >
                    {isSavingKeys ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving API Keys...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save API Keys</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* 4. KNOWLEDGE BASE & MEMORY TAB */}
            {activeTab === 'memory' && (
              <div className="space-y-3 max-w-md">
                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Manage persistent workspace memory and indexing rules.
                </p>
                <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 p-3.5 text-slate-600 dark:text-zinc-400">
                  <p className="font-medium text-slate-800 dark:text-zinc-200">Workspace Memory</p>
                  <p className="mt-1 text-[11.5px]">No external knowledge sources connected yet.</p>
                </div>
              </div>
            )}

            {/* 5. ACTIVITY LOGS TAB */}
            {activeTab === 'logs' && (
              <div className="space-y-3 max-w-lg">
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 dark:text-zinc-400">Recent API calls and credit usage history.</p>
                  <button
                    type="button"
                    onClick={fetchActivityLogs}
                    className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:underline cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>

                {isLoadingLogs ? (
                  <div className="flex items-center justify-center p-8 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading logs...</span>
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 dark:border-zinc-800 p-4 text-center text-slate-500 dark:text-zinc-500 text-[11.5px]">
                    No activity recorded yet. Start a chat or verify API keys to see activity logs.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 p-2.5 text-xs flex items-center justify-between transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-900 dark:text-zinc-100">
                            {log.action}
                          </span>
                          {log.model && (
                            <span className="text-[10.5px] font-mono text-slate-500 dark:text-zinc-400">
                              {log.model}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="text-right">
                          {log.credits_used > 0 ? (
                            <span className="inline-flex items-center rounded-md bg-slate-200/80 dark:bg-zinc-800 px-1.5 py-0.5 text-[10.5px] font-mono text-slate-700 dark:text-zinc-300">
                              -{log.credits_used} credit
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                              Free (Custom Key)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
