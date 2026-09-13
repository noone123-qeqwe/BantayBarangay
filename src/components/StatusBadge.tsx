"use client";

import React from "react";
import {
  FileText,
  Clock,
  Search,
  UserCheck,
  Wrench,
  PauseCircle,
  CheckCircle2,
  RotateCcw,
  Archive,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { ReportStatus } from "@/types";

interface StatusBadgeProps {
  status: ReportStatus;
  size?: "sm" | "md" | "lg";
}

export const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  SUBMITTED: {
    label: "Submitted",
    className: "badge-submitted",
    icon: FileText,
  },
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    className: "badge-pending-verification",
    icon: ShieldAlert,
  },
  RECEIVED: {
    label: "Received",
    className: "badge-received",
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className: "badge-under-review",
    icon: Search,
  },
  ASSIGNED: {
    label: "Assigned",
    className: "badge-assigned",
    icon: UserCheck,
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "badge-in-progress",
    icon: Wrench,
  },
  ON_HOLD: {
    label: "On Hold",
    className: "badge-closed",
    icon: PauseCircle,
  },
  RESOLVED: {
    label: "Resolved",
    className: "badge-resolved",
    icon: CheckCircle2,
  },
  REOPENED: {
    label: "Reopened",
    className: "badge-reopened",
    icon: RotateCcw,
  },
  CLOSED: {
    label: "Closed",
    className: "badge-closed",
    icon: Archive,
  },
  REJECTED: {
    label: "Rejected",
    className: "badge-reopened",
    icon: XCircle,
  },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: "badge-submitted",
    icon: FileText,
  };
  const Icon = config.icon;

  const iconSizes = {
    sm: 11,
    md: 13,
    lg: 15,
  };

  const isLive = ["IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "PENDING_VERIFICATION"].includes(status);

  return (
    <span
      className={`badge ${config.className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size === "sm" ? "5px" : "6px",
        padding: size === "sm" ? "3px 9px" : size === "lg" ? "6px 14px" : "4px 11px",
        fontSize: size === "sm" ? "0.688rem" : size === "lg" ? "0.813rem" : "0.75rem",
        fontWeight: 700,
        borderRadius: "var(--radius-full)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
        letterSpacing: "0.02em",
      }}
    >
      {isLive && (
        <span
          style={{
            width: size === "sm" ? "5px" : "6px",
            height: size === "sm" ? "5px" : "6px",
            borderRadius: "50%",
            backgroundColor: "currentColor",
            opacity: 0.85,
            flexShrink: 0,
          }}
        />
      )}
      <Icon size={iconSizes[size]} aria-hidden="true" style={{ flexShrink: 0 }} />
      <span>{config.label}</span>
    </span>
  );
}
