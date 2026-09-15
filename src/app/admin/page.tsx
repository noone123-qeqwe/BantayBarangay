"use client";

import React, { useEffect, useState, useMemo } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import {
  Users,
  Tags,
  Building2,
  BarChart3,
  ScrollText,
  Megaphone,
  Plus,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Search,
  ShieldCheck,
  ShieldAlert,
  Eye,
  MessageSquare,
  Flag,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Languages,
  Sparkles,
  ArrowUpRight,
  Filter,
  Phone,
  Mail,
  SlidersHorizontal,
} from "lucide-react";
import MasbatenoLanguageTab from "@/components/admin/MasbatenoLanguageTab";

export default function AdminControlPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "verification" | "users" | "categories" | "agencies" | "announcements" | "audit" | "language"
  >("verification");

  // Tab data states
  const [usersList, setUsersList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [agenciesList, setAgenciesList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [moderationQueue, setModerationQueue] = useState<any[]>([]);
  const [moderationTotal, setModerationTotal] = useState(0);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [moderationModal, setModerationModal] = useState<{ reportId: string; action: string } | null>(null);
  const [modReason, setModReason] = useState("");
  const [modFlagType, setModFlagType] = useState("");
  const [modVerifType, setModVerifType] = useState("ADD_DETAILS");
  const [modVerifMessage, setModVerifMessage] = useState("");
  const [modActionLoading, setModActionLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  // Client-side search and filters for clean UX
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [categorySearch, setCategorySearch] = useState("");
  const [agencySearch, setAgencySearch] = useState("");
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // New Category Modal / Form State
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catPriority, setCatPriority] = useState("MEDIUM");
  const [catAgencyId, setCatAgencyId] = useState("");

  // New Agency Modal / Form State
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [agencyCode, setAgencyCode] = useState("");
  const [agencyDesc, setAgencyDesc] = useState("");
  const [agencyEmail, setAgencyEmail] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");

  // New Announcement State
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPriority, setAnnPriority] = useState("NORMAL");

  useEffect(() => {
    if (!loading && (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role))) {
      router.push("/dashboard");
      return;
    }
    loadTabData(activeTab);
  }, [user, loading, activeTab]);

  // Preload overview counts so all KPI ribbon metrics populate immediately
  useEffect(() => {
    if (!loading && user && ["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      fetch("/api/admin/users")
        .then((r) => r.ok && r.json())
        .then((d) => d?.users && setUsersList(d.users))
        .catch(() => {});
      fetch("/api/agencies")
        .then((r) => r.ok && r.json())
        .then((d) => d?.agencies && setAgenciesList(d.agencies))
        .catch(() => {});
      fetch("/api/announcements")
        .then((r) => r.ok && r.json())
        .then((d) => d?.announcements && setAnnouncements(d.announcements))
        .catch(() => {});
      fetch("/api/categories")
        .then((r) => r.ok && r.json())
        .then((d) => d?.categories && setCategoriesList(d.categories))
        .catch(() => {});
    }
  }, [user, loading]);

  const loadTabData = async (tab: string) => {
    setTabLoading(true);
    try {
      if (tab === "users") {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsersList(data.users || []);
        }
      } else if (tab === "categories") {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategoriesList(data.categories || []);
        }
      } else if (tab === "agencies") {
        const res = await fetch("/api/agencies");
        if (res.ok) {
          const data = await res.json();
          setAgenciesList(data.agencies || []);
        }
      } else if (tab === "announcements") {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data.announcements || []);
        }
      } else if (tab === "audit") {
        const res = await fetch("/api/admin/audit-logs");
        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data.logs || []);
        }
      } else if (tab === "verification") {
        const res = await fetch("/api/reports/moderation?filter=pending");
        if (res.ok) {
          const data = await res.json();
          setModerationQueue(data.reports || []);
          setModerationTotal(data.total || 0);
        }
      }
    } catch (e) {
      console.error("Tab load error:", e);
    } finally {
      setTabLoading(false);
    }
  };

  const handleModerationAction = async (reportId: string, actionType: string) => {
    setModActionLoading(true);
    try {
      const payload: any = { reportId, actionType };
      if (modReason) payload.reason = modReason;
      if (modFlagType) payload.flagType = modFlagType;
      if (actionType === "REQUEST_INFO") {
        payload.verificationRequestType = modVerifType;
        payload.verificationMessage =
          modVerifMessage ||
          "We need a little more information about this report. Please check your report for details.";
      }

      const res = await fetch("/api/reports/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModerationModal(null);
        setModReason("");
        setModFlagType("");
        setModVerifMessage("");
        loadTabData("verification");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to perform action");
      }
    } catch (e) {
      alert("Error performing moderation action");
    } finally {
      setModActionLoading(false);
    }
  };

  const getRiskBadgeStyle = (level: string) => {
    switch (level) {
      case "HIGH":
      case "CRITICAL":
        return {
          bg: "rgba(248, 113, 113, 0.12)",
          color: "#f87171",
          border: "1px solid rgba(248, 113, 113, 0.3)",
        };
      case "MEDIUM":
        return {
          bg: "rgba(251, 191, 36, 0.12)",
          color: "#fbbf24",
          border: "1px solid rgba(251, 191, 36, 0.3)",
        };
      default:
        return {
          bg: "rgba(52, 211, 153, 0.12)",
          color: "#34d399",
          border: "1px solid rgba(52, 211, 153, 0.3)",
        };
    }
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return { bg: "rgba(239, 68, 68, 0.12)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.25)" };
      case "HIGH":
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.25)" };
      case "MEDIUM":
        return { bg: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.25)" };
      default:
        return { bg: "rgba(52, 211, 153, 0.12)", color: "#34d399", border: "1px solid rgba(52, 211, 153, 0.25)" };
    }
  };

  // Toggle user active status or role
  const handleUpdateUser = async (userId: string, updates: { role?: string; isActive?: boolean }) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });
      if (res.ok) {
        loadTabData("users");
      }
    } catch (e) {
      alert("Failed to update user");
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: catName,
          description: catDesc,
          defaultPriority: catPriority,
          defaultAgencyId: catAgencyId || null,
        }),
      });
      if (res.ok) {
        setShowCatModal(false);
        setCatName("");
        setCatDesc("");
        loadTabData("categories");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create category");
      }
    } catch (e) {
      alert("Error creating category");
    }
  };

  // Create Agency
  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agencyName,
          code: agencyCode,
          description: agencyDesc,
          contactEmail: agencyEmail,
          contactPhone: agencyPhone,
        }),
      });
      if (res.ok) {
        setShowAgencyModal(false);
        setAgencyName("");
        setAgencyCode("");
        setAgencyDesc("");
        loadTabData("agencies");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create agency");
      }
    } catch (e) {
      alert("Error creating agency");
    }
  };

  // Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          priority: annPriority,
        }),
      });
      if (res.ok) {
        setShowAnnModal(false);
        setAnnTitle("");
        setAnnContent("");
        loadTabData("announcements");
      }
    } catch (e) {
      alert("Error creating announcement");
    }
  };

  // Filtered lists
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const q = userSearch.toLowerCase();
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [usersList, userSearch, userRoleFilter]);

  const filteredCategories = useMemo(() => {
    return categoriesList.filter((cat) => {
      const q = categorySearch.toLowerCase();
      return !q || cat.name?.toLowerCase().includes(q) || cat.description?.toLowerCase().includes(q);
    });
  }, [categoriesList, categorySearch]);

  const filteredAgencies = useMemo(() => {
    return agenciesList.filter((ag) => {
      const q = agencySearch.toLowerCase();
      return (
        !q ||
        ag.name?.toLowerCase().includes(q) ||
        ag.code?.toLowerCase().includes(q) ||
        ag.description?.toLowerCase().includes(q)
      );
    });
  }, [agenciesList, agencySearch]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const q = announcementSearch.toLowerCase();
      return !q || ann.title?.toLowerCase().includes(q) || ann.content?.toLowerCase().includes(q);
    });
  }, [announcements, announcementSearch]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = auditSearch.toLowerCase();
      return (
        !q ||
        log.actor?.name?.toLowerCase().includes(q) ||
        log.actor?.role?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.entity?.toLowerCase().includes(q) ||
        log.newState?.toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditSearch]);

  if (loading || !user) {
    return (
      <div className="admin-shell" style={{ textAlign: "center", padding: "100px 20px" }}>
        <Loader2 size={36} className="spin" style={{ margin: "0 auto", color: "var(--primary)" }} />
        <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "12px" }}>Loading administration console...</p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* 1. Header & Live Indicator */}
      <div className="admin-header">
        <div className="admin-header-main">
          <div className="admin-header-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="admin-header-title">Admin Console</h1>
            <div className="admin-header-sub">
              <span className="admin-status-dot" />
              <span>Civic System Operational</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
              <span>Barangay Masbate City</span>
            </div>
          </div>
        </div>

        <div className="admin-header-actions">
          <NextLink href="/admin/analytics" className="admin-analytics-link">
            <BarChart3 size={15} color="#38bdf8" />
            <span>Analytics & SLA</span>
            <ArrowUpRight size={13} style={{ opacity: 0.7 }} />
          </NextLink>
        </div>
      </div>

      {/* 2. Glanceable Overview KPI Ribbon */}
      <div className="admin-kpi-ribbon">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <div className="admin-kpi-val" style={{ color: moderationTotal > 0 ? "#fbbf24" : "#f8fafc" }}>
              {moderationTotal}
            </div>
            <div className="admin-kpi-lbl">Queue Pending</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}>
            <Users size={18} />
          </div>
          <div>
            <div className="admin-kpi-val">{usersList.length || "—"}</div>
            <div className="admin-kpi-lbl">Registered Users</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#34d399" }}>
            <Building2 size={18} />
          </div>
          <div>
            <div className="admin-kpi-val">{agenciesList.length || "—"}</div>
            <div className="admin-kpi-lbl">Civic Agencies</div>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#c084fc" }}>
            <Megaphone size={18} />
          </div>
          <div>
            <div className="admin-kpi-val">{announcements.length || "—"}</div>
            <div className="admin-kpi-lbl">Active Notices</div>
          </div>
        </div>
      </div>

      {/* 3. Modern Segmented Pill Tabs Navigation */}
      <div className="admin-tabs-nav">
        {[
          { key: "verification", label: "Verification", icon: ShieldAlert, badge: moderationTotal },
          { key: "users", label: "Users & Staff", icon: Users },
          { key: "categories", label: "Categories", icon: Tags },
          { key: "agencies", label: "Agencies", icon: Building2 },
          { key: "announcements", label: "Announcements", icon: Megaphone },
          { key: "audit", label: "Audit Logs", icon: ScrollText },
          { key: "language", label: "Minasbate Glossary", icon: Languages },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`admin-tab-btn ${isActive ? "active" : ""}`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="admin-tab-badge">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 0: VERIFICATION QUEUE */}
      {activeTab === "verification" && (
        <div>
          <div className="admin-controls-bar">
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 2px" }}>
                Incident Verification Queue
              </h2>
              <p style={{ fontSize: "0.775rem", color: "#94a3b8", margin: 0 }}>
                High-risk and automated flags requiring administrative validation
              </p>
            </div>
            {moderationTotal > 0 && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#fbbf24",
                  background: "rgba(251, 191, 36, 0.12)",
                  border: "1px solid rgba(251, 191, 36, 0.25)",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                }}
              >
                {moderationTotal} pending review
              </span>
            )}
          </div>

          {moderationQueue.length === 0 ? (
            <div className="admin-empty-card">
              <div className="admin-empty-icon">
                <CheckCircle2 size={26} />
              </div>
              <h3 className="admin-empty-title">Queue Clear</h3>
              <p className="admin-empty-desc">
                No incident reports currently require manual verification. All submitted reports meet nominal risk thresholds.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {moderationQueue.map((report: any) => {
                const risk = report.riskAssessment;
                const riskStyle = getRiskBadgeStyle(risk?.riskLevel || report.riskLevel || "LOW");
                const isExpanded = expandedReport === report.id;

                return (
                  <div
                    key={report.id}
                    style={{
                      background: "rgba(13, 21, 39, 0.75)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      overflow: "hidden",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                      style={{
                        padding: "14px 18px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                        {report.photos?.[0] && (
                          <img
                            src={report.photos[0].photoUrl}
                            alt="Incident"
                            style={{
                              width: "48px",
                              height: "48px",
                              objectFit: "cover",
                              borderRadius: "10px",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                                fontSize: "0.813rem",
                                fontWeight: 800,
                                color: "var(--primary)",
                              }}
                            >
                              {report.referenceNo}
                            </span>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                backgroundColor: riskStyle.bg,
                                color: riskStyle.color,
                                border: riskStyle.border,
                              }}
                            >
                              Risk: {risk?.riskLevel || report.riskLevel || "—"} ({risk?.totalScore ?? report.riskScore ?? 0})
                            </span>
                            <StatusBadge status={report.status} size="sm" />
                          </div>

                          <div
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              color: "#f8fafc",
                              marginTop: "3px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {report.category?.name} — {report.title}
                          </div>

                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#94a3b8",
                              marginTop: "3px",
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                              <MapPin size={11} /> {report.address}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                              <Clock size={11} /> {new Date(report.createdAt).toLocaleString()}
                            </span>
                            <span>Resident: {report.resident?.name || "Anonymous"}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>
                          {isExpanded ? "Collapse" : "Review"}
                        </span>
                        {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.07)", padding: "18px" }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: "14px",
                            marginBottom: "16px",
                          }}
                        >
                          {/* Description */}
                          <div
                            style={{
                              padding: "14px",
                              background: "rgba(10, 16, 30, 0.5)",
                              borderRadius: "10px",
                              border: "1px solid rgba(255, 255, 255, 0.06)",
                            }}
                          >
                            <div style={{ fontSize: "0.688rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "6px" }}>
                              Incident Description
                            </div>
                            <p style={{ fontSize: "0.813rem", color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
                              {report.description}
                            </p>
                          </div>

                          {/* Risk Breakdown */}
                          <div
                            style={{
                              padding: "14px",
                              background: "rgba(10, 16, 30, 0.5)",
                              borderRadius: "10px",
                              border: "1px solid rgba(255, 255, 255, 0.06)",
                            }}
                          >
                            <div style={{ fontSize: "0.688rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                              Risk Signal Breakdown
                            </div>
                            {risk ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {[
                                  { label: "Text Quality", score: risk.textScore },
                                  { label: "Image Analysis", score: risk.imageScore },
                                  { label: "Behavior", score: risk.behaviorScore },
                                  { label: "Location", score: risk.locationScore },
                                  { label: "Duplicate", score: risk.duplicateScore },
                                  { label: "Category Match", score: risk.categoryMismatchScore },
                                ].map((sig) => (
                                  <div key={sig.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "0.725rem", color: "#94a3b8", width: "95px", flexShrink: 0 }}>
                                      {sig.label}
                                    </span>
                                    <div
                                      style={{
                                        flex: 1,
                                        height: "5px",
                                        background: "rgba(255, 255, 255, 0.08)",
                                        borderRadius: "3px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: `${Math.min(sig.score || 0, 100)}%`,
                                          height: "100%",
                                          backgroundColor:
                                            (sig.score || 0) > 50
                                              ? "#f87171"
                                              : (sig.score || 0) > 25
                                              ? "#fbbf24"
                                              : "#34d399",
                                        }}
                                      />
                                    </div>
                                    <span style={{ fontSize: "0.688rem", fontWeight: 700, color: "#cbd5e1", width: "24px", textAlign: "right" }}>
                                      {sig.score || 0}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>No granular signals available</p>
                            )}
                          </div>
                        </div>

                        {/* User Trust profile */}
                        {report.userTrustProfile && (
                          <div
                            style={{
                              padding: "10px 14px",
                              marginBottom: "14px",
                              borderRadius: "10px",
                              background: "rgba(10, 16, 30, 0.4)",
                              border: "1px solid rgba(255, 255, 255, 0.06)",
                              display: "flex",
                              gap: "18px",
                              flexWrap: "wrap",
                              fontSize: "0.75rem",
                              color: "#94a3b8",
                            }}
                          >
                            <span><strong style={{ color: "#f8fafc" }}>Trust Score:</strong> {report.userTrustProfile.trustScore}/100</span>
                            <span><strong style={{ color: "#f8fafc" }}>Total:</strong> {report.userTrustProfile.totalReports}</span>
                            <span><strong style={{ color: "#34d399" }}>Approved:</strong> {report.userTrustProfile.approvedCount}</span>
                            <span><strong style={{ color: "#f87171" }}>Rejected:</strong> {report.userTrustProfile.rejectedCount}</span>
                            <span><strong style={{ color: "#fbbf24" }}>Spam:</strong> {report.userTrustProfile.spamCount}</span>
                          </div>
                        )}

                        {/* Attached Photos */}
                        {report.photos?.length > 0 && (
                          <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "0.688rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                              Evidence Photos ({report.photos.length})
                            </div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              {report.photos.map((p: any) => (
                                <img
                                  key={p.id}
                                  src={p.photoUrl}
                                  alt="Evidence"
                                  style={{
                                    width: "80px",
                                    height: "80px",
                                    objectFit: "cover",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(255, 255, 255, 0.12)",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            paddingTop: "12px",
                            borderTop: "1px solid rgba(255, 255, 255, 0.07)",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleModerationAction(report.id, "APPROVE")}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "7px 14px",
                              borderRadius: "8px",
                              background: "rgba(16, 185, 129, 0.15)",
                              border: "1px solid rgba(16, 185, 129, 0.35)",
                              color: "#34d399",
                              fontSize: "0.775rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModerationModal({ reportId: report.id, action: "REQUEST_INFO" });
                              setModVerifMessage("");
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "7px 14px",
                              borderRadius: "8px",
                              background: "rgba(56, 189, 248, 0.12)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              color: "#38bdf8",
                              fontSize: "0.775rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <MessageSquare size={14} /> Request Info
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModerationModal({ reportId: report.id, action: "REJECT" });
                              setModReason("");
                              setModFlagType("");
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "7px 14px",
                              borderRadius: "8px",
                              background: "rgba(239, 68, 68, 0.12)",
                              border: "1px solid rgba(239, 68, 68, 0.28)",
                              color: "#f87171",
                              fontSize: "0.775rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModerationModal({ reportId: report.id, action: "MARK_SPAM" });
                              setModReason("");
                              setModFlagType("SPAM");
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "7px 14px",
                              borderRadius: "8px",
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              color: "#94a3b8",
                              fontSize: "0.775rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <Flag size={13} /> Spam
                          </button>
                          <a
                            href={`/reports/${report.referenceNo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "7px 14px",
                              borderRadius: "8px",
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              color: "#e2e8f0",
                              fontSize: "0.775rem",
                              fontWeight: 600,
                              textDecoration: "none",
                              marginLeft: "auto",
                            }}
                          >
                            <Eye size={13} /> View Full
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: USERS & STAFF */}
      {activeTab === "users" && (
        <div>
          {/* Controls Bar: Search + Role Filter Pills */}
          <div className="admin-controls-bar">
            <div className="admin-search-box">
              <Search size={15} className="admin-search-icon" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search by name, phone, or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <div className="admin-filter-group">
              {[
                { key: "ALL", label: "All Users" },
                { key: "RESIDENT", label: "Residents" },
                { key: "STAFF", label: "Staff" },
                { key: "ADMIN", label: "Admins" },
                { key: "SUPER_ADMIN", label: "Super Admin" },
              ].map((rf) => (
                <button
                  key={rf.key}
                  type="button"
                  onClick={() => setUserRoleFilter(rf.key)}
                  className={`admin-filter-pill ${userRoleFilter === rf.key ? "active" : ""}`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="admin-empty-card">
              <div className="admin-empty-icon" style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}>
                <Users size={24} />
              </div>
              <h3 className="admin-empty-title">No Users Found</h3>
              <p className="admin-empty-desc">No accounts match the active search query or filter.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="admin-table-card admin-desktop-table">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User Profile</th>
                      <th>Contact Info</th>
                      <th>Assigned Role</th>
                      <th>Account Status</th>
                      <th>Reports</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <img
                              src={u.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + u.name}
                              alt={u.name}
                              style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }}
                            />
                            <div>
                              <strong style={{ color: "#f8fafc", fontSize: "0.84rem" }}>{u.name}</strong>
                              <div style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "ui-monospace, monospace" }}>
                                {u.id.substring(0, 10)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div style={{ color: "#cbd5e1", fontWeight: 600, fontSize: "0.775rem" }}>
                              {u.phone || "No phone"}
                            </div>
                            {u.email && <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{u.email}</div>}
                          </div>
                        </td>
                        <td>
                          <select
                            className="admin-role-select"
                            value={u.role}
                            disabled={u.role === "SUPER_ADMIN"}
                            onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                          >
                            <option value="RESIDENT">Resident</option>
                            <option value="STAFF">Staff</option>
                            <option value="ADMIN">Admin</option>
                            {u.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Super Admin</option>}
                          </select>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              backgroundColor: u.isActive ? "rgba(16, 185, 129, 0.14)" : "rgba(239, 68, 68, 0.14)",
                              color: u.isActive ? "#34d399" : "#f87171",
                              border: u.isActive ? "1px solid rgba(16, 185, 129, 0.28)" : "1px solid rgba(239, 68, 68, 0.28)",
                            }}
                          >
                            {u.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: "#cbd5e1" }}>{u._count?.reports || 0}</td>
                        <td style={{ textAlign: "right" }}>
                          {u.role !== "SUPER_ADMIN" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateUser(u.id, { isActive: !u.isActive })}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "7px",
                                fontSize: "0.725rem",
                                fontWeight: 700,
                                border: "none",
                                cursor: "pointer",
                                backgroundColor: u.isActive ? "rgba(239, 68, 68, 0.14)" : "rgba(16, 185, 129, 0.14)",
                                color: u.isActive ? "#f87171" : "#34d399",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {u.isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Adaptive Cards (cleaner than awkward wide-scrolling tables) */}
              <div className="admin-mobile-cards">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="admin-mobile-card">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                          src={u.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + u.name}
                          alt={u.name}
                          style={{ width: "36px", height: "36px", borderRadius: "50%" }}
                        />
                        <div>
                          <strong style={{ color: "#f8fafc", fontSize: "0.875rem" }}>{u.name}</strong>
                          <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>{u.phone || u.email || "No contact"}</div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.688rem",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "9999px",
                          backgroundColor: u.isActive ? "rgba(16, 185, 129, 0.14)" : "rgba(239, 68, 68, 0.14)",
                          color: u.isActive ? "#34d399" : "#f87171",
                        }}
                      >
                        {u.isActive ? "Active" : "Off"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <select
                        className="admin-role-select"
                        value={u.role}
                        disabled={u.role === "SUPER_ADMIN"}
                        onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                        style={{ flex: 1 }}
                      >
                        <option value="RESIDENT">Resident</option>
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                        {u.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Super Admin</option>}
                      </select>

                      {u.role !== "SUPER_ADMIN" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateUser(u.id, { isActive: !u.isActive })}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "0.725rem",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: u.isActive ? "rgba(239, 68, 68, 0.16)" : "rgba(16, 185, 129, 0.16)",
                            color: u.isActive ? "#f87171" : "#34d399",
                          }}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === "categories" && (
        <div>
          <div className="admin-controls-bar">
            <div className="admin-search-box">
              <Search size={15} className="admin-search-icon" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search problem categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowCatModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                border: "none",
                color: "#ffffff",
                fontSize: "0.813rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={15} />
              <span>Add Category</span>
            </button>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="admin-empty-card">
              <div className="admin-empty-icon" style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}>
                <Tags size={24} />
              </div>
              <h3 className="admin-empty-title">No Categories Found</h3>
              <p className="admin-empty-desc">Create a new category or clear your search term.</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
              }}
            >
              {filteredCategories.map((cat) => {
                const pStyle = getPriorityBadgeStyle(cat.defaultPriority);
                return (
                  <div
                    key={cat.id}
                    style={{
                      background: "rgba(13, 21, 39, 0.7)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "14px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
                        <strong style={{ fontSize: "0.95rem", color: "#f8fafc", fontWeight: 700 }}>{cat.name}</strong>
                        <span
                          style={{
                            fontSize: "0.688rem",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: "9999px",
                            backgroundColor: pStyle.bg,
                            color: pStyle.color,
                            border: pStyle.border,
                          }}
                        >
                          {cat.defaultPriority}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.813rem", color: "#94a3b8", margin: "0 0 12px", lineHeight: 1.45 }}>
                        {cat.description}
                      </p>
                    </div>

                    <div
                      style={{
                        fontSize: "0.725rem",
                        color: "#64748b",
                        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                        paddingTop: "8px",
                      }}
                    >
                      Default Agency: <strong style={{ color: "#cbd5e1" }}>{cat.defaultAgency?.name || "Barangay Office"}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AGENCIES DIRECTORY */}
      {activeTab === "agencies" && (
        <div>
          <div className="admin-controls-bar">
            <div className="admin-search-box">
              <Search size={15} className="admin-search-icon" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search responder agencies..."
                value={agencySearch}
                onChange={(e) => setAgencySearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAgencyModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                border: "none",
                color: "#ffffff",
                fontSize: "0.813rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={15} />
              <span>Register Agency</span>
            </button>
          </div>

          {filteredAgencies.length === 0 ? (
            <div className="admin-empty-card">
              <div className="admin-empty-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#34d399" }}>
                <Building2 size={24} />
              </div>
              <h3 className="admin-empty-title">No Agencies Found</h3>
              <p className="admin-empty-desc">Register a utility partner or clear your search term.</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                gap: "12px",
              }}
            >
              {filteredAgencies.map((agency) => (
                <div
                  key={agency.id}
                  style={{
                    background: "rgba(13, 21, 39, 0.7)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "0.95rem", color: "#f8fafc", fontWeight: 700 }}>{agency.name}</strong>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          color: "#38bdf8",
                          background: "rgba(56, 189, 248, 0.14)",
                          padding: "2px 7px",
                          borderRadius: "6px",
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {agency.code}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.813rem", color: "#94a3b8", margin: "0 0 12px", lineHeight: 1.45 }}>
                      {agency.description}
                    </p>
                  </div>

                  <div
                    style={{
                      fontSize: "0.725rem",
                      color: "#94a3b8",
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                      paddingTop: "10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div>Coverage: <strong style={{ color: "#cbd5e1" }}>{agency.coverageArea || "City-wide"}</strong></div>
                    {agency.contactPhone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Phone size={11} /> <span>{agency.contactPhone}</span>
                      </div>
                    )}
                    {agency.contactEmail && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Mail size={11} /> <span>{agency.contactEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {activeTab === "announcements" && (
        <div>
          <div className="admin-controls-bar">
            <div className="admin-search-box">
              <Search size={15} className="admin-search-icon" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search notices & announcements..."
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAnnModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                border: "none",
                color: "#ffffff",
                fontSize: "0.813rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={15} />
              <span>Post Notice</span>
            </button>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <div className="admin-empty-card">
              <div className="admin-empty-icon" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#c084fc" }}>
                <Megaphone size={24} />
              </div>
              <h3 className="admin-empty-title">No Announcements</h3>
              <p className="admin-empty-desc">Broadcast official notices to resident dashboards.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  style={{
                    background: "rgba(13, 21, 39, 0.7)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#f8fafc", fontWeight: 700 }}>{ann.title}</strong>
                    <span
                      style={{
                        fontSize: "0.688rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        backgroundColor: ann.priority === "URGENT" ? "rgba(239, 68, 68, 0.14)" : "rgba(56, 189, 248, 0.14)",
                        color: ann.priority === "URGENT" ? "#f87171" : "#38bdf8",
                        border: ann.priority === "URGENT" ? "1px solid rgba(239, 68, 68, 0.28)" : "1px solid rgba(56, 189, 248, 0.28)",
                      }}
                    >
                      {ann.priority}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.813rem", color: "#cbd5e1", margin: "0 0 10px", lineHeight: 1.5 }}>
                    {ann.content}
                  </p>
                  <div style={{ fontSize: "0.725rem", color: "#64748b" }}>
                    Author: <strong style={{ color: "#94a3b8" }}>{ann.createdBy?.name || "Administration"}</strong> • {new Date(ann.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div>
          <div className="admin-controls-bar">
            <div className="admin-search-box">
              <Search size={15} className="admin-search-icon" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Filter audit events by actor or action..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>
              {filteredAuditLogs.length} events logged
            </span>
          </div>

          {filteredAuditLogs.length === 0 ? (
            <div className="admin-empty-card">
              <div className="admin-empty-icon" style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}>
                <ScrollText size={24} />
              </div>
              <h3 className="admin-empty-title">No Audit Logs</h3>
              <p className="admin-empty-desc">System operations will be permanently recorded here.</p>
            </div>
          ) : (
            <div className="admin-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Target Entity</th>
                    <th>Change Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span style={{ fontSize: "0.725rem", color: "#94a3b8", fontFamily: "ui-monospace, monospace" }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: "#f8fafc", fontSize: "0.813rem" }}>{log.actor?.name || "System"}</strong>
                        <div style={{ fontSize: "0.688rem", color: "#64748b" }}>{log.actor?.role || "AUTO"}</div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "ui-monospace, monospace",
                            fontSize: "0.725rem",
                            fontWeight: 700,
                            color: "#38bdf8",
                            background: "rgba(56, 189, 248, 0.12)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ color: "#cbd5e1", fontSize: "0.775rem" }}>{log.entity}</td>
                      <td style={{ maxWidth: "320px", fontSize: "0.725rem", color: "#94a3b8", wordBreak: "break-word" }}>
                        {log.newState || log.previousState || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: MINASBATE LANGUAGE & GLOSSARY */}
      {activeTab === "language" && <MasbatenoLanguageTab />}

      {/* 5. Modern Minimalist Glass Modals */}

      {/* Modal: Create Category */}
      {showCatModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 16px" }}>
              Add Problem Category
            </h3>
            <form onSubmit={handleCreateCategory}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                  Category Name
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ paddingLeft: "12px" }}
                  placeholder="e.g. Streetlight Outage"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                  Description
                </label>
                <textarea
                  className="admin-search-input"
                  style={{ padding: "10px 12px", height: "80px", resize: "none" }}
                  placeholder="Problem types covered by this category..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                  Default Priority
                </label>
                <select
                  className="admin-role-select"
                  style={{ width: "100%", height: "38px" }}
                  value={catPriority}
                  onChange={(e) => setCatPriority(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical Hazard</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#94a3b8",
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "0.813rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Agency */}
      {showAgencyModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 16px" }}>
              Register Responding Agency
            </h3>
            <form onSubmit={handleCreateAgency}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                    Agency Name
                  </label>
                  <input
                    type="text"
                    className="admin-search-input"
                    style={{ paddingLeft: "12px" }}
                    placeholder="e.g. Masbate Electric Co."
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                    Code Identifier
                  </label>
                  <input
                    type="text"
                    className="admin-search-input"
                    style={{ paddingLeft: "12px" }}
                    placeholder="e.g. MASELCO"
                    value={agencyCode}
                    onChange={(e) => setAgencyCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                  Description / Scope
                </label>
                <textarea
                  className="admin-search-input"
                  style={{ padding: "10px 12px", height: "70px", resize: "none" }}
                  placeholder="Mandate and coverage scope..."
                  value={agencyDesc}
                  onChange={(e) => setAgencyDesc(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    className="admin-search-input"
                    style={{ paddingLeft: "12px" }}
                    placeholder="Hotline phone"
                    value={agencyPhone}
                    onChange={(e) => setAgencyPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    className="admin-search-input"
                    style={{ paddingLeft: "12px" }}
                    placeholder="ops@agency.gov.ph"
                    value={agencyEmail}
                    onChange={(e) => setAgencyEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAgencyModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#94a3b8",
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "0.813rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Register Agency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Announcement */}
      {showAnnModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 16px" }}>
              Publish Community Notice
            </h3>
            <form onSubmit={handleCreateAnnouncement}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                  Announcement Title
                </label>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ paddingLeft: "12px" }}
                  placeholder="e.g. Scheduled Water Maintenance Advisory"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                  Content
                </label>
                <textarea
                  className="admin-search-input"
                  style={{ padding: "10px 12px", height: "90px", resize: "none" }}
                  placeholder="Important information for community residents..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                  Priority Level
                </label>
                <select
                  className="admin-role-select"
                  style={{ width: "100%", height: "38px" }}
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value)}
                >
                  <option value="NORMAL">Normal Advisory</option>
                  <option value="URGENT">Urgent Alert</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#94a3b8",
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "0.813rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Moderation Action */}
      {moderationModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 16px" }}>
              {moderationModal.action === "REQUEST_INFO"
                ? "Request Additional Information"
                : moderationModal.action === "REJECT"
                ? "Reject Incident Report"
                : moderationModal.action === "MARK_SPAM"
                ? "Mark Report as Spam"
                : "Moderation Action"}
            </h3>

            {moderationModal.action === "REQUEST_INFO" && (
              <>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                    What is required from the resident?
                  </label>
                  <select
                    className="admin-role-select"
                    style={{ width: "100%", height: "38px" }}
                    value={modVerifType}
                    onChange={(e) => setModVerifType(e.target.value)}
                  >
                    <option value="CONFIRM_LOCATION">Confirm Location</option>
                    <option value="RETAKE_PHOTO">Retake Photo</option>
                    <option value="ADD_DETAILS">Add More Details</option>
                    <option value="GENERAL">General Question</option>
                  </select>
                </div>
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                    Message to Resident
                  </label>
                  <textarea
                    className="admin-search-input"
                    style={{ padding: "10px 12px", height: "80px", resize: "none" }}
                    placeholder="e.g. Please confirm that this issue is currently active at this exact coordinate."
                    value={modVerifMessage}
                    onChange={(e) => setModVerifMessage(e.target.value)}
                  />
                </div>
              </>
            )}

            {(moderationModal.action === "REJECT" || moderationModal.action === "MARK_SPAM") && (
              <>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                    Flag / Rejection Category
                  </label>
                  <select
                    className="admin-role-select"
                    style={{ width: "100%", height: "38px" }}
                    value={modFlagType}
                    onChange={(e) => setModFlagType(e.target.value)}
                  >
                    <option value="">Select reason...</option>
                    <option value="SPAM">Spam</option>
                    <option value="PRANK_FAKE">Prank / Fake Report</option>
                    <option value="DUPLICATE">Duplicate</option>
                    <option value="INCORRECT_CATEGORY">Incorrect Category</option>
                    <option value="INVALID_LOCATION">Invalid Location</option>
                    <option value="INAPPROPRIATE">Inappropriate Content</option>
                    <option value="MISLEADING">Misleading Information</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", marginBottom: "6px" }}>
                    Reason / Notes
                  </label>
                  <textarea
                    className="admin-search-input"
                    style={{ padding: "10px 12px", height: "70px", resize: "none" }}
                    placeholder="Internal audit note for this decision..."
                    value={modReason}
                    onChange={(e) => setModReason(e.target.value)}
                  />
                </div>
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setModerationModal(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#94a3b8",
                  fontSize: "0.813rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={modActionLoading}
                onClick={() => handleModerationAction(moderationModal.reportId, moderationModal.action)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "10px",
                  background:
                    moderationModal.action === "REJECT" || moderationModal.action === "MARK_SPAM"
                      ? "linear-gradient(135deg, #dc2626, #ef4444)"
                      : "linear-gradient(135deg, #0284c7, #0ea5e9)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "0.813rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: modActionLoading ? 0.6 : 1,
                }}
              >
                {modActionLoading ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
