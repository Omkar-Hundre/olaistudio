import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, profile, isAuthenticated, openLogin, openSignUp, signOut } = useAuth();
  const { logoSrc } = useTheme();

  const displayName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="relative z-50 w-full max-w-2xl px-4 pt-4 sm:px-6 lg:px-8 mx-auto">
      <nav className="flex h-11 w-full items-center justify-between rounded-full border border-black/[0.055] bg-white/90 px-1.5 backdrop-blur-xl transition-all duration-300 hover:bg-white shadow-[0_2px_12px_rgba(11,13,18,0.04)]">
        {/* Logo */}
        <a href="#" className="group flex h-8 items-center rounded-full px-2 transition-all duration-200 hover:bg-black/[0.035]" title="Olai">
          <img src={logoSrc} alt="Olai" className="h-6 w-auto object-contain transition-transform duration-200 group-hover:scale-105" />
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-0.5 rounded-full bg-black/[0.025] p-0.5">
          <a
            href="#why"
            className="rounded-full px-3 py-1.5 text-[11.5px] font-medium text-ink/50 transition-all duration-200 hover:bg-white hover:text-ink hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] active:scale-95"
          >
            Why
          </a>

          <a
            href="#how"
            className="rounded-full px-3 py-1.5 text-[11.5px] font-medium text-ink/50 transition-all duration-200 hover:bg-white hover:text-ink hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] active:scale-95"
          >
            How it works
          </a>

          <a
            href="#usecases"
            className="rounded-full px-3 py-1.5 text-[11.5px] font-medium text-ink/50 transition-all duration-200 hover:bg-white hover:text-ink hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] active:scale-95"
          >
            Use cases
          </a>

          <a
            href="#features"
            className="rounded-full px-3 py-1.5 text-[11.5px] font-medium text-ink/50 transition-all duration-200 hover:bg-white hover:text-ink hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] active:scale-95"
          >
            Features
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-black/[0.035] py-1 px-2.5 text-[11.5px] font-medium text-ink">
                <UserIcon className="h-3.5 w-3.5 text-blue-600" />
                <span className="max-w-[90px] truncate">{displayName}</span>
              </div>
              <button
                type="button"
                onClick={signOut}
                title="Sign out"
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={openLogin}
                className="hidden sm:inline-flex h-8 items-center justify-center rounded-full px-3 text-[11.5px] font-medium text-ink/55 transition-all duration-200 hover:bg-black/[0.035] hover:text-ink active:scale-95"
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={openSignUp}
                className="group relative inline-flex h-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-brand-dark px-3.5 text-[11.5px] font-semibold text-white shadow-[0_5px_14px_rgba(46,124,246,0.22)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_7px_18px_rgba(46,124,246,0.30)] active:translate-y-0 active:scale-[0.97]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"></span>
                <span className="relative flex items-center gap-1.5">
                  Sign up
                  <svg
                    className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
