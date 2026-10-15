import React, { useState } from 'react';
import { X, Monitor, Tablet, Smartphone, Copy, Check, ExternalLink } from 'lucide-react';

/**
 * Extracts raw HTML snippet from AI assistant markdown response
 */
function extractHtmlFromResponse(content) {
  if (!content) return '';
  const codeBlockMatch = content.match(/```(?:html|jsx|xml)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // If no code block, check if content itself is HTML
  if (/<(?:section|div|header|footer|nav|main|h1|p)/i.test(content)) {
    return content.trim();
  }
  return `<section class="py-12 px-6 max-w-5xl mx-auto"><div class="p-6 bg-slate-50 dark:bg-zinc-900 rounded-xl">${content}</div></section>`;
}

export default function LandingPagePreviewModal({ isOpen, onClose, sections = [], projectTitle = 'Landing Page' }) {
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Stitch sections in order
  const stitchedSectionsHtml = sections
    .map(s => {
      // Find latest assistant code
      const latestAssistant = [...(s.messages || [])].reverse().find(m => m.role === 'assistant');
      const text = latestAssistant?.content || s.content || '';
      return `<!-- Section: ${s.title} -->\n${extractHtmlFromResponse(text)}`;
    })
    .join('\n\n');

  const fullHtmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;1,400&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      scroll-behavior: smooth;
    }
    .font-serif {
      font-family: 'Playfair Display', serif;
    }
  </style>
</head>
<body class="bg-white text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
  ${stitchedSectionsHtml}
</body>
</html>`;

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(fullHtmlDocument);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([fullHtmlDocument], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const viewportWidthClass = {
    desktop: 'w-full',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[375px]',
  }[viewport];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Header Controls Bar */}
      <div className="flex h-14 w-full shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[220px] sm:max-w-xs">
              {projectTitle} Preview
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 border border-slate-700/80 px-2 py-0.5 rounded-md">
            {sections.length} Sections Live
          </span>
        </div>

        {/* Viewport Device Switcher */}
        <div className="flex items-center rounded-xl bg-slate-800/80 p-1 border border-slate-700">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewport === 'desktop'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop view (100%)"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewport === 'tablet'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet view (768px)"
          >
            <Tablet className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewport === 'mobile'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile view (375px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Mobile</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyHtml}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied HTML' : 'Copy HTML'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewTab}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Open in new window"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Tab</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto bg-slate-950 p-3 sm:p-6 flex justify-center items-start">
        {/* Device frame - constrains to viewport width */}
        <div
          style={{
            width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px',
            maxWidth: '100%',
            height: '100%',
          }}
          className="bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-800/80 transition-all duration-300 flex flex-col"
        >
          <iframe
            title="Landing Page Live Preview"
            srcDoc={fullHtmlDocument}
            className="w-full flex-1 border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
