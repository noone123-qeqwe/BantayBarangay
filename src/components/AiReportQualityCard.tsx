"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Sparkles, Lightbulb, ChevronRight } from "lucide-react";
import { AiQualityCheckResult } from "@/lib/aiService";

interface AiReportQualityCardProps {
  quality: AiQualityCheckResult;
  onGoToStep?: (step: number) => void;
}

export default function AiReportQualityCard({ quality, onGoToStep }: AiReportQualityCardProps) {
  const isExcellent = quality.overallQuality === "excellent";
  const isGood = quality.overallQuality === "good";

  return (
    <div
      className="card"
      style={{
        padding: "20px",
        borderRadius: "18px",
        marginBottom: "20px",
        border: `1.5px solid ${isExcellent ? "rgba(16, 185, 129, 0.4)" : isGood ? "rgba(59, 130, 246, 0.35)" : "rgba(245, 158, 11, 0.4)"}`,
        backgroundColor: isExcellent ? "rgba(16, 185, 129, 0.03)" : "var(--bg-surface)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              backgroundColor: isExcellent ? "var(--success-light)" : "var(--primary-light)",
              color: isExcellent ? "var(--success-dark)" : "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: "0.938rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
              AI Report Quality Check
            </h4>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Evaluated for fastest municipal triage and dispatch
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
            backgroundColor: isExcellent ? "var(--success-light)" : isGood ? "var(--primary-light)" : "#fef3c7",
            color: isExcellent ? "var(--success-dark)" : isGood ? "var(--primary)" : "#b45309",
            border: `1px solid ${isExcellent ? "var(--success)" : isGood ? "var(--primary)" : "#f59e0b"}`,
          }}
        >
          <span>Score: {quality.score}%</span>
          <span>•</span>
          <span style={{ textTransform: "capitalize" }}>{quality.overallQuality.replace("_", " ")}</span>
        </div>
      </div>

      {/* 4 Quality Checklist Criteria */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginBottom: "14px" }}>
        {quality.items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "10px 12px",
              borderRadius: "12px",
              backgroundColor: item.passed ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
              border: `1px solid ${item.passed ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)"}`,
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            {item.passed ? (
              <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
            ) : (
              <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: "0.813rem", color: "var(--text-primary)" }}>
                {item.label}
              </strong>
              <span style={{ display: "block", fontSize: "0.75rem", color: item.passed ? "var(--text-secondary)" : "#b45309", marginTop: "1px" }}>
                {item.message}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Constructive Recommendations (if any) */}
      {quality.suggestions.length > 0 && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "#fffbeb",
            borderRadius: "12px",
            border: "1px solid #fde68a",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            fontSize: "0.813rem",
            color: "#92400e",
          }}
        >
          <Lightbulb size={18} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>How your report could be even better:</strong>
            <ul style={{ margin: "4px 0 0 0", paddingLeft: "18px", lineHeight: 1.4 }}>
              {quality.suggestions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
