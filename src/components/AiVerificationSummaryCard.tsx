"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Sparkles,
  Loader2,
  Send,
  Copy,
  Layers,
  Flame,
  Info,
} from "lucide-react";

interface AiVerificationSummaryCardProps {
  reportId: string;
  referenceNo: string;
  riskAssessment?: {
    totalScore: number;
    riskLevel: string;
    textScore: number;
    imageScore: number;
    duplicateScore: number;
    locationScore: number;
    behaviorScore: number;
    categoryMismatchScore: number;
    signals?: string | null;
    summary?: string | null;
  } | null;
  onActionComplete: () => void;
}

export default function AiVerificationSummaryCard({
  reportId,
  referenceNo,
  riskAssessment,
  onActionComplete,
}: AiVerificationSummaryCardProps) {
  const [activeModal, setActiveModal] = useState<"REQUEST_INFO" | "REJECT" | "MARK_SPAM" | "MERGE_DUPLICATE" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [duplicateTargetId, setDuplicateTargetId] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const riskLevel = riskAssessment?.riskLevel || "LOW";
  const totalScore = riskAssessment?.totalScore || 0;

  // Parse signals JSON safely
  let parsedSignals: string[] = [];
  if (riskAssessment?.signals) {
    if (Array.isArray(riskAssessment.signals)) {
      parsedSignals = riskAssessment.signals;
    } else if (typeof riskAssessment.signals === "string") {
      try {
        const parsed = JSON.parse(riskAssessment.signals);
        parsedSignals = Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch (e) {
        parsedSignals = [riskAssessment.signals];
      }
    }
  }

  const handleExecuteAction = async (actionType: string) => {
    setIsSubmittingAction(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/moderation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType,
          reason: actionReason.trim() || undefined,
          message: actionType === "REQUEST_INFO" ? actionReason.trim() : undefined,
          duplicateOfId: actionType === "MERGE_DUPLICATE" ? duplicateTargetId.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute moderation action.");
      }

      setActiveModal(null);
      setActionReason("");
      setDuplicateTargetId("");
      onActionComplete();
    } catch (err: any) {
      setActionError(err.message || "Action failed.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: "22px",
        borderRadius: "18px",
        border: `2px solid ${
          riskLevel === "HIGH" ? "var(--danger)" : riskLevel === "MEDIUM" ? "var(--accent)" : "rgba(37, 99, 235, 0.4)"
        }`,
        backgroundColor: "var(--bg-surface)",
        marginBottom: "24px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: riskLevel === "HIGH" ? "var(--danger-light)" : "var(--primary-light)",
              color: riskLevel === "HIGH" ? "var(--danger)" : "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.063rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
              AI Verification Summary
            </h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Internal staff risk assessment and civic recommendation
            </span>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "9999px",
            fontSize: "0.75rem",
            fontWeight: 800,
            textTransform: "uppercase",
            backgroundColor:
              riskLevel === "HIGH" ? "var(--danger-light)" : riskLevel === "MEDIUM" ? "var(--accent-light)" : "var(--success-light)",
            color:
              riskLevel === "HIGH" ? "var(--danger-dark)" : riskLevel === "MEDIUM" ? "var(--accent-dark)" : "var(--success-dark)",
            border: `1px solid ${
              riskLevel === "HIGH" ? "var(--danger)" : riskLevel === "MEDIUM" ? "var(--accent)" : "var(--success)"
            }`,
          }}
        >
          <span>Risk Level: {riskLevel}</span>
          <span>({totalScore}/100)</span>
        </div>
      </div>

      {/* Summary Narrative */}
      {riskAssessment?.summary && (
        <div
          style={{
            padding: "12px 14px",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "12px",
            fontSize: "0.813rem",
            color: "var(--text-primary)",
            lineHeight: 1.5,
            marginBottom: "14px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <strong>AI Reasoning:</strong> {riskAssessment.summary}
        </div>
      )}

      {/* Signals Breakdown */}
      {parsedSignals.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
            Identified Risk Signals ({parsedSignals.length}):
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto" }}>
            {parsedSignals.map((signal, idx) => (
              <div
                key={idx}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  backgroundColor: signal.includes("⚠️") || signal.includes("HIGH") ? "var(--danger-light)" : "var(--bg-subtle)",
                  fontSize: "0.75rem",
                  color: signal.includes("⚠️") || signal.includes("HIGH") ? "var(--danger-dark)" : "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {signal}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Action Controls (Approve, Request Info, Reject, Mark Spam, Merge Duplicate) */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "10px" }}>
          Staff Moderation Decision:
        </span>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {/* Approve */}
          <button
            type="button"
            onClick={() => handleExecuteAction("APPROVE")}
            disabled={isSubmittingAction}
            className="btn btn-sm btn-success"
            style={{ fontWeight: 700 }}
          >
            <CheckCircle2 size={15} />
            <span>Approve Report</span>
          </button>

          {/* Request More Information */}
          <button
            type="button"
            onClick={() => {
              setActiveModal("REQUEST_INFO");
              setActionReason("");
            }}
            disabled={isSubmittingAction}
            className="btn btn-sm btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <HelpCircle size={15} />
            <span>Request Info</span>
          </button>

          {/* Merge Duplicate */}
          <button
            type="button"
            onClick={() => {
              setActiveModal("MERGE_DUPLICATE");
              setActionReason("");
            }}
            disabled={isSubmittingAction}
            className="btn btn-sm btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <Layers size={15} />
            <span>Merge Duplicate</span>
          </button>

          {/* Reject */}
          <button
            type="button"
            onClick={() => {
              setActiveModal("REJECT");
              setActionReason("");
            }}
            disabled={isSubmittingAction}
            className="btn btn-sm btn-secondary"
            style={{ fontWeight: 700, color: "var(--danger)", borderColor: "var(--danger)" }}
          >
            <XCircle size={15} />
            <span>Reject</span>
          </button>

          {/* Mark as Spam */}
          <button
            type="button"
            onClick={() => {
              setActiveModal("MARK_SPAM");
              setActionReason("");
            }}
            disabled={isSubmittingAction}
            className="btn btn-sm btn-secondary"
            style={{ fontWeight: 700, color: "var(--danger-dark)", borderColor: "var(--danger)" }}
          >
            <ShieldAlert size={15} />
            <span>Mark as Spam</span>
          </button>
        </div>
      </div>

      {/* Action Modal */}
      {activeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "24px",
              borderRadius: "18px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, marginBottom: "8px" }}>
              {activeModal === "REQUEST_INFO" && "Request Additional Information"}
              {activeModal === "REJECT" && "Reject Community Report"}
              {activeModal === "MARK_SPAM" && "Mark Report as Spam"}
              {activeModal === "MERGE_DUPLICATE" && "Merge with Existing Report"}
            </h3>

            <p style={{ fontSize: "0.813rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
              {activeModal === "REQUEST_INFO" && "This message will be sent as an alert notification to the resident."}
              {activeModal === "REJECT" && "Please explain the reason for rejecting this report."}
              {activeModal === "MARK_SPAM" && "Report will be archived as spam and resident's trust score will be adjusted."}
              {activeModal === "MERGE_DUPLICATE" && "Link this report to an existing report reference number."}
            </p>

            {actionError && (
              <div style={{ padding: "8px 12px", backgroundColor: "var(--danger-light)", color: "var(--danger-dark)", fontSize: "0.813rem", borderRadius: "8px", marginBottom: "12px" }}>
                {actionError}
              </div>
            )}

            {activeModal === "MERGE_DUPLICATE" && (
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label">Original Report Reference # or ID *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. BB-2026-000001"
                  value={duplicateTargetId}
                  onChange={(e) => setDuplicateTargetId(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label">
                {activeModal === "REQUEST_INFO" ? "Message to Resident *" : "Reason / Operational Notes *"}
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder={
                  activeModal === "REQUEST_INFO"
                    ? "e.g. Could you please take a closer photo showing the street sign or mention the exact house number?"
                    : "Reason for action..."
                }
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn btn-secondary"
                disabled={isSubmittingAction}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteAction(activeModal)}
                disabled={isSubmittingAction || !actionReason.trim() || (activeModal === "MERGE_DUPLICATE" && !duplicateTargetId.trim())}
                className={`btn ${activeModal === "REJECT" || activeModal === "MARK_SPAM" ? "btn-danger" : "btn-primary"}`}
              >
                {isSubmittingAction ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                <span>Confirm Action</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
