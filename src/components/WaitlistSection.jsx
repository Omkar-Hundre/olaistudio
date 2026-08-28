import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '../lib/supabase';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function WaitlistSection() {
  const sectionRef = useRef(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '#waitlist-kicker, #waitlist-title, #waitlist-sub, #waitlist-card',
        { opacity: 0, y: 35 },
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
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email: cleanEmail }]);

      if (error) {
        if (error.code === '23505') {
          setStatus({
            type: 'info',
            message: "You're already registered on our early access list! We'll reach out soon.",
          });
        } else {
          setStatus({ type: 'error', message: error.message || 'Failed to submit. Please try again.' });
        }
      } else {
        setStatus({
          type: 'success',
          message: "✓ You're on the list! We'll email your invite as soon as early access opens.",
        });
        setEmail('');
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section ref={sectionRef} id="waitlist" className="relative w-full bg-[#F8F8F7] text-ink px-[12px] sm:px-[20px] py-12 sm:py-16 lg:py-20 overflow-hidden">
      <div className="border-t border-black/[0.07] mb-10"></div>

      <div className="w-full max-w-[1750px] mx-auto">
        <div id="waitlist-card" className="relative overflow-hidden rounded-[24px] border border-black/[0.10] bg-white p-8 sm:p-14 lg:p-18 shadow-[0_20px_60px_rgba(11,13,18,0.06)]">
          
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <p id="waitlist-kicker" className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink/40 mb-3">
              05 / Early Access
            </p>

            <h2 id="waitlist-title" className="font-display text-3xl font-medium leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl text-ink">
              Join the <span className="text-ink/30 italic font-normal">Olai waitlist.</span>
            </h2>

            <p id="waitlist-sub" className="mt-4 text-xs leading-[1.75] text-ink/55 sm:text-[15px] max-w-xl mx-auto">
              Be among the first to experience spatial, multi-model AI canvas. Early access invites are rolling out weekly.
            </p>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="mt-8 sm:mt-10 max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={loading}
                  required
                  className="w-full rounded-xl border border-black/[0.12] bg-[#FBFBFA] px-4 py-3.5 text-xs text-ink placeholder:text-ink/35 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-dark px-6 py-3.5 text-xs font-semibold text-white shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2 font-mono">
                      <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      Saving...
                    </span>
                  ) : (
                    <span>Join Waitlist →</span>
                  )}
                </button>
              </div>

              {/* Status Feedback Banners */}
              {status.message && (
                <div className={`mt-4 rounded-xl p-3 text-xs font-medium leading-relaxed text-left transition-all ${
                  status.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' :
                  status.type === 'info' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
                  'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                  {status.message}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
