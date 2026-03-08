"use client";

import { useMemo } from "react";

/**
 * Lightweight markdown renderer for AI responses.
 * Supports: headers, bold, italic, code blocks, inline code, lists, links, paragraphs.
 * No external dependencies -- pure regex transforms to HTML.
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:my-2 prose-code:text-orange-600 dark:prose-code:text-orange-400 prose-a:text-blue-600 dark:prose-a:text-blue-400 ${className || ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderMarkdown(md: string): string {
  // Normalize line endings
  let text = md.replace(/\r\n/g, "\n");

  // Code blocks (```lang\n...\n```)
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const escaped = escapeHtml(code.trimEnd());
    return `<pre class="rounded-lg bg-gray-900 p-3 text-sm text-gray-100 overflow-x-auto"><code${lang ? ` class="language-${lang}"` : ""}>${escaped}</code></pre>`;
  });

  // Process remaining text block by block
  const blocks = text.split(/\n\n+/);
  const rendered = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return "";

    // Skip already-rendered code blocks
    if (trimmed.startsWith("<pre")) return trimmed;

    // Headers
    if (trimmed.startsWith("### ")) return `<h3>${inline(trimmed.slice(4))}</h3>`;
    if (trimmed.startsWith("## ")) return `<h2>${inline(trimmed.slice(3))}</h2>`;
    if (trimmed.startsWith("# ")) return `<h1>${inline(trimmed.slice(2))}</h1>`;

    // Unordered list
    const ulLines = trimmed.split("\n");
    if (ulLines.every((l) => /^[-*]\s/.test(l.trim()))) {
      const items = ulLines.map((l) => `<li>${inline(l.trim().replace(/^[-*]\s/, ""))}</li>`);
      return `<ul>${items.join("")}</ul>`;
    }

    // Ordered list
    if (ulLines.every((l) => /^\d+\.\s/.test(l.trim()))) {
      const items = ulLines.map((l) => `<li>${inline(l.trim().replace(/^\d+\.\s/, ""))}</li>`);
      return `<ol>${items.join("")}</ol>`;
    }

    // Paragraph (may contain single line breaks)
    return `<p>${inline(trimmed.replace(/\n/g, "<br/>"))}</p>`;
  });

  return rendered.filter(Boolean).join("\n");
}

function inline(text: string): string {
  let result = escapeHtml(text);
  // Bold
  result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Italic
  result = result.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // Inline code
  result = result.replace(/`([^`]+)`/g, '<code class="rounded bg-gray-100 px-1 py-0.5 text-sm dark:bg-gray-800">$1</code>');
  // Links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Unescape <br/> that we inserted
  result = result.replace(/&lt;br\/&gt;/g, "<br/>");
  // Unescape HTML tags we generated
  result = result.replace(/&lt;(\/?(strong|em|code|a|br)\b[^&]*?)&gt;/g, "<$1>");
  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
