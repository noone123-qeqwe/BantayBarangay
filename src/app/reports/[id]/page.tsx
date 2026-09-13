"use client";

import React, { useEffect, useState, use } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import ReportTimeline from "@/components/ReportTimeline";
import ResolutionModal from "@/components/ResolutionModal";
import InteractiveMap from "@/components/InteractiveMap";
import AiVerificationSummaryCard from "@/components/AiVerificationSummaryCard";
import { ReportItem, AgencyItem, UserProfile } from "@/types";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Building2,
  User,
  ShieldCheck,
  Send,
  MessageSquare,
  Lock,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Camera,
  Loader2,
  Calendar,
  Layers,
  ChevronDown,
  Check,
  Sparkles,
  Navigation,
  Copy,
  ExternalLink,
  Crosshair,
} from "lucide-react";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [report, setReport] = useState<ReportItem | null>(null);
  const [agencies, setAgencies] = useState<AgencyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedGps, setCopiedGps] = useState(false);

  // Resolution verification modal for residents
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Staff operational form state
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState<string>("");
  const [statusPhotoUrl, setStatusPhotoUrl] = useState<string>("");
  const [isInternalStatusNote, setIsInternalStatusNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Staff update post state
  const [updateMsg, setUpdateMsg] = useState("");
  const [isInternalUpdate, setIsInternalUpdate] = useState(false);
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);

  // Agency & Priority assignment state
  const [selectedAgency, setSelectedAgency] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  const isStaff = user && ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(user.role);
  const isReporter = user && report && report.residentId === user.id;

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/${id}`);
      if (!res.ok) {
        throw new Error("Report not found or restricted.");
      }
      const data = await res.json();
      setReport(data.report);
      setNewStatus(data.report.status);
      setSelectedAgency(data.report.assignedAgencyId || "");
      setSelectedPriority(data.report.priority);
    } catch (err: any) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();

    fetch("/api/agencies")
      .then((res) => res.json())
      .then((data) => setAgencies(data.agencies || []))
      .catch((e) => console.error("Failed to load agencies", e));
  }, [id]);

  // Handle staff status update
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || !report) return;

    if (newStatus === "RESOLVED" && (!statusNote || statusNote.trim().length < 5)) {
      alert("Please provide a detailed resolution note explaining the fix.");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/reports/${report.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus,
          note: statusNote.trim() || `Status updated to ${newStatus}`,
          isInternal: isInternalStatusNote,
          photoUrl: statusPhotoUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status.");
      }

      setStatusNote("");
      setStatusPhotoUrl("");
      loadReport();
    } catch (err: any) {
      alert(err.message || "Status update failed.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle staff post update / note
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateMsg.trim() || !report) return;

    setIsPostingUpdate(true);
    try {
      const res = await fetch(`/api/reports/${report.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: updateMsg.trim(),
          isInternal: isInternalUpdate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post update.");
      }

      setUpdateMsg("");
      loadReport();
    } catch (err: any) {
      alert(err.message || "Failed to post update.");
    } finally {
      setIsPostingUpdate(false);
    }
  };

  // Handle agency / priority assignment save
  const handleAssignmentSave = async () => {
    if (!report) return;
    setIsSavingAssignment(true);
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedAgencyId: selectedAgency || null,
          priority: selectedPriority || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save assignment.");
      }
      loadReport();
    } catch (err: any) {
      alert(err.message || "Assignment adjustment failed.");
    } finally {
      setIsSavingAssignment(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <Loader2 size={36} className="spin" style={{ margin: "0 auto 12px auto", color: "var(--primary)" }} />
        <div style={{ color: "var(--text-muted)", fontSize: "0.938rem" }}>Loading report details...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="page-container" style={{ maxWidth: "600px", padding: "60px 20px", textAlign: "center" }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ margin: "0 auto 16px auto" }} />
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Report Not Found</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px", marginBottom: "24px" }}>
          {error || "The requested reference number was not found or has been restricted."}
        </p>
        <NextLink href="/reports" className="btn btn-primary">
          Back to Reports List
        </NextLink>
      </div>
    );
  }

  // SLA Calculation
  const isOverdue =
    report.slaDeadline &&
    new Date(report.slaDeadline) < new Date() &&
    !["CLOSED", "RESOLVED", "REJECTED"].includes(report.status);

  // Photos for ResolutionModal
  const originalPhoto =
    report.photos?.find((p) => p.photoType === "BEFORE" || !p.photoType)?.photoUrl ||
    report.photos?.[0]?.photoUrl;
  const resolutionPhoto =
    report.photos?.find((p) => p.photoType === "RESOLUTION")?.photoUrl ||
    report.statusHistory?.find((h) => h.photoUrl)?.photoUrl;

  return (
    <div className="page-container">
      {/* Back navigation */}
      <div style={{ marginBottom: "16px" }}>
        <NextLink
          href="/reports"
          className="btn btn-secondary btn-sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "44px",
            borderRadius: "12px",
            fontWeight: 700,
            padding: "8px 16px",
            color: "var(--text-primary)",
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Reports</span>
        </NextLink>
      </div>

      {/* TOP SECTION: Reference #, Status badge, Priority badge (Section 17) */}
      <div
        className="card"
        style={{
          padding: "24px 28px",
          marginBottom: "24px",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.375rem",
                  fontWeight: 800,
                  color: "var(--primary)",
                  letterSpacing: "0.03em",
                }}
              >
                {report.referenceNo}
              </span>
              <StatusBadge status={report.status} size="lg" />
              <PriorityBadge priority={report.priority} />
            </div>

            <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {report.title}
            </h1>
          </div>

          {/* SLA Target / Status Alert */}
          {report.slaDeadline && (
            <div
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-md)",
                backgroundColor: isOverdue ? "var(--danger-light)" : "var(--bg-subtle)",
                border: `1.5px solid ${isOverdue ? "var(--danger)" : "var(--border-medium)"}`,
                color: isOverdue ? "var(--danger-dark)" : "var(--text-secondary)",
                fontSize: "0.813rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Clock size={16} color={isOverdue ? "var(--danger)" : "var(--text-muted)"} />
              <div>
                <strong>{isOverdue ? "SLA Target Elapsed!" : "Target SLA Resolution:"}</strong>{" "}
                {new Date(report.slaDeadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          )}
        </div>

        {/* Location & Metadata Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
            fontSize: "0.813rem",
            color: "var(--text-muted)",
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "14px",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={15} color="var(--primary)" />
            <strong style={{ color: "var(--text-primary)" }}>{report.address}</strong>
          </span>

          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Building2 size={15} />
            Assigned: <strong>{report.assignedAgency?.name || "Pending Assignment"}</strong>
          </span>

          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={15} />
            Reported: {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>

          {report.resident && (
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <User size={15} />
              Reporter: {report.resident.name}
            </span>
          )}
        </div>
      </div>

      {/* RESOLUTION VERIFICATION PROMPT (Section 21) */}
      {report.status === "RESOLVED" && (isReporter || isStaff) && (
        <div
          style={{
            padding: "24px 28px",
            backgroundColor: "var(--success-light)",
            border: "2px solid var(--success)",
            borderRadius: "var(--radius-xl)",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.15)",
          }}
        >
          <div style={{ flex: "1 1 340px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <CheckCircle2 size={24} color="var(--success-dark)" />
              <strong style={{ fontSize: "1.125rem", color: "var(--success-dark)" }}>
                Issue Marked as Resolved — Resident Confirmation Required
              </strong>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
              The dispatched crew reports that work has finished. Please inspect the completed work and confirm whether the problem has actually been resolved in your area.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowVerifyModal(true)}
            className="btn btn-success btn-lg"
            style={{ fontWeight: 800, padding: "12px 28px" }}
          >
            <span>Confirm Resolution &rarr;</span>
          </button>
        </div>
      )}

      {/* Main Grid: Details + Staff Operations (Responsive 1-col on mobile, 2-col on desktop for staff) */}
      <div className={`report-detail-layout ${isStaff ? "is-staff" : ""}`}>
        {/* Left Column: Description, Photos, Location Map, Timeline, Updates */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Issue Details Card */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.063rem", fontWeight: 800, marginBottom: "12px" }}>Issue Details</h3>
            <p style={{ fontSize: "0.938rem", lineHeight: 1.6, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {report.description}
            </p>

            {report.landmark && (
              <div style={{ marginTop: "14px", fontSize: "0.813rem", color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)", padding: "10px 14px", borderRadius: "var(--radius-md)" }}>
                <strong>Landmark / Special Note:</strong> {report.landmark}
              </div>
            )}
          </div>

          {/* Photos Gallery */}
          {report.photos && report.photos.length > 0 && (
            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.063rem", fontWeight: 800, marginBottom: "16px" }}>
                Photo Evidence ({report.photos.length})
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
                {report.photos.map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      border: "1.5px solid var(--border-medium)",
                      backgroundColor: "var(--bg-subtle)",
                    }}
                  >
                    <a href={photo.photoUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={photo.photoUrl}
                        alt="Evidence photo"
                        style={{ width: "100%", height: "140px", objectFit: "cover" }}
                      />
                    </a>
                    <div style={{ padding: "8px 10px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <span
                        style={{
                          fontWeight: 800,
                          color: photo.photoType === "RESOLUTION" ? "var(--success-dark)" : "var(--primary)",
                          textTransform: "uppercase",
                        }}
                      >
                        [{photo.photoType} PHOTO]
                      </span>
                      {photo.caption && <div style={{ marginTop: "2px", color: "var(--text-primary)" }}>{photo.caption}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Map Preview & Responder Navigation */}
          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={18} color="var(--primary)" />
                <h3 style={{ fontSize: "1.063rem", fontWeight: 800, margin: 0 }}>Incident Location</h3>
              </div>
              {report.accuracy !== null && report.accuracy !== undefined && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: report.accuracy <= 15 ? "var(--success-dark)" : "var(--primary)",
                    backgroundColor: report.accuracy <= 15 ? "var(--success-light)" : "var(--primary-light)",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    border: `1px solid ${report.accuracy <= 15 ? "var(--success)" : "var(--primary)"}`,
                  }}
                >
                  <Crosshair size={13} />
                  <span>Location accuracy: &plusmn;{Math.round(report.accuracy)} meters</span>
                </span>
              )}
            </div>

            <InteractiveMap
              interactivePicker={false}
              initialLat={report.latitude}
              initialLng={report.longitude}
              accuracy={report.accuracy}
              reports={[report]}
              height="320px"
            />

            {/* Address & Landmark Guidance */}
            <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {report.address}
              </div>

              {report.landmark && (
                <div
                  style={{
                    fontSize: "0.813rem",
                    color: "var(--primary-dark)",
                    backgroundColor: "var(--primary-light)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Sparkles size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <span><strong>Responder Guide:</strong> {report.landmark}</span>
                </div>
              )}

              {/* Coordinates Bar & 1-Click Navigation */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  paddingTop: "10px",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                    Lat: {report.latitude.toFixed(6)}, Lng: {report.longitude.toFixed(6)}
                  </span>
                  {report.locationSource && (
                    <span style={{ backgroundColor: "var(--bg-subtle)", padding: "2px 8px", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
                      Source: {report.locationSource.replace(/_/g, " ")}
                    </span>
                  )}
                  {report.locationCapturedAt && (
                    <span style={{ backgroundColor: "var(--bg-subtle)", padding: "2px 8px", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
                      Captured: {new Date(report.locationCapturedAt).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                      {new Date(report.locationCapturedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`);
                      setCopiedGps(true);
                      setTimeout(() => setCopiedGps(false), 2000);
                    }}
                    title="Copy Exact GPS Coordinates"
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      padding: "2px",
                      color: copiedGps ? "var(--success)" : "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {copiedGps ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Turn-by-Turn Navigation for Dispatch & Responders */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                  >
                    <ExternalLink size={13} />
                    <span>Google Maps</span>
                  </a>
                  <a
                    href={`https://waze.com/ul?ll=${report.latitude},${report.longitude}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                  >
                    <Navigation size={13} color="#00d4ff" />
                    <span>Waze</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Status Progression Timeline (Section 18) */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.063rem", fontWeight: 800, marginBottom: "18px" }}>
              Status Progression Timeline
            </h3>
            <ReportTimeline
              history={report.statusHistory || []}
              currentStatus={report.status}
              isStaffViewer={Boolean(isStaff)}
            />
          </div>

          {/* Progress Updates Feed */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.063rem", fontWeight: 800, marginBottom: "16px" }}>Public Progress Updates</h3>

            {report.updates && report.updates.length > 0 ? (
              <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
                {report.updates.map((update) => (
                  <div
                    key={update.id}
                    style={{
                      padding: "14px 18px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: update.isInternal ? "var(--danger-light)" : "var(--bg-subtle)",
                      border: `1px solid ${update.isInternal ? "var(--danger)" : "var(--border-subtle)"}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "0.813rem", color: "var(--text-primary)" }}>
                        {update.author?.name || "Operations Desk"}{" "}
                        {update.isInternal && <span style={{ color: "var(--danger)", fontSize: "0.7rem" }}>[INTERNAL NOTE]</span>}
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {new Date(update.createdAt).toLocaleDateString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", margin: 0 }}>
                      {update.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "16px" }}>
                No progress updates posted yet.
              </p>
            )}

            {/* Post update box for Staff */}
            {isStaff && (
              <form onSubmit={handleUpdateSubmit} style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "18px" }}>
                <label className="form-label">Post Update / Operational Note</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Dispatched maintenance truck; excavation underway..."
                  value={updateMsg}
                  onChange={(e) => setUpdateMsg(e.target.value)}
                  required
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.813rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isInternalUpdate}
                      onChange={(e) => setIsInternalUpdate(e.target.checked)}
                    />
                    <span style={{ color: isInternalUpdate ? "var(--danger)" : "var(--text-secondary)" }}>
                      Internal Staff Note (Hidden from resident)
                    </span>
                  </label>

                  <button type="submit" disabled={isPostingUpdate} className="btn btn-sm btn-primary">
                    {isPostingUpdate ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                    <span>Post Update</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Staff Operational Panel */}
        {isStaff && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* AI Verification & Moderation Card */}
            <AiVerificationSummaryCard
              reportId={report.id}
              referenceNo={report.referenceNo}
              riskAssessment={report.riskAssessment}
              onActionComplete={loadReport}
            />

            {/* Status Transition Card */}
            <div className="card" style={{ padding: "24px", border: "2px solid var(--primary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <ShieldCheck size={20} color="var(--primary)" />
                <h3 style={{ fontSize: "1.063rem", fontWeight: 800 }}>Staff Action Controls</h3>
              </div>

              <form onSubmit={handleStatusSubmit}>
                <div className="form-group">
                  <label className="form-label">Advance Report Status</label>
                  <select
                    className="form-control"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="RECEIVED">Received</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="RESOLVED">Resolved — Awaiting Verification</option>
                    <option value="CLOSED">Closed (Completed)</option>
                    <option value="REJECTED">Rejected (Out of scope / Invalid)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {newStatus === "RESOLVED" ? "Resolution Note (Required) *" : "Status Transition Note"}
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder={
                      newStatus === "RESOLVED"
                        ? "Describe how the issue was fixed (e.g. Asphated 12-inch crater, flushed sewer line)..."
                        : "Reason or context for status update..."
                    }
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    required={newStatus === "RESOLVED"}
                  />
                </div>

                {newStatus === "RESOLVED" && (
                  <div className="form-group">
                    <label className="form-label">Resolution Photo URL (Proof of Completion)</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://... or /uploads/..."
                      value={statusPhotoUrl}
                      onChange={(e) => setStatusPhotoUrl(e.target.value)}
                    />
                    <span className="form-hint">Upload after-repair photo for resident verification.</span>
                  </div>
                )}

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.813rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isInternalStatusNote}
                      onChange={(e) => setIsInternalStatusNote(e.target.checked)}
                    />
                    <span>Internal Transition (Do not notify resident)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingStatus || newStatus === report.status}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {isUpdatingStatus ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                  <span>Apply Status Change</span>
                </button>
              </form>
            </div>

            {/* Assignment & Priority Adjuster */}
            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.063rem", fontWeight: 800, marginBottom: "16px" }}>
                Agency & Priority Routing
              </h3>

              <div className="form-group">
                <label className="form-label">Responsible Agency</label>
                <select
                  className="form-control"
                  value={selectedAgency}
                  onChange={(e) => setSelectedAgency(e.target.value)}
                >
                  <option value="">-- Select Responding Agency --</option>
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name} ({agency.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Official Priority</label>
                <select
                  className="form-control"
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical Hazard</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAssignmentSave}
                disabled={isSavingAssignment}
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isSavingAssignment ? <Loader2 size={16} className="spin" /> : <Building2 size={16} />}
                <span>Save Routing Adjustments</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verification Modal with Before & After Photos (Section 21) */}
      {showVerifyModal && (
        <ResolutionModal
          reportId={report.id}
          referenceNo={report.referenceNo}
          originalPhoto={originalPhoto || undefined}
          resolutionPhoto={resolutionPhoto || undefined}
          isOpen={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          onSuccess={() => {
            loadReport();
          }}
        />
      )}

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .report-detail-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 1024px) {
          .report-detail-layout.is-staff {
            grid-template-columns: 1.8fr 1.2fr;
            gap: 24px;
          }
        }
      `}</style>
    </div>
  );
}
