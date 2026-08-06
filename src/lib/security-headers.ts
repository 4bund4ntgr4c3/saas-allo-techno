const SUPABASE_URL = process.env["SUPABASE_URL"] ?? "";
const SUPABASE_ORIGIN = SUPABASE_URL ? new URL(SUPABASE_URL).origin : "";

// La SSR de TanStack Start injecte des scripts inline (JSON-LD + hydration
// `$tsr`), qu'on ne peut pas couvrir avec des hashes/nonces sans une importante
// re-architecture. On garde donc `script-src 'unsafe-inline'` mais on durcit
// tout le reste. Toute politique ajoutée ici doit rester cohérente avec le
// rendu réel (voir src/routes/__root.tsx et contact.tsx pour l'iframe OSM).
export const SECURITY_HEADERS: Record<string, string> = {
  // Force HTTPS sur tout le domaine
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  // Empêche le site d'être embarqué dans un <iframe> (clickjacking)
  "x-frame-options": "DENY",
  "frame-ancestors": "'none'", // via CSP ci-dessous, redondant mais explicite
  // Ne jamais laisser le navigateur deviner le MIME (XSS par type confusion)
  "x-content-type-options": "nosniff",
  // Réduit les données envoyées dans le Referer (sorties vers l'extérieur)
  "referrer-policy": "strict-origin-when-cross-origin",
  // Restreint les API navigateur exposées aux pages
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
  // Les styles inline sont requis par le runtime Tailwind + la feuille Google Fonts
  "content-security-policy": [
    "default-src 'self'",
    `connect-src 'self' ${SUPABASE_ORIGIN} https://api.supabase.co`,
    `img-src 'self' data: blob: ${SUPABASE_ORIGIN} https://fonts.gstatic.com`,
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // scripts inline exigés par la SSR TanStack (JSON-LD + hydration)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Carte OpenStreetMap embarquée sur /contact
    "frame-src 'self' https://www.openstreetmap.org",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; "),
};

export function applySecurityHeaders(headers: Headers): void {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
}
