// Validation du chiffrement Web Push aes128gcm (RFC 8188/8291) : on simule le
// push service en déchiffrant un payload avec la clé privée de l'abonné.
import { describe, expect, it } from "vitest";
import { encryptPayload, b64urlEncode } from "@/lib/push-sender";

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

async function hkdf(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm as unknown as BufferSource, "HKDF", false, [
    "deriveBits",
  ]);
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info } as HkdfParams,
      key,
      length * 8,
    ),
  );
}

describe("push encryption aes128gcm (RFC 8291)", () => {
  it("déchiffre un payload chiffré par encryptPayload avec la clé privée de l'abonné", async () => {
    // Abonné : paire ECDH P-256 + secret d'authentification
    const uaKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
      "deriveBits",
    ]);
    const uaPublic = new Uint8Array(await crypto.subtle.exportKey("raw", uaKeys.publicKey));
    const uaAuth = crypto.getRandomValues(new Uint8Array(16));

    // Serveur : clés contrôlées par le test (injectées pour connaître serverPublic)
    const serverKeys = (await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"],
    )) as CryptoKeyPair;
    const serverPublic = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));

    const message = { title: "Test", body: "Bonjour Bénin", url: "/fr/suivi" };
    const encrypted = await encryptPayload(
      utf8(JSON.stringify(message)),
      uaPublic,
      uaAuth,
      serverKeys,
    );

    // Format du message : salt(16) + rs(4) + ciphertext
    const salt = encrypted.slice(0, 16);
    const rs =
      (encrypted[16]! << 24) | (encrypted[17]! << 16) | (encrypted[18]! << 8) | encrypted[19]!;
    const ciphertext = encrypted.slice(20);
    expect(ciphertext.length).toBe(rs);

    // Déchiffrement côté abonné (RFC 8291 §3.4)
    const ecdhUa = new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: "ECDH",
          public: await crypto.subtle.importKey(
            "raw",
            serverPublic,
            { name: "ECDH", namedCurve: "P-256" },
            false,
            [],
          ),
        },
        uaKeys.privateKey,
        256,
      ),
    );
    const authInfo = concat(utf8("Content-Encoding: auth"), new Uint8Array([0]), uaAuth);
    const keyInfo = concat(utf8("WebPush: info"), new Uint8Array([0]), uaPublic, serverPublic);
    const prkKeyUa = await hkdf(ecdhUa, authInfo, keyInfo, 32);
    const ikmUa = await hkdf(
      prkKeyUa,
      salt,
      concat(utf8("Content-Encoding: aes128gcm"), new Uint8Array([0])),
      32,
    );

    const aesKeyUa = await crypto.subtle.importKey(
      "raw",
      ikmUa.slice(0, 16),
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );
    const plain = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ikmUa.slice(16, 28), additionalData: encrypted.slice(0, 20) },
        aesKeyUa,
        ciphertext,
      ),
    );

    // Le plaintext = payload + délimiteur de padding (0x02)
    expect(Array.from(plain.slice(0, plain.length - 1))).toEqual(
      Array.from(utf8(JSON.stringify(message))),
    );
    expect(plain[plain.length - 1]).toBe(2);
  });

  it("produit un payload différent à chaque chiffrement (salt aléatoire)", async () => {
    const uaKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
      "deriveBits",
    ]);
    const uaPublic = new Uint8Array(await crypto.subtle.exportKey("raw", uaKeys.publicKey));
    const uaAuth = crypto.getRandomValues(new Uint8Array(16));
    const payload = utf8(JSON.stringify({ title: "T", body: "b" }));
    const a = await encryptPayload(payload, uaPublic, uaAuth);
    const b = await encryptPayload(payload, uaPublic, uaAuth);
    expect(a).not.toEqual(b);
  });

  it("encode en base64url sans padding", () => {
    const bytes = new Uint8Array([0xfb, 0xff, 0x01, 0x02]);
    expect(b64urlEncode(bytes)).toBe("-_8BAg");
  });
});
