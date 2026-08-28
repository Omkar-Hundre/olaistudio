import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import Navbar from './Navbar';

const MAX_WORDS = 25;

export default function HeroSection() {
  const [stickyText, setStickyText] = useState('');
  const [stickySaved, setStickySaved] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const heroRef = useRef(null);
  const headingRef = useRef(null);
  const stickyRef = useRef(null);

  // Initialize sticky text from localStorage
  useEffect(() => {
    const savedNote = localStorage.getItem('olai_sticky_note') || '';
    setStickyText(savedNote);
    if (stickyRef.current) {
      stickyRef.current.innerText = savedNote;
    }
    const count = savedNote.trim() ? savedNote.trim().split(/\s+/).filter(Boolean).length : 0;
    setWordCount(count);
  }, []);

  // Handle sticky note editing & word limit enforcement
  const handleStickyInput = (e) => {
    let rawText = e.target.innerText;
    const words = rawText.trim() ? rawText.trim().split(/\s+/).filter(Boolean) : [];

    if (words.length > MAX_WORDS) {
      rawText = words.slice(0, MAX_WORDS).join(' ');
      if (stickyRef.current) {
        stickyRef.current.innerText = rawText;
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(stickyRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    const currentCount = rawText.trim() ? rawText.trim().split(/\s+/).filter(Boolean).length : 0;
    setWordCount(currentCount);
    setStickyText(rawText);
    localStorage.setItem('nodewise_sticky_note', rawText);

    setStickySaved(true);
    setTimeout(() => setStickySaved(false), 1500);
  };

  // Immediate GSAP entrance animation on load
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. Navbar drop in
      tl.fromTo(
        '#hero-navbar',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6 }
      );

      // 2. Hero Pill Badge
      tl.fromTo(
        '#hero-pill',
        { opacity: 0, y: -12, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5 },
        '-=0.3'
      );

      // 3. Hero Heading Staggered Text Entrance
      const headingChars = headingRef.current?.querySelectorAll('.hero-char');
      if (headingChars && headingChars.length > 0) {
        tl.fromTo(
          headingChars,
          { opacity: 0, y: 24, rotateX: -25 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            stagger: 0.012,
            duration: 0.65,
            ease: 'power3.out',
          },
          '-=0.3'
        );
      }

      // 4. Subtext & CTA
      tl.fromTo(
        ['#hero-desc', '#hero-cta'],
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.55 },
        '-=0.3'
      );

      // 5. Desktop Floating Cards Entrance (Tilted TOWARDS CENTER)
      tl.fromTo(
        '#card-sticky',
        { opacity: 0, scale: 0.85, rotation: 10, x: -35, y: -15 },
        { opacity: 1, scale: 1, rotation: 3.5, x: 0, y: 0, duration: 0.75, ease: 'back.out(1.4)' },
        '-=0.5'
      );

      tl.fromTo(
        '#card-memory',
        { opacity: 0, scale: 0.85, rotation: -10, x: 35, y: -15 },
        { opacity: 1, scale: 1, rotation: -3.5, x: 0, y: 0, duration: 0.75, ease: 'back.out(1.4)' },
        '-=0.6'
      );

      tl.fromTo(
        '#card-canvas',
        { opacity: 0, scale: 0.85, rotation: 8, x: -35, y: 25 },
        { opacity: 1, scale: 1, rotation: 2.5, x: 0, y: 0, duration: 0.75, ease: 'back.out(1.4)' },
        '-=0.6'
      );

      tl.fromTo(
        '#card-providers',
        { opacity: 0, scale: 0.85, rotation: -8, x: 35, y: 25 },
        { opacity: 1, scale: 1, rotation: -2.5, x: 0, y: 0, duration: 0.75, ease: 'back.out(1.4)' },
        '-=0.6'
      );

      // 6. Refined floating loops for desktop cards
      gsap.to('#card-sticky .card-inner', {
        y: -6,
        rotation: 2.5,
        duration: 3.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      gsap.to('#card-memory .card-inner', {
        y: 6,
        rotation: -2.5,
        duration: 3.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      gsap.to('#card-canvas .card-inner', {
        y: -7,
        rotation: 1.8,
        duration: 4.0,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      gsap.to('#card-providers .card-inner', {
        y: 7,
        rotation: -1.8,
        duration: 3.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const line1Text = "Think in branches,";
  const line2Text = "remember everything.";

  // Helper function to render text character-by-character without breaking words
  const renderAnimatedLine = (text) => {
    const words = text.split(' ');
    return words.map((word, wordIndex) => (
      <span key={wordIndex} className="inline-block whitespace-nowrap">
        {word.split('').map((char, charIndex) => (
          <span key={charIndex} className="hero-char inline-block">
            {char}
          </span>
        ))}
        {wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
      </span>
    ));
  };

  return (
    <section ref={heroRef} className="px-[12px] sm:px-[20px] pt-[12px] sm:pt-[20px]">
      <div className="relative min-h-0 lg:min-h-[calc(100vh-20px)] overflow-hidden rounded-[24px] border border-black/[0.055] bg-white shadow-[0_2px_18px_rgba(11,13,18,0.045)]">
        
        {/* Paper texture & subtle highlight */}
        <div
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              'radial-gradient(rgba(0, 0, 0, 0.065) 0.8px, transparent 0.8px)',
            backgroundSize: '12px 12px',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.78)_45%,rgba(255,255,255,0.15)_100%)]" />

        {/* ═══════════════════════════════════════════════
             3D FLUID SHAPES BACKGROUND (MOBILE & TABLET: <1024px)
        ════════════════════════════════════════════════ */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          {/* Fluid sphere 1 */}
          <div className="absolute left-[5%] top-[20%] h-44 w-44 rounded-full bg-gradient-to-br from-brand/25 to-blue-400/20 blur-3xl animate-fluid-1" />
          
          {/* Fluid sphere 2 */}
          <div className="absolute right-[5%] top-[30%] h-52 w-52 rounded-full bg-gradient-to-tr from-violet-500/20 to-brand/25 blur-3xl animate-fluid-2" />

          {/* 3D Rings Visual */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[260px] w-[260px] rounded-full border border-brand/10 opacity-60"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[180px] w-[180px] rounded-full border border-violet-500/10 opacity-50"></div>
        </div>

        {/* ═══════════════════════════════════════════════
             NAVBAR AT TOP (SEAMLESS INTEGRATION)
        ════════════════════════════════════════════════ */}
        <div id="hero-navbar">
          <Navbar />
        </div>

        {/* ═══════════════════════════════════════════════
             DESKTOP FLOATING CARDS (lg+ ONLY: HIDDEN ON MOBILE/TABLET)
        ════════════════════════════════════════════════ */}
        
        {/* CARD 01: STICKY NOTE (Top-Left, Tilted +3.5deg towards center) */}
        <div
          id="card-sticky"
          className="absolute z-30 hidden lg:block lg:left-[2.5%] lg:top-[110px] lg:w-[260px] xl:left-[4.5%] xl:w-[285px]"
        >
          {/* Pushpin */}
          <div className="absolute left-1/2 -top-5 z-40 -translate-x-1/2">
            <div className="relative h-5.5 w-5.5 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-[0_4px_12px_rgba(220,38,38,0.4)] border border-red-400">
              <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-white/70"></span>
              <span className="absolute left-1/2 top-full h-2.5 w-[2px] -translate-x-1/2 bg-red-800 shadow-xs"></span>
            </div>
          </div>

          <div className="card-inner relative min-h-[160px] rotate-[3.5deg] bg-[#FFF9C4] p-4.5 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.03)] border border-amber-200/70 backdrop-blur-sm transition-transform duration-300 hover:rotate-[0.5deg] hover:shadow-xl hover:scale-[1.015]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-7 rounded-t-2xl bg-gradient-to-b from-white/40 to-transparent" />

            <div className="relative min-h-[90px]">
              {!stickyText && (
                <div className="pointer-events-none absolute inset-0 font-note text-[18px] leading-snug text-slate-400/80">
                  Leave yourself a thought...
                </div>
              )}
              <div
                ref={stickyRef}
                contentEditable="true"
                spellCheck="true"
                role="textbox"
                aria-label="Sticky note"
                onInput={handleStickyInput}
                className="relative z-10 min-h-[90px] cursor-text whitespace-pre-wrap break-words font-note text-[18px] leading-snug text-slate-800/90 outline-none"
              />
            </div>

            <div className="relative z-10 mt-2.5 flex items-center justify-between border-t border-amber-900/10 pt-2">
              <span className="font-sans text-[9px] font-medium tracking-wider uppercase text-slate-700/40">
                Personal Note ({wordCount}/{MAX_WORDS})
              </span>
              <span
                className={`font-sans text-[9px] font-medium text-amber-800/60 transition-opacity duration-300 ${
                  stickySaved ? 'opacity-100' : 'opacity-0'
                }`}
              >
                saved
              </span>
            </div>
          </div>

          <div
            id="stickyHint"
            className="pointer-events-none relative -bottom-[-16px] left-[60%] z-40 w-[130px] opacity-80"
          >
            <svg className="absolute -left-4 top-[-8px] h-[50px] w-[60px]" viewBox="0 0 55 48" fill="none">
              <path
                d="M5 4C15 7 23 14 26 25C29 35 37 39 48 38"
                stroke="#0B0D12"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeDasharray="2.5 3"
                opacity=".4"
              />
              <path
                d="M43 33L49 38L42 41"
                stroke="#0B0D12"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity=".4"
              />
            </svg>
            <span className="relative left-[36px] top-[14px] whitespace-nowrap rotate-[3deg] font-note text-[16px] font-semibold text-ink/65">
              leave a message
            </span>
          </div>
        </div>

        {/* CARD 02: WORKSPACE MEMORY (Top-Right, Tilted -3.5deg towards center) */}
        <div
          id="card-memory"
          className="absolute z-20 hidden lg:block lg:right-[2.5%] lg:top-[110px] lg:w-[260px] xl:right-[4.5%] xl:w-[285px]"
        >
          <div className="card-inner rotate-[-3.5deg] rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_16px_36px_rgba(11,13,18,0.06)] backdrop-blur-xl transition-transform duration-300 hover:rotate-[-0.5deg] hover:shadow-xl hover:scale-[1.015]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <span className="text-[12px] font-semibold text-slate-900 tracking-tight">
                  Workspace Memory
                </span>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Context
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <div className="group rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition-all hover:bg-slate-100/80 hover:border-brand/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-800 transition-colors group-hover:text-brand">
                    Current Project
                  </span>
                  <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[8.5px] font-semibold text-brand">
                    active
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-slate-500 leading-snug">
                  Landing page & branch logic
                </p>
              </div>

              <div className="group rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition-all hover:bg-slate-100/80 hover:border-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-800">
                    Writing Preference
                  </span>
                  <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[8.5px] font-medium text-slate-600">
                    saved
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-slate-500 leading-snug">
                  Concise and clean pattern
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 03: THOUGHT THREADS GRAPH (Bottom-Left, Tilted +2.5deg towards center) */}
        <div
          id="card-canvas"
          className="absolute z-20 hidden lg:block lg:left-[2.5%] lg:bottom-[4%] lg:w-[270px] xl:left-[4.5%] xl:w-[295px]"
        >
          <div className="card-inner rotate-[2.5deg] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_16px_36px_rgba(11,13,18,0.06)] backdrop-blur-xl transition-transform duration-300 hover:rotate-[0.5deg] hover:shadow-xl hover:scale-[1.015]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="6" cy="6" r="3" />
                    <circle cx="18" cy="18" r="3" />
                    <path d="M8.5 8.5l7 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-slate-900 tracking-tight">
                    Thought Threads
                  </p>
                  <p className="text-[9px] text-slate-400 font-sans">
                    3 parallel branches
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-600">
                Connected
              </span>
            </div>

            {/* Clean SVG Vector Graph with Flowing Line Animation */}
            <div className="relative mt-3 h-[95px] overflow-hidden rounded-xl border border-slate-100 bg-[#F8FAFC]">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(148,163,184,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.15) 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                }}
              />

              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 240 95" fill="none">
                <path d="M45 47 C90 47, 95 24, 135 24" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" className="animate-stroke-flow" />
                <path d="M45 47 C90 47, 95 70, 135 70" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" className="animate-stroke-flow" />
                <path d="M135 24 L190 24" stroke="#CBD5E1" strokeWidth="1.5" />
              </svg>

              {/* Node Badges */}
              <div className="absolute left-[8%] top-[34%] flex items-center gap-1.5 rounded-lg border border-brand/20 bg-white px-2 py-1 shadow-xs transition-transform duration-200 hover:scale-105">
                <span className="h-2 w-2 rounded-full bg-brand"></span>
                <span className="text-[9px] font-medium text-slate-700">Root</span>
              </div>

              <div className="absolute left-[48%] top-[12%] flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-xs transition-transform duration-200 hover:scale-105">
                <span className="h-2 w-2 rounded-full bg-violet-500"></span>
                <span className="text-[9px] font-medium text-slate-700">Branch A</span>
              </div>

              <div className="absolute left-[48%] top-[58%] flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-xs transition-transform duration-200 hover:scale-105">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-[9px] font-medium text-slate-700">Branch B</span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[9px] font-sans text-slate-400">
              <span>Branch anywhere</span>
              <span className="text-slate-600 font-medium">Auto-synced</span>
            </div>
          </div>
        </div>

        {/* CARD 04: AI MODELS (Bottom-Right, Tilted -2.5deg towards center) */}
        <div
          id="card-providers"
          className="absolute z-20 hidden lg:block lg:right-[2.5%] lg:bottom-[4%] lg:w-[260px] xl:right-[4.5%] xl:w-[285px]"
        >
          <div className="card-inner rotate-[-2.5deg] rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_16px_36px_rgba(11,13,18,0.06)] backdrop-blur-xl transition-transform duration-300 hover:rotate-[-0.5deg] hover:shadow-xl hover:scale-[1.015]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-slate-900 tracking-tight">
                  AI Models
                </p>
                <p className="text-[9px] text-slate-400 font-sans">
                  Direct provider connections
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-600">
                Active
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2 transition-all hover:bg-slate-100/80 hover:scale-[1.01]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 font-bold text-xs border border-amber-200/50">
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10.5px] font-medium text-slate-800">
                    Claude 3.5 Sonnet
                  </p>
                  <p className="text-[8.5px] font-sans text-slate-400">
                    Anthropic
                  </p>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2 transition-all hover:bg-slate-100/80 hover:scale-[1.01]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs border border-emerald-200/50">
                  O
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10.5px] font-medium text-slate-800">
                    GPT-4o
                  </p>
                  <p className="text-[8.5px] font-sans text-slate-400">
                    OpenAI
                  </p>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[9px] font-sans text-slate-400">
              <span>Direct access</span>
              <span className="text-brand font-medium hover:underline cursor-pointer">
                Manage Keys →
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
             HERO CENTER CONTENT
        ════════════════════════════════════════════════ */}
        <div className="relative z-10 flex min-h-0 lg:min-h-[calc(100vh-120px)] flex-col items-center justify-center px-5 py-10 lg:py-16 text-center sm:px-6">
          
          {/* Pill Badge */}
          <div
            id="hero-pill"
            className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/90 px-3.5 py-1.5 shadow-[0_3px_12px_rgba(15,23,42,0.045)] backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand"></span>
            </span>
            <span className="text-[10.5px] font-medium tracking-wide text-ink/60">
              A new way to work with AI
            </span>
          </div>

          {/* Animated Hero Heading (Word-level Wrapping to prevent letter splits) */}
          <h1
            id="hero-heading"
            ref={headingRef}
            className="mt-6 max-w-4xl font-display font-medium tracking-[-0.045em] text-[34px] leading-[1.08] sm:text-6xl md:text-[70px] lg:text-[84px]"
          >
            <span className="inline">
              {renderAnimatedLine(line1Text)}
            </span>
            <br />
            <span className="text-ink/25 inline">
              {renderAnimatedLine(line2Text)}
            </span>
          </h1>

          {/* Subtext */}
          <p
            id="hero-desc"
            className="mt-6 max-w-lg text-[13.5px] font-medium leading-relaxed text-ink/55 sm:text-[15px]"
          >
            Olai is a spatial AI workspace for thinking beyond the chat box — branch conversations, scope your memory, and keep every decision connected.
          </p>

          {/* Call to Action */}
          <div id="hero-cta" className="mt-7">
            <a
              href="#waitlist"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand to-brand-dark px-5.5 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(46,124,246,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(46,124,246,0.30)] active:translate-y-0 active:scale-[0.97]"
            >
              Join the waitlist
              <svg
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
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
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
