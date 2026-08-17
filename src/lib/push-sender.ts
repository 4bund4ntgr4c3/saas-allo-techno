// ============================================================================
// Allô Techno — Envoi de notifications Web Push côté serveur (RFC 8030/8291/8292)
// - Signature VAPID (ES256) via WebCrypto
// - Chiffrement de bout en bout aes128gcm (RFC 8188) avec clés P-256 ECDH
// - Nettoyage des abonnements invalides (404/410) dans la table push_subscriptions
// Prérequis en production : `wrangler secret put VAPID_PUBLIC_KEY` et
// `wrangler secret put VAPID_PRIVATE_KEY` (paire générée via
// `npx web-push generate-vapid-keys`). Sans ces clés, l'envoi est refusé (503).
// ============================================================================

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
}

const VAPID_SUBJECT = "mailto:contact@allotechno.africa";

function getVapidKeys(): { publicKey: string; privateKey: string } | null {
  const publicKey = process.env["VAPID_PUBLIC_KEY"] ?? "";
  const privateKey = process.env["VAPID_PRIVATE_KEY"] ?? "";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}

// ---------------------------------------------------------------------------
// Base64url helpers
// ---------------------------------------------------------------------------

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function u32be(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}

// ---------------------------------------------------------------------------
// Crypto : HKDF-SHA256, ECDH P-256, AES-128-GCM, ES256
// ---------------------------------------------------------------------------

async function hkdf(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm as unknown as BufferSource, "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info } as HkdfParams,
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

/** Convertit une signature ECDSA DER en r||s (64 octets, big-endian). */
function derToRaw(sig: Uint8Array): Uint8Array {
  // 0x30 len 0x02 rlen r 0x02 slen s
  if (sig.length < 8 || sig[0] !== 0x30) return sig;
  let offset = 2;
  const readInt = (): Uint8Array => {
    offset += 1; // tag 0x02
    let len = sig[offset] ?? 0;
    offset += 1;
    if (len & 0x80) {
      const count = len & 0x7f;
      len = 0;
      for (let i = 0; i < count; i++) {
        const byte = sig[offset] ?? 0;
        offset += 1;
        len = len * 256 + byte;
      }
    }
    let start = offset;
    offset += len;
    while ((sig[start] ?? 0) === 0 && offset - start > 1) start++; // strip leading zeros
    const intBytes = sig.slice(start, start + len - (start - (offset - len)));
    const padded = new Uint8Array(32);
    padded.set(intBytes, 32 - intBytes.length);
    return padded;
  };
  const r = readInt();
  const s = readInt();
  return concat(r, s);
}

async function createVapidJwt(aud: string): Promise<string> {
  const { privateKey } = getVapidKeys()!;
  const header = b64urlEncode(utf8(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64urlEncode(
    utf8(JSON.stringify({ aud, exp: now + 12 * 3600, sub: VAPID_SUBJECT })),
  );
  const rawD = b64urlDecode(privateKey);
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    d: b64urlEncode(rawD),
    x: "",
    y: "",
  };
  // Reconstruire x/y depuis la clé publique pour le JWK complet (dérivation non
  // triviale en WebCrypto) : on signe avec une clé importée depuis d + pub.
  const { publicKey } = getVapidKeys()!;
  const rawPub = b64urlDecode(publicKey);
  jwk.x = b64urlEncode(rawPub.slice(1, 33));
  jwk.y = b64urlEncode(rawPub.slice(33, 65));
  const signingKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const derSig = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      signingKey,
      utf8(`${header}.${payload}`) as unknown as BufferSource,
    ),
  );
  return `${header}.${payload}.${b64urlEncode(derToRaw(derSig))}`;
}

