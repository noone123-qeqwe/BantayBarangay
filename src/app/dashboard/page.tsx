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
  Building2,
  AlertCircle,
  Camera,
  User,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  const isStaff = user && ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(user.role);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, loading]);

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

  if (loading || (!user && fetching)) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "100px 20px" }}>
        <img
          src="/logo.png"
          alt="BantayBarangay"
          width={64}
          height={64}
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "18px",
            margin: "0 auto 16px auto",
            display: "block",
            boxShadow: "0 8px 24px rgba(2, 132, 199, 0.35)",
            objectFit: "contain",
          }}
        />
        <div style={{ fontSize: "1.1rem", color: "var(--text-muted)", fontWeight: 600 }}>
          Loading your community dashboard...
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Counters
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => ["SUBMITTED", "RECEIVED", "UNDER_REVIEW"].includes(r.status)).length;
  const inProgressCount = reports.filter((r) => ["ASSIGNED", "IN_PROGRESS"].includes(r.status)).length;
  const resolvedCount = reports.filter((r) => ["RESOLVED", "CLOSED"].includes(r.status)).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Staff category buckets (Section 22)
  const staffNeedsAttention = reports.filter((r) =>
    ["SUBMITTED", "UNDER_REVIEW", "REOPENED"].includes(r.status)
  );
  const staffCritical = reports.filter((r) =>
    r.priority === "CRITICAL" && !["CLOSED", "RESOLVED", "REJECTED"].includes(r.status)
  );
  const staffNewReports = reports.filter((r) => r.status === "SUBMITTED");
  const staffOverdue = reports.filter(
    (r) =>
      r.slaDeadline &&
      new Date(r.slaDeadline) < new Date() &&
      !["CLOSED", "RESOLVED", "REJECTED"].includes(r.status)
  );

  return (
    <div className="page-container">
      {/* 1. TOP SECTION (Section 8) */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
          {getGreeting()}, {user.name.split(" ")[0]}!
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.063rem", marginTop: "4px" }}>
          Help keep our community safe and better.
        </p>
      </div>

      {/* Announcements Banner */}
      {announcements.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          {announcements.slice(0, 1).map((ann) => (
            <div
              key={ann.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "16px 20px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: ann.priority === "URGENT" ? "var(--danger-light)" : "var(--primary-light)",
                border: `1.5px solid ${ann.priority === "URGENT" ? "rgba(239, 68, 68, 0.3)" : "rgba(2, 132, 199, 0.25)"}`,
                color: ann.priority === "URGENT" ? "var(--danger-dark)" : "var(--primary-dark)",
              }}
            >
              <Megaphone size={22} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "0.938rem", display: "block" }}>{ann.title}</strong>
                <span style={{ fontSize: "0.813rem", opacity: 0.9 }}>{ann.content}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. RESIDENT VIEW (Section 8) */}
      {!isStaff ? (
        <>
          {/* DOMINANT ACTION: Report an Issue CTA */}
          <div style={{ marginBottom: "24px" }}>
            <NextLink
              href="/reports/new"
              className="card card-interactive"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "22px 24px",
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0d9488 100%)",
                color: "#ffffff",
                borderRadius: "20px",
                textDecoration: "none",
                boxShadow: "0 10px 25px rgba(2, 132, 199, 0.35)",
                border: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "16px",
                    backgroundColor: "rgba(255, 255, 255, 0.22)",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <PlusCircle size={28} color="#ffffff" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "-0.01em" }}>
                    📍 Report an Issue
                  </h2>
                  <p style={{ fontSize: "0.875rem", margin: "3px 0 0 0", color: "rgba(255, 255, 255, 0.92)", lineHeight: 1.35 }}>
                    Potholes, broken streetlights, clogged canals, or hazardous wires
                  </p>
                </div>
              </div>

              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginLeft: "8px",
                }}
              >
                <ChevronRight size={20} color="#ffffff" />
              </div>
            </NextLink>
          </div>

          {/* QUICK ACCESS (My Reports, Map, Notifications, Profile) */}
          <div style={{ marginBottom: "28px" }}>
            <h3 style={{ fontSize: "1.063rem", fontWeight: 800, marginBottom: "12px", color: "var(--text-primary)" }}>
              Quick Access
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "10px",
              }}
            >
              <NextLink
                href="/reports"
                className="card card-interactive"
                style={{
                  padding: "14px 8px",
                  textAlign: "center",
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText size={20} />
                </div>
                <strong style={{ fontSize: "0.813rem", color: "var(--text-primary)" }}>My Reports</strong>
                <span style={{ fontSize: "0.688rem", color: "var(--text-muted)" }}>{totalCount} filed</span>
              </NextLink>

              <NextLink
                href="/map"
                className="card card-interactive"
                style={{
                  padding: "14px 8px",
                  textAlign: "center",
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    color: "var(--success-dark)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MapPin size={20} />
                </div>
                <strong style={{ fontSize: "0.813rem", color: "var(--text-primary)" }}>Map</strong>
                <span style={{ fontSize: "0.688rem", color: "var(--text-muted)" }}>Live Pins</span>
              </NextLink>

              <NextLink
                href="/notifications"
                className="card card-interactive"
                style={{
                  padding: "14px 8px",
                  textAlign: "center",
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(245, 158, 11, 0.12)",
                    color: "var(--warning-dark)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bell size={20} />
                </div>
                <strong style={{ fontSize: "0.813rem", color: "var(--text-primary)" }}>Alerts</strong>
                <span style={{ fontSize: "0.688rem", color: "var(--text-muted)" }}>Updates</span>
              </NextLink>

              <NextLink
                href="/profile"
                className="card card-interactive"
                style={{
                  padding: "14px 8px",
                  textAlign: "center",
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(99, 102, 241, 0.12)",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={20} />
                </div>
                <strong style={{ fontSize: "0.813rem", color: "var(--text-primary)" }}>Profile</strong>
                <span style={{ fontSize: "0.688rem", color: "var(--text-muted)" }}>Settings</span>
              </NextLink>
            </div>
          </div>

          {/* REPORT OVERVIEW (Total, Pending, In Progress, Resolved) */}
          <div style={{ marginBottom: "36px" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, marginBottom: "14px", color: "var(--text-primary)" }}>
              Report Overview
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "14px",
              }}
            >
              <div className="card card-accent-blue" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Total
                  </div>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Layers size={16} />
                  </div>
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
                  {totalCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  All filed cases
                </div>
              </div>

              <div className="card card-accent-amber" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Pending
                  </div>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", backgroundColor: "var(--accent-light)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Clock size={16} />
                  </div>
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)", marginTop: "4px" }}>
                  {pendingCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Awaiting review
                </div>
              </div>

              <div className="card card-accent-purple" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    In Progress
                  </div>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", backgroundColor: "rgba(99, 102, 241, 0.12)", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity size={16} />
                  </div>
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#6366f1", marginTop: "4px" }}>
                  {inProgressCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Field work active
                </div>
              </div>

              <div className="card card-accent-emerald" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--status-resolved-dark)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Resolved
                  </div>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", backgroundColor: "var(--status-resolved-bg)", color: "var(--status-resolved)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--status-resolved-dark)", marginTop: "4px" }}>
                  {resolvedCount}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Fixed & closed
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* 3. STAFF DASHBOARD (Section 22) */
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Operational Incident Control
            </h2>
            <NextLink href="/reports/new" className="btn btn-primary btn-sm">
              <PlusCircle size={16} />
              <span>Log Dispatch</span>
            </NextLink>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            {/* Needs Attention */}
            <div
              className="card"
              style={{
                padding: "20px",
                borderLeft: "4px solid var(--warning)",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--warning-dark)", textTransform: "uppercase" }}>
                Needs Attention
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--warning-dark)", marginTop: "4px" }}>
                {staffNeedsAttention.length}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Action or verification required
              </div>
            </div>

            {/* Critical Issues */}
            <div
              className="card"
              style={{
                padding: "20px",
                borderLeft: "4px solid var(--danger)",
                backgroundColor: staffCritical.length > 0 ? "rgba(239, 68, 68, 0.04)" : "var(--bg-card)",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--danger)", textTransform: "uppercase" }}>
                Critical Issues
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--danger)", marginTop: "4px" }}>
                {staffCritical.length}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                High-risk community threats
              </div>
            </div>

            {/* New Reports */}
            <div
              className="card"
              style={{
                padding: "20px",
                borderLeft: "4px solid var(--primary)",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase" }}>
                New Reports
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--primary)", marginTop: "4px" }}>
                {staffNewReports.length}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Recently submitted
              </div>
            </div>

            {/* Overdue */}
            <div
              className="card"
              style={{
                padding: "20px",
                borderLeft: "4px solid var(--accent)",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--danger-dark)", textTransform: "uppercase" }}>
                Overdue
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--danger-dark)", marginTop: "4px" }}>
                {staffOverdue.length}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Exceeded SLA target
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. RECENT REPORTS (Section 8: Modern report cards instead of cluttered tables) */}
      <div style={{ marginBottom: "36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)" }}>
            Recent Reports
          </h3>
          <NextLink
            href="/reports"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: "var(--primary)",
            }}
          >
            <span>View All</span>
            <ChevronRight size={16} />
          </NextLink>
        </div>

        {reports.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <FileText size={42} style={{ margin: "0 auto 12px auto", opacity: 0.5 }} />
            <h4 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>
              No reports logged yet
            </h4>
            <p style={{ fontSize: "0.875rem", maxWidth: "400px", margin: "6px auto 20px auto" }}>
              Help keep our community safe and better. If you spot broken public infrastructure, file a report.
            </p>
            <NextLink href="/reports/new" className="btn btn-primary">
              <PlusCircle size={18} />
              <span>Report First Issue</span>
            </NextLink>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {reports.slice(0, 5).map((report) => {
              const photoUrl = report.photos && report.photos[0]?.photoUrl;
              const formattedDate = new Date(report.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <NextLink
                  key={report.id}
                  href={`/reports/${report.referenceNo}`}
                  className="card card-interactive"
                  style={{
                    display: "flex",
                    padding: "16px 18px",
                    gap: "16px",
                    alignItems: "center",
                    textDecoration: "none",
                  }}
                >
                  {/* Photo Thumbnail */}
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-subtle)",
                      overflow: "hidden",
                      flexShrink: 0,
                      border: "1px solid var(--border-medium)",
                    }}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={report.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--text-muted)",
                        }}
                      >
                        <Camera size={24} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--primary)",
                        }}
                      >
                        {report.referenceNo}
                      </span>
                      <StatusBadge status={report.status} size="sm" />
                      <PriorityBadge priority={report.priority} />
                    </div>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "0.938rem",
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {report.title}
                    </strong>

                    <p
                      style={{
                        fontSize: "0.813rem",
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginTop: "2px",
                      }}
                    >
                      {report.description}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginTop: "6px",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={12} />
                        {report.address.split(",")[0]}
                      </span>
                      <span>•</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} />
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </NextLink>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
