"use client";

import React from "react";
import StatusBadge from "./StatusBadge";
import { StatusHistoryItem, ReportStatus } from "@/types";
import {
  Clock,
  User,
  ShieldAlert,
  Image as ImageIcon,
  Check,
  CircleDot,
  Circle,
  Sparkles,
  ArrowDown,
  Building2,
} from "lucide-react";

interface ReportTimelineProps {
  history: StatusHistoryItem[];
  currentStatus?: string;
  isStaffViewer?: boolean;
}

// Canonical steps for the visual progress tracker
const CANONICAL_STEPS: { status: ReportStatus; label: string; desc: string }[] = [
  { status: "SUBMITTED", label: "Submitted", desc: "Logged by resident" },
  { status: "UNDER_REVIEW", label: "Under Review", desc: "Operations verification" },
  { status: "ASSIGNED", label: "Assigned", desc: "Dispatched to agency" },
  { status: "IN_PROGRESS", label: "In Progress", desc: "Field work underway" },
  { status: "RESOLVED", label: "Resolved", desc: "Work completed by crew" },
  { status: "CLOSED", label: "Closed", desc: "Verified & confirmed" },
];

export default function ReportTimeline({
  history = [],
  currentStatus,
  isStaffViewer = false,
}: ReportTimelineProps) {
  // Determine current active status from history if not passed
  const activeStatus = currentStatus || (history.length > 0 ? history[history.length - 1].newStatus : "SUBMITTED");

  // Determine which index in canonical sequence corresponds to current status
  const getStepState = (stepStatus: ReportStatus) => {
    const statusOrder: Record<string, number> = {
      SUBMITTED: 0,
      RECEIVED: 1,
      UNDER_REVIEW: 1,
      ASSIGNED: 2,
      IN_PROGRESS: 3,
      ON_HOLD: 3,
      RESOLVED: 4,
      REOPENED: 3,
      CLOSED: 5,
      REJECTED: -1,
    };

    const currentOrder = statusOrder[activeStatus] ?? 0;
    const thisOrder = statusOrder[stepStatus] ?? 0;

    if (activeStatus === "REJECTED") {
      return stepStatus === "SUBMITTED" ? "completed" : "inactive";
    }

    if (thisOrder < currentOrder) return "completed";
    if (thisOrder === currentOrder) return "active";
    return "pending";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* 1. SIGNATURE LIFECYCLE PROGRESSION TRACKER (Section 18) */}
      <div
        style={{
          padding: "20px 16px",
          backgroundColor: "var(--bg-subtle)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
            Lifecycle Progression
          </span>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>
            Current: {activeStatus.replace(/_/g, " ")}
          </span>
        </div>

        {/* Horizontal Desktop / Tablet Tracker */}
        <div
          className="timeline-stepper-desktop"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "8px",
            position: "relative",
          }}
        >
          {CANONICAL_STEPS.map((step, idx) => {
            const state = getStepState(step.status);
            const isCompleted = state === "completed";
            const isActive = state === "active";

            return (
              <div
                key={step.status}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {/* Node circle */}
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    transition: "all 0.25s ease",
                    backgroundColor: isCompleted
                      ? "var(--success)"
                      : isActive
                      ? "var(--primary)"
                      : "var(--bg-surface)",
                    color: isCompleted || isActive ? "#ffffff" : "var(--text-muted)",
                    border: isCompleted
                      ? "2px solid var(--success)"
                      : isActive
                      ? "2px solid var(--primary)"
                      : "2px solid var(--border-medium)",
                    boxShadow: isActive ? "0 0 0 4px var(--primary-light)" : "none",
                  }}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : isActive ? (
                    <CircleDot size={16} strokeWidth={3} />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "0.813rem",
                    fontWeight: isActive ? 800 : isCompleted ? 700 : 500,
                    color: isActive ? "var(--primary-dark)" : isCompleted ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  {step.label}
                </div>
                <span
                  style={{
                    fontSize: "0.688rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.2,
                    marginTop: "2px",
                  }}
                >
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CHRONOLOGICAL EVENT AUDIT LOG */}
      <div>
        <h4 style={{ fontSize: "0.938rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>
          Event Activity & Update History
        </h4>

        {history.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontStyle: "italic", padding: "12px 0" }}>
            No status history recorded yet.
          </div>
        ) : (
          <div className="timeline" style={{ paddingLeft: "8px" }}>
            {history.map((item, index) => {
              const isLatest = index === history.length - 1;
              const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item.id}
                  className={`timeline-item ${isLatest ? "completed" : ""}`}
                  style={{ paddingBottom: "24px" }}
                >
                  <div className="timeline-dot" />
                  <div className="timeline-content" style={{ padding: "16px 18px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <StatusBadge status={item.newStatus} size="sm" />
                        {item.isInternal && (
                          <span
                            style={{
                              fontSize: "0.688rem",
                              fontWeight: 700,
                              backgroundColor: "var(--danger-light)",
                              color: "var(--danger)",
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                            }}
                          >
                            INTERNAL NOTE
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          fontWeight: 500,
                        }}
                      >
                        <Clock size={13} />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    {/* Note / Message */}
                    {item.note && (
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--text-primary)",
                          lineHeight: 1.5,
                          marginBottom: item.photoUrl ? "12px" : "0",
                        }}
                      >
                        {item.note}
                      </p>
                    )}

                    {/* Proof Photo Attachment */}
                    {item.photoUrl && (
                      <div style={{ marginTop: "10px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <ImageIcon size={14} />
                          <span>Status Verification Attachment</span>
                        </div>
                        <a href={item.photoUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block" }}>
                          <img
                            src={item.photoUrl}
                            alt="Status evidence attachment"
                            style={{
                              width: "140px",
                              height: "95px",
                              objectFit: "cover",
                              borderRadius: "var(--radius-md)",
                              border: "1.5px solid var(--border-medium)",
                              boxShadow: "var(--shadow-sm)",
                              transition: "transform 0.2s ease",
                            }}
                          />
                        </a>
                      </div>
                    )}

                    {/* Actor attribution */}
                    {item.actor && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          marginTop: "10px",
                          borderTop: "1px solid var(--border-subtle)",
                          paddingTop: "8px",
                        }}
                      >
                        <User size={13} color="var(--primary)" />
                        <span>
                          Updated by: <strong style={{ color: "var(--text-primary)" }}>{item.actor.name}</strong>{" "}
                          <span style={{ opacity: 0.8 }}>({item.actor.role})</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .timeline-stepper-desktop {
            grid-template-columns: repeat(3, 1fr) !important;
            row-gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
