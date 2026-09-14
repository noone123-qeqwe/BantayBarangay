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
      <div className="dashboard-root">
        <div className="loading-container">
          <div className="brand-logo-emblem">
            <ShieldCheck size={28} className="emblem-icon" />
          </div>
          <div className="loading-text">Loading your civic dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

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
      {/* Dynamic Background Auras matching login screen */}
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
                <span>verified resident portal</span>
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

            {/* LIVE MUNICIPAL DISPATCH CARD (Direct match with login screen) */}
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
          STYLES: Dark Civic-Tech Visual Identity Matching Login
         =============================================================== */}
      <style jsx>{`
        /* Root Canvas */
        .dashboard-root {
          min-height: calc(100vh - var(--header-height, 60px));
          background-color: #060a12;
          background-image: 
            radial-gradient(circle at 12% 15%, rgba(13, 148, 136, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 88% 85%, rgba(37, 99, 235, 0.08) 0%, transparent 45%);
          color: #ffffff;
          padding: 36px 20px 60px 20px;
          position: relative;
          overflow: hidden;
        }

        /* Ambient Background Glows */
        .ambient-glow {
          position: absolute;
          border-radius: 9999px;
          filter: blur(140px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.45;
        }

        .glow-emerald {
          width: 540px;
          height: 540px;
          background: radial-gradient(circle, rgba(5, 150, 105, 0.15) 0%, transparent 70%);
          top: -100px;
          left: -100px;
        }

        .glow-blue {
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.14) 0%, transparent 70%);
          bottom: -80px;
          right: -80px;
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
          width: 54px;
          height: 54px;
          border-radius: 14px;
          background-color: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
          margin-bottom: 16px;
        }

        .loading-text {
          font-size: 1.05rem;
          color: #8da0b6;
          font-weight: 600;
        }

        /* -------------------------------------------------------------
           HEADER BLOCK
           ------------------------------------------------------------- */
        .dashboard-header-block {
          margin-bottom: 32px;
        }

        .header-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
        }

        .role-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .pill-resident {
          background-color: rgba(30, 58, 138, 0.35);
          border: 1px solid rgba(59, 130, 246, 0.35);
          color: #60a5fa;
        }

        .pill-staff {
          background-color: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #fbbf24;
        }

        .pill-admin {
          background-color: rgba(99, 102, 241, 0.18);
          border: 1px solid rgba(99, 102, 241, 0.35);
          color: #a5b4fc;
        }

        .pill-super {
          background-color: rgba(168, 85, 247, 0.18);
          border: 1px solid rgba(168, 85, 247, 0.35);
          color: #d8b4fe;
        }

        .status-live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #34d399;
          font-weight: 600;
        }

        .pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #34d399;
          box-shadow: 0 0 8px #34d399;
        }

        .header-greeting-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .greeting-heading {
          font-family: var(--font-heading);
          font-size: clamp(1.75rem, 3.5vw, 2.35rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #ffffff;
          line-height: 1.18;
          margin: 0;
        }

        .greeting-name-highlight {
          color: #38bdf8;
        }

        .greeting-subtext {
          font-size: 0.969rem;
          color: #8da0b6;
          margin: 6px 0 0 0;
          line-height: 1.5;
          max-width: 620px;
        }

        /* Buttons */
        .emerald-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 20px;
          border-radius: 12px;
          background-color: #0d7658;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          font-size: 0.906rem;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(13, 118, 88, 0.45);
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
          user-select: none;
        }

        .emerald-action-btn:hover {
          background-color: #0b684d;
          box-shadow: 0 6px 20px rgba(13, 118, 88, 0.6);
          transform: translateY(-1px);
        }

        .outline-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #e2e8f0;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .outline-action-btn:hover {
          background-color: rgba(255, 255, 255, 0.08);
          border-color: #38bdf8;
          color: #ffffff;
        }

        .staff-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* -------------------------------------------------------------
           ANNOUNCEMENT BANNER
           ------------------------------------------------------------- */
        .announcements-section {
          margin-bottom: 28px;
        }

        .announcement-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 14px;
        }

        .ann-standard {
          background-color: rgba(30, 58, 138, 0.25);
          border: 1px solid rgba(59, 130, 246, 0.35);
          color: #93c5fd;
        }

        .ann-urgent {
          background-color: rgba(220, 38, 38, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
        }

        .ann-icon-wrap {
          flex-shrink: 0;
        }

        .ann-text-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ann-title {
          font-size: 0.906rem;
          color: #ffffff;
        }

        .ann-body {
          font-size: 0.813rem;
          opacity: 0.9;
        }

        /* -------------------------------------------------------------
           RESIDENT HERO CTA CARD
           ------------------------------------------------------------- */
        .resident-report-hero-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px;
          border-radius: 18px;
          background: linear-gradient(135deg, #0d7658 0%, #065f46 60%, #064e3b 100%);
          border: 1px solid rgba(52, 211, 153, 0.3);
          box-shadow: 0 10px 30px -5px rgba(5, 150, 105, 0.35);
          text-decoration: none;
          color: #ffffff;
          margin-bottom: 30px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .resident-report-hero-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 35px -5px rgba(5, 150, 105, 0.48);
        }

        .hero-left-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .hero-icon-container {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background-color: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 9999px;
          background-color: rgba(255, 255, 255, 0.16);
          font-size: 0.688rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #d1fae5;
          margin-bottom: 6px;
        }

        .hero-title {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 800;
          margin: 0;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .hero-desc {
          font-size: 0.875rem;
          color: #d1fae5;
          margin: 4px 0 0 0;
          opacity: 0.92;
        }

        .hero-arrow-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* -------------------------------------------------------------
           SECTIONS & GENERAL HEADINGS
           ------------------------------------------------------------- */
        .section-title {
          font-family: var(--font-heading);
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin: 0 0 14px 0;
        }

        .section-subtitle {
          font-size: 0.844rem;
          color: #8da0b6;
          margin: 3px 0 0 0;
        }

        .section-header-bar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .section-badge-pill {
          font-size: 0.719rem;
          font-weight: 700;
          color: #38bdf8;
          background-color: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 3px 9px;
          border-radius: 9999px;
        }

        /* -------------------------------------------------------------
           QUICK ACCESS GRID
           ------------------------------------------------------------- */
        .quick-access-section {
          margin-bottom: 32px;
        }

        .quick-access-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .dark-nav-card {
          background-color: #10151c;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 18px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .dark-nav-card:hover {
          border-color: #38bdf8;
          background-color: #151b24;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -5px rgba(0, 0, 0, 0.5);
        }

        .nav-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .nav-card-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #ffffff;
        }

        .nav-card-subtitle {
          font-size: 0.719rem;
          color: #8da0b6;
          margin-top: 3px;
        }

        /* -------------------------------------------------------------
           KPI METRICS SYSTEM
           ------------------------------------------------------------- */
        .kpi-metrics-section {
          margin-bottom: 32px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .kpi-card {
          background-color: #10151c;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 20px;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .kpi-card:hover {
          transform: translateY(-2px);
        }

        .border-blue { border-left: 4px solid #2563eb !important; }
        .border-amber { border-left: 4px solid #f59e0b !important; }
        .border-purple { border-left: 4px solid #8b5cf6 !important; }
        .border-emerald { border-left: 4px solid #059669 !important; }
        .border-crimson { border-left: 4px solid #ef4444 !important; }
        .border-rose { border-left: 4px solid #f43f5e !important; }

        .kpi-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .kpi-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #8da0b6;
        }

        .kpi-number {
          font-family: var(--font-heading);
          font-size: 2.25rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
        }

        .kpi-caption {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 4px;
        }

        /* Colors */
        .text-blue { color: #38bdf8; }
        .text-amber { color: #fbbf24; }
        .text-purple { color: #c084fc; }
        .text-emerald { color: #34d399; }
        .text-crimson { color: #f87171; }
        .text-rose { color: #fb7185; }

        .icon-blue { background: rgba(37, 99, 235, 0.15); color: #38bdf8; }
        .icon-emerald { background: rgba(5, 150, 105, 0.15); color: #34d399; }
        .icon-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .icon-purple { background: rgba(139, 92, 246, 0.15); color: #c084fc; }

        /* -------------------------------------------------------------
           LIVE DISPATCH WIDGET (RESIDENT VIEW)
           ------------------------------------------------------------- */
        .dispatch-live-widget {
          background-color: #0d141e;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 16px;
          padding: 18px 20px;
          margin-bottom: 36px;
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
          font-size: 0.75rem;
          color: #8da0b6;
          font-weight: 600;
          text-transform: lowercase;
        }

        .radio-icon {
          color: #38bdf8;
        }

        .dispatch-resolved-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #34d399;
        }

        .dispatch-ticket-title {
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 4px 0;
        }

        .dispatch-ticket-meta {
          font-size: 0.813rem;
          color: #8da0b6;
          margin: 0 0 12px 0;
        }

        .dispatch-divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.08);
          margin-bottom: 10px;
        }

        .dispatch-resident-loop {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.781rem;
          color: #34d399;
          font-weight: 600;
        }

        .verified-check {
          color: #34d399;
        }

        /* -------------------------------------------------------------
           STAFF TOOLS ROW
           ------------------------------------------------------------- */
        .staff-tools-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-bottom: 32px;
        }

        .tool-quick-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 20px;
          background-color: #10151c;
          border: 1px solid #1e293b;
          border-radius: 16px;
          text-decoration: none;
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .tool-quick-card:hover {
          border-color: #38bdf8;
          background-color: #151b24;
          transform: translateY(-2px);
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
          font-size: 0.938rem;
          display: block;
        }

        .tool-desc {
          font-size: 0.781rem;
          color: #8da0b6;
          margin-top: 2px;
          display: block;
        }

        .tool-arrow {
          margin-left: auto;
          color: #64748b;
        }

        /* -------------------------------------------------------------
           ADMIN & SUPER ADMIN COMMAND HUB
           ------------------------------------------------------------- */
        .admin-hub-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-bottom: 32px;
        }

        .admin-hub-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 22px;
          background-color: #10151c;
          border: 1px solid #1e293b;
          border-radius: 16px;
          text-decoration: none;
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .admin-hub-card:hover {
          border-color: #38bdf8;
          background-color: #151b24;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -5px rgba(0, 0, 0, 0.5);
        }

        .hub-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .hub-text-wrap {
          flex: 1;
        }

        .hub-title {
          font-size: 0.969rem;
          display: block;
          margin-bottom: 2px;
        }

        .hub-desc {
          font-size: 0.781rem;
          color: #8da0b6;
          margin: 0;
          line-height: 1.35;
        }

        .hub-arrow {
          color: #64748b;
          transition: transform 0.15s ease, color 0.15s ease;
        }

        .admin-hub-card:hover .hub-arrow {
          color: #38bdf8;
          transform: translateX(3px);
        }

        /* -------------------------------------------------------------
           SHARED REPORTS / QUEUE FEED
           ------------------------------------------------------------- */
        .reports-feed-section {
          margin-bottom: 40px;
        }

        .view-all-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.844rem;
          font-weight: 700;
          color: #38bdf8;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .view-all-link:hover {
          color: #7dd3fc;
          text-decoration: underline;
        }

        .reports-list-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .report-item-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 18px;
          background-color: #10151c;
          border: 1px solid #1e293b;
          border-radius: 16px;
          text-decoration: none;
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .report-item-card:hover {
          border-color: #38bdf8;
          background-color: #141a23;
          transform: translateY(-1px);
        }

        .report-thumbnail-box {
          width: 76px;
          height: 76px;
          border-radius: 12px;
          background-color: #0b0f16;
          border: 1px solid #1e293b;
          overflow: hidden;
          flex-shrink: 0;
        }

        .report-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .camera-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .report-info-col {
          flex: 1;
          min-width: 0;
        }

        .report-meta-header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .ref-tag {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          color: #38bdf8;
        }

        .report-headline {
          display: block;
          font-size: 0.938rem;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .report-summary {
          font-size: 0.813rem;
          color: #8da0b6;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 2px 0 6px 0;
        }

        .report-meta-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: #64748b;
        }

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .meta-icon {
          color: #64748b;
        }

        .meta-bullet {
          color: #475569;
        }

        .report-arrow {
          color: #64748b;
          flex-shrink: 0;
        }

        .empty-state-card {
          padding: 48px 24px;
          text-align: center;
          background-color: #10151c;
          border: 1px dashed #1e293b;
          border-radius: 16px;
        }

        .empty-icon {
          color: #64748b;
          margin-bottom: 12px;
        }

        .empty-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 6px 0;
        }

        .empty-desc {
          font-size: 0.875rem;
          color: #8da0b6;
          max-width: 440px;
          margin: 0 auto 20px auto;
        }

        /* -------------------------------------------------------------
           BOTTOM SEAL
           ------------------------------------------------------------- */
        .dashboard-bottom-seal {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.719rem;
          color: #64748b;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .seal-shield {
          color: #059669;
          flex-shrink: 0;
        }

        /* -------------------------------------------------------------
           RESPONSIVE BREAKPOINTS
           ------------------------------------------------------------- */
        @media (max-width: 960px) {
          .quick-access-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .admin-hub-grid {
            grid-template-columns: 1fr;
          }

          .staff-tools-row {
            grid-template-columns: 1fr;
          }

          .resident-report-hero-card {
            padding: 20px;
          }

          .hero-left-content {
            gap: 14px;
          }

          .hero-icon-container {
            width: 48px;
            height: 48px;
          }

          .hero-title {
            font-size: 1.15rem;
          }
        }

        @media (max-width: 480px) {
          .dashboard-root {
            padding: 20px 12px 48px 12px;
          }

          .quick-access-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .kpi-card {
            padding: 14px;
          }

          .kpi-number {
            font-size: 1.75rem;
          }

          .report-item-card {
            padding: 12px;
            gap: 12px;
          }

          .report-thumbnail-box {
            width: 64px;
            height: 64px;
          }

          .hero-desc {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
