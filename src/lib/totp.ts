// TOTP (RFC 6238) implémenté sur Web Crypto — portable Node / Cloudflare
// Workers. Génération de secret Base32, code à 6 chiffres, fenêtre ±1 pas.

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const c of clean) {
    value = (value << 5) | ALPHABET.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, toArrayBuffer(data));
  return new Uint8Array(sig);
}

async function hotp(secretBytes: Uint8Array, counter: number): Promise<string> {
  const buf = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const hash = await hmacSha1(secretBytes, buf);
  const offset = (hash[hash.length - 1] ?? 0) & 0x0f;
  const code =
    (((hash[offset] ?? 0) & 0x7f) << 24) |
    (((hash[offset + 1] ?? 0) & 0xff) << 16) |
    (((hash[offset + 2] ?? 0) & 0xff) << 8) |
    ((hash[offset + 3] ?? 0) & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

function counterAt(timestamp: number): number {
  return Math.floor(timestamp / 30_000);
}

export async function verifyTotp(
  secret: string,
  token: string,
  window = 1,
  now = Date.now(),
): Promise<boolean> {
  const code = token.replace(/\s/g, "").trim();
  if (!/^\d{6}$/.test(code)) return false;
  const bytes = base32Decode(secret);
  if (bytes.length < 10) return false;
  const counter = counterAt(now);
  for (let w = -window; w <= window; w++) {
    if ((await hotp(bytes, counter + w)) === code) return true;
  }
  return false;
}

export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

export function otpauthUri(secret: string, label: string, issuer: string): string {
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
