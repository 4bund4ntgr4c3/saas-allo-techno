// Utilitaires de sécurité serveur :
//   - codes de suivi par réservation (protège contre l'énumération des références)
//   - limiteur de débit en mémoire, indexé par IP + action
// Utilisés par les server functions (fonctions serveur TanStack Start / Nitro).

import { getRequestIP } from "@tanstack/react-start/server";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I/L
// Poivre pour l'empreinte du code de suivi. En développement / test, un repli
// stable est autorisé. En production, TRACKING_CODE_PEPPER DOIT être défini
// via `wrangler secret put` pour garantir l'unicité des empreintes.
const PEPPER = process.env["TRACKING_CODE_PEPPER"];
if (!PEPPER && import.meta.env.PROD) {
  console.error(
    "[security] TRACKING_CODE_PEPPER manquant en production — les codes de suivi seront compromis. " +
      "Définir la variable via `wrangler secret put TRACKING_CODE_PEPPER`.",
  );
}
const EFFECTIVE_PEPPER = PEPPER ?? "at-tracking-code-pepper-dev-fallback";

const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(EFFECTIVE_PEPPER),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(new Uint8Array(sig));
}

/** Comparaison à temps constant de deux hexadécimaux. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Code de suivi aléatoire (10 caractères, alphabet sans ambiguïté). */
export function generateTrackingCode(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return code;
}

/** Empreinte HMAC-SHA256 (poivrée) du code de suivi, stockée en base. */
export async function hashTrackingCode(code: string): Promise<string> {
  return hmacSha256(`tracking:${code.trim().toUpperCase()}`);
}

/** Vrai si le code fourni correspond à l'empreinte stockée. */
export async function verifyTrackingCode(
  code: string,
  storedHash: string | null,
): Promise<boolean> {
  if (!storedHash) return false;
  const candidate = await hashTrackingCode(code.trim().toUpperCase());
  return safeEqual(candidate, storedHash);
}

// ---------------------------------------------------------------------------
// Limiteur de débit (fenêtre glissante, 60 secondes).
// Si un binding Cloudflare KV nommé RATE_LIMIT_KV est disponible, la limite
// est persistée entre les requêtes / isolats. Sinon, fallback sur une Map en
// mémoire (suffisant pour ralentir l'énumération, mais pas persistant).
// ---------------------------------------------------------------------------

const WINDOW_MS = 60_000;
const KV_NAMESPACE = (() => {
  try {
    // @ts-expect-error — Cloudflare KV binding injecté par Nitro/Wrangler
    const ns = process.env.RATE_LIMIT_KV as KVNamespace | undefined;
    return ns && typeof ns.get === "function" ? ns : null;
  } catch {
    return null;
  }
})();

// Fallback mémoire utilisé quand KV n'est pas disponible
const memBuckets = new Map<string, { count: number; resetAt: number }>();

/** IP du client si disponible, sinon une clé stable de repli. */
export function clientIp(): string {
  try {
    return getRequestIP({ xForwardedFor: true }) ?? getRequestIP() ?? "unknown";
  } catch {
    return "unknown";
  }
}

// ---------------------------------------------------------------------------
// Validation d'URL sortantes (anti-SSRF)
// ---------------------------------------------------------------------------

/**
 * Vrai si l'URL est sûre pour un appel sortant : HTTPS obligatoire, hostname
 * public (pas de loopback, d'adresse privée, de link-local ou de métadonnées).
 * Bloque aussi les hôtes à risque communs (localhost, .internal, .local…).
 */
export function isSafeOutboundUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "metadata.google.internal" ||
    hostname === "169.254.169.254"
  ) {
    return false;
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (ipv4) {
    const parts = ipv4.slice(1).map(Number);
    if (parts.some((p) => p > 255)) return false;
    const [a, b] = parts as [number, number, number, number];
    if (a === 0 || a === 10) return false; // réseau courant / privé 10.x
    if (a === 127) return false; // loopback
    if (a === 169 && b === 254) return false; // link-local / métadonnées
    if (a === 172 && b >= 16 && b <= 31) return false; // privé 172.16-31
    if (a === 192 && b === 168) return false; // privé 192.168
    if (a >= 224) return false; // multicast / réservé
  }

  if (hostname === "::1" || hostname === "[::1]") return false;
  return true;
}

