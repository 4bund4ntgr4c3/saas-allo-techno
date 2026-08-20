import DOMPurify from "dompurify";

// Lightweight isomorphic wrapper: DOMPurify needs window on client,
// on SSR (Cloudflare Workers) we fallback to the server-side regex sanitizer
// used in content.functions.ts rowToPost.

const ALLOWED_TAGS = ["p", "br", "strong", "em", "b", "i", "u", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "code", "pre", "hr", "a"] as const;

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [...ALLOWED_TAGS],
  ALLOWED_ATTR: ["href", "target", "rel"],
  ALLOW_DATA_ATTR: false,
} as const;

function serverSanitize(dirty: string): string {
  if (!dirty || typeof dirty !== "string") return "";
  let s = dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, "");
  const allowed = new Set(ALLOWED_TAGS as readonly string[]);
  s = s.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tagRaw, attrsRaw) => {
    const tag = (tagRaw as string).toLowerCase();
    const isClosing = (match as string).startsWith("</");
    if (!allowed.has(tag)) return "";
    if (isClosing) return `</${tag}>`;
    if (tag === "br" || tag === "hr") return `<${tag} />`;
    if (tag === "a") {
      const hrefMatch = (attrsRaw as string).match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const rawUrl = hrefMatch ? hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || "" : "";
      if (/^(?:https?:\/\/|mailto:)/i.test(rawUrl.trim())) {
        const safeUrl = rawUrl.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">`;
      }
      return `<a>`;
    }
    return `<${tag}>`;
  });
  return s;
}

export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== "string") return "";
  // Client-side: DOMPurify with window
  if (typeof window !== "undefined" && typeof (window as unknown as { document?: unknown }).document !== "undefined") {
    return DOMPurify.sanitize(dirty, PURIFY_CONFIG as never) as unknown as string;
  }
  // SSR fallback
  return serverSanitize(dirty);
}

export function sanitizeBlogParagraphs(paragraphs: string[]): string[] {
  return paragraphs.map((p) => sanitizeHtml(p));
}
