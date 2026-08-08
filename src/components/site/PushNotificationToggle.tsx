import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import "@/lib/i18n/segments/push";
import {
  getPushPermissionState,
  isPushSupported,
  isPushSubscribed,
  requestPushPermission,
  subscribePush,
  unsubscribePush,
} from "@/lib/push-notifications";

type PushStatus = "unsupported" | "denied" | "default" | "subscribed" | "loading";

/**
 * Toggle pour activer / désactiver les notifications push navigateur.
 * S'affiche comme un petit bouton icône dans le header.
 */
export function PushNotificationToggle() {
  const { t } = useI18n();
  const [status, setStatus] = useState<PushStatus>("loading");

  useEffect(() => {
    if (!isPushSupported()) {
      setStatus("unsupported");
      return;
    }

    const init = async () => {
      const permission = getPushPermissionState();
      if (permission === "denied") {
        setStatus("denied");
        return;
      }
      if (permission === "default") {
        setStatus("default");
        return;
      }

      // Permission granted — check if actually subscribed
      try {
        const reg = await navigator.serviceWorker.ready;
        const subscribed = await isPushSubscribed(reg);
        setStatus(subscribed ? "subscribed" : "default");
      } catch {
        setStatus("default");
      }
    };

    void init();
  }, []);

  const handleToggle = async () => {
    if (status === "unsupported" || status === "denied" || status === "loading") return;

    setStatus("loading");

    if (status === "subscribed") {
      // Unsubscribe
      try {
        const reg = await navigator.serviceWorker.ready;
        const ok = await unsubscribePush(reg);
        if (ok) {
          setStatus("default");
          toast.success(t("push.disabled"));
        } else {
          setStatus("subscribed");
        }
      } catch {
        setStatus("subscribed");
      }
      return;
    }

    // Subscribe
    const permission = await requestPushPermission();
    if (permission === "denied") {
      setStatus("denied");
      toast.error(t("push.denied"));
      return;
    }
    if (permission === "default") {
      // User closed the prompt without choosing
      setStatus("default");
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await subscribePush(reg);
      if (subscription) {
        setStatus("subscribed");
        toast.success(t("push.enabled"));
        // TODO: Send subscription to server for push dispatch
      } else {
        setStatus("default");
      }
    } catch {
      setStatus("default");
    }
  };

  if (status === "unsupported") return null;

  const label =
    status === "subscribed"
      ? t("push.enabled")
      : status === "denied"
        ? t("push.denied")
        : t("push.enable");

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={status === "loading" || status === "denied"}
      aria-label={label}
      title={label}
      className={`grid size-11 place-items-center rounded-sm border border-border text-muted-foreground transition-colors hover:text-foreground ${
        status === "subscribed" ? "text-primary" : ""
      } ${status === "denied" ? "opacity-50" : ""}`}
    >
      {status === "loading" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : status === "subscribed" ? (
        <BellRing className="size-4" />
      ) : status === "denied" ? (
        <BellOff className="size-4" />
      ) : (
        <Bell className="size-4" />
      )}
    </button>
  );
}
