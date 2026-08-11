/**
 * Client-side push notification utilities.
 * Handles permission requests, subscription management, and status checks.
 *
 * NOTE: Server-side push sending requires a VAPID key pair and a push service
 * (e.g. web-push, OneSignal, Firebase Cloud Messaging). This module only
 * implements the client-side subscription flow. The actual notification dispatch
 * must be implemented on the server (TODO).
 */

const PUSH_STORAGE_KEY = "at-push-subscription";

/**
 * Check if the browser supports push notifications.
 */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Request notification permission from the user.
 * Returns the resulting permission state.
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  return Notification.requestPermission();
}

/**
 * Subscribe to push notifications using the Push API.
 * Requires an active Service Worker registration.
 * Returns the subscription object or null if unavailable.
 */
export async function subscribePush(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    // Check if already subscribed
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    // Clé publique VAPID pour l'abonnement push (doit être définie côté client
    // via VITE_VAPID_PUBLIC_KEY dans .env, exposée par Vite au build).
    const vapidPublicKey = import.meta.env["VITE_VAPID_PUBLIC_KEY"] ?? "";

    if (!vapidPublicKey) {
      console.warn("[push] VAPID_PUBLIC_KEY not configured — subscription skipped");
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
    });

    // Store endpoint locally for status checks
    localStorage.setItem(
      PUSH_STORAGE_KEY,
      JSON.stringify({ endpoint: subscription.endpoint, timestamp: Date.now() }),
    );

    return subscription;
  } catch (err) {
    console.error("[push] subscription failed", err);
    return null;
  }
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribePush(registration: ServiceWorkerRegistration): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    const success = await subscription.unsubscribe();
    if (success) {
      localStorage.removeItem(PUSH_STORAGE_KEY);
    }
    return success;
  } catch (err) {
    console.error("[push] unsubscribe failed", err);
    return false;
  }
}

/**
 * Check if the user is currently subscribed to push notifications.
 */
export async function isPushSubscribed(registration: ServiceWorkerRegistration): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

/**
 * Get the current notification permission state.
 */
export function getPushPermissionState(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (typeof window === "undefined") return new Uint8Array(0);
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
