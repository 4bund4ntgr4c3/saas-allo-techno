import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  getInternalNotifications,
  markNotificationRead,
  markAllRead,
  type InternalNotification,
} from "@/lib/internal-notifications";
import {
  Bell,
  AlertTriangle,
  CreditCard,
  Calendar,
  Package,
  Settings,
  CheckCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

const TYPE_ICONS: Record<string, typeof Bell> = {
  sla_breach: AlertTriangle,
  new_reservation: Calendar,
  payment_received: CreditCard,
  escalation: AlertTriangle,
  low_stock: Package,
  system: Settings,
};

const TYPE_COLORS: Record<string, string> = {
  sla_breach: "text-destructive",
  new_reservation: "text-primary",
  payment_received: "text-success",
  escalation: "text-amber-600",
  low_stock: "text-amber-500",
  system: "text-muted-foreground",
};

export function AdminInternalNotifs() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<InternalNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setNotifications(await getInternalNotifications());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead({ data: { id } });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Bell className="size-5" />
          {t("admin.notifs.title")}
          {unread.length > 0 && (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
              {unread.length}
            </span>
          )}
        </h3>
        {unread.length > 0 && (
          <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-1 size-3" /> {t("admin.notifs.markAllRead")}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Bell className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t("admin.notifs.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell;
            const color = TYPE_COLORS[n.type] ?? "text-muted-foreground";
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  n.read ? "bg-card" : "bg-primary/5 border-primary/20"
                }`}
              >
                <div className={`mt-0.5 ${color}`}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? "" : "font-medium"}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleString(t("locale") as string)}
                  </p>
                </div>
                {!n.read && (
                  <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id)}>
                    <CheckCheck className="size-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
