import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HowItWorksSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header entrance
      gsap.fromTo(
        '#how-eyebrow, #how-heading, #how-badge',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
          },
        }
      );

      // 4 Step cards staggered entrance
      gsap.fromTo(
        '.how-step-card',
        { opacity: 0, y: 35, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.12,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="how" className="relative w-full overflow-hidden bg-white text-ink px-[12px] sm:px-[20px] py-12 lg:py-20">
      <div className="border-t border-black/[0.07] mb-12"></div>

      <div className="w-full max-w-[1750px] mx-auto">

        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end mb-12">
          <div>
            <p id="how-eyebrow" className="font-mono text-[10.5px] font-semibold uppercase tracking-widest text-ink/40">
              02 / Architecture & Workflow
            </p>
            <h2 id="how-heading" className="mt-3 font-display text-3xl font-medium leading-[1.04] tracking-[-0.04em] sm:text-5xl lg:text-6xl max-w-5xl">
              A canvas built for <span className="text-ink/30 italic font-normal">the entire workflow.</span>
            </h2>
          </div>
        </div>

        {/* 4x1 Single Row Grid (4 Columns across max-width screen) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">

          {/* ── CARD 01: RESEARCH & SOURCES ── */}
          <div className="how-step-card group flex flex-col justify-between rounded-2xl border border-black/[0.075] bg-[#FAFBFD] p-5 sm:p-6 shadow-[0_10px_30px_rgba(11,13,18,0.03)] transition-all duration-300 hover:border-brand/30 hover:bg-white hover:shadow-[0_18px_40px_rgba(46,124,246,0.08)]">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-brand-soft font-mono text-xs font-semibold text-brand">
                  01
                </span>
                <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wider text-ink/40">
                  Research & Sources
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-medium tracking-tight">
                Research & Ingestion
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-ink/55">
                Drop PDFs, links, or transcripts directly onto the canvas. Every source becomes a searchable node.
              </p>
            </div>

            {/* Mockup 01 */}
            <div className="relative mt-6 h-[180px] overflow-hidden rounded-xl border border-black/[0.06] bg-white p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-black/[0.05] pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand"></span>
                  <span className="font-mono text-[9.5px] font-semibold text-slate-800">Parser Engine</span>
                </div>
                <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[8px] font-semibold text-brand">
                  3 Synced
                </span>
              </div>

              <div className="space-y-1.5 my-auto">
                <div className="flex items-center justify-between rounded-lg border border-black/[0.05] bg-slate-50 p-2 text-[10px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <svg className="h-3.5 w-3.5 text-brand shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    </svg>
                    <span className="font-medium text-slate-800 truncate">Spec_Doc.pdf</span>
                  </div>
                  <span className="font-mono text-[8px] text-emerald-600 font-medium">Parsed</span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-black/[0.05] bg-slate-50 p-2 text-[10px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <svg className="h-3.5 w-3.5 text-brand shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    </svg>
                    <span className="font-medium text-slate-800 truncate">API Docs URL</span>
                  </div>
                  <span className="font-mono text-[8px] text-emerald-600 font-medium">Parsed</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-black/[0.05] pt-1.5 text-[8.5px] font-mono text-slate-400">
                <span>Vectorized context</span>
                <span className="text-brand font-medium">Ready</span>
              </div>
            </div>
          </div>

          {/* ── CARD 02: PLANNING & EDGES ── */}
          <div className="how-step-card group flex flex-col justify-between rounded-2xl border border-black/[0.075] bg-[#FAFBFD] p-5 sm:p-6 shadow-[0_10px_30px_rgba(11,13,18,0.03)] transition-all duration-300 hover:border-brand/30 hover:bg-white hover:shadow-[0_18px_40px_rgba(46,124,246,0.08)]">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-brand-soft font-mono text-xs font-semibold text-brand">
                  02
                </span>
                <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wider text-ink/40">
                  Planning & Edges
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-medium tracking-tight">
                Planning & Branching
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-ink/55">
                Draw directional edges to pass context forward. Branch into alternative ideas with zero context bleed.
              </p>
            </div>

            {/* Mockup 02 */}
            <div className="relative mt-6 h-[180px] overflow-hidden rounded-xl border border-black/[0.06] bg-white p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-black/[0.05] pb-2">
                <span className="font-mono text-[9.5px] font-semibold text-slate-800">Directed Edges</span>
                <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[8px] font-semibold text-brand">
                  2 Branches
                </span>
              </div>

              <div className="relative h-[95px] my-auto">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 240 95" fill="none">
                  <path d="M50 47 C 100 47, 110 22, 160 22" stroke="#CBD5E1" strokeWidth="1.5" />
                  <path d="M50 47 C 100 47, 110 72, 160 72" stroke="#CBD5E1" strokeWidth="1.5" />
                  <path d="M50 47 C 100 47, 110 22, 160 22" stroke="#2E7CF6" strokeWidth="1.5" strokeDasharray="4 4" className="animate-stroke-flow" />
                  <path d="M50 47 C 100 47, 110 72, 160 72" stroke="#2E7CF6" strokeWidth="1.5" strokeDasharray="4 4" className="animate-stroke-flow" />
                </svg>

                <div className="relative z-10 flex h-full items-center justify-between px-1">
                  <div className="rounded-lg border border-brand/20 bg-brand-soft/60 p-2 shadow-xs text-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand inline-block mb-0.5"></span>
                    <p className="text-[9px] font-semibold text-brand">Root</p>
                  </div>

                  <div className="flex flex-col justify-between h-full py-1">
                    <div className="rounded border border-black/[0.06] bg-white p-1.5 shadow-xs text-left">
                      <p className="text-[8.5px] font-semibold text-slate-800">Branch A: REST</p>
                    </div>
                    <div className="rounded border border-black/[0.06] bg-white p-1.5 shadow-xs text-left">
                      <p className="text-[8.5px] font-semibold text-slate-800">Branch B: GraphQL</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-black/[0.05] pt-1.5 text-[8.5px] font-mono text-slate-400">
                <span>Isolated state</span>
                <span className="text-brand font-medium">No bleed</span>
              </div>
            </div>
          </div>

          {/* ── CARD 03: SCOPED MEMORY ── */}
          <div className="how-step-card group flex flex-col justify-between rounded-2xl border border-black/[0.075] bg-[#FAFBFD] p-5 sm:p-6 shadow-[0_10px_30px_rgba(11,13,18,0.03)] transition-all duration-300 hover:border-brand/30 hover:bg-white hover:shadow-[0_18px_40px_rgba(46,124,246,0.08)]">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-brand-soft font-mono text-xs font-semibold text-brand">
                  03
                </span>
                <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wider text-ink/40">
                  Scoped Memory
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-medium tracking-tight">
                Scoped Memory Rules
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-ink/55">
                Scope memory across global or tree levels. Scratchpads read context without corrupting main decisions.
              </p>
            </div>

            {/* Mockup 03 */}
            <div className="relative mt-6 h-[180px] overflow-hidden rounded-xl border border-black/[0.06] bg-white p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-black/[0.05] pb-2">
                <span className="font-mono text-[9.5px] font-semibold text-slate-800">Memory Protection</span>
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-600 border border-emerald-200">
                  Guard Active
                </span>
              </div>

              <div className="space-y-1.5 my-auto">
                <div className="flex items-center justify-between rounded-lg border border-black/[0.05] bg-slate-50 p-2 text-[9.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-brand"></span>
                    <span className="font-medium text-slate-800">Tree Memory</span>
                  </div>
                  <span className="font-mono text-[8px] text-brand font-semibold">Read & Write</span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-100/70 p-2 text-[9.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                    <span className="font-medium text-slate-700">Scratchpad</span>
                  </div>
                  <span className="font-mono text-[8px] text-slate-500 font-semibold">Read Only</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-black/[0.05] pt-1.5 text-[8.5px] font-mono text-slate-400">
                <span>Protected tree</span>
                <span className="text-slate-600 font-medium">Auto-sync</span>
              </div>
            </div>
          </div>

          {/* ── CARD 04: AUTHENTIC DARK TERMINAL & BUILDING ── */}
          <div className="how-step-card group flex flex-col justify-between rounded-2xl border border-black/[0.075] bg-[#FAFBFD] p-5 sm:p-6 shadow-[0_10px_30px_rgba(11,13,18,0.03)] transition-all duration-300 hover:border-brand/30 hover:bg-white hover:shadow-[0_18px_40px_rgba(46,124,246,0.08)]">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-brand-soft font-mono text-xs font-semibold text-brand">
                  04
                </span>
                <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wider text-ink/40">
                  Building & Output
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-medium tracking-tight">
                Building & Output
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-ink/55">
                Synthesize research and decisions directly into production code artifacts and deployable project builds.
              </p>
            </div>

            {/* Authentic macOS Dark Terminal Window Mockup */}
            <div className="relative mt-6 h-[180px] overflow-hidden rounded-xl border border-[#1E293B] bg-[#0B0D12] p-3 shadow-md flex flex-col justify-between">
              {/* Terminal Titlebar */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>
                <span className="font-mono text-[8.5px] text-slate-400">
                  bash — olai-cli
                </span>
              </div>

              {/* Terminal Logs & Output */}
              <div className="my-auto font-mono text-[9px] leading-relaxed text-slate-300 space-y-1">
                <p className="text-slate-400">
                  <span className="text-brand font-semibold">$</span> olai build --prod
                </p>
                <p className="text-slate-300">
                  <span className="text-emerald-400 font-bold">✔</span> Parsed 14 research nodes
                </p>
                <p className="text-slate-300">
                  <span className="text-emerald-400 font-bold">✔</span> Verified scoped memory
                </p>
                <p className="text-slate-300">
                  <span className="text-emerald-400 font-bold">✔</span> Generated React Flow canvas
                </p>
                <p className="text-emerald-400 font-semibold pt-0.5">
                  🚀 Built in 1.18s → dist/
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[8px] font-mono text-slate-500">
                <span>Output: dist/index.html</span>
                <span className="text-emerald-400">Deploy ready</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
