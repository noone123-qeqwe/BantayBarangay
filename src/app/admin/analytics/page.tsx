"use client";

import React, { useEffect, useState } from "react";
import NextLink from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Building2,
  Loader2,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function AnalyticsDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !["STAFF", "ADMIN", "SUPER_ADMIN"].includes(user.role))) {
      router.push("/dashboard");
      return;
    }

    const loadAnalytics = async () => {
      try {
        setFetching(true);
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setFetching(false);
      }
    };

    if (user) {
      loadAnalytics();
    }
  }, [user, loading]);

  if (loading || fetching) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <Loader2 size={36} className="spin" style={{ margin: "0 auto 12px auto", color: "var(--primary)" }} />
        <div style={{ color: "var(--text-muted)", fontSize: "0.938rem" }}>Generating operational analytics...</div>
      </div>
    );
  }

  const m = data?.metrics || {};
  const byCategory = data?.byCategory || [];
  const byAgency = data?.byAgency || [];
  const hotspots = data?.hotspots || [];

  const maxCatCount = Math.max(...byCategory.map((c: any) => c.count), 1);
  const maxAgencyCount = Math.max(...byAgency.map((a: any) => a.count), 1);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BarChart3 size={22} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Civic Infrastructure Analytics</h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.938rem" }}>
          Real-time performance metrics, agency dispatch workloads, SLA compliance, and geospatial hazard hotspots
        </p>
      </div>

      {/* KPI Cards (Section 27) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div className="card" style={{ padding: "22px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Total Reports Filed
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--primary)", marginTop: "4px" }}>
            {m.totalReports ?? 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            All active & historic logs
          </div>
        </div>

        <div className="card" style={{ padding: "22px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--success-dark)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Resolution Rate
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--success-dark)", marginTop: "4px" }}>
            {m.resolutionRate ?? 0}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {m.resolved + m.closed} resolved / closed
          </div>
        </div>

        <div className="card" style={{ padding: "22px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--info)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Avg Resolution Time
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--info)", marginTop: "4px" }}>
            {m.avgResolutionHours ?? 0}h
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Turnaround from report to fix
          </div>
        </div>

        <div className="card" style={{ padding: "22px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Overdue SLA
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--danger)", marginTop: "4px" }}>
            {m.overdue ?? 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Target deadline elapsed
          </div>
        </div>
      </div>

      {/* Grid: Category Breakdown & Agency Workload */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        {/* Reports by Category Bar Chart */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.063rem", fontWeight: 800, marginBottom: "18px" }}>
            Reports by Problem Category
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {byCategory.map((cat: any) => {
              const pct = Math.round((cat.count / maxCatCount) * 100);
              return (
                <div key={cat.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.813rem", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{cat.name}</span>
                    <span style={{ fontWeight: 800, color: "var(--primary)" }}>{cat.count} reports</span>
                  </div>
                  <div
                    style={{
                      height: "10px",
                      backgroundColor: "var(--bg-subtle)",
                      borderRadius: "9999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #0284c7 0%, #06b6d4 100%)",
                        borderRadius: "9999px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agency Workload Breakdown */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.063rem", fontWeight: 800, marginBottom: "18px" }}>
            Agency Workload & Dispatch
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {byAgency.map((agency: any) => {
              const pct = Math.round((agency.count / maxAgencyCount) * 100);
              return (
                <div key={agency.code}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.813rem", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{agency.name}</span>
                    <span style={{ fontWeight: 800, color: "var(--info)" }}>{agency.count} assigned</span>
                  </div>
                  <div
                    style={{
                      height: "10px",
                      backgroundColor: "var(--bg-subtle)",
                      borderRadius: "9999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #6366f1 0%, #818cf8 100%)",
                        borderRadius: "9999px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 28: GEOGRAPHIC INFRASTRUCTURE HOTSPOTS */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <AlertTriangle size={20} color="var(--danger)" />
          <h3 style={{ fontSize: "1.125rem", fontWeight: 800 }}>Geographic Problem Hotspots</h3>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
          Algorithmic detection of clustered infrastructure failures within 150-meter zones. Click any hotspot to view and triage related incident reports.
        </p>

        {hotspots.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
            {hotspots.map((spot: any, idx: number) => (
              <NextLink
                key={idx}
                href="/reports"
                className="card card-interactive"
                style={{
                  padding: "18px",
                  borderRadius: "var(--radius-lg)",
                  backgroundColor: "var(--danger-light)",
                  border: "1.5px solid var(--danger)",
                  textDecoration: "none",
                  display: "block",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: "var(--danger)",
                        display: "inline-block",
                        boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.3)",
                      }}
                    />
                    <strong style={{ fontSize: "0.938rem", color: "var(--danger-dark)" }}>
                      {spot.category} Hotspot
                    </strong>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      backgroundColor: "var(--danger)",
                      color: "#ffffff",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                    }}
                  >
                    {spot.count} Reports
                  </span>
                </div>

                <div style={{ fontSize: "0.813rem", color: "var(--text-primary)" }}>
                  Zone coordinates: {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", fontSize: "0.75rem", color: "var(--danger-dark)", fontWeight: 700 }}>
                  <span>View Hotspot Reports</span>
                  <ChevronRight size={14} />
                </div>
              </NextLink>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            No concentrated failure hotspots detected across active reporting zones.
          </p>
        )}
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
