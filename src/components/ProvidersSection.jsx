import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: 'GPT-4o · o3-mini',
    tag: 'Direct API',
    desc: 'Plug in your OpenAI key to run GPT-4o and reasoning models per node.',
    icon: (
      <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7606-3.9877 5.98 5.98 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7363-7.2911zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7944.7944 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.47 4.47 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 8.7356a4.4653 4.4653 0 0 1 2.337-1.9776V12.3a.7759.7759 0 0 0 .388.6718l5.8286 3.3638-2.02 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7913A4.4944 4.4944 0 0 1 2.3408 8.7356zm16.5963 3.8558-5.838-3.3685 2.0152-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.7944.7944 0 0 0-.402-.686zm2.0104-3.009-4.7783-2.7582a.7759.7759 0 0 0-.7854 0L9.541 10.1927V7.8603a.0804.0804 0 0 1 .0332-.0615l4.8303-2.7914a4.4992 4.4992 0 0 1 6.6802 4.6653zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.052V6.0646a4.4944 4.4944 0 0 1 7.3757-3.4537l-.1419.0805-4.7783 2.7582a.7944.7944 0 0 0-.3927.6813v6.7322zm1.0976-2.3655 2.602-1.4998 2.6069 1.4998v2.9996l-2.6069 1.5045-2.602-1.5045z"/>
      </svg>
    ),
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: 'Gemini 1.5 Pro · 2.0',
    tag: 'Long Context',
    desc: 'Connect Google AI Studio keys for long-context research branches.',
    icon: (
      <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z"/>
      </svg>
    ),
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: 'Claude 3.5 Sonnet',
    tag: 'Reasoning',
    desc: 'Power your creative writing and architecture nodes with Claude.',
    icon: (
      <svg className="h-5 w-5 text-amber-700" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 17.574h-4.32l-1.042-3.136H7.89l-1.042 3.136H2.528L8.683 2.426h4.634l6.155 15.148zm-6.425-6.526L9.98 7.82l-1.067 3.228h2.134z"/>
      </svg>
    ),
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: '100+ Models',
    tag: 'Unified API',
    desc: 'Use one key to access DeepSeek, Mistral, Llama, and 100+ models.',
    icon: (
      <svg className="h-5 w-5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7v10M7 12h10"/>
      </svg>
    ),
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    models: 'Grok 2 · Vision',
    tag: 'Real-time',
    desc: 'Connect xAI keys for fast real-time search and reasoning.',
    icon: (
      <svg className="h-5 w-5 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    models: 'Llama 3.1 405B',
    tag: 'Enterprise GPU',
    desc: 'Connect hosted or enterprise GPU microservice endpoints.',
    icon: (
      <svg className="h-5 w-5 text-emerald-700" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M9 9h6v6H9z" fill="white" />
      </svg>
    ),
  },
  {
    id: 'ollama',
    name: 'Local Ollama & vLLM',
    models: 'Zero Telemetry',
    tag: 'Private / Offline',
    desc: 'Run local models on your own machine with complete privacy.',
    icon: (
      <svg className="h-5 w-5 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 9h6M9 12h6M9 15h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'more',
    isMore: true,
    name: '+ Custom Endpoints',
    models: 'DeepSeek · Groq · Custom',
    tag: 'Supported',
    desc: 'Connect any OpenAI-compatible custom endpoint or proxy.',
    icon: (
      <div className="flex h-5 w-5 items-center justify-center font-mono text-xs font-bold text-ink">
        +
      </div>
    ),
  },
];

export default function ProvidersSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '#provider-kicker, #provider-title, #provider-sub',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
          },
        }
      );

      gsap.fromTo(
        '.provider-card',
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.06,
          duration: 0.8,
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

  return (
    <section ref={sectionRef} id="providers" className="relative w-full bg-[#F8F8F7] text-ink px-[12px] sm:px-[20px] py-10 sm:py-14 lg:py-16 overflow-hidden">
      <div className="border-t border-black/[0.07] mb-8 sm:mb-10"></div>

      <div className="w-full max-w-[1750px] mx-auto">
        
        {/* Section Header */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end mb-8 sm:mb-10">
          <div className="lg:col-span-8">
            <p id="provider-kicker" className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink/40">
              04 / Model Providers
            </p>
            <h2 id="provider-title" className="mt-2.5 max-w-4xl font-display text-3xl font-medium leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl text-ink">
              One canvas, <span className="text-ink/30 italic font-normal">every provider.</span>
            </h2>
          </div>
          <div className="lg:col-span-4 lg:pb-1">
            <p id="provider-sub" className="max-w-md text-xs leading-[1.75] text-ink/55 sm:text-[14px]">
              Plug in your API keys to switch models per node. Connect OpenAI, Gemini, Claude, OpenRouter, Grok, and NVIDIA NIM in a single connected workflow.
            </p>
          </div>
        </div>

        {/* 8 Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className={`provider-card group relative flex flex-col justify-between rounded-[20px] border p-5 transition-all duration-200 ${
                provider.isMore
                  ? 'border-dashed border-black/20 bg-white/50 hover:bg-white hover:border-black/35'
                  : 'border-black/[0.10] bg-white shadow-[0_12px_35px_rgba(11,13,18,0.05)] hover:border-black/20 hover:shadow-lg'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F7F5] border border-black/[0.05] transition-transform group-hover:scale-105">
                    {provider.icon}
                  </div>
                  <span className="rounded-md bg-slate-100/80 px-2 py-0.5 font-mono text-[8px] font-semibold text-slate-600">
                    {provider.tag}
                  </span>
                </div>

                <h3 className="font-display text-base font-semibold tracking-tight text-slate-900 mb-0.5">
                  {provider.name}
                </h3>
                <p className="font-mono text-[8.5px] font-semibold text-brand tracking-wider uppercase mb-2">
                  {provider.models}
                </p>

                <p className="text-xs leading-relaxed text-ink/60">
                  {provider.desc}
                </p>
              </div>

              <div className="mt-5 border-t border-black/[0.06] pt-3 flex items-center justify-between font-mono text-[8.5px] text-ink/40 uppercase">
                <span>API Status</span>
                <span className="text-emerald-600 font-semibold">Direct Plug</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
