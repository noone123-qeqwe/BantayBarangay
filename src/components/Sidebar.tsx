"use client";

import React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  MapPin,
  BarChart3,
  Flame,
  Building2,
  Tags,
  Users,
  Megaphone,
  ScrollText,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(pathname);
  if (isAuthPage || !user || user.role === "RESIDENT") {
    return null;
  }

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

  const navGroups = [
    {
      title: "Overview",
      items: [
        { label: "Operations Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Reports Queue",
      items: [
        { label: "All Reports", href: "/reports", icon: FileText },
        { label: "Under Review", href: "/reports?status=UNDER_REVIEW", icon: Clock },
        { label: "In Progress", href: "/reports?status=IN_PROGRESS", icon: Wrench },
        { label: "Resolved / Closed", href: "/reports?status=RESOLVED", icon: CheckCircle2 },
      ],
    },
    {
      title: "Operations & Agencies",
      items: [
        { label: "Agency Directory", href: "/admin", icon: Building2 },
        { label: "Problem Categories", href: "/admin", icon: Tags },
      ],
    },
    {
      title: "Community & Map",
      items: [
        { label: "Community Map", href: "/map", icon: MapPin },
        { label: "Announcements", href: "/admin", icon: Megaphone },
      ],
    },
    {
      title: "Insights & Intelligence",
      items: [
        { label: "Analytics & SLA", href: "/admin/analytics", icon: BarChart3 },
        { label: "Hazard Hotspots", href: "/map", icon: Flame },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "Administration",
            items: [
              { label: "User Roles & Staff", href: "/admin", icon: Users },
              { label: "System Audit Logs", href: "/admin", icon: ScrollText },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside
      className="desktop-sidebar"
      style={{
        width: "var(--sidebar-width)",
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "none",
        flexDirection: "column",
        padding: "20px 14px",
        height: "calc(100vh - var(--header-height))",
        position: "sticky",
        top: "var(--header-height)",
        overflowY: "auto",
      }}
    >
      {/* Primary Action Button */}
      <div style={{ marginBottom: "20px" }}>
        <NextLink
          href="/reports/new"
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", fontWeight: 800 }}
        >
          <PlusCircle size={18} />
          <span>+ File New Report</span>
        </NextLink>
      </div>

      {/* Navigation Groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>
        {navGroups.map((group) => (
          <div key={group.title}>
            <div
              style={{
                fontSize: "0.688rem",
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "0 10px",
                marginBottom: "6px",
              }}
            >
              {group.title}
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : item.href === "/reports"
                    ? pathname === "/reports"
                    : pathname.startsWith(item.href);

                return (
                  <NextLink
                    key={item.label}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.813rem",
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? "var(--primary)" : "var(--text-secondary)",
                      backgroundColor: isActive ? "var(--primary-light)" : "transparent",
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={16} color={isActive ? "var(--primary)" : "var(--text-muted)"} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </NextLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Staff Role Footer Pill */}
      <div
        style={{
          marginTop: "20px",
          padding: "12px",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--bg-subtle)",
          border: "1px solid var(--border-medium)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <img
            src="/logo.png"
            alt="BantayBarangay"
            width={32}
            height={32}
            style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "contain" }}
          />
        </div>
        <div>
          <strong style={{ fontSize: "0.813rem", color: "var(--text-primary)", display: "block" }}>
            Operational Mode
          </strong>
          <span style={{ fontSize: "0.688rem", color: "var(--primary)", fontWeight: 800 }}>
            {user.role} PERMISSIONS
          </span>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 1024px) {
          .desktop-sidebar {
            display: flex !important;
          }
        }
      `}</style>
    </aside>
  );
}
