import React, { useEffect, useState } from 'react';
import gsap from 'gsap';

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress counter animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 60);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const tl = gsap.timeline({
        onComplete: () => {
          if (onComplete) onComplete();
        },
      });

      tl.to('#preloader-logo', {
        scale: 0.9,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
      })
      .to('#preloader', {
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
        duration: 0.8,
        ease: 'power4.inOut',
      });
    }
  }, [progress, onComplete]);

  return (
    <div
      id="preloader"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0B0D12] text-white select-none"
      style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
    >
      <div id="preloader-logo" className="flex flex-col items-center gap-4">
        {/* Animated Brand Logo Icon */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-[0_0_30px_rgba(46,124,246,0.5)]">
          <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
            <path d="M12 3v5M12 16v5M3 12h5M16 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-2xl font-semibold tracking-tight text-white">
            Olai
          </span>
          <span className="font-mono text-xs text-white/40 uppercase tracking-widest">
            Spatial AI Engine
          </span>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="h-[2px] w-48 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-brand to-brand-soft transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-white/50">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
