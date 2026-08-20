// Lightweight isomorphic wrapper: on Workers SSR we use regex fallback
// (dompurify requires DOM and inflates server bundle ~158kB). On client we
// load dompurify lazily via dynamic import to avoid SSR evaluation.

const ALLOWED_TAGS = ["p", "br", "strong", "em", "b", "i", "u", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "code", "pre", "hr", "a"] as const;

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [...ALLOWED_TAGS],
  ALLOWED_ATTR: ["href", "target", "rel"],
  ALLOW_DATA_ATTR: false,
} as const;

let clientPurify: { sanitize: (dirty: string, cfg: unknown) => string } | null = null;
function getClientPurify(): { sanitize: (dirty: string, cfg: unknown) => string } | null {
  if (clientPurify) return clientPurify;
  if (typeof window === "undefined") return null;
  try {
    // dompurify is client-only; require at runtime to avoid SSR bundling
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("dompurify") as { default?: { sanitize: (d: string, c: unknown) => string }; sanitize?: (d: string, c: unknown) => string };
    const api = (mod.default ?? mod) as { sanitize: (d: string, c: unknown) => string };
    if (api && typeof api.sanitize === "function") {
      clientPurify = api;
      return clientPurify;
    }
  } catch {
    // fallback to regex
  }
  return null;
}

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
  const purify = getClientPurify();
  if (purify) {
    try {
      return purify.sanitize(dirty, PURIFY_CONFIG as never) as unknown as string;
    } catch {
      return serverSanitize(dirty);
    }
  }
  return serverSanitize(dirty);
}

export function sanitizeBlogParagraphs(paragraphs: string[]): string[] {
  return paragraphs.map((p) => sanitizeHtml(p));
}
