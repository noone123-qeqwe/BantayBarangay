"use client";

import React, { useEffect, useState } from "react";
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
  Edit2,
  Trash2,
  Calendar,
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
} from "lucide-react";
import MasbatenoLanguageTab from "@/components/admin/MasbatenoLanguageTab";

export default function AdminControlPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"users" | "categories" | "agencies" | "announcements" | "audit" | "verification" | "language">("verification");

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
        payload.verificationMessage = modVerifMessage || "We need a little more information about this report. Please check your report for details.";
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
      case "HIGH": return { bg: "var(--risk-high-bg)", color: "var(--risk-high)", border: "1px solid rgba(220, 38, 38, 0.3)" };
      case "MEDIUM": return { bg: "var(--risk-medium-bg)", color: "var(--risk-medium)", border: "1px solid rgba(217, 119, 6, 0.3)" };
      default: return { bg: "var(--risk-low-bg)", color: "var(--risk-low)", border: "1px solid rgba(5, 150, 105, 0.3)" };
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

  if (loading || !user) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <Loader2 size={36} className="spin" style={{ margin: "0 auto", color: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Admin Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={28} color="var(--primary)" />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Barangay Administration Console</h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.938rem", marginTop: "4px" }}>
          Manage residents, staff personnel, dynamic categories, civic agencies, and inspect audit logs
        </p>
      </div>

      {/* Tabs Bar */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-medium)",
          marginBottom: "24px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {[
          { key: "verification", label: `Needs Verification${moderationTotal > 0 ? ` (${moderationTotal})` : ""}`, icon: ShieldAlert },
          { key: "language", label: "Minasbate Language & Glossary", icon: Languages },
          { key: "users", label: "Users & Staff", icon: Users },
          { key: "categories", label: "Categories", icon: Tags },
          { key: "agencies", label: "Agencies Directory", icon: Building2 },
          { key: "announcements", label: "Announcements", icon: Megaphone },
          { key: "audit", label: "System Audit Logs", icon: ScrollText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "var(--radius-md) var(--radius-md) 0 0",
                fontSize: "0.875rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                backgroundColor: isActive ? "var(--bg-card)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--text-muted)",
                borderBottom: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 0: NEEDS VERIFICATION (Moderation Queue) */}
      {activeTab === "verification" && (
        <div>
          <div className="card" style={{ padding: "16px 20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: "1rem" }}>Report Verification Queue ({moderationTotal})</strong>
              <p style={{ fontSize: "0.813rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Reports flagged by the automated risk analysis system. Review each report before approving or rejecting.
              </p>
            </div>
          </div>

          {moderationQueue.length === 0 ? (
            <div className="card" style={{ padding: "40px", textAlign: "center" }}>
              <CheckCircle2 size={40} color="var(--success)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "4px" }}>All Clear</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No reports currently require verification.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {moderationQueue.map((report: any) => {
                const risk = report.riskAssessment;
                const riskStyle = getRiskBadgeStyle(risk?.riskLevel || report.riskLevel || "LOW");
                const isExpanded = expandedReport === report.id;

                return (
                  <div key={report.id} className="card" style={{ padding: "0", overflow: "hidden" }}>
                    {/* Report Header */}
                    <div
                      style={{ padding: "18px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}
                      onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                        {/* Photo thumbnail */}
                        {report.photos?.[0] && (
                          <img
                            src={report.photos[0].photoUrl}
                            alt="Report"
                            style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border-medium)", flexShrink: 0 }}
                          />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.813rem", fontWeight: 800, color: "var(--primary)" }}>{report.referenceNo}</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px", backgroundColor: riskStyle.bg, color: riskStyle.color, border: riskStyle.border }}>
                              {risk?.riskLevel || report.riskLevel || "—"} ({risk?.totalScore ?? report.riskScore ?? 0})
                            </span>
                            <StatusBadge status={report.status} size="sm" />
                          </div>
                          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {report.category?.name} — {report.title}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><MapPin size={11} /> {report.address}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Clock size={11} /> {new Date(report.createdAt).toLocaleString()}</span>
                            <span>By: {report.resident?.name || "Unknown"}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                          {/* Description */}
                          <div style={{ padding: "14px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                            <div style={{ fontSize: "0.688rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>Description</div>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{report.description}</p>
                          </div>

                          {/* Risk Signal Breakdown */}
                          <div style={{ padding: "14px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                            <div style={{ fontSize: "0.688rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Risk Signal Breakdown</div>
                            {risk ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {[
                                  { label: "Text Quality", score: risk.textScore },
                                  { label: "Image Analysis", score: risk.imageScore },
                                  { label: "Behavior", score: risk.behaviorScore },
                                  { label: "Location", score: risk.locationScore },
                                  { label: "Duplicate", score: risk.duplicateScore },
                                  { label: "Category Match", score: risk.categoryMismatchScore },
                                ].map((signal) => (
                                  <div key={signal.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", width: "100px", flexShrink: 0 }}>{signal.label}</span>
                                    <div style={{ flex: 1, height: "6px", backgroundColor: "var(--border-subtle)", borderRadius: "3px", overflow: "hidden" }}>
                                      <div style={{ width: `${Math.min(signal.score, 100)}%`, height: "100%", backgroundColor: signal.score > 50 ? "var(--risk-high)" : signal.score > 25 ? "var(--risk-medium)" : "var(--risk-low)", borderRadius: "3px", transition: "width 0.3s ease" }} />
                                    </div>
                                    <span style={{ fontSize: "0.688rem", fontWeight: 700, color: "var(--text-muted)", width: "28px", textAlign: "right" }}>{signal.score}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>No risk assessment data available</p>
                            )}
                          </div>
                        </div>

                        {/* AI Analysis Summary */}
                        {risk?.summary && (
                          <div style={{ padding: "12px 16px", marginBottom: "16px", borderRadius: "var(--radius-md)", backgroundColor: riskStyle.bg, border: riskStyle.border, fontSize: "0.813rem", color: riskStyle.color, fontWeight: 600 }}>
                            {risk.summary}
                          </div>
                        )}

                        {/* Risk Signals List */}
                        {risk?.signals && (
                          <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "0.688rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>Detected Risk Signals</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {(typeof risk.signals === "string" ? JSON.parse(risk.signals) : risk.signals).map((signal: string, idx: number) => (
                                <div key={idx} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                                  <AlertCircle size={12} style={{ flexShrink: 0, marginTop: "2px", color: "var(--risk-medium)" }} />
                                  <span>{signal}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* User Trust Info */}
                        {report.userTrustProfile && (
                          <div style={{ padding: "12px 16px", marginBottom: "16px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.75rem" }}>
                            <span><strong>Trust Score:</strong> {report.userTrustProfile.trustScore}/100</span>
                            <span><strong>Total Reports:</strong> {report.userTrustProfile.totalReports}</span>
                            <span><strong>Approved:</strong> {report.userTrustProfile.approvedCount}</span>
                            <span><strong>Rejected:</strong> {report.userTrustProfile.rejectedCount}</span>
                            <span><strong>Spam:</strong> {report.userTrustProfile.spamCount}</span>
                            <span><strong>Duplicates:</strong> {report.userTrustProfile.duplicateCount}</span>
                          </div>
                        )}

                        {/* Photos */}
                        {report.photos?.length > 0 && (
                          <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "0.688rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>Attached Photos</div>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                              {report.photos.map((p: any) => (
                                <img key={p.id} src={p.photoUrl} alt="Evidence" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border-medium)" }} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px solid var(--border-subtle)" }}>
                          <button
                            type="button"
                            onClick={() => handleModerationAction(report.id, "APPROVE")}
                            className="btn btn-sm"
                            style={{ backgroundColor: "var(--success-light)", color: "var(--success-dark)", border: "1px solid var(--success)", fontWeight: 700 }}
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => { setModerationModal({ reportId: report.id, action: "REQUEST_INFO" }); setModVerifMessage(""); }}
                            className="btn btn-sm"
                            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-dark)", border: "1px solid var(--primary)", fontWeight: 700 }}
                          >
                            <MessageSquare size={14} /> Request More Info
                          </button>
                          <button
                            type="button"
                            onClick={() => { setModerationModal({ reportId: report.id, action: "REJECT" }); setModReason(""); setModFlagType(""); }}
                            className="btn btn-sm"
                            style={{ backgroundColor: "var(--priority-critical-bg)", color: "var(--priority-critical)", border: "1px solid rgba(220, 38, 38, 0.3)", fontWeight: 700 }}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => { setModerationModal({ reportId: report.id, action: "MARK_SPAM" }); setModReason(""); setModFlagType("SPAM"); }}
                            className="btn btn-sm"
                            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-medium)", fontWeight: 700 }}
                          >
                            <Flag size={14} /> Mark as Spam
                          </button>
                          <a
                            href={`/reports/${report.referenceNo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-secondary"
                            style={{ fontWeight: 700 }}
                          >
                            <Eye size={14} /> View Full Report
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

      {/* TAB 1: USERS */}
      {activeTab === "users" && (
        <div>
          <div className="card" style={{ padding: "16px 20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "1rem" }}>All Registered Community Users & Officers ({usersList.length})</strong>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Mobile Number</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Reports Filed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                          src={u.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=u"}
                          alt={u.name}
                          style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                        />
                        <div>
                          <strong>{u.name}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID: {u.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{u.phone || "N/A"}</strong>
                        {u.email && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <select
                        className="form-control"
                        style={{ padding: "4px 8px", fontSize: "0.813rem", width: "auto" }}
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
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "9999px",
                          backgroundColor: u.isActive ? "var(--success-light)" : "var(--danger-light)",
                          color: u.isActive ? "var(--success-dark)" : "var(--danger-dark)",
                        }}
                      >
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td>{u._count?.reports || 0}</td>
                    <td>
                      {u.role !== "SUPER_ADMIN" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateUser(u.id, { isActive: !u.isActive })}
                          className={`btn btn-sm ${u.isActive ? "btn-danger" : "btn-success"}`}
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
        </div>
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === "categories" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Infrastructure Problem Categories</h2>
            <button type="button" onClick={() => setShowCatModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>Add Category</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {categoriesList.map((cat) => (
              <div key={cat.id} className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <strong style={{ fontSize: "1.063rem" }}>{cat.name}</strong>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>
                    {cat.defaultPriority}
                  </span>
                </div>
                <p style={{ fontSize: "0.813rem", color: "var(--text-secondary)", marginBottom: "12px", minHeight: "36px" }}>
                  {cat.description}
                </p>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
                  Default Agency: <strong>{cat.defaultAgency?.name || "Barangay San Antonio"}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AGENCIES */}
      {activeTab === "agencies" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Civic Agencies & Utility Partners</h2>
            <button type="button" onClick={() => setShowAgencyModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>Register Agency</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {agenciesList.map((agency) => (
              <div key={agency.id} className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "1.063rem" }}>{agency.name}</strong>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--info)" }}>
                    {agency.code}
                  </span>
                </div>
                <p style={{ fontSize: "0.813rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
                  {agency.description}
                </p>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>Coverage: <strong>{agency.coverageArea || "City-wide"}</strong></div>
                  <div>Phone: <strong>{agency.contactPhone || "N/A"}</strong></div>
                  <div>Email: <strong>{agency.contactEmail || "N/A"}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {activeTab === "announcements" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Community Announcements</h2>
            <button type="button" onClick={() => setShowAnnModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>Post Notice</span>
            </button>
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            {announcements.map((ann) => (
              <div key={ann.id} className="card" style={{ padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "1rem" }}>{ann.title}</strong>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      backgroundColor: ann.priority === "URGENT" ? "var(--danger-light)" : "var(--primary-light)",
                      color: ann.priority === "URGENT" ? "var(--danger-dark)" : "var(--primary-dark)",
                    }}
                  >
                    {ann.priority}
                  </span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{ann.content}</p>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
                  Posted by: {ann.createdBy?.name || "Administration"} • {new Date(ann.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div>
          <div className="card" style={{ padding: "16px 20px", marginBottom: "16px" }}>
            <strong style={{ fontSize: "1rem" }}>Immutable System Audit Trail ({auditLogs.length} Events)</strong>
            <p style={{ fontSize: "0.813rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Every status change, assignment, user modification, and resolution verification is permanently recorded.
            </p>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <strong>{log.actor?.name || "System"}</strong>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{log.actor?.role}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.entity}</td>
                    <td style={{ maxWidth: "300px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {log.newState || log.previousState || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: MINASBATE LANGUAGE & GLOSSARY MANAGEMENT */}
      {activeTab === "language" && <MasbatenoLanguageTab />}

      {/* Modal: Create Category */}
      {showCatModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "16px" }}>Add Infrastructure Category</h3>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Broken Traffic Light"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describe problem types covered by this category..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Priority</label>
                <select className="form-control" value={catPriority} onChange={(e) => setCatPriority(e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical Hazard</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setShowCatModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Agency */}
      {showAgencyModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "16px" }}>Register Responding Agency</h3>
            <form onSubmit={handleCreateAgency}>
              <div className="form-group">
                <label className="form-label">Agency Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Meralco Emergency Crew"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Code Identifier</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. MERALCO"
                  value={agencyCode}
                  onChange={(e) => setAgencyCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Scope</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Mandate and coverage scope..."
                  value={agencyDesc}
                  onChange={(e) => setAgencyDesc(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Hotline / Phone"
                    value={agencyPhone}
                    onChange={(e) => setAgencyPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="ops@agency.gov.ph"
                    value={agencyEmail}
                    onChange={(e) => setAgencyEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setShowAgencyModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Agency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Announcement */}
      {showAnnModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "16px" }}>Post Community Notice</h3>
            <form onSubmit={handleCreateAnnouncement}>
              <div className="form-group">
                <label className="form-label">Announcement Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Scheduled Water Pipe Maintenance"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Detailed information for residents..."
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-control" value={annPriority} onChange={(e) => setAnnPriority(e.target.value)}>
                  <option value="NORMAL">Normal Advisory</option>
                  <option value="URGENT">Urgent Alert</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setShowAnnModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Moderation Action */}
      {moderationModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: "24px", maxWidth: "500px" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "16px" }}>
              {moderationModal.action === "REQUEST_INFO" ? "Request Additional Information" :
               moderationModal.action === "REJECT" ? "Reject Report" :
               moderationModal.action === "MARK_SPAM" ? "Mark as Spam" : "Moderation Action"}
            </h3>

            {moderationModal.action === "REQUEST_INFO" && (
              <>
                <div className="form-group">
                  <label className="form-label">What do you need from the resident?</label>
                  <select className="form-control" value={modVerifType} onChange={(e) => setModVerifType(e.target.value)}>
                    <option value="CONFIRM_LOCATION">Confirm Location</option>
                    <option value="RETAKE_PHOTO">Retake Photo</option>
                    <option value="ADD_DETAILS">Add More Details</option>
                    <option value="GENERAL">General Question</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Message to Resident</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Please confirm that this issue is currently present at the selected location."
                    value={modVerifMessage}
                    onChange={(e) => setModVerifMessage(e.target.value)}
                  />
                </div>
              </>
            )}

            {(moderationModal.action === "REJECT" || moderationModal.action === "MARK_SPAM") && (
              <>
                <div className="form-group">
                  <label className="form-label">Flag Type</label>
                  <select className="form-control" value={modFlagType} onChange={(e) => setModFlagType(e.target.value)}>
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
                <div className="form-group">
                  <label className="form-label">Reason / Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Internal reason for this decision..."
                    value={modReason}
                    onChange={(e) => setModReason(e.target.value)}
                  />
                </div>
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button type="button" onClick={() => setModerationModal(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                disabled={modActionLoading}
                onClick={() => handleModerationAction(moderationModal.reportId, moderationModal.action)}
                className="btn btn-primary"
              >
                {modActionLoading ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
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