/**
 * Vrai si la requête est autorisée (compteur < max sur la fenêtre).
 * `key` doit être stable par action, ex. "suivi-lookup".
 */
export async function rateLimit(key: string, max: number): Promise<boolean> {
  const ip = clientIp();
  const bucketKey = `${ip}:${key}`;

  if (KV_NAMESPACE) {
    return rateLimitKV(bucketKey, max);
  }
  return rateLimitMemory(bucketKey, max);
}

/** Rate limiting via Cloudflare KV (persistant entre isolats/déploiements). */
async function rateLimitKV(bucketKey: string, max: number): Promise<boolean> {
  const now = Date.now();
  const ttlSec = Math.ceil(WINDOW_MS / 1000);

  const raw = await KV_NAMESPACE.get(bucketKey, { type: "json" });
  const bucket = raw as { count: number; resetAt: number } | null;

  if (!bucket || now > bucket.resetAt) {
    await KV_NAMESPACE.put(bucketKey, JSON.stringify({ count: 1, resetAt: now + WINDOW_MS }), {
      expirationTtl: ttlSec,
    });
    return true;
  }
  if (bucket.count >= max) return false;

  bucket.count += 1;
  await KV_NAMESPACE.put(bucketKey, JSON.stringify(bucket), { expirationTtl: ttlSec });
  return true;
}

/** Rate limiting en mémoire (fallback sans KV). */
function rateLimitMemory(bucketKey: string, max: number): boolean {
  const now = Date.now();
  const bucket = memBuckets.get(bucketKey);
  if (!bucket || now > bucket.resetAt) {
    memBuckets.set(bucketKey, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

/**
 * Retourne l'état actuel des buckets de limite de débit pour le tableau de bord admin.
 * Lecture seule — pas d'impact sur les compteurs.
 */
export async function getRateLimitStats(): Promise<{
  totalBuckets: number;
  activeBuckets: number;
  blockedBuckets: number;
  storage: "kv" | "memory";
  buckets: Array<{ key: string; count: number; resetIn: number }>;
}> {
  const now = Date.now();

  if (KV_NAMESPACE) {
    // KV ne permet pas de lister efficacement — on retourne un aperçu limité
    return {
      totalBuckets: -1,
      activeBuckets: -1,
      blockedBuckets: -1,
      storage: "kv",
      buckets: [],
    };
  }

  const allBuckets: Array<{ key: string; count: number; resetIn: number }> = [];
  let active = 0;
  let blocked = 0;

  for (const [key, bucket] of memBuckets.entries()) {
    if (now > bucket.resetAt) continue;
    const resetIn = Math.ceil((bucket.resetAt - now) / 1000);
    allBuckets.push({ key, count: bucket.count, resetIn });
    active++;
    if (bucket.count >= 10) blocked++;
  }

  return {
    totalBuckets: memBuckets.size,
    activeBuckets: active,
    blockedBuckets: blocked,
    storage: "memory",
    buckets: allBuckets.sort((a, b) => b.count - a.count).slice(0, 50),
  };
}

/**
 * Retourne l'état des buckets pour le tableau de bord admin (lecture seule).
 */
export async function getRateLimitBuckets(): Promise<
  Array<{
    key: string;
    count: number;
    resetIn: number;
    isBlocked: boolean;
  }>
> {
  const now = Date.now();

  if (KV_NAMESPACE) return [];

  const result: Array<{ key: string; count: number; resetIn: number; isBlocked: boolean }> = [];

  for (const [key, bucket] of memBuckets.entries()) {
    if (now > bucket.resetAt) continue;
    const resetIn = Math.ceil((bucket.resetAt - now) / 1000);
    result.push({
      key,
      count: bucket.count,
      resetIn,
      isBlocked: bucket.count >= 10,
    });
  }

  return result.sort((a, b) => b.count - a.count).slice(0, 100);
}
