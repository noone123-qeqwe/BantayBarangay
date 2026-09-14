"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NotificationItem } from "@/types";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  Loader2,
  FileText,
  AlertTriangle,
  Sparkles,
  Circle,
  MessageSquare,
  Wrench,
} from "lucide-react";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      } else {
        router.replace("/login");
      }
      return;
    }

    const loadNotifications = async () => {
      try {
        setFetching(true);
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setFetching(false);
      }
    };

    if (user) {
      loadNotifications();
    }
  }, [user, loading]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (e) {
      console.error("Mark read error:", e);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (e) {}
  };

  if (loading || fetching) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <Loader2 size={36} className="spin" style={{ margin: "0 auto 12px auto", color: "var(--primary)" }} />
        <div style={{ color: "var(--text-muted)", fontSize: "0.938rem" }}>Loading alerts...</div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Group by: Today, Yesterday, Earlier (Section 20)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

  const todayList: NotificationItem[] = [];
  const yesterdayList: NotificationItem[] = [];
  const earlierList: NotificationItem[] = [];

  notifications.forEach((item) => {
    const itemTime = new Date(item.createdAt).getTime();
    if (itemTime >= todayStart) {
      todayList.push(item);
    } else if (itemTime >= yesterdayStart) {
      yesterdayList.push(item);
    } else {
      earlierList.push(item);
    }
  });

  const renderNotificationGroup = (title: string, items: NotificationItem[]) => {
    if (items.length === 0) return null;

    return (
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            fontSize: "0.813rem",
            fontWeight: 800,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "10px",
            paddingLeft: "4px",
          }}
        >
          {title} ({items.length})
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {items.map((notif) => {
            const isResolution = notif.type === "RESOLUTION";
            const targetUrl = notif.report?.referenceNo ? `/reports/${notif.report.referenceNo}` : "/reports";
            const isUnread = !notif.isRead;

            return (
              <NextLink
                key={notif.id}
                href={targetUrl}
                onClick={() => handleMarkOneRead(notif.id)}
                className="card card-interactive"
                style={{
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  backgroundColor: isUnread ? "var(--primary-light)" : "var(--bg-surface)",
                  border: isUnread ? "1.5px solid rgba(2, 132, 199, 0.35)" : "1px solid var(--border-subtle)",
                  textDecoration: "none",
                  position: "relative",
                }}
              >
                {/* Unread indicator dot */}
                {isUnread && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary)",
                      position: "absolute",
                      left: "6px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                )}

                {/* Appropriate Icon */}
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: isResolution
                      ? "var(--success-light)"
                      : isUnread
                      ? "var(--primary)"
                      : "var(--bg-subtle)",
                    color: isResolution
                      ? "var(--success-dark)"
                      : isUnread
                      ? "#ffffff"
                      : "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                >
                  {isResolution ? (
                    <CheckCircle2 size={22} />
                  ) : notif.type === "STATUS_CHANGE" ? (
                    <Wrench size={20} />
                  ) : notif.type === "COMMENT" ? (
                    <MessageSquare size={20} />
                  ) : (
                    <FileText size={20} />
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <strong
                        style={{
                          fontSize: "0.938rem",
                          color: isUnread ? "var(--primary-dark)" : "var(--text-primary)",
                          fontWeight: isUnread ? 800 : 600,
                        }}
                      >
                        {notif.title}
                      </strong>
                      {isUnread && (
                        <span
                          style={{
                            fontSize: "0.688rem",
                            fontWeight: 800,
                            backgroundColor: "var(--primary)",
                            color: "#ffffff",
                            padding: "1px 6px",
                            borderRadius: "9999px",
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>
                      {new Date(notif.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "0.813rem",
                      color: isUnread ? "var(--text-primary)" : "var(--text-secondary)",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {notif.message}
                  </p>
                </div>

                <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </NextLink>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ maxWidth: "760px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Bell size={24} color="var(--primary)" />
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Notifications</h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.938rem", marginTop: "2px" }}>
            {unreadCount > 0 ? `You have ${unreadCount} unread community updates` : "All notifications caught up"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="btn btn-secondary btn-sm"
            style={{
              minHeight: "44px",
              padding: "8px 16px",
              borderRadius: "12px",
              fontWeight: 700,
            }}
          >
            <CheckCheck size={16} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {notifications.length === 0 ? (
        <div className="card" style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
          <Bell size={48} style={{ margin: "0 auto 14px auto", opacity: 0.4 }} />
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>
            No notifications yet
          </h3>
          <p style={{ fontSize: "0.875rem", maxWidth: "360px", margin: "6px auto 0 auto" }}>
            When status changes or repair updates occur on your reports, you will receive notifications here.
          </p>
        </div>
      ) : (
        <div>
          {renderNotificationGroup("Today", todayList)}
          {renderNotificationGroup("Yesterday", yesterdayList)}
          {renderNotificationGroup("Earlier", earlierList)}
        </div>
      )}

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
