import React from 'react';
import { CheckCircle2, ChevronRight, Hash } from 'lucide-react';

/**
 * ==============================================================================
 * Component: MarkdownRenderer
 * ==============================================================================
 * High-performance, zero-dependency Markdown renderer designed for
 * SaaS plans, technical specifications, and structured chat outputs.
 * 
 * Supports:
 * - H1, H2, H3, H4 with badges and typography
 * - Key-Value pair highlighting (* **Key:** Value)
 * - Nested bullet lists and numbered lists
 * - Markdown tables (| Col 1 | Col 2 |)
 * - Checklists (✓, [x], [ ])
 * - Horizontal rules (---)
 * - Blockquotes (> Quote)
 * - Code blocks and inline code
 * ==============================================================================
 */

function renderInlineFormatting(text) {
  if (!text) return null;

  // Split by inline code, bold, italic, links
  const tokens = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200/70 dark:border-zinc-700 font-mono text-[11.5px] text-slate-800 dark:text-zinc-200"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold + Italic ***text*** or ___text___
    const boldItalicMatch = remaining.match(/^(\*\*\*|___)(.+?)\1/);
    if (boldItalicMatch) {
      tokens.push(
        <strong key={key++} className="font-bold italic text-slate-900 dark:text-zinc-100">
          {boldItalicMatch[2]}
        </strong>
      );
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // Bold **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      tokens.push(
        <strong key={key++} className="font-semibold text-slate-900 dark:text-zinc-100">
          {boldMatch[2]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.+?)\1/);
    if (italicMatch) {
      tokens.push(
        <em key={key++} className="italic text-slate-700 dark:text-zinc-300">
          {italicMatch[2]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Standard text chunk up to next formatting character
    const nextSpecial = remaining.search(/[`*_]/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Fallback for stray delimiter character
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
}

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content || typeof content !== 'string') return null;

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let inTable = false;
  let tableRows = [];
  let currentList = [];
  let listType = null; // 'ul' | 'ol'

  const flushList = () => {
    if (currentList.length > 0) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(
        <ListTag
          key={`list-${elements.length}`}
          className={`space-y-1.5 my-2.5 ${listType === 'ol' ? 'list-decimal list-inside pl-1' : 'pl-1'}`}
        >
          {currentList.map((item, idx) => (
            <li key={idx} className="text-xs sm:text-[13px] text-slate-700 dark:text-zinc-300 leading-relaxed">
              {item.indent > 0 ? (
                <div className="pl-4 border-l border-slate-200 dark:border-zinc-800 my-1">
                  {renderInlineFormatting(item.text)}
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  {item.isCheck ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  ) : listType === 'ul' ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-zinc-500 mt-2 shrink-0" />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    {renderInlineFormatting(item.text)}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ListTag>
      );
      currentList = [];
      listType = null;
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headerRow = tableRows[0];
      const bodyRows = tableRows.slice(1);

      elements.push(
        <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/60 text-slate-900 dark:text-zinc-100 font-semibold">
                {headerRow.map((cell, cIdx) => (
                  <th key={cIdx} className="px-3.5 py-2.5 text-[11.5px] uppercase tracking-wider">
                    {renderInlineFormatting(cell.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-slate-700 dark:text-zinc-300">
                      {renderInlineFormatting(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code Blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushList();
        flushTable();
        elements.push(
          <div
            key={`code-${elements.length}`}
            className="my-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-950 p-3.5 overflow-x-auto text-[11.5px] font-mono text-zinc-200 shadow-inner"
          >
            <pre>{codeBlockContent.join('\n')}</pre>
          </div>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(rawLine);
      continue;
    }

    // Markdown Tables (| Col 1 | Col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      // Skip markdown separator row |---|---|
      if (/^\|[\s-:]+\|[\s-:|]+$/.test(trimmed)) {
        continue;
      }
      const cells = trimmed.split('|').slice(1, -1);
      if (!inTable) {
        inTable = true;
        tableRows = [cells];
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      flushList();
      elements.push(
        <hr
          key={`hr-${elements.length}`}
          className="my-5 border-t border-slate-200/90 dark:border-zinc-800"
        />
      );
      continue;
    }

    // Headers
    if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ') || trimmed.startsWith('#### ')) {
      flushList();
      const level = trimmed.match(/^#+/)[0].length;
      const title = trimmed.replace(/^#+\s*/, '');

      if (level === 1) {
        elements.push(
          <div key={`h1-${elements.length}`} className="mt-4 mb-3 pb-2 border-b border-slate-200 dark:border-zinc-800">
            <h1 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-zinc-100" />
              {renderInlineFormatting(title)}
            </h1>
          </div>
        );
      } else if (level === 2) {
        elements.push(
          <div key={`h2-${elements.length}`} className="mt-5 mb-2.5">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono font-semibold text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700">
                §
              </span>
              <span>{renderInlineFormatting(title)}</span>
            </h2>
          </div>
        );
      } else if (level === 3) {
        elements.push(
          <h3
            key={`h3-${elements.length}`}
            className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-zinc-200 mt-3.5 mb-1.5"
          >
            {renderInlineFormatting(title)}
          </h3>
        );
      } else {
        elements.push(
          <h4
            key={`h4-${elements.length}`}
            className="text-[11.5px] sm:text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-2 mb-1"
          >
            {renderInlineFormatting(title)}
          </h4>
        );
      }
      continue;
    }

    // Blockquote (> Quote)
    if (trimmed.startsWith('> ')) {
      flushList();
      const quoteText = trimmed.replace(/^>\s*/, '');
      elements.push(
        <div
          key={`quote-${elements.length}`}
          className="my-3 pl-3.5 py-1.5 border-l-2 border-slate-400 dark:border-zinc-600 bg-slate-50/60 dark:bg-zinc-900/40 rounded-r-lg text-xs sm:text-[12.5px] italic text-slate-700 dark:text-zinc-300"
        >
          {renderInlineFormatting(quoteText)}
        </div>
      );
      continue;
    }

    // Lists (* item, - item, 1. item)
    const bulletMatch = rawLine.match(/^(\s*)([*+-]|\d+\.)\s+(.+)$/);
    if (bulletMatch) {
      const indentSpaces = bulletMatch[1].length;
      const isOrdered = /^\d+\./.test(bulletMatch[2]);
      const itemText = bulletMatch[3];
      const isCheck = itemText.startsWith('✓') || itemText.startsWith('[x]') || itemText.startsWith('[X]');
      const cleanItemText = itemText.replace(/^(✓|\[x\]|\[X\]|\[\s\])\s*/, '');

      if (!currentList.length) {
        listType = isOrdered ? 'ol' : 'ul';
      }

      currentList.push({
        indent: Math.floor(indentSpaces / 2),
        text: cleanItemText,
        isCheck,
      });
      continue;
    } else {
      flushList();
    }

    // Standard Paragraph
    if (trimmed.length > 0) {
      elements.push(
        <p
          key={`p-${elements.length}`}
          className="text-xs sm:text-[13px] text-slate-700 dark:text-zinc-300 leading-relaxed my-1.5"
        >
          {renderInlineFormatting(trimmed)}
        </p>
      );
    }
  }

  flushList();
  flushTable();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
