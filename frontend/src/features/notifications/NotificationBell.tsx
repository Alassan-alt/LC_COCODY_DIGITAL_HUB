import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  ClipboardCheck,
  FileText,
  RefreshCw,
  ScrollText,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Notification, NotificationType } from "./api";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "./hooks";

const typeIcons: Record<NotificationType, typeof Bell> = {
  TASK_ASSIGNED: ClipboardCheck,
  TASK_DUE_SOON: CalendarClock,
  TASK_OVERDUE: AlertTriangle,
  DOCUMENT_NEW: FileText,
  EVENT_NEW: CalendarClock,
  MEETING_NEW: Users,
  REPORT_NEW: ScrollText,
  TRANSITION: RefreshCw,
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useNotifications({ page: 1 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    const onClickOutside = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = data?.unreadCount ?? 0;

  const handleClickNotification = (notification: Notification): void => {
    if (!notification.isRead) markRead.mutate(notification.id);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative flex items-center justify-center rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-primary"
        title="Notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-error text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-neutral-300 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
            <p className="text-sm font-semibold text-neutral-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="size-3.5" />
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {data?.items.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-neutral-500">Aucune notification.</p>
            )}
            {data?.items.map((notification) => {
              const Icon = typeIcons[notification.type];
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleClickNotification(notification)}
                  className={`flex w-full items-start gap-2.5 border-b border-neutral-100 px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-neutral-50 ${
                    notification.isRead ? "" : "bg-primary-light/40"
                  }`}
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-neutral-500" />
                  <div className="min-w-0">
                    <p className={`text-neutral-800 ${notification.isRead ? "" : "font-medium"}`}>
                      {notification.message}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">{timeAgo(notification.createdAt)}</p>
                  </div>
                  {!notification.isRead && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
