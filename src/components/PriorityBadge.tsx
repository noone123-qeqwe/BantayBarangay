"use client";

import React from "react";
import { AlertCircle, AlertTriangle, Flame, Info } from "lucide-react";
import { ReportPriority } from "@/types";

interface PriorityBadgeProps {
  priority: ReportPriority;
  size?: "sm" | "md";
}

export const PRIORITY_CONFIG: Record<
  ReportPriority,
  { label: string; className: string; icon: React.ElementType }
> = {
  LOW: {
    label: "Low Priority",
    className: "priority-low",
    icon: Info,
  },
  MEDIUM: {
    label: "Medium Priority",
    className: "priority-medium",
    icon: AlertCircle,
  },
  HIGH: {
    label: "High Priority",
    className: "priority-high",
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: "Critical Hazard",
    className: "priority-critical",
    icon: Flame,
  },
};

export default function PriorityBadge({ priority, size = "md" }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  const Icon = config.icon;

  return (
    <span
      className={`badge ${config.className}`}
      style={{
        padding: size === "sm" ? "3px 9px" : "4px 11px",
        fontSize: size === "sm" ? "0.688rem" : "0.75rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontWeight: 700,
        borderRadius: "var(--radius-full)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
      }}
    >
      <Icon size={size === "sm" ? 12 : 13} aria-hidden="true" style={{ flexShrink: 0 }} />
      <span>{config.label}</span>
    </span>
  );
}
