"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  RotateCcw,
  X,
  AlertTriangle,
  Loader2,
  ArrowDown,
  Camera,
  Check,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface ResolutionModalProps {
  reportId: string;
  referenceNo: string;
  originalPhoto?: string | null;
  resolutionPhoto?: string | null;
  onSuccess: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResolutionModal({
  reportId,
  referenceNo,
  originalPhoto,
  resolutionPhoto,
  onSuccess,
  isOpen,
  onClose,
}: ResolutionModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<"FIXED" | "NOT_FIXED" | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedChoice) return;
    if (selectedChoice === "NOT_FIXED" && !reason.trim()) {
      setError("Please help responders understand what remains unfinished or broken.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: selectedChoice === "FIXED",
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit verification.");
      }

      if (selectedChoice === "FIXED") {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth: "580px",
          padding: "28px 24px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={20} color="var(--primary)" />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
                Resolution Confirmation
              </h3>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Case <strong style={{ color: "var(--primary)" }}>{referenceNo}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Section 21: Before & After Evidence Comparison */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "10px", alignItems: "center" }}>
            {/* Issue Reported Card */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "var(--danger)",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                  letterSpacing: "0.04em",
                }}
              >
                Issue Reported
              </div>
              <div
                style={{
                  height: "110px",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  backgroundColor: "var(--bg-surface)",
                  border: "1.5px solid var(--border-medium)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {originalPhoto ? (
                  <img
                    src={originalPhoto}
                    alt="Original reported issue"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", padding: "8px" }}>
                    <Camera size={22} style={{ margin: "0 auto 4px auto", opacity: 0.6 }} />
                    <span>Original Photo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transition Arrow */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowDown size={16} />
              </div>
            </div>

            {/* Work Completed Card */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "var(--success-dark)",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                  letterSpacing: "0.04em",
                }}
              >
                Work Completed
              </div>
              <div
                style={{
                  height: "110px",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  backgroundColor: "var(--bg-surface)",
                  border: "1.5px solid var(--border-medium)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {resolutionPhoto ? (
                  <img
                    src={resolutionPhoto}
                    alt="Resolution completion proof"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", padding: "8px" }}>
                    <CheckCircle2 size={22} color="var(--success)" style={{ margin: "0 auto 4px auto" }} />
                    <span>Resolution Photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Question */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h4 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--text-primary)" }}>
            Is the issue actually fixed?
          </h4>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            As a community resident, your feedback ensures accountability and high service standards.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: "12px",
              backgroundColor: "var(--danger-light)",
              color: "var(--danger-dark)",
              borderRadius: "var(--radius-md)",
              marginBottom: "18px",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Two Choice Action Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => {
              setSelectedChoice("FIXED");
              setError(null);
            }}
            style={{
              padding: "16px 14px",
              borderRadius: "var(--radius-lg)",
              border: `2px solid ${selectedChoice === "FIXED" ? "var(--success)" : "var(--border-medium)"}`,
              backgroundColor: selectedChoice === "FIXED" ? "var(--success-light)" : "var(--bg-surface)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              textAlign: "center",
              transition: "all 0.2s ease",
              boxShadow: selectedChoice === "FIXED" ? "0 4px 14px rgba(16, 185, 129, 0.25)" : "none",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: selectedChoice === "FIXED" ? "var(--success)" : "var(--bg-subtle)",
                color: selectedChoice === "FIXED" ? "#ffffff" : "var(--success-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={24} strokeWidth={2.5} />
            </div>
            <strong style={{ fontSize: "0.938rem", color: "var(--text-primary)" }}>✓ Yes, It's Fixed</strong>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
              Close this case officially
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedChoice("NOT_FIXED");
              setError(null);
            }}
            style={{
              padding: "16px 14px",
              borderRadius: "var(--radius-lg)",
              border: `2px solid ${selectedChoice === "NOT_FIXED" ? "var(--primary)" : "var(--border-medium)"}`,
              backgroundColor: selectedChoice === "NOT_FIXED" ? "var(--primary-light)" : "var(--bg-surface)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              textAlign: "center",
              transition: "all 0.2s ease",
              boxShadow: selectedChoice === "NOT_FIXED" ? "0 4px 14px rgba(2, 132, 199, 0.25)" : "none",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: selectedChoice === "NOT_FIXED" ? "var(--primary)" : "var(--bg-subtle)",
                color: selectedChoice === "NOT_FIXED" ? "#ffffff" : "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RotateCcw size={24} strokeWidth={2.5} />
            </div>
            <strong style={{ fontSize: "0.938rem", color: "var(--text-primary)" }}>↻ No, Problem Remains</strong>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
              Keep open for additional work
            </span>
          </button>
        </div>

        {/* Friendly explanation that "No" is not a punishment */}
        {selectedChoice === "NOT_FIXED" && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-subtle)",
              marginBottom: "16px",
              fontSize: "0.813rem",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <HelpCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>
              Reopening helps our crews return to complete the fix without starting a whole new report from scratch.
            </span>
          </div>
        )}

        {/* Input box for reason or optional praise */}
        {selectedChoice === "NOT_FIXED" && (
          <div style={{ marginBottom: "20px" }}>
            <label className="form-label" htmlFor="reopen-note">
              Please explain what is still broken: *
            </label>
            <textarea
              id="reopen-note"
              className="form-control"
              rows={3}
              placeholder="e.g. Only half of the pothole was patched, or the streetlight flickers off when windy..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
        )}

        {selectedChoice === "FIXED" && (
          <div style={{ marginBottom: "20px" }}>
            <label className="form-label" htmlFor="praise-note">
              Optional feedback for the response team:
            </label>
            <textarea
              id="praise-note"
              className="form-control"
              rows={2}
              placeholder="e.g. Thank you! Asphalt looks clean and traffic flows smoothly now."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedChoice || isSubmitting}
            className={`btn ${selectedChoice === "FIXED" ? "btn-success" : "btn-primary"} btn-lg`}
            style={{ fontWeight: 700 }}
          >
            {isSubmitting && <Loader2 size={16} className="spin" />}
            <span>Confirm Verification</span>
          </button>
        </div>
      </div>

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
