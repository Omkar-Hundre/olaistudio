/**
 * ==============================================================================
 * Component: AuthModal (Light-Themed SaaS Design)
 * ==============================================================================
 * Modal interface for user authentication matching Olai's light design aesthetic:
 * - Sign In form (Email, Password)
 * - Sign Up form (Full Name, Pre-filled Date of Birth, Email ID, Country Code + Phone, Password)
 * - Country code selector with flag badges
 * - Credibility validation feedback (detects dummy numbers, unrealistic DOBs, fake emails)
 * - Email Verification Confirmation State
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import * as authService from '../../services/authService';
import { APP_CONFIG } from '../../config/constants';
import {
  X,
  Mail,
  Lock,
  User,
  Calendar,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    closeAuthModal,
    verificationNotice,
    clearVerificationNotice
  } = useAuth();
  const { logoSrc } = useTheme();

  // Form State with smart defaults
  const [formData, setFormData] = useState({
    name: '',
    dob: APP_CONFIG.auth.defaultDob, // Pre-filled default Date of Birth
    email: '',
    countryCode: '+91', // Pre-filled default country code
    phone: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [signupSuccessEmail, setSignupSuccessEmail] = useState('');

  // Reset errors and fields on mode change or open
  useEffect(() => {
    setErrorMessage('');
    if (isAuthModalOpen) {
      setSignupSuccessEmail('');
    }
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (authModalMode === 'signup') {
        const { error } = await authService.signUp({
          name: formData.name,
          dob: formData.dob,
          email: formData.email,
          countryCode: formData.countryCode,
          phone: formData.phone,
          password: formData.password,
        });

        if (error) {
          setErrorMessage(error.message || 'Failed to create account. Please check your details.');
        } else {
          setSignupSuccessEmail(formData.email);
        }
      } else {
        const { error } = await authService.signIn({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          setErrorMessage(error.message || 'Invalid email or password.');
        } else {
          closeAuthModal();
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeAuthModal}
      />

      {/* Light Themed Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-black/[0.08] bg-white p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18)] transition-all duration-300 animate-in zoom-in-95 my-auto">

        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-44 bg-gradient-to-br from-blue-100/70 via-indigo-50/50 to-transparent blur-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/80 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800 active:scale-95"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Email Verification Toast Notice */}
        {verificationNotice && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-50/90 p-3.5 text-emerald-900 shadow-xs">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-emerald-950">{verificationNotice.title}</p>
              <p className="mt-0.5 text-emerald-800 leading-relaxed">{verificationNotice.message}</p>
            </div>
            <button
              onClick={clearVerificationNotice}
              className="ml-auto text-emerald-700 hover:text-emerald-950"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* EMAIL VERIFICATION SENT CONFIRMATION SCREEN */}
        {signupSuccessEmail ? (
          <div className="py-3 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner ring-8 ring-blue-50/60">
              <Mail className="h-8 w-8 animate-bounce text-blue-600" />
            </div>

            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Check your inbox
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              We sent a verification link to: <br />
              <span className="font-semibold text-slate-900 mt-1 inline-block bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                {signupSuccessEmail}
              </span>
            </p>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900 flex items-center gap-2.5 text-left">
              <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600" />
              <span>Click the link in the email to verify your account. Once verified, you will be redirected to log in.</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSignupSuccessEmail('');
                setAuthModalMode('login');
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-brand to-brand-dark py-2.5 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(46,124,246,0.25)] transition-all hover:shadow-[0_6px_18px_rgba(46,124,246,0.35)] active:scale-[0.98]"
            >
              <span>Back to Log In</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div>
            {/* Header & Tabs */}
            <div className="mb-5">
              <div className="flex items-center">
                <img
                  src={logoSrc}
                  alt="Olai"
                  className="h-8 w-auto object-contain"
                />
              </div>

              {/* Light Styled Mode Switcher */}
              <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-100/90 p-1 border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className={`rounded-lg py-2 text-xs font-semibold transition-all ${authModalMode === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthModalMode('signup')}
                  className={`rounded-lg py-2 text-xs font-semibold transition-all ${authModalMode === 'signup'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-50 p-3 text-xs text-red-700 shadow-2xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">

              {/* SIGN UP ONLY: Full Name */}
              {authModalMode === 'signup' && (
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-slate-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Omkar Hundre"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* SIGN UP ONLY: Date of Birth & Country Code + Phone */}
              {authModalMode === 'signup' && (
                <>
                  {/* Date of Birth (Pre-filled default) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11.5px] font-medium text-slate-700">
                        Date of Birth
                      </label>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <input
                        type="date"
                        name="dob"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        value={formData.dob}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone Number with Country Code Selector */}
                  <div>
                    <label className="mb-1 block text-[11.5px] font-medium text-slate-700">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      {/* Country Code Dropdown */}
                      <div className="relative w-28 shrink-0">
                        <select
                          name="countryCode"
                          value={formData.countryCode}
                          onChange={handleChange}
                          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-2.5 pr-6 text-xs font-semibold text-slate-800 focus:border-brand focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand/15 transition-all cursor-pointer"
                        >
                          {APP_CONFIG.countries.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      {/* Phone Input */}
                      <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Phone className="h-4 w-4" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          required
                          placeholder={formData.countryCode === '+91' ? '98765 43210' : '555 123 4567'}
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-brand to-brand-dark py-2.5 text-xs font-semibold text-white shadow-[0_5px_15px_rgba(46,124,246,0.24)] transition-all hover:shadow-[0_8px_20px_rgba(46,124,246,0.34)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{authModalMode === 'signup' ? 'Creating Account...' : 'Logging In...'}</span>
                  </>
                ) : (
                  <span>{authModalMode === 'signup' ? 'Create Account' : 'Log In'}</span>
                )}
              </button>
            </form>

            {/* Footer Switcher */}
            <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
              {authModalMode === 'signup' ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthModalMode('login')}
                    className="font-semibold text-brand hover:underline cursor-pointer"
                  >
                    Log In
                  </button>
                </p>
              ) : (
                <p>
                  Don&apos;t have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthModalMode('signup')}
                    className="font-semibold text-brand hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
