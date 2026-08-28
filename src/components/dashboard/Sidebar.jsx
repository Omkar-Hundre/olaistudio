/**
 * ==============================================================================
 * Component: Sidebar (Arena / Frontier Styled Layout)
 * ==============================================================================
 * Clean, structured sidebar matching the reference design:
 * - Brand / Project selector ("Olai ▾") & Sidebar collapse trigger
 * - Rounded "+ New Chat" pill button
 * - Clean navigation items: Leaderboard, Search, Workspace
 * - Previous Projects / History list
 * - Bottom credits percentage ring & user account profile
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { getUserCredits } from '../../services/creditService';
import {
  Plus,
  Trophy,
  Search,
  FolderKanban,
  Settings,
  LogOut,
  ChevronDown,
  Clock,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export default function Sidebar({ 
  isMobileOpen, 
  onCloseMobile, 
  currentTab = 'overview', 
  onSelectTab,
  onOpenSettings,
  previousProjects = []
}) {
  const { user, profile, signOut } = useAuth();
  const { logoSrc } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [credits, setCredits] = useState({
    balance: 100,
    allocated: 100,
    used: 0,
    tier: 'standard'
  });

  const displayName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || profile?.email || '';

  // Fetch real user credits on user load
  useEffect(() => {
    if (user?.id) {
      getUserCredits(user.id).then(({ credits: creds }) => {
        if (creds) setCredits(creds);
      });
    }
  }, [user?.id]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 dark:bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200/80 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-[#0E0F12] transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-[68px]' : 'w-60'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header: Brand Selector & Collapse Button */}
        <div className="flex h-14 shrink-0 items-center justify-between px-4 border-b border-slate-200/60 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5 overflow-hidden cursor-pointer">
            <img
              src={logoSrc}
              alt="Olai"
              className={`object-contain transition-all ${
                isCollapsed ? 'h-6 w-auto' : 'h-6.5 w-auto'
              }`}
            />
            {!isCollapsed && <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-slate-200/60 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            title={isCollapsed ? 'Open sidebar' : 'Close sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Top: + New Chat Pill Button */}
        <div className="px-3 pt-3.5 pb-2">
          <button
            type="button"
            onClick={() => {
              if (onSelectTab) onSelectTab('overview');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 py-2 text-[12.5px] font-medium text-slate-800 dark:text-zinc-200 shadow-2xs transition-all hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-[0.99] cursor-pointer ${
              isCollapsed ? 'px-0' : 'px-3.5'
            }`}
            title="New Chat"
          >
            <Plus className="h-4 w-4 text-slate-500 dark:text-zinc-400 shrink-0" />
            {!isCollapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Navigation & Projects Area */}
        <div className="flex-1 overflow-y-auto px-3 py-1.5 space-y-4">
          
          {/* Main Quick Nav */}
          <nav className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('leaderboard');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Leaderboard"
            >
              <Trophy className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" />
              {!isCollapsed && <span>Leaderboard</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('search');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Search"
            >
              <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" />
              {!isCollapsed && <span>Search</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('projects');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Workspace"
            >
              <FolderKanban className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" />
              {!isCollapsed && <span>Workspace</span>}
            </button>
          </nav>

          {/* Previous Projects Section */}
          <div>
            {!isCollapsed && (
              <p className="px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Recent
              </p>
            )}
            <div className="space-y-0.5">
              {previousProjects.length === 0 ? (
                !isCollapsed && (
                  <p className="px-2.5 py-1.5 text-[11.5px] text-slate-400 dark:text-zinc-600 font-normal">
                    No recent chats
                  </p>
                )
              ) : (
                previousProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12.5px] text-slate-600 dark:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors"
                  >
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                    {!isCollapsed && <span className="truncate">{project.name}</span>}
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Bottom Section: Credits Widget, Settings, and Profile */}
        <div className="shrink-0 border-t border-slate-200/70 dark:border-zinc-800 p-2.5 space-y-2">
          
          {/* User Credits Card with Circular Progress Ring */}
          <div className={`rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#121316] p-2 shadow-2xs transition-all ${
            isCollapsed ? 'px-1.5 py-2 flex flex-col items-center justify-center' : ''
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                  <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      strokeWidth="2.5"
                      className="stroke-slate-200 dark:stroke-zinc-800"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      strokeWidth="2.5"
                      strokeDasharray="56.55"
                      strokeDashoffset={56.55 - (56.55 * Math.min(100, Math.max(0, (credits.balance / (credits.allocated || 100)) * 100))) / 100}
                      strokeLinecap="round"
                      className="stroke-slate-900 dark:stroke-zinc-100 transition-all duration-500 ease-out"
                    />
                  </svg>
                </div>

                {!isCollapsed && (
                  <span className="text-[12px] font-semibold text-slate-800 dark:text-zinc-200">
                    Credits
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <span className="text-[11px] font-mono font-medium text-slate-600 dark:text-zinc-400">
                  {Math.round((credits.balance / (credits.allocated || 100)) * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* User Account Row */}
          <div className={`flex items-center justify-between rounded-xl p-1.5 hover:bg-slate-200/40 dark:hover:bg-zinc-800/60 transition-colors ${
            isCollapsed ? 'flex-col gap-1.5' : ''
          }`}>
            <button
              type="button"
              onClick={() => {
                if (onOpenSettings) onOpenSettings('profile');
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center gap-2.5 overflow-hidden text-left cursor-pointer"
              title="Open Account Settings"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 dark:bg-zinc-700 text-white font-semibold text-xs shadow-2xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden leading-tight">
                  <span className="text-[12px] font-semibold text-slate-900 dark:text-zinc-200 truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                    {displayEmail}
                  </span>
                </div>
              )}
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={signOut}
              title="Sign Out"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}
