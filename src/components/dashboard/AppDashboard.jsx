/**
 * ==============================================================================
 * Component: AppDashboard (Frontier / Arena Styled Workspace)
 * ==============================================================================
 * Authenticated workspace screen matching the reference layout:
 * - Dynamic URL routing (/c/:sessionId) with instant URL updates and refresh preservation
 * - Professional Sidebar with + New Chat, Leaderboard, Search, Workspace, and Credits
 * - Live database session persistence & sidebar history sync
 * - Top header with Mode selector, announcement banner, Private badge, Theme toggle & Profile
 * - Central ChatWorkspace with responsive tile questionnaire & inline alignment progress
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import SettingsModal from '../settings/SettingsModal';
import ChatWorkspace from './ChatWorkspace';
import { ThemePillSwitch } from '../common/ThemeToggle';
import { getUserWorkflowSessions } from '../../services/workflowService';
import {
  Menu,
  ChevronDown,
  Lock,
  X
} from 'lucide-react';

/**
 * Extracts session ID from current URL path (/c/:id) or query (?c=:id)
 * @returns {string | null}
 */
function getSessionIdFromUrl() {
  if (typeof window === 'undefined') return null;
  const pathMatch = window.location.pathname.match(/\/c\/([a-zA-Z0-9_-]+)/);
  if (pathMatch) return pathMatch[1];
  const searchParam = new URLSearchParams(window.location.search).get('c');
  if (searchParam) return searchParam;
  return null;
}

export default function AppDashboard() {
  const { user, profile } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState('profile');
  const [creditRefreshTrigger, setCreditRefreshTrigger] = useState(0);
  const [showAnnouncementBanner, setShowAnnouncementBanner] = useState(true);

  // Workflow Session State (Initialized from URL for direct refresh support)
  const [activeSessionId, setActiveSessionId] = useState(getSessionIdFromUrl);
  const [sessions, setSessions] = useState([]);

  const displayName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const loadSessions = async () => {
    if (user?.id) {
      const { sessions: userSessions } = await getUserWorkflowSessions(user.id);
      if (userSessions) {
        setSessions(userSessions);
      }
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user?.id, creditRefreshTrigger]);

  // Sync with browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlId = getSessionIdFromUrl();
      setActiveSessionId(urlId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenSettings = (tab = 'profile') => {
    setSettingsDefaultTab(tab);
    setIsSettingsOpen(true);
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setActiveTab('overview');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
    }
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setActiveTab('overview');
    if (typeof window !== 'undefined' && sessionId) {
      window.history.pushState(null, '', `/c/${sessionId}`);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F9FA] dark:bg-[#13151A] text-slate-900 dark:text-zinc-100 font-sans antialiased transition-colors duration-200">
      {/* Centralized Settings Dialog */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultTab={settingsDefaultTab}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        key={creditRefreshTrigger}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={handleOpenSettings}
        previousProjects={sessions}
        onNewChat={handleNewChat}
        onSelectProject={handleSelectSession}
        activeProjectId={activeSessionId}
      />

      {/* Main Workspace Area (Offset by sidebar width on desktop) */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-60 transition-all duration-200">
        
        {/* Top Header Bar */}
        <header className="flex h-13 shrink-0 items-center justify-between border-b border-slate-200/70 dark:border-zinc-800 bg-white/95 dark:bg-[#16181D]/95 px-4 md:px-6 z-30 transition-colors">
          
          {/* Left: Mobile Toggle */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 lg:hidden transition-colors cursor-pointer"
              aria-label="Open navigation sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          {/* Right: Announcement Banner, Private Indicator, Theme Toggle, and Profile */}
          <div className="flex items-center gap-3">
            
            {/* Announcement Banner Pill */}
            {showAnnouncementBanner && (
              <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-900/90 py-1 pl-2.5 pr-3 text-[11px] text-slate-600 dark:text-zinc-400 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementBanner(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
                  title="Dismiss banner"
                >
                  <X className="h-3 w-3" />
                </button>
                <span>Follow us for the latest in AI news and advancements</span>
                
                {/* Social Icons */}
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 pl-1 border-l border-slate-200 dark:border-zinc-700">
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    𝕏
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-slate-900 dark:hover:text-white transition-colors font-bold text-[10px]"
                  >
                    in
                  </a>
                </div>
              </div>
            )}

            {/* Private Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-medium text-slate-500 dark:text-zinc-400">
              <Lock className="h-3 w-3" />
              <span>Private</span>
            </div>

            {/* Clean Pill Theme Switcher */}
            <ThemePillSwitch />

            {/* Profile Avatar Button (Opens Settings Modal) */}
            <button
              type="button"
              onClick={() => handleOpenSettings('profile')}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 font-semibold text-xs transition-transform hover:scale-105 hover:ring-2 hover:ring-slate-300 dark:hover:ring-zinc-700 active:scale-95 cursor-pointer shadow-xs"
              title={`Account Settings (${displayName})`}
              aria-label="Open account settings"
            >
              {displayName.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        {/* Central Chat Workspace */}
        <main className="flex flex-1 flex-col bg-[#F8F9FA] dark:bg-[#13151A] overflow-hidden transition-colors">
          <ChatWorkspace
            activeSessionId={activeSessionId}
            onSessionCreated={(newId) => {
              setActiveSessionId(newId);
              if (typeof window !== 'undefined' && newId) {
                window.history.pushState(null, '', `/c/${newId}`);
              }
              loadSessions();
            }}
            onCreditDeducted={() => {
              setCreditRefreshTrigger((prev) => prev + 1);
              loadSessions();
            }}
          />
        </main>
      </div>
    </div>
  );
}
