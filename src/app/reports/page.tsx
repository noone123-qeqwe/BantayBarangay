"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { ReportItem, CategoryItem, ReportStatus, ReportPriority } from "@/types";
import {
  Search,
  Filter,
  PlusCircle,
  FileText,
  Clock,
  MapPin,
  ChevronRight,
  Loader2,
  X,
  AlertTriangle,
  Download,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Camera,
  CheckCircle2,
  Wrench,
  Flame,
} from "lucide-react";

export default function ReportsListPage() {
  const { user, loading } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [fetching, setFetching] = useState(true);

  // Quick Resident Tabs: ALL | PENDING | IN_PROGRESS | RESOLVED (Section 16)
  const [activeQuickTab, setActiveQuickTab] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "RESOLVED">("ALL");

  // Advanced Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [mineOnly, setMineOnly] = useState(false);

  const isStaff = user && ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(user.role);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch((e) => console.error("Category load error:", e));
  }, []);

  const loadReports = async () => {
    try {
      setFetching(true);
      const params = new URLSearchParams();

      if (activeQuickTab !== "ALL" && selectedStatus === "ALL") {
        if (activeQuickTab === "PENDING") params.append("status", "SUBMITTED");
        else if (activeQuickTab === "IN_PROGRESS") params.append("status", "IN_PROGRESS");
        else if (activeQuickTab === "RESOLVED") params.append("status", "RESOLVED");
      } else if (selectedStatus !== "ALL") {
        params.append("status", selectedStatus);
      }

      if (selectedCategory !== "ALL") params.append("categoryId", selectedCategory);
      if (selectedPriority !== "ALL") params.append("priority", selectedPriority);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (mineOnly) params.append("mine", "true");
      params.append("limit", "50");

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadReports();
    }
  }, [user, loading, activeQuickTab, selectedStatus, selectedCategory, selectedPriority, mineOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReports();
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedCategory("ALL");
    setSelectedPriority("ALL");
    setActiveQuickTab("ALL");
    setMineOnly(false);
  };

  // CSV Export for Admin/Staff
  const handleExportCSV = () => {
    if (reports.length === 0) return;
    const headers = ["Reference", "Title", "Category", "Status", "Priority", "Address", "Date Reported"];
    const rows = reports.map((r) => [
      r.referenceNo,
      `"${r.title.replace(/"/g, '""')}"`,
      r.category?.name || "",
      r.status,
      r.priority,
      `"${r.address.replace(/"/g, '""')}"`,
      new Date(r.createdAt).toISOString().split("T")[0],
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bantay-reports-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Category Color Class Helper
  const getCategoryBadgeClass = (catName?: string) => {
    const name = (catName || "").toLowerCase();
    if (name.includes("road") || name.includes("pothole")) return "category-badge-road";
    if (name.includes("light") || name.includes("electric") || name.includes("wire") || name.includes("post")) return "category-badge-light";
    if (name.includes("water") || name.includes("flood")) return "category-badge-water";
    if (name.includes("drain") || name.includes("sewer") || name.includes("pipe")) return "category-badge-drainage";
    if (name.includes("waste") || name.includes("garbage") || name.includes("trash")) return "category-badge-waste";
    if (name.includes("tree") || name.includes("branch")) return "category-badge-tree";
    return "category-badge-hazard";
  };

  // Active filter chips list (Section 26)
  const categoryName = categories.find((c) => c.id === selectedCategory)?.name;
  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  if (selectedCategory !== "ALL" && categoryName) {
    activeChips.push({ key: "cat", label: categoryName, onRemove: () => setSelectedCategory("ALL") });
  }
  if (selectedPriority !== "ALL") {
    activeChips.push({ key: "pri", label: `${selectedPriority} Priority`, onRemove: () => setSelectedPriority("ALL") });
  }
  if (selectedStatus !== "ALL") {
    activeChips.push({ key: "sta", label: selectedStatus.replace(/_/g, " "), onRemove: () => setSelectedStatus("ALL") });
  }
  if (searchQuery.trim()) {
    activeChips.push({ key: "q", label: `"${searchQuery.trim()}"`, onRemove: () => setSearchQuery("") });
  }

  // Summary counts
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => ["SUBMITTED", "RECEIVED", "UNDER_REVIEW"].includes(r.status)).length;
  const inProgressCount = reports.filter((r) => ["ASSIGNED", "IN_PROGRESS"].includes(r.status)).length;
  const resolvedCount = reports.filter((r) => ["RESOLVED", "CLOSED"].includes(r.status)).length;

  return (
    <div className="page-container">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(2, 132, 199, 0.3)",
              }}
            >
              <FileText size={22} />
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>
              {isStaff ? "Barangay Report Queue & Operations" : "My Reports"}
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.938rem", marginTop: "4px" }}>
            {isStaff
              ? "Operational triage, assignment, status progression, and SLA response targets"
              : "Track live progress, view evidence updates, and verify completed infrastructure repairs"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {isStaff && (
            <button type="button" onClick={handleExportCSV} className="btn btn-secondary btn-sm">
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          )}

          <NextLink href="/reports/new" className="btn btn-primary btn-sm">
            <PlusCircle size={16} />
            <span>+ Report Issue</span>
          </NextLink>
        </div>
      </div>

      {/* COLORFUL STATS SUMMARY CARDS (Desktop only) */}
      <div
        className="desktop-stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <div
          onClick={() => {
            setActiveQuickTab("ALL");
            setSelectedStatus("ALL");
          }}
          className="card card-accent-blue card-interactive"
          style={{
            padding: "16px 18px",
            background: activeQuickTab === "ALL" ? "linear-gradient(180deg, rgba(2, 132, 199, 0.08) 0%, var(--bg-card) 100%)" : "var(--bg-card)",
            border: activeQuickTab === "ALL" ? "1.5px solid var(--primary)" : "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase" }}>
              Total Reports
            </span>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={15} />
            </div>
          </div>
          <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
            {totalCount}
          </div>
        </div>

        <div
          onClick={() => {
            setActiveQuickTab("PENDING");
            setSelectedStatus("ALL");
          }}
          className="card card-accent-amber card-interactive"
          style={{
            padding: "16px 18px",
            background: activeQuickTab === "PENDING" ? "linear-gradient(180deg, rgba(245, 158, 11, 0.1) 0%, var(--bg-card) 100%)" : "var(--bg-card)",
            border: activeQuickTab === "PENDING" ? "1.5px solid var(--accent)" : "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase" }}>
              Pending Review
            </span>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "var(--accent-light)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={15} />
            </div>
          </div>
          <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--accent)", marginTop: "4px" }}>
            {pendingCount}
          </div>
        </div>

        <div
          onClick={() => {
            setActiveQuickTab("IN_PROGRESS");
            setSelectedStatus("ALL");
          }}
          className="card card-accent-purple card-interactive"
          style={{
            padding: "16px 18px",
            background: activeQuickTab === "IN_PROGRESS" ? "linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, var(--bg-card) 100%)" : "var(--bg-card)",
            border: activeQuickTab === "IN_PROGRESS" ? "1.5px solid #6366f1" : "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase" }}>
              In Progress
            </span>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "rgba(99, 102, 241, 0.12)", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wrench size={15} />
            </div>
          </div>
          <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "#6366f1", marginTop: "4px" }}>
            {inProgressCount}
          </div>
        </div>

        <div
          onClick={() => {
            setActiveQuickTab("RESOLVED");
            setSelectedStatus("ALL");
          }}
          className="card card-accent-emerald card-interactive"
          style={{
            padding: "16px 18px",
            background: activeQuickTab === "RESOLVED" ? "linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, var(--bg-card) 100%)" : "var(--bg-card)",
            border: activeQuickTab === "RESOLVED" ? "1.5px solid var(--status-resolved)" : "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--status-resolved-dark)", textTransform: "uppercase" }}>
              Resolved / Closed
            </span>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "var(--status-resolved-bg)", color: "var(--status-resolved)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--status-resolved-dark)", marginTop: "4px" }}>
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* VIBRANT RESIDENT QUICK STATUS SEGMENTED CONTROL */}
      <div className="reports-tabs-bar">
        {[
          { key: "ALL", label: "All", count: totalCount },
          { key: "PENDING", label: "Pending", count: pendingCount },
          { key: "IN_PROGRESS", label: "In Progress", count: inProgressCount },
          { key: "RESOLVED", label: "Resolved", count: resolvedCount },
        ].map((tab) => {
          const isActive = activeQuickTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveQuickTab(tab.key as any);
                setSelectedStatus("ALL");
              }}
              className={`reports-tab-pill ${isActive ? "active" : ""}`}
            >
              <span>{tab.label}</span>
              <span className="pill-badge">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: "16px",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search Box */}
          <div style={{ flex: "2 1 240px", position: "relative" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search reference #, title, or street..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "36px" }}
            />
            <Search
              size={18}
              color="var(--primary)"
              style={{ position: "absolute", left: "10px", top: "12px" }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ flex: "1 1 140px" }}>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ flex: "1 1 150px" }}>
            <select
              className="form-control"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ flex: "1 1 130px" }}>
            <select
              className="form-control"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
            <Search size={16} />
            <span>Search</span>
          </button>
        </form>

        {isStaff && (
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.813rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => setMineOnly(e.target.checked)}
              />
              <span>Show only reports filed by me</span>
            </label>
          </div>
        )}
      </div>

      {/* REMOVABLE FILTER CHIPS (Section 26) */}
      {activeChips.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Active:
          </span>
          {activeChips.map((chip) => (
            <span key={chip.key} className="filter-chip">
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove filter ${chip.label}`}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "inherit",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={13} />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={handleClearAll}
            style={{
              background: "none",
              border: "none",
              color: "var(--danger)",
              fontSize: "0.813rem",
              fontWeight: 700,
              cursor: "pointer",
              marginLeft: "4px",
              textDecoration: "underline",
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* CONTENT: DESKTOP TABLE vs MOBILE CARDS */}
      {fetching ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px auto", color: "var(--primary)" }} />
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading reports...</div>
        </div>
      ) : reports.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "60px 20px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <FileText size={48} style={{ margin: "0 auto 14px auto", opacity: 0.5 }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
            No reports found
          </h3>
          <p style={{ fontSize: "0.875rem", maxWidth: "420px", margin: "6px auto 20px auto" }}>
            No infrastructure reports match your active search filters.
          </p>
          <button type="button" onClick={handleClearAll} className="btn btn-secondary">
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          {/* 1. Desktop Data Table */}
          <div className="table-container desktop-reports-table">
            <table className="table">
              <thead>
                <tr style={{ background: "var(--bg-subtle)" }}>
                  <th>Reference #</th>
                  <th>Category</th>
                  <th>Issue Details</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Agency / Assigned</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <NextLink
                        href={`/reports/${report.referenceNo}`}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 800,
                          color: "var(--primary)",
                          textDecoration: "none",
                        }}
                      >
                        {report.referenceNo}
                      </NextLink>
                    </td>
                    <td>
                      <span className={`category-badge ${getCategoryBadgeClass(report.category?.name)}`}>
                        {report.category?.name || "General"}
                      </span>
                    </td>
                    <td style={{ maxWidth: "240px" }}>
                      <strong style={{ display: "block", fontSize: "0.875rem" }}>{report.title}</strong>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {report.description}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.813rem" }}>{report.address.split(",")[0]}</span>
                    </td>
                    <td>
                      <PriorityBadge priority={report.priority} />
                    </td>
                    <td>
                      <StatusBadge status={report.status} size="sm" />
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-subtle)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {report.assignedAgency?.code || "Unassigned"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </td>
                    <td>
                      <NextLink href={`/reports/${report.referenceNo}`} className="btn btn-sm btn-primary">
                        <span>View</span>
                        <ChevronRight size={14} />
                      </NextLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2. Mobile Responsive Cards View */}
          <div className="mobile-reports-cards" style={{ display: "none", flexDirection: "column", gap: "12px" }}>
            {reports.map((report) => {
              const photoUrl = report.photos && report.photos[0]?.photoUrl;
              const formattedDate = new Date(report.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <NextLink
                  key={report.id}
                  href={`/reports/${report.referenceNo}`}
                  className="card card-interactive"
                  style={{
                    padding: "16px",
                    display: "flex",
                    gap: "14px",
                    alignItems: "center",
                    textDecoration: "none",
                  }}
                >
                  {/* Photo or Category Icon Thumbnail */}
                  <div
                    style={{
                      width: "62px",
                      height: "62px",
                      borderRadius: "12px",
                      backgroundColor: "var(--bg-subtle)",
                      overflow: "hidden",
                      flexShrink: 0,
                      border: "1.5px solid var(--border-medium)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={report.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Camera size={22} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)" }}>
                        {report.referenceNo}
                      </span>
                      <span className={`category-badge ${getCategoryBadgeClass(report.category?.name)}`} style={{ fontSize: "0.688rem", padding: "1px 6px" }}>
                        {report.category?.name}
                      </span>
                      <StatusBadge status={report.status} size="sm" />
                      <PriorityBadge priority={report.priority} />
                    </div>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "0.9rem",
                        color: "var(--text-primary)",
                        lineHeight: 1.3,
                        marginBottom: "2px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {report.title}
                    </strong>

                    <p
                      style={{
                        fontSize: "0.775rem",
                        color: "var(--text-secondary)",
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        margin: "1px 0 4px 0",
                        lineHeight: 1.35,
                      }}
                    >
                      {report.description}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.72rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <MapPin size={11} color="var(--primary)" />
                        <span>{report.address.split(",")[0]}</span>
                      </span>
                      <span>•</span>
                      <span>{formattedDate}</span>
                      {report.assignedAgency?.code && (
                        <>
                          <span>•</span>
                          <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                            {report.assignedAgency.code}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </NextLink>
              );
            })}
          </div>
        </>
      )}

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .reports-tabs-bar {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          margin-bottom: 16px;
          padding-bottom: 4px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .reports-tabs-bar::-webkit-scrollbar {
          display: none;
        }

        .reports-tab-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 0.813rem;
          font-weight: 700;
          border: 1px solid var(--border-medium);
          background: var(--bg-surface);
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
        .reports-tab-pill.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
        }

        .pill-badge {
          background: rgba(0, 0, 0, 0.08);
          padding: 1px 7px;
          border-radius: 9999px;
          font-size: 0.688rem;
          font-weight: 800;
        }
        .reports-tab-pill.active .pill-badge {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }

        @media (max-width: 880px) {
          .desktop-stats-grid {
            display: none !important;
          }
          .desktop-reports-table {
            display: none !important;
          }
          .mobile-reports-cards {
            display: flex !important;
            gap: 10px !important;
            padding-bottom: 24px;
          }
          .mobile-reports-cards .card {
            padding: 12px 14px !important;
            gap: 12px !important;
            border-radius: 14px !important;
            transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease !important;
          }
          .mobile-reports-cards .card:active {
            transform: scale(0.98) !important;
            background-color: var(--bg-subtle) !important;
          }
          .reports-tab-pill:active {
            transform: scale(0.94) !important;
          }
        }
      `}</style>
    </div>
  );
}
