"use client";

import React, { useState, useEffect } from "react";
import {
  Languages,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Edit2,
  History,
  RotateCcw,
  Loader2,
  Check,
  X,
  BookOpen,
  Filter,
  Tag,
  Clock,
  User,
} from "lucide-react";

interface GlossaryItem {
  id: string;
  term: string;
  category: string;
  masbateno: string;
  filipino: string;
  english: string;
  contextOrNotes?: string | null;
  status: "VERIFIED" | "NEEDS_REVIEW" | "INCORRECT" | "UNNATURAL" | "UNCERTAIN";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuditLogItem {
  id: string;
  glossaryId: string;
  actorId?: string;
  actorName?: string;
  changeType: string;
  previousState?: string | null;
  newState?: string | null;
  note?: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { key: "ALL", label: "All Categories" },
  { key: "common_words", label: "Common Words" },
  { key: "greetings", label: "Greetings" },
  { key: "questions", label: "Questions" },
  { key: "report_terms", label: "Report Terms" },
  { key: "location_terms", label: "Location Terms" },
  { key: "infrastructure_terms", label: "Infrastructure (10 Domains)" },
  { key: "status_messages", label: "Status Messages" },
  { key: "notifications", label: "Notifications" },
  { key: "error_messages", label: "Error Messages" },
  { key: "help_instructions", label: "Help Instructions" },
  { key: "ui_labels", label: "UI Labels" },
  { key: "common_local_expressions", label: "Local Expressions" },
];

const STATUSES = [
  { key: "ALL", label: "All Statuses" },
  { key: "VERIFIED", label: "Verified", color: "var(--success)" },
  { key: "NEEDS_REVIEW", label: "Needs Review", color: "var(--warning)" },
  { key: "UNCERTAIN", label: "Uncertain", color: "#f97316" },
  { key: "UNNATURAL", label: "Unnatural", color: "#8b5cf6" },
  { key: "INCORRECT", label: "Incorrect", color: "var(--danger)" },
];

export default function MasbatenoLanguageTab() {
  const [items, setItems] = useState<GlossaryItem[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    verified: 0,
    needsReview: 0,
    uncertain: 0,
    unnatural: 0,
    incorrect: 0,
    active: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GlossaryItem | null>(null);
  const [reviewModalItem, setReviewModalItem] = useState<GlossaryItem | null>(null);
  const [auditItem, setAuditItem] = useState<GlossaryItem | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Form fields
  const [formTerm, setFormTerm] = useState("");
  const [formCategory, setFormCategory] = useState("infrastructure_terms");
  const [formMasbateno, setFormMasbateno] = useState("");
  const [formFilipino, setFormFilipino] = useState("");
  const [formEnglish, setFormEnglish] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState<any>("VERIFIED");
  const [formIsActive, setFormIsActive] = useState(true);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGlossary();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const loadGlossary = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/admin/language/glossary?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.entries || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load glossary entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormTerm("");
    setFormCategory("infrastructure_terms");
    setFormMasbateno("");
    setFormFilipino("");
    setFormEnglish("");
    setFormNotes("");
    setFormStatus("VERIFIED");
    setFormIsActive(true);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: GlossaryItem) => {
    setEditingItem(item);
    setFormTerm(item.term);
    setFormCategory(item.category);
    setFormMasbateno(item.masbateno);
    setFormFilipino(item.filipino);
    setFormEnglish(item.english);
    setFormNotes(item.contextOrNotes || "");
    setFormStatus(item.status);
    setFormIsActive(item.isActive);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTerm || !formMasbateno || !formFilipino || !formEnglish) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/language/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: formTerm,
          category: formCategory,
          masbateno: formMasbateno,
          filipino: formFilipino,
          english: formEnglish,
          contextOrNotes: formNotes,
          status: formStatus,
          isActive: formIsActive,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        loadGlossary();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to add translation");
      }
    } catch (err) {
      alert("Error creating translation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/language/glossary/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formCategory,
          masbateno: formMasbateno,
          filipino: formFilipino,
          english: formEnglish,
          contextOrNotes: formNotes,
          status: formStatus,
          isActive: formIsActive,
          note: `Modified via Admin Language Manager`,
        }),
      });
      if (res.ok) {
        setEditingItem(null);
        loadGlossary();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update translation");
      }
    } catch (err) {
      alert("Error updating translation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickReviewFlag = async (item: GlossaryItem, newStatus: string, noteText: string = "") => {
    try {
      const res = await fetch("/api/admin/language/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          glossaryId: item.id,
          status: newStatus,
          note: noteText || `Reviewer marked status as ${newStatus}`,
        }),
      });
      if (res.ok) {
        setReviewModalItem(null);
        setReviewNote("");
        loadGlossary();
      } else {
        alert("Failed to update review status");
      }
    } catch (err) {
      alert("Network error updating status");
    }
  };

  const handleToggleActive = async (item: GlossaryItem) => {
    try {
      const res = await fetch(`/api/admin/language/glossary/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !item.isActive,
          note: item.isActive ? "Disabled translation" : "Re-enabled translation",
        }),
      });
      if (res.ok) {
        loadGlossary();
      }
    } catch (err) {
      alert("Error toggling active state");
    }
  };

  const handleViewAudit = async (item: GlossaryItem) => {
    setAuditItem(item);
    setLoadingAudit(true);
    try {
      const res = await fetch(`/api/admin/language/audit?glossaryId=${item.id}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error loading audit trail:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
            <CheckCircle2 size={12} /> Verified
          </span>
        );
      case "NEEDS_REVIEW":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
            <Clock size={12} /> Needs Review
          </span>
        );
      case "UNCERTAIN":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: "rgba(249, 115, 22, 0.1)", color: "#f97316" }}>
            <HelpCircle size={12} /> Uncertain
          </span>
        );
      case "UNNATURAL":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
            <AlertTriangle size={12} /> Unnatural
          </span>
        );
      case "INCORRECT":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
            <XCircle size={12} /> Incorrect
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div>
      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <div className="card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "0.813rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Terms</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "4px", color: "var(--primary)" }}>{stats.total}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Across 12 categories</div>
        </div>

        <div className="card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "0.813rem", color: "var(--text-muted)", fontWeight: 600 }}>Verified Authentic</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "4px", color: "#10b981" }}>{stats.verified}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Locally approved</div>
        </div>

        <div className="card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "0.813rem", color: "var(--text-muted)", fontWeight: 600 }}>Needs Review</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "4px", color: "#f59e0b" }}>{stats.needsReview}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Pending linguist check</div>
        </div>

        <div className="card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "0.813rem", color: "var(--text-muted)", fontWeight: 600 }}>Uncertain / Unnatural</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "4px", color: "#8b5cf6" }}>
            {stats.uncertain + stats.unnatural + stats.incorrect}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Flagged for correction</div>
        </div>
      </div>

      {/* Control Bar: Search, Category, Status Filter, Add Button */}
      <div
        className="card"
        style={{
          padding: "16px",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: "1 1 500px" }}>
          <div style={{ position: "relative", minWidth: "240px", flex: "1" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              className="input"
              placeholder="Search Masbateño, English, Filipino..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "36px", width: "100%" }}
            />
          </div>

          <select
            className="input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ minWidth: "180px" }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>

          <select
            className="input"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ minWidth: "140px" }}
          >
            {STATUSES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
        >
          <Plus size={16} /> Add Translation
        </button>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-card-subtle)", borderBottom: "1px solid var(--border-medium)" }}>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Term / Identifier</th>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Category</th>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Authentic Masbateño (Minasbate)</th>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Filipino</th>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>English Meaning</th>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Review Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 700 }}>Active</th>
                <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <Loader2 size={24} className="spin" style={{ margin: "0 auto", color: "var(--primary)" }} />
                    <p style={{ marginTop: "8px", color: "var(--text-muted)" }}>Loading Minasbate glossary entries...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No glossary terms match your current filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid var(--border-light)",
                      opacity: item.isActive ? 1 : 0.5,
                      transition: "background-color 0.15s",
                    }}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 700, fontFamily: "monospace", color: "var(--primary)" }}>
                      {item.term}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "0.75rem", padding: "3px 8px", borderRadius: "6px", backgroundColor: "var(--bg-card-subtle)", color: "var(--text-muted)", fontWeight: 600 }}>
                        {item.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-main)" }}>
                      {item.masbateno}
                      {item.contextOrNotes && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          ℹ️ {item.contextOrNotes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{item.filipino}</td>
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{item.english}</td>
                    <td style={{ padding: "12px 16px" }}>{getStatusBadge(item.status)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          border: "none",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          backgroundColor: item.isActive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          color: item.isActive ? "#10b981" : "#ef4444",
                        }}
                      >
                        {item.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="btn btn-secondary"
                          style={{ padding: "6px", borderRadius: "6px" }}
                          title="Edit Translation"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewModalItem(item)}
                          className="btn btn-secondary"
                          style={{ padding: "6px", borderRadius: "6px", color: "#f59e0b" }}
                          title="Human Review Flagging"
                        >
                          <AlertTriangle size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewAudit(item)}
                          className="btn btn-secondary"
                          style={{ padding: "6px", borderRadius: "6px" }}
                          title="View Revision Audit Trail"
                        >
                          <History size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Translation Modal */}
      {showAddModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card" style={{ backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "560px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Languages size={22} color="var(--primary)" />
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Add Verified Minasbate Term</h3>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAdd}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Term Identifier *</label>
                  <input type="text" required placeholder="e.g. pothole_deep" className="input" style={{ width: "100%" }} value={formTerm} onChange={(e) => setFormTerm(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Category *</label>
                  <select className="input" style={{ width: "100%" }} value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                    {CATEGORIES.filter((c) => c.key !== "ALL").map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Authentic Masbateño Translation *</label>
                <input type="text" required placeholder="Minasbate phrasing (e.g. daku nga lubak sa kalsada)" className="input" style={{ width: "100%" }} value={formMasbateno} onChange={(e) => setFormMasbateno(e.target.value)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Filipino Equivalent *</label>
                  <input type="text" required placeholder="e.g. malaking lubak" className="input" style={{ width: "100%" }} value={formFilipino} onChange={(e) => setFormFilipino(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>English Meaning *</label>
                  <input type="text" required placeholder="e.g. large pothole" className="input" style={{ width: "100%" }} value={formEnglish} onChange={(e) => setFormEnglish(e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Usage Context / Linguistic Notes</label>
                <textarea rows={2} placeholder="Explain local usage or distinctions from Waray/Cebuano..." className="input" style={{ width: "100%" }} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {submitting ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Save Translation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Translation Modal */}
      {editingItem && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card" style={{ backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "560px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Edit2 size={20} color="var(--primary)" />
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Edit Translation: {editingItem.term}</h3>
              </div>
              <button type="button" onClick={() => setEditingItem(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Masbateño (Minasbate)</label>
                <input type="text" required className="input" style={{ width: "100%" }} value={formMasbateno} onChange={(e) => setFormMasbateno(e.target.value)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Filipino</label>
                  <input type="text" required className="input" style={{ width: "100%" }} value={formFilipino} onChange={(e) => setFormFilipino(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>English</label>
                  <input type="text" required className="input" style={{ width: "100%" }} value={formEnglish} onChange={(e) => setFormEnglish(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Category</label>
                  <select className="input" style={{ width: "100%" }} value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                    {CATEGORIES.filter((c) => c.key !== "ALL").map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Review Status</label>
                  <select className="input" style={{ width: "100%" }} value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                    {STATUSES.filter((s) => s.key !== "ALL").map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Usage Context / Notes</label>
                <textarea rows={2} className="input" style={{ width: "100%" }} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" onClick={() => setEditingItem(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {submitting ? <Loader2 size={16} className="spin" /> : <Check size={16} />} Update Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Human Review Modal */}
      {reviewModalItem && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card" style={{ backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "500px", padding: "24px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Human Linguistic Review</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "16px" }}>
              Evaluate accuracy and naturalness for Minasbate speakers:
            </p>

            <div style={{ backgroundColor: "var(--bg-card-subtle)", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
              <div style={{ fontWeight: 700, color: "var(--primary)" }}>{reviewModalItem.masbateno}</div>
              <div style={{ fontSize: "0.813rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Filipino: {reviewModalItem.filipino} | English: {reviewModalItem.english}
              </div>
            </div>

            <label style={{ fontSize: "0.813rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Reviewer Note / Feedback</label>
            <input
              type="text"
              placeholder="e.g. Corrected marker from Waray 'hin' to Masbateño 'sin'"
              className="input"
              style={{ width: "100%", marginBottom: "16px" }}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => handleQuickReviewFlag(reviewModalItem, "VERIFIED", reviewNote)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #10b981", backgroundColor: "rgba(16,185,129,0.1)", color: "#10b981", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
              >
                <CheckCircle2 size={16} /> Mark Verified
              </button>

              <button
                type="button"
                onClick={() => handleQuickReviewFlag(reviewModalItem, "NEEDS_REVIEW", reviewNote)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #f59e0b", backgroundColor: "rgba(245,158,11,0.1)", color: "#f59e0b", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
              >
                <Clock size={16} /> Needs Review
              </button>

              <button
                type="button"
                onClick={() => handleQuickReviewFlag(reviewModalItem, "UNNATURAL", reviewNote)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #8b5cf6", backgroundColor: "rgba(139,92,246,0.1)", color: "#8b5cf6", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
              >
                <AlertTriangle size={16} /> Flag Unnatural
              </button>

              <button
                type="button"
                onClick={() => handleQuickReviewFlag(reviewModalItem, "INCORRECT", reviewNote)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ef4444", backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
              >
                <XCircle size={16} /> Flag Incorrect
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setReviewModalItem(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Audit Drawer / Modal */}
      {auditItem && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card" style={{ backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "640px", maxHeight: "80vh", display: "flex", flexDirection: "column", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <History size={20} color="var(--primary)" />
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Revision History: {auditItem.term}</h3>
              </div>
              <button type="button" onClick={() => setAuditItem(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
              {loadingAudit ? (
                <div style={{ textAlign: "center", padding: "30px" }}>
                  <Loader2 size={24} className="spin" style={{ margin: "0 auto", color: "var(--primary)" }} />
                </div>
              ) : auditLogs.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>
                  No historical revision changes recorded for this entry yet.
                </p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} style={{ borderBottom: "1px solid var(--border-light)", padding: "12px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.813rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                        {log.changeType.replace(/_/g, " ")}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.813rem", color: "var(--text-main)", marginTop: "4px" }}>
                      {log.note || "No note recorded"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      Editor: {log.actorName || "System / Staff"}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button type="button" onClick={() => setAuditItem(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