/** Chiffre un payload en aes128gcm (RFC 8188 + RFC 8291) pour une subscription. */
export async function encryptPayload(
  plaintext: Uint8Array,
  uaPublicKey: Uint8Array,
  uaAuthSecret: Uint8Array,
  serverKeysOverride?: CryptoKeyPair,
): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const serverKeys =
    serverKeysOverride ??
    ((await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
      "deriveBits",
    ])) as CryptoKeyPair);
  const serverPublic = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
  const uaPublicJwk = await crypto.subtle.importKey(
    "raw",
    uaPublicKey as unknown as BufferSource,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: uaPublicJwk },
      serverKeys.privateKey,
      256,
    ),
  );

  // RFC 8291 §3.4 : PRK_key = HKDF-Extract(salt=auth_info, ikm=ecdh_secret)
  // puis ikm = HKDF-Expand(PRK_key, "WebPush: info" || 0x00 || ua_public || as_public, 32)
  const authInfo = concat(utf8("Content-Encoding: auth"), new Uint8Array([0]), uaAuthSecret);
  const keyInfo = concat(utf8("WebPush: info"), new Uint8Array([0]), uaPublicKey, serverPublic);
  const prkKey = await hkdf(ecdhSecret, authInfo, keyInfo, 32);
  // RFC 8188 : prk = HKDF-Extract(salt, ikm) puis cek = HKDF-Expand("Content-Encoding: aes128gcm" || 0x00)
  const ikm = await hkdf(
    prkKey,
    salt,
    concat(utf8("Content-Encoding: aes128gcm"), new Uint8Array([0])),
    32,
  );
  const aesKey = ikm.slice(0, 16);
  const nonce = ikm.slice(16, 28);

  const rs = plaintext.length + 17; // tag AES-GCM (16) + octet de padding
  const header = concat(salt, u32be(rs));
  const recordPlain = concat(plaintext, new Uint8Array([2])); // délimiteur de padding 0x02
  const importKey = await crypto.subtle.importKey(
    "raw",
    aesKey as unknown as BufferSource,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, additionalData: header } as AesGcmParams,
      importKey,
      recordPlain as unknown as BufferSource,
    ),
  );
  return concat(header, ciphertext);
}

// ---------------------------------------------------------------------------
// Envoi
// ---------------------------------------------------------------------------

type SendResult = "ok" | "gone" | "error";

async function sendToEndpoint(
  endpoint: string,
  p256dh: string,
  authKey: string,
  message: PushMessage,
): Promise<SendResult> {
  const keys = getVapidKeys();
  if (!keys) return "error";
  let body: Uint8Array;
  try {
    body = await encryptPayload(
      utf8(JSON.stringify(message)),
      b64urlDecode(p256dh),
      b64urlDecode(authKey),
    );
  } catch {
    return "error";
  }
  const jwt = await createVapidJwt(new URL(endpoint).origin).catch(() => "");
  if (!jwt) return "error";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Encoding": "aes128gcm",
        TTL: "86400",
        Urgency: "normal",
        "Content-Type": "application/octet-stream",
        Authorization: `vapid t=${jwt}, k=${keys.publicKey}`,
      },
      body: body as unknown as BodyInit,
    });
    if (res.status === 404 || res.status === 410) return "gone";
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

async function pruneSubscription(endpoint: string): Promise<void> {
  try {
    await supabaseAdmin
      .from("push_subscriptions" as never)
      .delete()
      .eq("endpoint", endpoint);
  } catch {
    /* suppression best-effort */
  }
}

/** Envoie un message à tous les appareils d'un utilisateur. */
export async function sendPushToUser(
  userId: string,
  message: PushMessage,
): Promise<{ sent: number; pruned: number }> {
  if (!getVapidKeys())
    throw new Error(
      "VAPID non configuré — définir VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY via wrangler secret put.",
    );
  const { data } = await supabaseAdmin
    .from("push_subscriptions" as never)
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", userId);
  let sent = 0;
  let pruned = 0;
  for (const sub of (data ?? []) as { endpoint: string; p256dh: string; auth_key: string }[]) {
    const result = await sendToEndpoint(sub.endpoint, sub.p256dh, sub.auth_key, message);
    if (result === "ok") sent++;
    else if (result === "gone") {
      pruned++;
      await pruneSubscription(sub.endpoint);
    }
  }
  return { sent, pruned };
}

/** Envoie un message à tous les abonnés (staff/atelier). */
export async function sendPushToAll(
  message: PushMessage,
): Promise<{ sent: number; pruned: number }> {
  if (!getVapidKeys())
    throw new Error(
      "VAPID non configuré — définir VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY via wrangler secret put.",
    );
  const { data } = await supabaseAdmin
    .from("push_subscriptions" as never)
    .select("endpoint, p256dh, auth_key")
    .limit(2000);
  let sent = 0;
  let pruned = 0;
  for (const sub of (data ?? []) as { endpoint: string; p256dh: string; auth_key: string }[]) {
    const result = await sendToEndpoint(sub.endpoint, sub.p256dh, sub.auth_key, message);
    if (result === "ok") sent++;
    else if (result === "gone") {
      pruned++;
      await pruneSubscription(sub.endpoint);
    }
  }
  return { sent, pruned };
}

/** Vrai si les clés VAPID sont configurées (envoi possible). */
export function isPushEnabled(): boolean {
  return getVapidKeys() !== null;
}
