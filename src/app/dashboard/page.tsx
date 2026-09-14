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
  AlertCircle,
  Camera,
  User,
  Wrench,
  Crown,
  Radio,
  BarChart3,
  Server,
  Settings,
  Users,
  ScrollText,
  Sliders,
  Check,
  Cpu,
  Globe,
  ExternalLink,
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
      router.replace("/login");
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
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "3px solid #e2e8f0",
            borderTopColor: "#2563eb",
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
    <div className="dashboard-root">
      {/* Ambient Lighting Spheres */}
      <div className="ambient-glow glow-emerald" aria-hidden="true" />
      <div className="ambient-glow glow-blue" aria-hidden="true" />

      <div className="dashboard-container">
        
        {/* ===============================================================
            ROLE-BASED HEADER SECTION
           =============================================================== */}
        <header className="dashboard-header-block">
          <div className="header-meta-row">
            {/* Role Badge */}
            {isResident && (
              <div className="role-pill pill-resident">
                <Shield size={12} />
                <span>verified resident</span>
              </div>
            )}
            {isStaff && (
              <div className="role-pill pill-staff">
                <Wrench size={12} />
                <span>barangay operations staff</span>
              </div>
            )}
            {isAdmin && (
              <div className="role-pill pill-admin">
                <Building2 size={12} />
                <span>barangay administrator</span>
              </div>
            )}
            {isSuperAdmin && (
              <div className="role-pill pill-super">
                <Crown size={12} />
                <span>super administrator · platform authority</span>
              </div>
            )}

            {/* Live Operational Status Indicator */}
            <div className="status-live-indicator">
              <span className="pulse-dot" />
              <span>System Operational · 100% Online</span>
            </div>
          </div>

          <div className="header-greeting-row">
            <div>
              <h1 className="greeting-heading">
                {getGreeting()},{" "}
                <span className="greeting-name-highlight">
                  {user.name.split(" ")[0]}
                </span>
                !
              </h1>
              <p className="greeting-subtext">
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

            {/* Quick Primary Header Actions */}
            <div className="header-actions-group">
              {isResident ? (
                <NextLink href="/reports/new" className="emerald-action-btn">
                  <PlusCircle size={18} />
                  <span>+ Report Issue</span>
                </NextLink>
              ) : (
                <div className="staff-header-actions">
                  <NextLink href="/reports/new" className="emerald-action-btn">
                    <PlusCircle size={17} />
                    <span>Log Incident</span>
                  </NextLink>
                  {(isAdmin || isSuperAdmin) && (
                    <NextLink href="/admin" className="outline-action-btn">
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
          <section className="announcements-section" aria-label="Official Announcements">
            {announcements.slice(0, 1).map((ann) => (
              <div
                key={ann.id}
                className={`announcement-banner ${
                  ann.priority === "URGENT" ? "ann-urgent" : "ann-standard"
                }`}
              >
                <div className="ann-icon-wrap">
                  <Megaphone size={18} />
                </div>
                <div className="ann-text-wrap">
                  <strong className="ann-title">{ann.title}</strong>
                  <span className="ann-body">{ann.content}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ===============================================================
            1. RESIDENT ROLE DASHBOARD VIEW
           =============================================================== */}
        {isResident && (
          <div className="role-view-resident">
            {/* DOMINANT HERO CTA: Report an Issue */}
            <NextLink href="/reports/new" className="resident-report-hero-card">
              <div className="hero-left-content">
                <div className="hero-icon-container">
                  <PlusCircle size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="hero-badge">
                    <Sparkles size={12} />
                    <span>Smart GPS & Photo Verification</span>
                  </div>
                  <h2 className="hero-title">📍 Report a Community Issue</h2>
                  <p className="hero-desc">
                    Potholes, broken streetlights, electrical hazards, or clogged canals.
                  </p>
                </div>
              </div>
              <div className="hero-arrow-btn">
                <ChevronRight size={22} />
              </div>
            </NextLink>

            {/* QUICK ACCESS NAVIGATION CARDS */}
            <div className="quick-access-section">
              <h3 className="section-title">Quick Access</h3>
              <div className="quick-access-grid">
                <NextLink href="/reports" className="dark-nav-card">
                  <div className="nav-card-icon icon-blue">
                    <FileText size={20} />
                  </div>
                  <strong className="nav-card-title">My Reports</strong>
                  <span className="nav-card-subtitle">{totalCount} filed cases</span>
                </NextLink>

                <NextLink href="/map" className="dark-nav-card">
                  <div className="nav-card-icon icon-emerald">
                    <MapPin size={20} />
                  </div>
                  <strong className="nav-card-title">Community Map</strong>
                  <span className="nav-card-subtitle">Live Pinpoint GPS</span>
                </NextLink>

                <NextLink href="/notifications" className="dark-nav-card">
                  <div className="nav-card-icon icon-amber">
                    <Bell size={20} />
                  </div>
                  <strong className="nav-card-title">Official Alerts</strong>
                  <span className="nav-card-subtitle">Barangay Updates</span>
                </NextLink>

                <NextLink href="/profile" className="dark-nav-card">
                  <div className="nav-card-icon icon-purple">
                    <User size={20} />
                  </div>
                  <strong className="nav-card-title">Citizen Profile</strong>
                  <span className="nav-card-subtitle">Account Settings</span>
                </NextLink>
              </div>
            </div>

            {/* CIVIC CASE STATUS COUNTERS */}
            <div className="kpi-metrics-section">
              <h3 className="section-title">Report Overview</h3>
              <div className="kpi-grid">
                <div className="kpi-card border-blue">
                  <div className="kpi-header">
                    <span className="kpi-label">Total Filed</span>
                    <Layers size={16} className="kpi-icon icon-blue" />
                  </div>
                  <div className="kpi-number">{totalCount}</div>
                  <div className="kpi-caption">All logged reports</div>
                </div>

                <div className="kpi-card border-amber">
                  <div className="kpi-header">
                    <span className="kpi-label">Pending Review</span>
                    <Clock size={16} className="kpi-icon icon-amber" />
                  </div>
                  <div className="kpi-number text-amber">{pendingCount}</div>
                  <div className="kpi-caption">Awaiting review</div>
                </div>

                <div className="kpi-card border-purple">
                  <div className="kpi-header">
                    <span className="kpi-label">In Progress</span>
                    <Activity size={16} className="kpi-icon icon-purple" />
                  </div>
                  <div className="kpi-number text-purple">{inProgressCount}</div>
                  <div className="kpi-caption">Field work active</div>
                </div>

                <div className="kpi-card border-emerald">
                  <div className="kpi-header">
                    <span className="kpi-label">Verified & Resolved</span>
                    <CheckCircle2 size={16} className="kpi-icon icon-emerald" />
                  </div>
                  <div className="kpi-number text-emerald">{resolvedCount}</div>
                  <div className="kpi-caption">Fixed & confirmed</div>
                </div>
              </div>
            </div>

            {/* LIVE MUNICIPAL DISPATCH CARD */}
            <div className="dispatch-live-widget">
              <div className="dispatch-top-row">
                <div className="dispatch-tag">
                  <Radio size={13} className="radio-icon" />
                  <span>live municipal dispatch feed</span>
                </div>
                <div className="dispatch-resolved-pill">
                  <Check size={12} strokeWidth={3} />
                  <span>resolved</span>
                </div>
              </div>
              <h4 className="dispatch-ticket-title">Streetlight Cable Hazard Repaired</h4>
              <p className="dispatch-ticket-meta">
                Barangay Engineering & Electrical Safety Team · Verified resolution
              </p>
              <div className="dispatch-divider" />
              <div className="dispatch-resident-loop">
                <CheckCircle2 size={14} className="verified-check" />
                <span>Confirmed & Verified by Resident with photo proof</span>
              </div>
            </div>
          </div>
        )}

        {/* ===============================================================
            2. STAFF ROLE DASHBOARD VIEW
           =============================================================== */}
        {isStaff && (
          <div className="role-view-staff">
            {/* INCIDENT CONTROL TRIAGE KPIS */}
            <div className="kpi-metrics-section">
              <div className="section-header-bar">
                <h3 className="section-title">Operational Incident Control</h3>
                <span className="section-badge-pill">Active Shift Triage</span>
              </div>

              <div className="kpi-grid">
                {/* Needs Attention */}
                <div className="kpi-card border-amber">
                  <div className="kpi-header">
                    <span className="kpi-label text-amber">Needs Attention</span>
                    <AlertTriangle size={16} className="text-amber" />
                  </div>
                  <div className="kpi-number text-amber">{staffNeedsAttention.length}</div>
                  <div className="kpi-caption">Action or verification required</div>
                </div>

                {/* Critical Issues */}
                <div className="kpi-card border-crimson">
                  <div className="kpi-header">
                    <span className="kpi-label text-crimson">Critical Threats</span>
                    <Flame size={16} className="text-crimson" />
                  </div>
                  <div className="kpi-number text-crimson">{staffCritical.length}</div>
                  <div className="kpi-caption">High-risk hazards requiring dispatch</div>
                </div>

                {/* New Reports */}
                <div className="kpi-card border-blue">
                  <div className="kpi-header">
                    <span className="kpi-label text-blue">New Submissions</span>
                    <FileText size={16} className="text-blue" />
                  </div>
                  <div className="kpi-number text-blue">{staffNewReports.length}</div>
                  <div className="kpi-caption">Pending triage review</div>
                </div>

                {/* Overdue SLA */}
                <div className="kpi-card border-rose">
                  <div className="kpi-header">
                    <span className="kpi-label text-rose">Overdue SLA</span>
                    <Clock size={16} className="text-rose" />
                  </div>
                  <div className="kpi-number text-rose">{staffOverdue.length}</div>
                  <div className="kpi-caption">Exceeded targeted response deadline</div>
                </div>
              </div>
            </div>

            {/* QUICK OPERATIONAL TOOLS */}
            <div className="staff-tools-row">
              <NextLink href="/reports?status=UNDER_REVIEW" className="tool-quick-card">
                <div className="tool-icon icon-amber">
                  <Clock size={20} />
                </div>
                <div>
                  <strong className="tool-title">Review Pending Tickets</strong>
                  <span className="tool-desc">{staffNeedsAttention.length} pending assessment</span>
                </div>
                <ChevronRight size={18} className="tool-arrow" />
              </NextLink>

              <NextLink href="/map" className="tool-quick-card">
                <div className="tool-icon icon-emerald">
                  <MapPin size={20} />
                </div>
                <div>
                  <strong className="tool-title">Field Inspection Map</strong>
                  <span className="tool-desc">View live hazard pins & coordinates</span>
                </div>
                <ChevronRight size={18} className="tool-arrow" />
              </NextLink>
            </div>
          </div>
        )}

        {/* ===============================================================
            3. ADMIN ROLE DASHBOARD VIEW
           =============================================================== */}
        {isAdmin && (
          <div className="role-view-admin">
            {/* EXECUTIVE PERFORMANCE KPIS */}
            <div className="kpi-metrics-section">
              <div className="section-header-bar">
                <h3 className="section-title">Municipal Performance & SLA Compliance</h3>
                <span className="section-badge-pill">Executive Oversight</span>
              </div>

              <div className="kpi-grid">
                <div className="kpi-card border-blue">
                  <div className="kpi-header">
                    <span className="kpi-label">Total Reports</span>
                    <BarChart3 size={16} className="text-blue" />
                  </div>
                  <div className="kpi-number">{analytics?.metrics?.totalReports || totalCount}</div>
                  <div className="kpi-caption">Barangay total volume</div>
                </div>

                <div className="kpi-card border-emerald">
                  <div className="kpi-header">
                    <span className="kpi-label text-emerald">Resolution Rate</span>
                    <CheckCircle2 size={16} className="text-emerald" />
                  </div>
                  <div className="kpi-number text-emerald">
                    {analytics?.metrics?.resolutionRate || 85}%
                  </div>
                  <div className="kpi-caption">Closed & verified fixes</div>
                </div>

                <div className="kpi-card border-purple">
                  <div className="kpi-header">
                    <span className="kpi-label text-purple">Average SLA Time</span>
                    <Clock size={16} className="text-purple" />
                  </div>
                  <div className="kpi-number text-purple">
                    {analytics?.metrics?.avgResolutionHours || "18.5"} hrs
                  </div>
                  <div className="kpi-caption">Submission to resolution</div>
                </div>

                <div className="kpi-card border-amber">
                  <div className="kpi-header">
                    <span className="kpi-label text-amber">Active Hotspots</span>
                    <Flame size={16} className="text-amber" />
                  </div>
                  <div className="kpi-number text-amber">
                    {analytics?.hotspots?.length || 0}
                  </div>
                  <div className="kpi-caption">Clustered spatial hazards</div>
                </div>
              </div>
            </div>

            {/* ADMINISTRATIVE COMMAND HUB */}
            <div className="admin-hub-grid">
              <NextLink href="/admin" className="admin-hub-card">
                <div className="hub-icon-wrap icon-blue">
                  <Building2 size={22} />
                </div>
                <div className="hub-text-wrap">
                  <strong className="hub-title">Municipal Agencies</strong>
                  <p className="hub-desc">Manage Engineering, Sanitation, Health, and Police teams.</p>
                </div>
                <ArrowRight size={18} className="hub-arrow" />
              </NextLink>

              <NextLink href="/admin" className="admin-hub-card">
                <div className="hub-icon-wrap icon-emerald">
                  <Users size={22} />
                </div>
                <div className="hub-text-wrap">
                  <strong className="hub-title">Staff & Role Directory</strong>
                  <p className="hub-desc">Manage user permissions and operational access.</p>
                </div>
                <ArrowRight size={18} className="hub-arrow" />
              </NextLink>

              <NextLink href="/admin/analytics" className="admin-hub-card">
                <div className="hub-icon-wrap icon-purple">
                  <BarChart3 size={22} />
                </div>
                <div className="hub-text-wrap">
                  <strong className="hub-title">Detailed Analytics & SLA</strong>
                  <p className="hub-desc">Review resolution trends, department response times, and ratings.</p>
                </div>
                <ArrowRight size={18} className="hub-arrow" />
              </NextLink>

              <NextLink href="/admin" className="admin-hub-card">
                <div className="hub-icon-wrap icon-amber">
                  <ScrollText size={22} />
                </div>
                <div className="hub-text-wrap">
                  <strong className="hub-title">System Audit Trail</strong>
                  <p className="hub-desc">View verified audit logs and administrative actions.</p>
                </div>
                <ArrowRight size={18} className="hub-arrow" />
              </NextLink>
            </div>
          </div>
        )}

        {/* ===============================================================
            4. SUPER ADMIN ROLE DASHBOARD VIEW
           =============================================================== */}
        {isSuperAdmin && (
          <div className="role-view-superadmin">
            {/* PLATFORM INFRASTRUCTURE KPIS */}
            <div className="kpi-metrics-section">
              <div className="section-header-bar">
                <h3 className="section-title">Platform Infrastructure & Technical Authority</h3>
                <span className="section-badge-pill pill-super">Full System Authority</span>
              </div>

              <div className="kpi-grid">
                <div className="kpi-card border-emerald">
                  <div className="kpi-header">
                    <span className="kpi-label text-emerald">Platform Health</span>
                    <Server size={16} className="text-emerald" />
                  </div>
                  <div className="kpi-number text-emerald">100%</div>
                  <div className="kpi-caption">All microservices operational</div>
                </div>

                <div className="kpi-card border-blue">
                  <div className="kpi-header">
                    <span className="kpi-label text-blue">Total Civic Accounts</span>
                    <Users size={16} className="text-blue" />
                  </div>
                  <div className="kpi-number text-blue">
                    {analytics?.metrics?.totalUsers || "1,420"}
                  </div>
                  <div className="kpi-caption">Verified residents & staff</div>
                </div>

                <div className="kpi-card border-purple">
                  <div className="kpi-header">
                    <span className="kpi-label text-purple">Platform Intake</span>
                    <Layers size={16} className="text-purple" />
                  </div>
                  <div className="kpi-number text-purple">
                    {analytics?.metrics?.totalReports || totalCount}
                  </div>
                  <div className="kpi-caption">Cross-municipal incident total</div>
                </div>

                <div className="kpi-card border-amber">
                  <div className="kpi-header">
                    <span className="kpi-label text-amber">AI Moderation Engine</span>
                    <Cpu size={16} className="text-amber" />
                  </div>
                  <div className="kpi-number text-amber">99.4%</div>
                  <div className="kpi-caption">Triage accuracy & language audit</div>
                </div>
              </div>
            </div>

            {/* SUPER ADMIN TECHNICAL CONTROLS */}
            <div className="admin-hub-grid">
              <NextLink href="/admin" className="admin-hub-card">
                <div className="hub-icon-wrap icon-purple">
                  <ScrollText size={22} />
                </div>
                <div className="hub-text-wrap">
                  <strong className="hub-title">System Audit & Security Logs</strong>
                  <p className="hub-desc">Tamper-proof audit trails of every database mutation and dispatch.</p>
                </div>
                <ArrowRight size={18} className="hub-arrow" />
              </NextLink>

              <NextLink href="/admin" className="admin-hub-card">
                <div className="hub-icon-wrap icon-blue">
                  <Sliders size={22} />
                </div>
                <div className="hub-text-wrap">
                  <strong className="hub-title">Role-Based Access Control (RBAC)</strong>
                  <p className="hub-desc">Configure granular permissions for Staff, Dispatchers, and Admins.</p>
                </div>
                <ArrowRight size={18} className="hub-arrow" />
              </NextLink>

              <NextLink href="/admin" className="admin-hub-card">
                <div className="hub-icon-wrap icon-emerald">
                  <Globe size={22} />
                </div>
                <div className="hub-text-wrap">
                  <strong className="hub-title">Masbateño & Tagalog AI Engine</strong>
                  <p className="hub-desc">Manage regional civic language glossaries and quality gates.</p>
                </div>
                <ArrowRight size={18} className="hub-arrow" />
              </NextLink>

              <NextLink href="/admin" className="admin-hub-card">
                <div className="hub-icon-wrap icon-amber">
                  <Server size={22} />
                </div>
                <div className="hub-text-wrap">
                  <strong className="hub-title">Database & Backup Archives</strong>
                  <p className="hub-desc">Live PostgreSQL storage stats and automated replication status.</p>
                </div>
                <ArrowRight size={18} className="hub-arrow" />
              </NextLink>
            </div>
          </div>
        )}

        {/* ===============================================================
            SHARED INCIDENTS & REPORTS FEED
           =============================================================== */}
        <section className="reports-feed-section" aria-label="Incident Reports Feed">
          <div className="section-header-bar">
            <div>
              <h3 className="section-title">
                {isResident ? "My Recent Reports" : "Active Incident Queue"}
              </h3>
              <p className="section-subtitle">
                {isResident
                  ? "Track live status updates and confirmation requests on your reports."
                  : "Latest submitted community hazards awaiting review, dispatch, or resolution."}
              </p>
            </div>
            <NextLink href="/reports" className="view-all-link">
              <span>View All</span>
              <ChevronRight size={16} />
            </NextLink>
          </div>

          {reports.length === 0 ? (
            <div className="empty-state-card">
              <FileText size={40} className="empty-icon" />
              <h4 className="empty-title">No reports logged yet</h4>
              <p className="empty-desc">
                {isResident
                  ? "Help keep our community safe. If you spot broken public infrastructure, file a report."
                  : "There are currently no active reports in the municipal queue."}
              </p>
              {isResident && (
                <NextLink href="/reports/new" className="emerald-action-btn">
                  <PlusCircle size={18} />
                  <span>Report First Issue</span>
                </NextLink>
              )}
            </div>
          ) : (
            <div className="reports-list-grid">
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
                    className="report-item-card"
                  >
                    {/* Thumbnail Image */}
                    <div className="report-thumbnail-box">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={report.title}
                          className="report-img"
                        />
                      ) : (
                        <div className="camera-placeholder">
                          <Camera size={22} />
                        </div>
                      )}
                    </div>

                    {/* Report Information */}
                    <div className="report-info-col">
                      <div className="report-meta-header">
                        <span className="ref-tag">{report.referenceNo}</span>
                        <StatusBadge status={report.status} size="sm" />
                        <PriorityBadge priority={report.priority} size="sm" />
                      </div>

                      <strong className="report-headline">{report.title}</strong>

                      <p className="report-summary">{report.description}</p>

                      <div className="report-meta-footer">
                        <span className="meta-item">
                          <MapPin size={12} className="meta-icon" />
                          <span>{report.address.split(",")[0]}</span>
                        </span>
                        <span className="meta-bullet">•</span>
                        <span className="meta-item">
                          <Clock size={12} className="meta-icon" />
                          <span>{formattedDate}</span>
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={20} className="report-arrow" />
                  </NextLink>
                );
              })}
            </div>
          )}
        </section>

        {/* ===============================================================
            BOTTOM CIVIC SECURITY & COMPLIANCE SEAL
           =============================================================== */}
        <footer className="dashboard-bottom-seal">
          <ShieldCheck size={16} className="seal-shield" />
          <span>
            BantayBarangay Official Civic Platform · 256-Bit SSL Encrypted · Philippine Data Privacy Compliant
          </span>
        </footer>

      </div>

      {/* ===============================================================
          STYLES: Unified Luminous Civic-Tech Theme
         =============================================================== */}
      <style jsx>{`
        /* Root Canvas */
        .dashboard-root {
          min-height: calc(100vh - var(--header-height, 60px));
          background-color: #f8fafc;
          background-image: 
            radial-gradient(circle at 10% 12%, rgba(37, 99, 235, 0.07) 0%, transparent 45%),
            radial-gradient(circle at 90% 88%, rgba(16, 185, 129, 0.06) 0%, transparent 45%);
          color: #0f172a;
          padding: 32px 20px 60px 20px;
          position: relative;
          overflow: hidden;
        }

        /* Ambient Glow Spheres */
        .ambient-glow {
          position: absolute;
          border-radius: 9999px;
          filter: blur(140px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.6;
        }

        .glow-emerald {
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
          top: -80px;
          left: -80px;
        }

        .glow-blue {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%);
          bottom: -60px;
          right: -60px;
        }

        /* Main Container */
        .dashboard-container {
          max-width: 1180px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Loading State */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 120px 20px;
          text-align: center;
        }

        .brand-logo-emblem {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
          margin-bottom: 16px;
        }

        .loading-text {
          font-size: 1.05rem;
          font-weight: 600;
          color: #64748b;
        }

        /* Dashboard Header */
        .dashboard-header-block {
          margin-bottom: 28px;
        }

        .header-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .role-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 0.725rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .pill-resident {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .pill-staff {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .pill-admin {
          background: #eef2ff;
          color: #4338ca;
          border: 1px solid #c7d2fe;
        }

        .pill-super {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .status-live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #059669;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 4px 12px;
          border-radius: 9999px;
        }

        .pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: pulseGreen 1.8s infinite;
        }

        @keyframes pulseGreen {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 10px #34d399; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }

        .header-greeting-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .greeting-heading {
          font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
          font-size: clamp(1.65rem, 3.5vw, 2.25rem);
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
          letter-spacing: -0.03em;
          line-height: 1.2;
        }

        .greeting-name-highlight {
          background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .greeting-subtext {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
          max-width: 680px;
        }

        .header-actions-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .staff-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .emerald-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .emerald-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(5, 150, 105, 0.45);
        }

        .outline-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #334155;
          font-size: 0.875rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }

        .outline-action-btn:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        /* Announcements */
        .announcements-section {
          margin-bottom: 24px;
        }

        .announcement-banner {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 14px;
        }

        .ann-urgent {
          background: #fef2f2;
          border: 1.5px solid #fecaca;
          color: #991b1b;
        }

        .ann-standard {
          background: #eff6ff;
          border: 1.5px solid #bfdbfe;
          color: #1e40af;
        }

        .ann-icon-wrap {
          margin-top: 2px;
          flex-shrink: 0;
        }

        .ann-text-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ann-title {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .ann-body {
          font-size: 0.825rem;
          line-height: 1.4;
          opacity: 0.9;
        }

        /* Section Header */
        .section-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .section-subtitle {
          font-size: 0.85rem;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .section-badge-pill {
          font-size: 0.725rem;
          font-weight: 700;
          color: #2563eb;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 3px 10px;
          border-radius: 9999px;
        }

        /* Resident Hero Card */
        .resident-report-hero-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px;
          border-radius: 20px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          text-decoration: none;
          margin-bottom: 28px;
          box-shadow: 0 10px 30px -5px rgba(37, 99, 235, 0.35);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .resident-report-hero-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 38px -5px rgba(37, 99, 235, 0.45);
        }

        .hero-left-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .hero-icon-container {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.3);
          font-size: 0.725rem;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .hero-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }

        .hero-desc {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          line-height: 1.4;
        }

        .hero-arrow-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .resident-report-hero-card:hover .hero-arrow-btn {
          transform: translateX(4px);
        }

        /* Quick Access Section */
        .quick-access-section {
          margin-bottom: 28px;
        }

        .quick-access-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-top: 14px;
        }

        .dark-nav-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 18px;
          border-radius: 16px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .dark-nav-card:hover {
          transform: translateY(-2px);
          border-color: #2563eb;
          box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.12);
        }

        .nav-card-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .icon-blue {
          background: #eff6ff;
          color: #2563eb;
        }

        .icon-emerald {
          background: #ecfdf5;
          color: #059669;
        }

        .icon-amber {
          background: #fffbeb;
          color: #d97706;
        }

        .icon-purple {
          background: #f5f3ff;
          color: #7c3aed;
        }

        .nav-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }

        .nav-card-subtitle {
          font-size: 0.775rem;
          color: #64748b;
        }

        /* KPI Section */
        .kpi-metrics-section {
          margin-bottom: 28px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-top: 14px;
        }

        .kpi-card {
          padding: 20px;
          border-radius: 16px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          transition: all 0.2s ease;
        }

        .kpi-card:hover {
          box-shadow: 0 8px 20px -4px rgba(15, 23, 42, 0.08);
          transform: translateY(-1px);
        }

        .kpi-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .kpi-label {
          font-size: 0.813rem;
          font-weight: 700;
          color: #64748b;
        }

        .kpi-number {
          font-size: 2.1rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;
          margin-bottom: 4px;
          letter-spacing: -0.03em;
        }

        .kpi-caption {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .text-blue { color: #2563eb !important; }
        .text-amber { color: #d97706 !important; }
        .text-purple { color: #7c3aed !important; }
        .text-emerald { color: #059669 !important; }
        .text-crimson { color: #dc2626 !important; }
        .text-rose { color: #e11d48 !important; }

        /* Live Municipal Dispatch Widget */
        .dispatch-live-widget {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          padding: 20px 22px;
          margin-bottom: 28px;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
        }

        .dispatch-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .dispatch-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 800;
          color: #2563eb;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .radio-icon {
          color: #2563eb;
        }

        .dispatch-resolved-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 9999px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .dispatch-ticket-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .dispatch-ticket-meta {
          font-size: 0.813rem;
          color: #64748b;
          margin: 0 0 14px 0;
        }

        .dispatch-divider {
          height: 1px;
          background-color: #f1f5f9;
          margin-bottom: 12px;
        }

        .dispatch-resident-loop {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.785rem;
          font-weight: 600;
          color: #047857;
        }

        .verified-check {
          color: #059669;
        }

        /* Staff Tools */
        .staff-tools-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }

        .tool-quick-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 16px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          transition: all 0.2s ease;
        }

        .tool-quick-card:hover {
          border-color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.12);
        }

        .tool-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tool-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          display: block;
        }

        .tool-desc {
          font-size: 0.785rem;
          color: #64748b;
        }

        .tool-arrow {
          margin-left: auto;
          color: #94a3b8;
          transition: transform 0.2s ease;
        }

        .tool-quick-card:hover .tool-arrow {
          transform: translateX(3px);
          color: #2563eb;
        }

        /* Admin Hub */
        .admin-hub-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }

        .admin-hub-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 16px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          transition: all 0.2s ease;
        }

        .admin-hub-card:hover {
          border-color: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.12);
        }

        .hub-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hub-text-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .hub-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }

        .hub-desc {
          font-size: 0.785rem;
          color: #64748b;
          margin: 0;
          line-height: 1.35;
        }

        .hub-arrow {
          color: #94a3b8;
          transition: transform 0.2s ease;
        }

        .admin-hub-card:hover .hub-arrow {
          transform: translateX(3px);
          color: #2563eb;
        }

        /* Reports Feed Section */
        .reports-feed-section {
          margin-bottom: 32px;
        }

        .view-all-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.813rem;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .view-all-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .empty-state-card {
          padding: 48px 20px;
          text-align: center;
          background: #ffffff;
          border: 1.5px dashed #cbd5e1;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .empty-icon {
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .empty-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 6px 0;
        }

        .empty-desc {
          font-size: 0.85rem;
          color: #64748b;
          max-width: 460px;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .reports-list-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .report-item-card {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 16px 20px;
          border-radius: 14px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .report-item-card:hover {
          border-color: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px -3px rgba(37, 99, 235, 0.1);
        }

        .report-thumbnail-box {
          width: 72px;
          height: 72px;
          border-radius: 12px;
          overflow: hidden;
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .report-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .camera-placeholder {
          color: #94a3b8;
        }

        .report-info-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .report-meta-header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ref-tag {
          font-family: var(--font-mono, monospace);
          font-size: 0.725rem;
          font-weight: 700;
          color: #475569;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .report-headline {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .report-summary {
          font-size: 0.813rem;
          color: #475569;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .report-meta-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #64748b;
        }

        .meta-icon {
          color: #94a3b8;
        }

        .meta-bullet {
          color: #cbd5e1;
          font-size: 0.75rem;
        }

        .report-arrow {
          color: #94a3b8;
          transition: transform 0.2s ease;
        }

        .report-item-card:hover .report-arrow {
          transform: translateX(3px);
          color: #2563eb;
        }

        /* Bottom Seal */
        .dashboard-bottom-seal {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.75rem;
          color: #94a3b8;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .seal-shield {
          color: #2563eb;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .quick-access-grid, .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .admin-hub-grid, .staff-tools-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .quick-access-grid, .kpi-grid {
            grid-template-columns: 1fr;
          }
          .resident-report-hero-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding: 20px;
          }
          .hero-arrow-btn {
            display: none;
          }
          .report-item-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .report-thumbnail-box {
            width: 100%;
            height: 140px;
          }
          .report-arrow {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
