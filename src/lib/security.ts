// Utilitaires de sécurité serveur :
//   - codes de suivi par réservation (protège contre l'énumération des références)
//   - limiteur de débit en mémoire, indexé par IP + action
// Utilisés par les server functions (fonctions serveur TanStack Start / Nitro).

import { getRequestIP } from "@tanstack/react-start/server";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I/L
// Poivre pour l'empreinte du code de suivi. Un repli stable est utilisé en
// développement / test ; en production, définir TRACKING_CODE_PEPPER.
const PEPPER = process.env["TRACKING_CODE_PEPPER"] ?? "at-tracking-code-pepper-v1";

const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(PEPPER),
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
// Limiteur de débit (fenêtre glissante en mémoire).
// Sur Cloudflare Workers, la mémoire est partagée par isolat : la limite n'est
// donc pas globale, mais elle suffit à ralentir l'énumération côté API.
// ---------------------------------------------------------------------------

const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

/** IP du client si disponible, sinon une clé stable de repli. */
export function clientIp(): string {
  try {
    return getRequestIP({ xForwardedFor: true }) ?? getRequestIP() ?? "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Vrai si la requête est autorisée (compteur < max sur la fenêtre).
 * `key` doit être stable par action, ex. "suivi-lookup".
 */
export function rateLimit(key: string, max: number): boolean {
  const ip = clientIp();
  const now = Date.now();
  const bucketKey = `${ip}:${key}`;
  const bucket = buckets.get(bucketKey);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}
