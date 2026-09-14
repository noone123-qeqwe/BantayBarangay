"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Home,
  MapPin,
  FileText,
  Bell,
  User,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Hide bottom navigation bar on authentication screens and intro
  const isAuthPage = ["/login", "/register", "/forgot-password", "/"].includes(pathname);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        // Silently catch in polling
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 20000);
    return () => clearInterval(interval);
  }, [user]);

  if (isAuthPage) {
    return null;
  }

  const isStaff = user && ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(user.role);

  const tabs = [
    {
      id: "home",
      label: "Home",
      href: user ? "/dashboard" : "/",
      icon: user ? LayoutDashboard : Home,
      isActive: pathname === "/dashboard" || pathname === "/",
    },
    {
      id: "map",
      label: "Map",
      href: "/map",
      icon: MapPin,
      isActive: pathname === "/map",
    },
    {
      id: "reports",
      label: isStaff ? "Queue" : "Reports",
      href: "/reports",
      icon: FileText,
      isActive: pathname === "/reports" || pathname.startsWith("/reports/"),
    },
    {
      id: "notifications",
      label: "Alerts",
      href: user ? "/notifications" : "/login",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      isActive: pathname === "/notifications",
    },
    {
      id: "profile",
      label: "Profile",
      href: user ? "/profile" : "/login",
      icon: User,
      isActive: pathname === "/profile",
    },
  ];

  return (
    <nav
      className="bottom-nav-mobile"
      aria-label="Mobile navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 45,
        height: "var(--bottom-nav-height)",
        backgroundColor: "var(--bg-glass-dock)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 6px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.45)",
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive;

        return (
          <NextLink
            key={tab.id}
            href={tab.href}
            className={`nav-tab ${active ? "nav-tab-active" : ""}`}
            style={{
              color: active ? "var(--primary)" : "var(--text-muted)",
              position: "relative",
            }}
          >
            <div className={`nav-icon-wrapper ${active ? "active-pill" : ""}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {tab.badge && tab.badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-4px",
                    backgroundColor: "var(--priority-critical)",
                    color: "#ffffff",
                    fontSize: "0.625rem",
                    fontWeight: 800,
                    borderRadius: "9999px",
                    padding: "1px 5px",
                    minWidth: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 5px rgba(220, 38, 38, 0.4)",
                    border: "1.5px solid #ffffff",
                  }}
                >
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: "0.688rem",
                fontWeight: active ? 800 : 600,
                letterSpacing: "-0.01em",
                transition: "color 0.15s ease",
              }}
            >
              {tab.label}
            </span>
          </NextLink>
        );
      })}

      <style jsx>{`
        .bottom-nav-mobile {
          display: flex;
        }
        @media (min-width: 1024px) {
          .bottom-nav-mobile {
            display: none !important;
          }
        }
        .nav-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          flex: 1;
          text-decoration: none;
          min-height: 54px;
          touch-action: manipulation;
          transition: transform 0.1s ease;
        }
        .nav-tab:active {
          transform: scale(0.92);
        }
        .nav-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 28px;
          border-radius: 9999px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .active-pill {
          background-color: rgba(37, 99, 235, 0.12);
          color: var(--primary);
        }
        :global([data-theme="dark"]) .bottom-nav-mobile {
          background-color: rgba(15, 23, 42, 0.94) !important;
        }
        :global([data-theme="dark"]) .active-pill {
          background-color: rgba(37, 99, 235, 0.25) !important;
        }
      `}</style>
    </nav>
  );
}
