import React from 'react';

const SOCIAL_LINKS = [
  {
    name: 'X (Twitter)',
    href: 'https://x.com',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    name: 'GitHub',
    href: 'https://github.com',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
      </svg>
    ),
  },
  {
    name: 'Discord',
    href: 'https://discord.com',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="relative w-full bg-[#F8F8F7] text-ink border-t border-black/[0.07] py-10 sm:py-14 px-[12px] sm:px-[20px]">
      <div className="w-full max-w-[1750px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-between">
          
          {/* Left Column: Big Olai Brand Logo Wordmark */}
          <div className="lg:col-span-7 space-y-2">
            <h2 className="font-display text-6xl sm:text-7xl lg:text-8xl xl:text-[110px] font-bold tracking-[-0.045em] leading-none text-transparent bg-clip-text bg-gradient-to-b from-[#0B0D12] via-[#0B0D12]/80 to-[#0B0D12]/40 select-none py-1">
              Olai
            </h2>
            <p className="font-mono text-[11.5px] text-ink/50 max-w-md pt-1">
              Spatial AI workspace for thinking beyond the chat box.
            </p>
          </div>

          {/* Right Column: Nav Links, Social Icons & Copyright */}
          <div className="lg:col-span-5 flex flex-col lg:items-end space-y-5">
            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-[11px] text-ink/55">
              <a href="#problem" className="hover:text-ink transition-colors">The Problem</a>
              <a href="#how-it-works" className="hover:text-ink transition-colors">Workflow</a>
              <a href="#showcase" className="hover:text-ink transition-colors">Canvas</a>
              <a href="#providers" className="hover:text-ink transition-colors">Providers</a>
              <a href="#waitlist" className="hover:text-ink transition-colors">Waitlist</a>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-ink/65 hover:text-ink hover:bg-white hover:border-black/20 hover:shadow-xs transition-all active:scale-95"
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Rights Reserved */}
            <p className="font-mono text-[10.5px] text-ink/45 pt-1">
              © {new Date().getFullYear()}{' '}
              <a
                href="https://www.autonoms.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ink underline decoration-black/20 underline-offset-3 hover:text-brand hover:decoration-brand transition-colors"
              >
                Autonoms (www.autonoms.in)
              </a>
              . All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
