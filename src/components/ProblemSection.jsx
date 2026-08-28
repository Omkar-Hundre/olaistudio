import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const SLIDES = [
  {
    id: 0,
    number: '01',
    title: 'Context evaporates.',
    subtitle: 'Constraints and decisions get buried in long threads. The further you scroll, the easier they are to lose.',
    barColor: 'bg-rose-500',
    label: 'Context evaporates',
  },
  {
    id: 1,
    number: '02',
    title: 'Alternatives break apart.',
    subtitle: 'Exploring another idea means opening another chat and rebuilding the same context by hand.',
    barColor: 'bg-violet-500',
    label: 'Alternatives break apart',
  },
  {
    id: 2,
    number: '03',
    title: 'Thought loses structure.',
    subtitle: 'Research, brainstorming, decisions, references, and code all end up inside the same scrolling stream.',
    barColor: 'bg-emerald-500',
    label: 'Thought loses structure',
  },
];

export default function ProblemSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  // Auto-slide timer: advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeSlide]);

  // GSAP ScrollTrigger for section header entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '#why-overline, #why-heading, #why-sub, .problem-tab',
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.14,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
          },
        }
      );

      gsap.fromTo(
        '#problem-slider-box',
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // GSAP Slide Content Staggered Entrance Animation (Smoother & Deliberate Speed)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const currentSlideElement = trackRef.current?.children[activeSlide];
      if (currentSlideElement) {
        const animatableItems = currentSlideElement.querySelectorAll('.slide-animate-item');
        gsap.fromTo(
          animatableItems,
          { opacity: 0, y: 22, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.14,
            duration: 0.85,
            ease: 'power3.out',
          }
        );
      }
    }, trackRef);

    return () => ctx.revert();
  }, [activeSlide]);

  const goToNext = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const goToPrev = () => {
    setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  return (
    <section ref={sectionRef} id="why" className="relative w-full overflow-hidden bg-[#F2F3F5] text-ink">
      <div className="border-t border-black/[0.07]"></div>

      <div className="px-5 py-16 sm:px-8 md:px-12 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10 xl:gap-14">

          {/* ══════════ LEFT COLUMN: STICKY HEADER & INDEX ══════════ */}
          <div className="lg:col-span-5 xl:col-span-5">
            <div className="lg:sticky lg:top-16">
              <p id="why-overline" className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink/40">
                01 / The problem
              </p>

              <h2 id="why-heading" className="mt-5 max-w-[680px] font-display text-[38px] font-medium leading-[1.02] tracking-[-0.045em] sm:text-5xl md:text-[58px] lg:text-[64px] xl:text-[70px]">
                Chat is a linear timeline.
                <span className="block text-ink/25">Thought is a web.</span>
              </h2>

              <p id="why-sub" className="mt-6 max-w-xl text-sm leading-[1.75] text-ink/55 sm:text-[15px]">
                Ideas branch, decisions change, and context needs to stay connected. A single scrolling conversation wasn't designed for that.
              </p>

              {/* Synchronized Index Tabs */}
              <div className="mt-10 max-w-xl border-t border-black/[0.08]">
                {SLIDES.map((slide) => {
                  const isActive = activeSlide === slide.id;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveSlide(slide.id)}
                      className="problem-tab group flex w-full items-center gap-4 border-b border-black/[0.05] py-4 text-left transition-all duration-300"
                    >
                      <span className={`font-mono text-[11px] font-semibold ${
                        slide.id === 0 ? 'text-rose-500' : slide.id === 1 ? 'text-violet-500' : 'text-emerald-500'
                      }`}>
                        {slide.number}
                      </span>
                      <span
                        className={`text-[13.5px] font-semibold transition-colors duration-300 ${
                          isActive ? 'text-ink' : 'text-ink/40 group-hover:text-ink/75'
                        }`}
                      >
                        {slide.label}
                      </span>
                      <span
                        className={`ml-auto h-px transition-all duration-500 ${
                          isActive
                            ? `w-14 ${slide.barColor} opacity-100`
                            : `w-8 ${slide.barColor} opacity-25`
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ══════════ RIGHT COLUMN: ANIMATED INTERACTIVE SLIDER ══════════ */}
          <div className="lg:col-span-7 xl:col-span-7">
            <div
              id="problem-slider-box"
              className="relative overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_20px_50px_rgba(11,13,18,0.07)]"
            >
              
              {/* Slider Track */}
              <div
                ref={trackRef}
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >

                {/* ── SLIDE 01: CONTEXT EVAPORATES ── */}
                <article className="w-full shrink-0">
                  <div className="flex min-h-[430px] sm:min-h-[460px] lg:min-h-[480px] flex-col">
                    <div className="flex items-start justify-between gap-6 border-b border-black/[0.07] px-6 py-5 sm:px-8">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
                          Context evaporates.
                        </h3>
                        <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-ink/55">
                          Constraints and decisions get buried in long threads. The further you scroll, the easier they are to lose.
                        </p>
                      </div>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-rose-200 bg-rose-500/10 font-mono text-[11px] font-semibold text-rose-500">
                        01
                      </span>
                    </div>

                    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-8 sm:px-10">
                      <div
                        className="pointer-events-none absolute inset-0 opacity-[0.025]"
                        style={{
                          backgroundImage:
                            'linear-gradient(rgba(11,13,18,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(11,13,18,.5) 1px,transparent 1px)',
                          backgroundSize: '32px 32px',
                        }}
                      />

                      <div className="relative z-10 w-full max-w-lg space-y-3">
                        {/* User Message 1 */}
                        <div className="slide-animate-item flex justify-end">
                          <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-brand px-4 py-3 text-xs text-white shadow-xs">
                            <p className="mb-1 font-mono text-[8.5px] uppercase tracking-wider text-white/50">
                              You · Message 02
                            </p>
                            <p className="font-medium">The launch budget is strictly $2,000.</p>
                          </div>
                        </div>

                        {/* Assistant Message 1 */}
                        <div className="slide-animate-item flex justify-start">
                          <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-md border border-black/[0.07] bg-slate-50/80 px-4 py-3 text-xs text-ink/70 shadow-xs">
                            <p className="mb-1 font-mono text-[8.5px] uppercase tracking-wider text-ink/40">
                              Assistant · Message 03
                            </p>
                            <p>Understood. I'll keep the launch plan within $2,000.</p>
                          </div>
                        </div>

                        {/* Timeline Divider */}
                        <div className="slide-animate-item my-4 flex items-center gap-3">
                          <div className="h-px flex-1 bg-black/[0.08]"></div>
                          <span className="whitespace-nowrap font-mono text-[8.5px] uppercase tracking-wider text-ink/35">
                            11 messages later
                          </span>
                          <div className="h-px flex-1 bg-black/[0.08]"></div>
                        </div>

                        {/* User Message 2 */}
                        <div className="slide-animate-item flex justify-end">
                          <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-brand px-4 py-3 text-xs text-white shadow-xs">
                            <p className="mb-1 font-mono text-[8.5px] uppercase tracking-wider text-white/50">
                              You · Message 14
                            </p>
                            <p className="font-medium">What advertising budget should we allocate?</p>
                          </div>
                        </div>

                        {/* Contradictory Assistant Message */}
                        <div className="slide-animate-item flex justify-start">
                          <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-md border border-rose-200 bg-rose-50/60 px-4 py-3 text-xs text-ink/80 shadow-xs">
                            <p className="mb-1 font-mono text-[8.5px] uppercase tracking-wider text-rose-500">
                              Assistant · Message 15
                            </p>
                            <p>
                              I'd recommend <span className="font-semibold text-rose-600">$5,000</span> for maximum reach.
                            </p>
                          </div>
                        </div>

                        {/* Conflict Warning Badge */}
                        <div className="slide-animate-item mt-3 flex items-center justify-center gap-2 text-[9.5px] font-semibold uppercase tracking-wider text-rose-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          Context Contradiction Detected
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                {/* ── SLIDE 02: ALTERNATIVES BREAK APART ── */}
                <article className="w-full shrink-0">
                  <div className="flex min-h-[430px] sm:min-h-[460px] lg:min-h-[480px] flex-col">
                    <div className="flex items-start justify-between gap-6 border-b border-black/[0.07] px-6 py-5 sm:px-8">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
                          Alternatives break apart.
                        </h3>
                        <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-ink/55">
                          Exploring another idea means opening another chat window and rebuilding the same context by hand.
                        </p>
                      </div>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-violet-200 bg-violet-500/10 font-mono text-[11px] font-semibold text-violet-600">
                        02
                      </span>
                    </div>

                    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-8 sm:px-10">
                      <div
                        className="pointer-events-none absolute inset-0 opacity-[0.025]"
                        style={{
                          backgroundImage:
                            'linear-gradient(rgba(11,13,18,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(11,13,18,.5) 1px,transparent 1px)',
                          backgroundSize: '32px 32px',
                        }}
                      />

                      <div className="relative z-10 w-full max-w-lg space-y-4">
                        {/* Conversation A */}
                        <div className="slide-animate-item rounded-2xl border border-black/[0.07] bg-white p-4 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-brand"></span>
                              <span className="text-[11px] font-semibold text-slate-800">Launch Strategy</span>
                            </div>
                            <span className="font-mono text-[8.5px] text-ink/40">Chat Thread A</span>
                          </div>
                          <div className="mt-3 space-y-1.5">
                            <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-[10.5px] text-ink/60">
                              Budget: $2,000 cap
                            </div>
                            <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-[10.5px] text-ink/60">
                              Target Audience: Software Developers
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="slide-animate-item flex items-center justify-center gap-3">
                          <div className="h-px w-12 bg-black/[0.08]"></div>
                          <span className="font-mono text-[9px] text-violet-600 font-medium">New Direction</span>
                          <div className="h-px w-12 bg-black/[0.08]"></div>
                        </div>

                        {/* Conversation B */}
                        <div className="slide-animate-item rounded-2xl border border-violet-200 bg-violet-50/50 p-4 shadow-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-violet-500"></span>
                              <span className="text-[11px] font-semibold text-slate-800">Developer Strategy</span>
                            </div>
                            <span className="font-mono text-[8.5px] text-violet-600">Chat Thread B</span>
                          </div>
                          <p className="mt-2.5 text-[10.5px] leading-relaxed text-ink/60">
                            Same project details must be copied across manually into a separate chat.
                          </p>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-violet-200/60">
                            <div className="h-full w-[50%] rounded-full bg-violet-500"></div>
                          </div>
                          <p className="mt-1.5 font-mono text-[8.5px] text-violet-700/70">Context rebuilt manually</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                {/* ── SLIDE 03: THOUGHT LOSES STRUCTURE ── */}
                <article className="w-full shrink-0">
                  <div className="flex min-h-[430px] sm:min-h-[460px] lg:min-h-[480px] flex-col">
                    <div className="flex items-start justify-between gap-6 border-b border-black/[0.07] px-6 py-5 sm:px-8">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
                          Thought loses structure.
                        </h3>
                        <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-ink/55">
                          Research, brainstorming, decisions, references, and code all end up inside the same scrolling stream.
                        </p>
                      </div>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-200 bg-emerald-500/10 font-mono text-[11px] font-semibold text-emerald-600">
                        03
                      </span>
                    </div>

                    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-8 sm:px-10">
                      <div
                        className="pointer-events-none absolute inset-0 opacity-[0.03]"
                        style={{
                          backgroundImage:
                            'linear-gradient(rgba(11,13,18,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(11,13,18,.5) 1px,transparent 1px)',
                          backgroundSize: '28px 28px',
                        }}
                      />

                      <div className="relative z-10 w-full max-w-xl">
                        <div className="relative mx-auto h-[240px] w-full">
                          {/* Flow lines */}
                          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 520 240" fill="none">
                            <path d="M260 120 C180 120 140 50 70 50" stroke="#CBD5E1" strokeWidth="1.5" />
                            <path d="M260 120 C180 120 140 190 70 190" stroke="#CBD5E1" strokeWidth="1.5" />
                            <path d="M260 120 C340 120 380 50 450 50" stroke="#CBD5E1" strokeWidth="1.5" />
                            <path d="M260 120 C340 120 380 190 450 190" stroke="#CBD5E1" strokeWidth="1.5" />

                            <path d="M260 120 C180 120 140 50 70 50" stroke="#2E7CF6" strokeWidth="1.5" strokeDasharray="4 4" className="animate-stroke-flow" />
                            <path d="M260 120 C180 120 140 190 70 190" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="4 4" className="animate-stroke-flow" />
                            <path d="M260 120 C340 120 380 50 450 50" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" className="animate-stroke-flow" />
                            <path d="M260 120 C340 120 380 190 450 190" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 4" className="animate-stroke-flow" />
                          </svg>

                          {/* Center Spatial Hub */}
                          <div className="slide-animate-item absolute left-1/2 top-1/2 flex h-18 w-18 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border border-brand/30 bg-white p-2 shadow-lg backdrop-blur-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-soft text-brand">
                              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
                              </svg>
                            </div>
                            <span className="mt-1 font-sans text-[8.5px] font-semibold text-brand">
                              Spatial Hub
                            </span>
                          </div>

                          {/* Node Card 1 */}
                          <div className="slide-animate-item absolute left-[1%] top-[4%] flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white p-2.5 shadow-sm">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-[10.5px] font-semibold text-ink">Research Context</p>
                              <p className="font-mono text-[8.5px] text-ink/40">14 sources</p>
                            </div>
                          </div>

                          {/* Node Card 2 */}
                          <div className="slide-animate-item absolute left-[1%] bottom-[4%] flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white p-2.5 shadow-sm">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-[10.5px] font-semibold text-ink">Brainstorm</p>
                              <p className="font-mono text-[8.5px] text-ink/40">3 branches</p>
                            </div>
                          </div>

                          {/* Node Card 3 */}
                          <div className="slide-animate-item absolute right-[1%] top-[4%] flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white p-2.5 shadow-sm">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-[10.5px] font-semibold text-ink">Strict Constraints</p>
                              <p className="font-mono text-[8.5px] text-emerald-600">$2,000 budget</p>
                            </div>
                          </div>

                          {/* Node Card 4 */}
                          <div className="slide-animate-item absolute right-[1%] bottom-[4%] flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white p-2.5 shadow-sm">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-[10.5px] font-semibold text-ink">Artifact Canvas</p>
                              <p className="font-mono text-[8.5px] text-ink/40">Live preview</p>
                            </div>
                          </div>
                        </div>

                        <p className="slide-animate-item mt-3 text-center text-xs font-medium text-ink/50">
                          Data streams dynamically across nodes without losing context.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>

              </div>

              {/* ══════════ CONTROLS FOOTER ══════════ */}
              <div className="flex items-center justify-between border-t border-black/[0.08] px-4 py-4 sm:px-6 bg-slate-50/50">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={goToPrev}
                  aria-label="Previous slide"
                  className="group flex h-9 w-9 items-center justify-center rounded-full border border-black/15 bg-white text-ink shadow-xs transition-all duration-200 hover:bg-slate-900 hover:text-white active:scale-95"
                >
                  <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 16 16" fill="none">
                    <path d="M10.5 3.5 6 8l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Dot Navigation */}
                <div className="flex items-center gap-2">
                  {SLIDES.map((slide) => {
                    const isActive = activeSlide === slide.id;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActiveSlide(slide.id)}
                        aria-label={`Go to slide ${slide.id + 1}`}
                        className={`h-2 transition-all duration-300 rounded-full ${
                          isActive ? 'w-8 bg-slate-900' : 'w-2 bg-black/20 hover:bg-black/40'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="Next slide"
                  className="group flex h-9 w-9 items-center justify-center rounded-full border border-black/15 bg-white text-ink shadow-xs transition-all duration-200 hover:bg-slate-900 hover:text-white active:scale-95"
                >
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none">
                    <path d="m5.5 3.5 4.5 4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
