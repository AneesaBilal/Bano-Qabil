import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/api/notifications.api";
import type { Notification } from "@/types";
import { formatDateTime, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NotificationsPanelProps {
  onClose: () => void;
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listNotifications(user.id)
      .then(setNotifications)
      .finally(() => setIsLoading(false));
  }, [user]);

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 z-40 mt-2 w-80 rounded-lg border bg-popover shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleMarkAllRead}>
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Loading...</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <Bell className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={cn("block w-full border-b px-4 py-3 text-left text-sm last:border-0 hover:bg-accent", !n.is_read && "bg-primary/5")}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{n.title}</span>
                  {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="mt-0.5 text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
