"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { ReportItem, AnnouncementItem } from "@/types";
import {
  PlusCircle,
  FileText,
  MapPin,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Megaphone,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Shield,
  Building2,
  Camera,
  User,
  Wrench,
  Crown,
  BarChart3,
  Server,
  Settings,
  Users,
  ScrollText,
  Cpu,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  const role = user?.role || "RESIDENT";
  const isResident = role === "RESIDENT";
  const isStaff = role === "STAFF";
  const isAdmin = role === "ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";

  useEffect(() => {
    if (!loading && !user) {
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      } else {
        router.replace("/login");
      }
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, loading, router]);

  const loadDashboardData = async () => {
    try {
      setFetching(true);
      const reportRes = await fetch("/api/reports?limit=10");
      if (reportRes.ok) {
        const data = await reportRes.json();
        setReports(data.reports || []);
      }

      const annRes = await fetch("/api/announcements");
      if (annRes.ok) {
        const data = await annRes.json();
        setAnnouncements(data.announcements || []);
      }

      if (user && ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
        const anaRes = await fetch("/api/analytics");
        if (anaRes.ok) {
          const data = await anaRes.json();
          setAnalytics(data);
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || !user) {
    if (!user && !loading) return null;
    return (
      <div
        style={{
          minHeight: "calc(100vh - var(--header-height, 60px))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#080d1a",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "3px solid rgba(255, 255, 255, 0.12)",
            borderTopColor: "#38bdf8",
            animation: "spin 0.7s linear infinite",
          }}
        />
      </div>
    );
  }

  // Resident KPI counts
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) =>
    ["SUBMITTED", "RECEIVED", "UNDER_REVIEW"].includes(r.status)
  ).length;
  const inProgressCount = reports.filter((r) =>
    ["ASSIGNED", "IN_PROGRESS"].includes(r.status)
  ).length;
  const resolvedCount = reports.filter((r) =>
    ["RESOLVED", "CLOSED"].includes(r.status)
  ).length;

  // Staff category buckets
  const staffNeedsAttention = reports.filter((r) =>
    ["SUBMITTED", "UNDER_REVIEW", "REOPENED"].includes(r.status)
  );
  const staffCritical = reports.filter(
    (r) =>
      r.priority === "CRITICAL" &&
      !["CLOSED", "RESOLVED", "REJECTED"].includes(r.status)
  );
  const staffNewReports = reports.filter((r) => r.status === "SUBMITTED");
  const staffOverdue = reports.filter(
    (r) =>
      r.slaDeadline &&
      new Date(r.slaDeadline) < new Date() &&
      !["CLOSED", "RESOLVED", "REJECTED"].includes(r.status)
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user.name.split(" ")[0];

  return (
    <div
      className="dash-page-canvas"
      style={{
        width: "100%",
        minHeight: "calc(100vh - var(--header-height, 60px))",
        backgroundColor: "#080d1a",
        color: "#f8fafc",
        padding: "24px 20px 48px 20px",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Subtle Ambient Radial Glow */}
      <div
        className="dash-ambient-glow"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: "30%",
          width: "800px",
          height: "500px",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(2, 132, 199, 0.12) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 75%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className="dash-container"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* ===============================================================
            1. HEADER SECTION: Compact Greeting & Direct CTA
           =============================================================== */}
        <header
          className="dash-header-card"
          style={{
            width: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1.5px solid rgba(56, 189, 248, 0.18)",
            borderRadius: "20px",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxShadow:
              "0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
          }}
        >
          {/* Header Meta: Role & Status */}
          <div
            className="dash-header-meta"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {/* Role Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isResident && (
                <div
                  className="dash-role-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontSize: "0.725rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: "rgba(56, 189, 248, 0.1)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    color: "#38bdf8",
                  }}
                >
                  <Shield size={12} />
                  <span>Resident</span>
                </div>
              )}
              {isStaff && (
                <div
                  className="dash-role-badge dash-role-staff"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontSize: "0.725rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    color: "#34d399",
                  }}
                >
                  <Wrench size={12} />
                  <span>Operations Staff</span>
                </div>
              )}
              {isAdmin && (
                <div
                  className="dash-role-badge dash-role-admin"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontSize: "0.725rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: "rgba(129, 140, 248, 0.1)",
                    border: "1px solid rgba(129, 140, 248, 0.25)",
                    color: "#818cf8",
                  }}
                >
                  <Building2 size={12} />
                  <span>Administrator</span>
                </div>
              )}
              {isSuperAdmin && (
                <div
                  className="dash-role-badge dash-role-super"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    fontSize: "0.725rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: "rgba(251, 191, 36, 0.1)",
                    border: "1px solid rgba(251, 191, 36, 0.25)",
                    color: "#fbbf24",
                  }}
                >
                  <Crown size={12} />
                  <span>Super Admin</span>
                </div>
              )}
            </div>

            {/* Live Operational Dot */}
            <div
              className="dash-live-status"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.75rem",
                color: "#94a3b8",
                fontWeight: 600,
              }}
            >
              <span
                className="dash-live-dot"
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#34d399",
                  boxShadow: "0 0 8px #34d399",
                }}
              />
              <span>Live Civic Net</span>
            </div>
          </div>

          {/* Main Greeting Row */}
          <div
            className="dash-header-main"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div>
              <h1
                className="dash-greeting-title"
                style={{
                  fontSize: "1.55rem",
                  fontWeight: 800,
                  color: "#f8fafc",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                  margin: "0 0 4px 0",
                }}
              >
                {getGreeting()},{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #38bdf8 0%, #34d399 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {firstName}
                </span>
                !
              </h1>
              <p
                className="dash-greeting-sub"
                style={{
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                {isResident && "Report community issues and track live resolutions."}
                {isStaff && "Field incident triage and SLA dispatch queue."}
                {isAdmin && "Municipal executive governance & citizen oversight."}
                {isSuperAdmin && "Platform infrastructure & system administration."}
              </p>
            </div>

            {/* Desktop Action Buttons */}
            <div className="dash-header-actions-desktop" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {isResident ? (
                <NextLink
                  href="/reports/new"
                  className="dash-action-btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #0284c7 0%, #10b981 100%)",
                    color: "#ffffff",
                    fontSize: "0.885rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 4px 16px rgba(2, 132, 199, 0.35)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <PlusCircle size={18} />
                  <span>+ Report Issue</span>
                </NextLink>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <NextLink
                    href="/reports/new"
                    className="dash-action-btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 18px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #0284c7 0%, #10b981 100%)",
                      color: "#ffffff",
                      fontSize: "0.885rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    <PlusCircle size={17} />
                    <span>Log Incident</span>
                  </NextLink>
                  {(isAdmin || isSuperAdmin) && (
                    <NextLink
                      href="/admin"
                      className="dash-action-btn-outline"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 16px",
                        borderRadius: "12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: "#cbd5e1",
                        fontSize: "0.885rem",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      <Settings size={16} />
                      <span>Admin Console</span>
                    </NextLink>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile One-Handed CTA Button (Full-width, thumb-friendly right under greeting) */}
          <NextLink
            href="/reports/new"
            className="dash-mobile-cta"
            style={{
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "13px 18px",
              borderRadius: "14px",
              fontSize: "0.95rem",
              fontWeight: 800,
              textDecoration: "none",
              background: "linear-gradient(135deg, #0284c7 0%, #10b981 100%)",
              color: "#ffffff",
              boxShadow: "0 4px 16px rgba(2, 132, 199, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <PlusCircle size={19} />
            <span>{isResident ? "+ Report Community Issue" : "+ Log Incident Ticket"}</span>
          </NextLink>
        </header>

        {/* ===============================================================
            2. ACTIVE ANNOUNCEMENT (IF ANY)
           =============================================================== */}
        {announcements.length > 0 && (
          <section aria-label="Official Announcements">
            {announcements.slice(0, 1).map((ann) => (
              <div
                key={ann.id}
                className={`dash-announcement ${ann.priority === "URGENT" ? "dash-announcement-urgent" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  backgroundColor:
                    ann.priority === "URGENT"
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(56, 189, 248, 0.08)",
                  border:
                    ann.priority === "URGENT"
                      ? "1px solid rgba(239, 68, 68, 0.3)"
                      : "1px solid rgba(56, 189, 248, 0.25)",
                  color: ann.priority === "URGENT" ? "#fca5a5" : "#e2e8f0",
                  fontSize: "0.85rem",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "9px",
                    background:
                      ann.priority === "URGENT"
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(56, 189, 248, 0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Megaphone
                    size={16}
                    color={ann.priority === "URGENT" ? "#ef4444" : "#38bdf8"}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
                  <strong style={{ color: "#f8fafc", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ann.title}
                  </strong>
                  <span style={{ color: "#cbd5e1", fontSize: "0.785rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ann.content}
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ===============================================================
            3. MOBILE-FIRST 1-ROW 4-METRIC STRIP (Compact & Glanceable)
           =============================================================== */}
        {isResident && (
          <div className="dash-mobile-metrics">
            <div className="dash-mobile-metric-item">
              <span className="dash-mobile-metric-val" style={{ color: "#38bdf8" }}>
                {totalCount}
              </span>
              <span className="dash-mobile-metric-lbl">Total</span>
            </div>
            <div className="dash-mobile-metric-item">
              <span className="dash-mobile-metric-val" style={{ color: "#f59e0b" }}>
                {pendingCount}
              </span>
              <span className="dash-mobile-metric-lbl">Review</span>
            </div>
            <div className="dash-mobile-metric-item">
              <span className="dash-mobile-metric-val" style={{ color: "#c084fc" }}>
                {inProgressCount}
              </span>
              <span className="dash-mobile-metric-lbl">Progress</span>
            </div>
            <div className="dash-mobile-metric-item">
              <span className="dash-mobile-metric-val" style={{ color: "#34d399" }}>
                {resolvedCount}
              </span>
              <span className="dash-mobile-metric-lbl">Resolved</span>
            </div>
          </div>
        )}

        {isStaff && (
          <div className="dash-mobile-metrics">
            <div className="dash-mobile-metric-item">
              <span className="dash-mobile-metric-val" style={{ color: "#f59e0b" }}>
                {staffNeedsAttention.length}
              </span>
              <span className="dash-mobile-metric-lbl">Attention</span>
            </div>
            <div className="dash-mobile-metric-item">
              <span className="dash-mobile-metric-val" style={{ color: "#ef4444" }}>
                {staffCritical.length}
              </span>
              <span className="dash-mobile-metric-lbl">Critical</span>
            </div>
            <div className="dash-mobile-metric-item">
              <span className="dash-mobile-metric-val" style={{ color: "#38bdf8" }}>
                {staffNewReports.length}
              </span>
              <span className="dash-mobile-metric-lbl">New</span>
            </div>
            <div className="dash-mobile-metric-item">
              <span className="dash-mobile-metric-val" style={{ color: "#fb7185" }}>
                {staffOverdue.length}
              </span>
              <span className="dash-mobile-metric-lbl">Overdue</span>
            </div>
          </div>
        )}

        {(isAdmin || isSuperAdmin) && (
          <div className="dash-mobile-metrics">
            <div className="dash-mobile-metric-item">
              <span className="dash-mobile-metric-val" style={{ color: "#38bdf8" }}>
                {isSuperAdmin ? "100%" : totalCount}
              </span>
              <span className="dash-mobile-metric-lbl">{isSuperAdmin ? "Health" : "Total"}</span>
            </div>
            <div className="dash-mobile-metric-item">
              <span className="dash-mobile-metric-val" style={{ color: "#34d399" }}>
                {analytics?.metrics?.resolutionRate || 85}%
              </span>
              <span className="dash-mobile-metric-lbl">Rate</span>
            </div>
            <div className="dash-mobile-metric-item">
              <span className="dash-mobile-metric-val" style={{ color: "#c084fc" }}>
                {analytics?.metrics?.avgResolutionHours || "18.5"}h
              </span>
              <span className="dash-mobile-metric-lbl">Avg SLA</span>
            </div>
            <div className="dash-mobile-metric-item">
              <span className="dash-mobile-metric-val" style={{ color: "#f59e0b" }}>
                {analytics?.hotspots?.length || 0}
              </span>
              <span className="dash-mobile-metric-lbl">Hotspots</span>
            </div>
          </div>
        )}

        {/* ===============================================================
            4. DESKTOP-ONLY HERO & 4-COLUMN KPI CARDS (Untouched on Desktop)
           =============================================================== */}
        {isResident && (
          <>
            {/* Desktop Hero CTA */}
            <NextLink
              href="/reports/new"
              className="dash-hero-report dash-desktop-only"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 26px",
                borderRadius: "20px",
                background:
                  "linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)",
                border: "1.5px solid rgba(56, 189, 248, 0.28)",
                boxShadow: "0 16px 40px -10px rgba(0, 0, 0, 0.6)",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                <div
                  className="dash-hero-icon"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #0284c7 0%, #10b981 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)",
                    flexShrink: 0,
                  }}
                >
                  <PlusCircle size={26} strokeWidth={2.4} />
                </div>
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "0.725rem",
                      fontWeight: 700,
                      color: "#34d399",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: "3px",
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Smart GPS & Photo Verification</span>
                  </div>
                  <h2
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      color: "#f8fafc",
                      margin: "0 0 2px 0",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Report a Community Issue
                  </h2>
                  <p
                    style={{
                      fontSize: "0.825rem",
                      color: "#94a3b8",
                      margin: 0,
                    }}
                  >
                    Potholes, broken streetlights, electrical hazards, or clogged canals.
                  </p>
                </div>
              </div>
              <div
                className="dash-hero-arrow"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ChevronRight size={18} />
              </div>
            </NextLink>

            {/* Desktop 4-Column KPI Counters */}
            <div
              className="dash-kpi-grid dash-desktop-only"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
              }}
            >
              {/* Total Filed */}
              <div
                className="dash-kpi-card"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.94)",
                  border: "1.5px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="dash-kpi-label" style={{ fontSize: "0.775rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                    Total Filed
                  </span>
                  <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Layers size={16} />
                  </div>
                </div>
                <div className="dash-kpi-val" style={{ fontSize: "2rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>
                  {totalCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>All logged reports</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", backgroundColor: "#38bdf8" }} />
              </div>

              {/* Pending Review */}
              <div
                className="dash-kpi-card"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.94)",
                  border: "1.5px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="dash-kpi-label" style={{ fontSize: "0.775rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" }}>
                    Pending Review
                  </span>
                  <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Clock size={16} />
                  </div>
                </div>
                <div className="dash-kpi-val" style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b", lineHeight: 1 }}>
                  {pendingCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Awaiting review</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", backgroundColor: "#f59e0b" }} />
              </div>

              {/* In Progress */}
              <div
                className="dash-kpi-card"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.94)",
                  border: "1.5px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="dash-kpi-label" style={{ fontSize: "0.775rem", fontWeight: 700, color: "#c084fc", textTransform: "uppercase" }}>
                    In Progress
                  </span>
                  <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(192, 132, 252, 0.1)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity size={16} />
                  </div>
                </div>
                <div className="dash-kpi-val" style={{ fontSize: "2rem", fontWeight: 800, color: "#c084fc", lineHeight: 1 }}>
                  {inProgressCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Field work active</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", backgroundColor: "#c084fc" }} />
              </div>

              {/* Verified & Resolved */}
              <div
                className="dash-kpi-card"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.94)",
                  border: "1.5px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="dash-kpi-label" style={{ fontSize: "0.775rem", fontWeight: 700, color: "#34d399", textTransform: "uppercase" }}>
                    Resolved
                  </span>
                  <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(52, 211, 153, 0.1)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="dash-kpi-val" style={{ fontSize: "2rem", fontWeight: 800, color: "#34d399", lineHeight: 1 }}>
                  {resolvedCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Fixed & confirmed</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", backgroundColor: "#34d399" }} />
              </div>
            </div>

            {/* Desktop Quick Access Grid (Kept on desktop, hidden on mobile) */}
            <div
              className="dash-quick-grid dash-desktop-only"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "14px",
              }}
            >
              <NextLink
                href="/reports"
                className="dash-quick-card"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  border: "1.5px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "16px",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  textDecoration: "none",
                }}
              >
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "0.885rem", fontWeight: 700, color: "#f8fafc", lineHeight: 1.2 }}>My Reports</div>
                  <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>{totalCount} filed cases</div>
                </div>
              </NextLink>

              <NextLink
                href="/map"
                className="dash-quick-card"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  border: "1.5px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "16px",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  textDecoration: "none",
                }}
              >
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(52, 211, 153, 0.1)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "0.885rem", fontWeight: 700, color: "#f8fafc", lineHeight: 1.2 }}>Community Map</div>
                  <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>Live Pinpoint GPS</div>
                </div>
              </NextLink>

              <NextLink
                href="/notifications"
                className="dash-quick-card"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  border: "1.5px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "16px",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  textDecoration: "none",
                }}
              >
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bell size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "0.885rem", fontWeight: 700, color: "#f8fafc", lineHeight: 1.2 }}>Official Alerts</div>
                  <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>Barangay Updates</div>
                </div>
              </NextLink>

              <NextLink
                href="/profile"
                className="dash-quick-card"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  border: "1.5px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "16px",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  textDecoration: "none",
                }}
              >
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(192, 132, 252, 0.1)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <User size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "0.885rem", fontWeight: 700, color: "#f8fafc", lineHeight: 1.2 }}>Citizen Profile</div>
                  <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>Account Settings</div>
                </div>
              </NextLink>
            </div>
          </>
        )}

        {/* ===============================================================
            5. DESKTOP-ONLY STAFF & ADMIN KPIS & HUB
           =============================================================== */}
        {isStaff && (
          <div className="dash-desktop-only">
            <div
              className="dash-kpi-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
              }}
            >
              <div className="dash-kpi-card" style={{ backgroundColor: "rgba(15, 23, 42, 0.94)", border: "1.5px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "18px 20px" }}>
                <span style={{ fontSize: "0.775rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" }}>Needs Attention</span>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b" }}>{staffNeedsAttention.length}</div>
              </div>
              <div className="dash-kpi-card" style={{ backgroundColor: "rgba(15, 23, 42, 0.94)", border: "1.5px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "18px 20px" }}>
                <span style={{ fontSize: "0.775rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase" }}>Critical Threats</span>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#ef4444" }}>{staffCritical.length}</div>
              </div>
              <div className="dash-kpi-card" style={{ backgroundColor: "rgba(15, 23, 42, 0.94)", border: "1.5px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "18px 20px" }}>
                <span style={{ fontSize: "0.775rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase" }}>New Submissions</span>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#38bdf8" }}>{staffNewReports.length}</div>
              </div>
              <div className="dash-kpi-card" style={{ backgroundColor: "rgba(15, 23, 42, 0.94)", border: "1.5px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "18px 20px" }}>
                <span style={{ fontSize: "0.775rem", fontWeight: 700, color: "#fb7185", textTransform: "uppercase" }}>Overdue SLA</span>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fb7185" }}>{staffOverdue.length}</div>
              </div>
            </div>
          </div>
        )}

        {(isAdmin || isSuperAdmin) && (
          <div className="dash-desktop-only">
            <div
              className="dash-quick-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "14px",
              }}
            >
              <NextLink href="/admin" className="dash-quick-card" style={{ backgroundColor: "rgba(15, 23, 42, 0.85)", border: "1.5px solid rgba(255, 255, 255, 0.07)", borderRadius: "16px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none" }}>
                <Building2 size={20} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: "0.885rem", fontWeight: 700, color: "#f8fafc" }}>Agencies</div>
                  <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>Public Works & Safety</div>
                </div>
              </NextLink>
              <NextLink href="/admin" className="dash-quick-card" style={{ backgroundColor: "rgba(15, 23, 42, 0.85)", border: "1.5px solid rgba(255, 255, 255, 0.07)", borderRadius: "16px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none" }}>
                <Users size={20} color="#34d399" />
                <div>
                  <div style={{ fontSize: "0.885rem", fontWeight: 700, color: "#f8fafc" }}>User Directory</div>
                  <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>Staff Permissions</div>
                </div>
              </NextLink>
              <NextLink href="/admin/analytics" className="dash-quick-card" style={{ backgroundColor: "rgba(15, 23, 42, 0.85)", border: "1.5px solid rgba(255, 255, 255, 0.07)", borderRadius: "16px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none" }}>
                <BarChart3 size={20} color="#c084fc" />
                <div>
                  <div style={{ fontSize: "0.885rem", fontWeight: 700, color: "#f8fafc" }}>SLA Analytics</div>
                  <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>Response Trends</div>
                </div>
              </NextLink>
              <NextLink href="/admin" className="dash-quick-card" style={{ backgroundColor: "rgba(15, 23, 42, 0.85)", border: "1.5px solid rgba(255, 255, 255, 0.07)", borderRadius: "16px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px", textDecoration: "none" }}>
                <ScrollText size={20} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: "0.885rem", fontWeight: 700, color: "#f8fafc" }}>Audit Trail</div>
                  <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>System Security</div>
                </div>
              </NextLink>
            </div>
          </div>
        )}

        {/* ===============================================================
            6. RECENT INCIDENTS / REPORTS FEED (Primary Content)
           =============================================================== */}
        <section
          className="dash-feed-card"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1.5px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "20px",
            boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.7)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
          aria-label="Incident Reports Feed"
        >
          <div
            className="dash-feed-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
              paddingBottom: "12px",
            }}
          >
            <div>
              <h3
                className="dash-feed-title"
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#f8fafc",
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                {isResident ? "Recent Reports" : "Active Incident Queue"}
              </h3>
            </div>
            <NextLink
              href="/reports"
              className="dash-feed-viewall"
              style={{
                fontSize: "0.813rem",
                fontWeight: 700,
                color: "#38bdf8",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>View All</span>
              <ChevronRight size={15} />
            </NextLink>
          </div>

          {reports.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "36px 16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  marginBottom: "12px",
                }}
              >
                <FileText size={24} />
              </div>
              <h4
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                  margin: "0 0 4px 0",
                }}
              >
                No reports logged yet
              </h4>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  maxWidth: "340px",
                  margin: "0 0 14px 0",
                  lineHeight: 1.4,
                }}
              >
                {isResident
                  ? "Spot public hazard or broken infrastructure? Tap below to report."
                  : "There are currently no active reports in the municipal queue."}
              </p>
              {isResident && (
                <NextLink
                  href="/reports/new"
                  className="dash-action-btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 16px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #0284c7 0%, #10b981 100%)",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <PlusCircle size={16} />
                  <span>Report First Issue</span>
                </NextLink>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {reports.slice(0, 5).map((report) => {
                const photoUrl = report.photos && report.photos[0]?.photoUrl;
                const formattedDate = new Date(report.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                  }
                );

                return (
                  <NextLink
                    key={report.id}
                    href={`/reports/${report.referenceNo}`}
                    className="dash-report-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      textDecoration: "none",
                      gap: "12px",
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="dash-report-thumb"
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        overflow: "hidden",
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={report.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Camera size={18} color="#64748b" />
                      )}
                    </div>

                    {/* Report Information */}
                    <div
                      className="dash-report-main"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.725rem",
                            fontWeight: 700,
                            color: "#38bdf8",
                          }}
                        >
                          {report.referenceNo}
                        </span>
                        <StatusBadge status={report.status} size="sm" />
                        <PriorityBadge priority={report.priority} size="sm" />
                      </div>

                      <strong
                        className="dash-report-title"
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          color: "#f8fafc",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {report.title}
                      </strong>

                      <div
                        className="dash-report-meta"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          fontSize: "0.725rem",
                          color: "#94a3b8",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <MapPin size={11} color="#64748b" />
                          <span>{report.address.split(",")[0]}</span>
                        </span>
                        <span>•</span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <Clock size={11} color="#64748b" />
                          <span>{formattedDate}</span>
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={16} color="#64748b" style={{ flexShrink: 0 }} />
                  </NextLink>
                );
              })}
            </div>
          )}
        </section>

        {/* ===============================================================
            7. DESKTOP BOTTOM COMPLIANCE SEAL (Hidden on Mobile)
           =============================================================== */}
        <footer
          className="dash-bottom-seal dash-desktop-only"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "0.75rem",
            color: "#64748b",
            padding: "8px 0 16px 0",
            textAlign: "center",
          }}
        >
          <ShieldCheck size={15} color="#34d399" />
          <span>
            BantayBarangay Official Civic Platform · 256-Bit SSL Encrypted · Philippine Data Privacy Compliant
          </span>
        </footer>
      </div>
    </div>
  );
}
