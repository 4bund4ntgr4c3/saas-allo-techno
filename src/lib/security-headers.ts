const SUPABASE_URL = process.env["SUPABASE_URL"] ?? "";
const SUPABASE_ORIGIN = SUPABASE_URL ? new URL(SUPABASE_URL).origin : "";
const IS_PROD = import.meta.env.PROD;

// En-têtes statiques, indépendants de la requête. Le CSP n'est PAS dans cette
// liste : il est strict et dépend d'un nonce généré par requête (voir
// buildContentSecurityPolicy + le middleware CSP dans src/start.ts), et il est
// posé par la middle pour rester cohérent avec le nonce taggé sur les scripts.
export const SECURITY_HEADERS: Record<string, string> = {
  // Force HTTPS sur tout le domaine
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  // Empêche le site d'être enclavé dans une <iframe> (clickjacking). La
  // directive frame-ancestors du CSP renforce ceci de manière explicite.
  "x-frame-options": "DENY",
  // Ne jamais laisser le navigateur deviner le MIME (XSS par type confusion)
  "x-content-type-options": "nosniff",
  // Réduit les données envoyées dans le Referer (sorties vers l'extérieur)
  "referrer-policy": "strict-origin-when-cross-origin",
  // Restreint les API navigateur exposées aux pages (camera et payment autorisés pour self pour scan QR et paiements)
  "permissions-policy": "camera=(self), microphone=(), geolocation=(), payment=(self)",
};

// CSP stricte, construite par requête avec un nonce unique. `script-src`
// n'utilise plus 'unsafe-inline' : chaque script inline/d'a occurrence porté
// par TanStack Start reçoit automatiquement l'attribut nonce (voir
// router.options.ssr.nonce), et les scripts « loader » sont autorisés par
// 'strict-dynamic'. `style-src 'unsafe-inline'` reste nécessaire pour le
// runtime Tailwind et la feuille Google Fonts.
export function buildContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `connect-src 'self' ${SUPABASE_ORIGIN} https://api.supabase.co https://plausible.io`,
    `img-src 'self' data: blob: ${SUPABASE_ORIGIN} https://fonts.gstatic.com https://placehold.co`,
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // 'unsafe-eval' nécessaire uniquement en dev (Vite HMR). En production,
    // le nonce + strict-dynamic suffisent et renforcent la sécurité CSP.
    `script-src 'self' 'strict-dynamic' 'nonce-${nonce}'${IS_PROD ? "" : " 'unsafe-eval'"}`,
    // Cartes embarquées : OpenStreetMap (/contact) et Google Maps (/magasins)
    "frame-src 'self' https://www.openstreetmap.org https://maps.google.com",
    // Empêche d'embarquer le site dans une <iframe> externe
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function applySecurityHeaders(headers: Headers): void {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
}
