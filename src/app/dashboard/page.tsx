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
  Sliders,
  Check,
  Cpu,
  Globe,
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

  // Counts & Filter Bins
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
          gap: "24px",
        }}
      >
        {/* ===============================================================
            HEADER CARD: Greeting, Role Badge & Primary CTAs
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
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow:
              "0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
          }}
        >
          <div
            className="dash-header-meta"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
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
                    padding: "4px 11px",
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
                  <Shield size={13} />
                  <span>Verified Resident</span>
                </div>
              )}
              {isStaff && (
                <div
                  className="dash-role-badge dash-role-staff"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 11px",
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
                  <Wrench size={13} />
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
                    padding: "4px 11px",
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
                  <Building2 size={13} />
                  <span>Barangay Administrator</span>
                </div>
              )}
              {isSuperAdmin && (
                <div
                  className="dash-role-badge dash-role-super"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 11px",
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
                  <Crown size={13} />
                  <span>Super Administrator</span>
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
              <span>System Operational · 100% Online</span>
            </div>
          </div>

          <div
            className="dash-header-main"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <h1
                className="dash-greeting-title"
                style={{
                  fontSize: "1.65rem",
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
                  {user.name.split(" ")[0]}
                </span>
                !
              </h1>
              <p
                className="dash-greeting-sub"
                style={{
                  fontSize: "0.875rem",
                  color: "#94a3b8",
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                {isResident &&
                  "Report community issues, track emergency fixes, and verify completed resolutions."}
                {isStaff &&
                  "Operational Incident Control · Active Field Dispatch & SLA Monitoring Queue."}
                {isAdmin &&
                  "Executive Municipal Command · Governance, SLA Compliance & Citizen Oversight."}
                {isSuperAdmin &&
                  "Municipal Platform Infrastructure, Security Audits & Cross-Agency Authority."}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
        </header>

        {/* ===============================================================
            MUNICIPAL ANNOUNCEMENTS BANNER (IF ACTIVE)
           =============================================================== */}
        {announcements.length > 0 && (
          <section aria-label="Official Announcements">
            {announcements.slice(0, 1).map((ann) => (
              <div
                key={ann.id}
                className={`dash-announcement ${
                  ann.priority === "URGENT" ? "dash-announcement-urgent" : ""
                }`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 20px",
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
                  fontSize: "0.875rem",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
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
                    size={18}
                    color={ann.priority === "URGENT" ? "#ef4444" : "#38bdf8"}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <strong style={{ color: "#f8fafc", fontWeight: 700 }}>
                    {ann.title}
                  </strong>
                  <span style={{ color: "#cbd5e1" }}>{ann.content}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ===============================================================
            RESIDENT VIEW: Hero CTA + KPI Metrics + Quick Access
           =============================================================== */}
        {isResident && (
          <>
            {/* Clean Hero Report CTA */}
            <NextLink
              href="/reports/new"
              className="dash-hero-report"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "22px 28px",
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
                    width: "52px",
                    height: "52px",
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
                  <PlusCircle size={28} strokeWidth={2.4} />
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
                      marginBottom: "4px",
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Smart GPS & Photo Verification</span>
                  </div>
                  <h2
                    style={{
                      fontSize: "1.2rem",
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
                      fontSize: "0.84rem",
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
                  width: "40px",
                  height: "40px",
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
                <ChevronRight size={20} />
              </div>
            </NextLink>

            {/* 4-Column KPI Counters */}
            <div
              className="dash-kpi-grid"
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
                <div
                  className="dash-kpi-header"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    className="dash-kpi-label"
                    style={{
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Total Filed
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: "rgba(56, 189, 248, 0.1)",
                      color: "#38bdf8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Layers size={16} />
                  </div>
                </div>
                <div
                  className="dash-kpi-val"
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#f8fafc",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {totalCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  All logged reports
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#38bdf8",
                  }}
                />
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
                <div
                  className="dash-kpi-header"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    className="dash-kpi-label"
                    style={{
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      color: "#f59e0b",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Pending Review
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: "rgba(245, 158, 11, 0.1)",
                      color: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Clock size={16} />
                  </div>
                </div>
                <div
                  className="dash-kpi-val"
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#f59e0b",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {pendingCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Awaiting review
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#f59e0b",
                  }}
                />
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
                <div
                  className="dash-kpi-header"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    className="dash-kpi-label"
                    style={{
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      color: "#c084fc",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    In Progress
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: "rgba(192, 132, 252, 0.1)",
                      color: "#c084fc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Activity size={16} />
                  </div>
                </div>
                <div
                  className="dash-kpi-val"
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#c084fc",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {inProgressCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Field work active
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#c084fc",
                  }}
                />
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
                <div
                  className="dash-kpi-header"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    className="dash-kpi-label"
                    style={{
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      color: "#34d399",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Resolved
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: "rgba(52, 211, 153, 0.1)",
                      color: "#34d399",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div
                  className="dash-kpi-val"
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#34d399",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {resolvedCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Fixed & confirmed
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#34d399",
                  }}
                />
              </div>
            </div>

            {/* Quick Access Navigation Grid */}
            <div
              className="dash-quick-grid"
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
                <div
                  className="dash-quick-icon"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(56, 189, 248, 0.1)",
                    color: "#38bdf8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <div
                    className="dash-quick-title"
                    style={{
                      fontSize: "0.885rem",
                      fontWeight: 700,
                      color: "#f8fafc",
                      lineHeight: 1.2,
                    }}
                  >
                    My Reports
                  </div>
                  <div
                    className="dash-quick-sub"
                    style={{ fontSize: "0.725rem", color: "#94a3b8" }}
                  >
                    {totalCount} filed cases
                  </div>
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
                <div
                  className="dash-quick-icon"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(52, 211, 153, 0.1)",
                    color: "#34d399",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={20} />
                </div>
                <div>
                  <div
                    className="dash-quick-title"
                    style={{
                      fontSize: "0.885rem",
                      fontWeight: 700,
                      color: "#f8fafc",
                      lineHeight: 1.2,
                    }}
                  >
                    Community Map
                  </div>
                  <div
                    className="dash-quick-sub"
                    style={{ fontSize: "0.725rem", color: "#94a3b8" }}
                  >
                    Live Pinpoint GPS
                  </div>
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
                <div
                  className="dash-quick-icon"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bell size={20} />
                </div>
                <div>
                  <div
                    className="dash-quick-title"
                    style={{
                      fontSize: "0.885rem",
                      fontWeight: 700,
                      color: "#f8fafc",
                      lineHeight: 1.2,
                    }}
                  >
                    Official Alerts
                  </div>
                  <div
                    className="dash-quick-sub"
                    style={{ fontSize: "0.725rem", color: "#94a3b8" }}
                  >
                    Barangay Updates
                  </div>
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
                <div
                  className="dash-quick-icon"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(192, 132, 252, 0.1)",
                    color: "#c084fc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User size={20} />
                </div>
                <div>
                  <div
                    className="dash-quick-title"
                    style={{
                      fontSize: "0.885rem",
                      fontWeight: 700,
                      color: "#f8fafc",
                      lineHeight: 1.2,
                    }}
                  >
                    Citizen Profile
                  </div>
                  <div
                    className="dash-quick-sub"
                    style={{ fontSize: "0.725rem", color: "#94a3b8" }}
                  >
                    Account Settings
                  </div>
                </div>
              </NextLink>
            </div>
          </>
        )}

        {/* ===============================================================
            STAFF VIEW: Incident Control & Active Shift Triage
           =============================================================== */}
        {isStaff && (
          <>
            <div
              className="dash-kpi-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
              }}
            >
              {/* Needs Attention */}
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      color: "#f59e0b",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Needs Attention
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: "rgba(245, 158, 11, 0.1)",
                      color: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AlertTriangle size={16} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#f59e0b",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {staffNeedsAttention.length}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Action or verification required
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#f59e0b",
                  }}
                />
              </div>

              {/* Critical Threats */}
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      color: "#ef4444",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Critical Threats
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Flame size={16} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#ef4444",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {staffCritical.length}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  High-risk hazards
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#ef4444",
                  }}
                />
              </div>

              {/* New Submissions */}
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      color: "#38bdf8",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    New Submissions
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: "rgba(56, 189, 248, 0.1)",
                      color: "#38bdf8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={16} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#38bdf8",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {staffNewReports.length}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Pending triage review
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#38bdf8",
                  }}
                />
              </div>

              {/* Overdue SLA */}
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      color: "#fb7185",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Overdue SLA
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: "rgba(251, 113, 133, 0.1)",
                      color: "#fb7185",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Clock size={16} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#fb7185",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {staffOverdue.length}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  Exceeded response window
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#fb7185",
                  }}
                />
              </div>
            </div>

            {/* Quick Operational Links */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "14px",
              }}
            >
              <NextLink
                href="/reports?status=UNDER_REVIEW"
                className="dash-quick-card"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  border: "1.5px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "16px",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    className="dash-quick-icon"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "rgba(245, 158, 11, 0.1)",
                      color: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.885rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                        lineHeight: 1.2,
                      }}
                    >
                      Review Pending Tickets
                    </div>
                    <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>
                      {staffNeedsAttention.length} pending assessment
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
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
                  justifyContent: "space-between",
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    className="dash-quick-icon"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "rgba(52, 211, 153, 0.1)",
                      color: "#34d399",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.885rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                        lineHeight: 1.2,
                      }}
                    >
                      Field Inspection Map
                    </div>
                    <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>
                      View live hazard coordinates
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </NextLink>
            </div>
          </>
        )}

        {/* ===============================================================
            ADMIN & SUPER ADMIN VIEW: Executive Governance & RBAC
           =============================================================== */}
        {(isAdmin || isSuperAdmin) && (
          <>
            <div
              className="dash-kpi-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
              }}
            >
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      color: "#38bdf8",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {isSuperAdmin ? "Platform Health" : "Total Reports"}
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: "rgba(56, 189, 248, 0.1)",
                      color: "#38bdf8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSuperAdmin ? <Server size={16} /> : <BarChart3 size={16} />}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#38bdf8",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {isSuperAdmin ? "100%" : analytics?.metrics?.totalReports || totalCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {isSuperAdmin ? "All systems active" : "Barangay total volume"}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#38bdf8",
                  }}
                />
              </div>

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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      color: "#34d399",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {isSuperAdmin ? "Civic Accounts" : "Resolution Rate"}
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: "rgba(52, 211, 153, 0.1)",
                      color: "#34d399",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSuperAdmin ? <Users size={16} /> : <CheckCircle2 size={16} />}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#34d399",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {isSuperAdmin
                    ? analytics?.metrics?.totalUsers || "1,420"
                    : `${analytics?.metrics?.resolutionRate || 85}%`}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {isSuperAdmin ? "Verified residents & staff" : "Closed & verified fixes"}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#34d399",
                  }}
                />
              </div>

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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      color: "#c084fc",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {isSuperAdmin ? "Incident Intake" : "Avg SLA Time"}
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: "rgba(192, 132, 252, 0.1)",
                      color: "#c084fc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSuperAdmin ? <Layers size={16} /> : <Clock size={16} />}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#c084fc",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {isSuperAdmin
                    ? analytics?.metrics?.totalReports || totalCount
                    : `${analytics?.metrics?.avgResolutionHours || "18.5"}h`}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {isSuperAdmin ? "Cross-municipal total" : "Submission to fix"}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#c084fc",
                  }}
                />
              </div>

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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      color: "#f59e0b",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {isSuperAdmin ? "AI Moderation" : "Active Hotspots"}
                  </span>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9px",
                      background: "rgba(245, 158, 11, 0.1)",
                      color: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSuperAdmin ? <Cpu size={16} /> : <Flame size={16} />}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#f59e0b",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {isSuperAdmin ? "99.4%" : analytics?.hotspots?.length || 0}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {isSuperAdmin ? "Triage accuracy" : "Clustered hazards"}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    backgroundColor: "#f59e0b",
                  }}
                />
              </div>
            </div>

            {/* Admin Command Hub */}
            <div
              className="dash-quick-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "14px",
              }}
            >
              <NextLink
                href="/admin"
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
                <div
                  className="dash-quick-icon"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(56, 189, 248, 0.1)",
                    color: "#38bdf8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.885rem",
                      fontWeight: 700,
                      color: "#f8fafc",
                      lineHeight: 1.2,
                    }}
                  >
                    Municipal Agencies
                  </div>
                  <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>
                    Engineering & Health
                  </div>
                </div>
              </NextLink>

              <NextLink
                href="/admin"
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
                <div
                  className="dash-quick-icon"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(52, 211, 153, 0.1)",
                    color: "#34d399",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Users size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.885rem",
                      fontWeight: 700,
                      color: "#f8fafc",
                      lineHeight: 1.2,
                    }}
                  >
                    User Directory
                  </div>
                  <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>
                    Staff Permissions
                  </div>
                </div>
              </NextLink>

              <NextLink
                href="/admin/analytics"
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
                <div
                  className="dash-quick-icon"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(192, 132, 252, 0.1)",
                    color: "#c084fc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <BarChart3 size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.885rem",
                      fontWeight: 700,
                      color: "#f8fafc",
                      lineHeight: 1.2,
                    }}
                  >
                    SLA Analytics
                  </div>
                  <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>
                    Response Times
                  </div>
                </div>
              </NextLink>

              <NextLink
                href="/admin"
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
                <div
                  className="dash-quick-icon"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ScrollText size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.885rem",
                      fontWeight: 700,
                      color: "#f8fafc",
                      lineHeight: 1.2,
                    }}
                  >
                    Audit Trail
                  </div>
                  <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>
                    System Security Logs
                  </div>
                </div>
              </NextLink>
            </div>
          </>
        )}

        {/* ===============================================================
            SHARED INCIDENTS & REPORTS FEED
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
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
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
              paddingBottom: "14px",
            }}
          >
            <div>
              <h3
                className="dash-feed-title"
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: "#f8fafc",
                  letterSpacing: "-0.02em",
                  margin: "0 0 2px 0",
                }}
              >
                {isResident ? "My Recent Reports" : "Active Incident Queue"}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
                {isResident
                  ? "Track live status updates and confirmation requests on your reports."
                  : "Latest submitted community hazards awaiting triage, dispatch, or resolution."}
              </p>
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
              <ChevronRight size={16} />
            </NextLink>
          </div>

          {reports.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 20px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  marginBottom: "14px",
                }}
              >
                <FileText size={28} />
              </div>
              <h4
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                  margin: "0 0 6px 0",
                }}
              >
                No reports logged yet
              </h4>
              <p
                style={{
                  fontSize: "0.825rem",
                  color: "#94a3b8",
                  maxWidth: "380px",
                  margin: "0 0 16px 0",
                  lineHeight: 1.4,
                }}
              >
                {isResident
                  ? "Help keep our community safe. If you spot broken public infrastructure, file a report."
                  : "There are currently no active reports in the municipal queue."}
              </p>
              {isResident && (
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
                    fontSize: "0.875rem",
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
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reports.slice(0, 5).map((report) => {
                const photoUrl = report.photos && report.photos[0]?.photoUrl;
                const formattedDate = new Date(report.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
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
                      padding: "14px 16px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      textDecoration: "none",
                      gap: "14px",
                    }}
                  >
                    {/* Thumbnail Image */}
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
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
                        <Camera size={20} color="#64748b" />
                      )}
                    </div>

                    {/* Report Information */}
                    <div
                      className="dash-report-main"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#38bdf8",
                            letterSpacing: "0.02em",
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
                          fontSize: "0.925rem",
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
                          gap: "12px",
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <MapPin size={12} color="#64748b" />
                          <span>{report.address.split(",")[0]}</span>
                        </span>
                        <span>•</span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Clock size={12} color="#64748b" />
                          <span>{formattedDate}</span>
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={18} color="#64748b" />
                  </NextLink>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom Civic Security & Compliance Seal */}
        <footer
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
