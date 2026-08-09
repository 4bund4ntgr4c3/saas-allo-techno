import { createLogger } from "@/lib/logger";

const logger = createLogger("push-dispatch");

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function encodeBase64Url(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function encryptPayload(
  payload: string,
  userPublicKey: string,
): Promise<{ ciphertext: string; salt: string; dh: string }> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(payload);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const localKey = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);
  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKey.publicKey),
  );
  const userPublicKeyBytes = urlBase64ToUint8Array(userPublicKey);
  const userPublicKeyObject = await crypto.subtle.importKey(
    "raw",
    userPublicKeyBytes.buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: userPublicKeyObject },
      localKey.privateKey,
      256,
    ),
  );
  const prk = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    { name: "HKDF", hash: "SHA-256" },
    false,
    ["deriveBits"],
  );
  const cekInfo = new Uint8Array([...encoder.encode("Content-Encoding: aes128gcm\x00"), ...salt]);
  const cek = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "HKDF", salt, info: cekInfo }, prk, 128),
  );
  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, aesKey, plaintext),
  );
  const record = new Uint8Array(1 + 16 + 1 + 1 + ciphertext.length);
  record[0] = 0x03;
  record.set(salt, 1);
  record[17] = 1;
  record[18] = 0;
  record.set(ciphertext, 19);
  return {
    ciphertext: encodeBase64Url(record),
    salt: encodeBase64Url(salt),
    dh: encodeBase64Url(localPublicKeyRaw),
  };
}

interface PushSubRow {
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

export async function sendPushNotification(params: {
  userId: string;
  title: string;
  body: string;
  url?: string;
}): Promise<{ sent: number; failed: number }> {
  const { userId, title, body, url } = params;

  const vapidPublicKey = process.env["VAPID_PUBLIC_KEY"];
  if (!vapidPublicKey) {
    logger.warn("VAPID keys not configured — push notifications disabled");
    return { sent: 0, failed: 0 };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: rawSubs, error } = await supabaseAdmin
    .from("push_subscriptions" as never)
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", userId);

  if (error) {
    logger.error("fetch subscriptions failed", error as Error);
    return { sent: 0, failed: 0 };
  }

  const subscriptions = (rawSubs ?? []) as PushSubRow[];

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const payload: PushPayload = { title, body };
  if (url) payload.url = url;

  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  for (const sub of subscriptions) {
    try {
      const { ciphertext } = await encryptPayload(JSON.stringify(payload), sub.p256dh);

      const response = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          TTL: "86400",
        },
        body: ciphertext,
      });

      if (response.status === 201 || response.status === 200) {
        sent++;
      } else if (response.status === 404 || response.status === 410) {
        staleEndpoints.push(sub.endpoint);
        failed++;
      } else {
        logger.warn(`push service returned ${response.status}`, {
          endpoint: sub.endpoint,
          status: response.status,
        });
        failed++;
      }
    } catch (err) {
      logger.error("push send failed", err as Error, { endpoint: sub.endpoint });
      failed++;
    }
  }

  if (staleEndpoints.length > 0) {
    const { error: deleteError } = await supabaseAdmin
      .from("push_subscriptions" as never)
      .delete()
      .in("endpoint", staleEndpoints);

    if (deleteError) {
      logger.error("cleanup stale subscriptions failed", deleteError as Error);
    }
  }

  return { sent, failed };
}
