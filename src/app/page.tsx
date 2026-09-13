"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldAlert,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  AlertTriangle,
  Building,
  Users,
  Eye,
  Activity,
  FileCheck,
  ChevronRight,
  Lock,
  ExternalLink,
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchRef, setSearchRef] = useState("");
  const [trackerError, setTrackerError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalReports: 48,
    resolvedCount: 36,
    activeAgencies: 6,
    avgHours: 18,
  });

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = searchRef.trim().toUpperCase();
    if (!cleanRef) {
      setTrackerError("Please enter a reference number (e.g. BB-2026-000101)");
      return;
    }
    router.push(`/reports/${cleanRef}`);
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(180deg, #f0fdf4 0%, #e0f2fe 60%, var(--bg-app) 100%)",
          padding: "60px 20px 80px 20px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "860px", margin: "0 auto", position: "relative", zIndex: 2 }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              backgroundColor: "rgba(2, 132, 199, 0.12)",
              color: "var(--primary-dark)",
              borderRadius: "9999px",
              fontSize: "0.813rem",
              fontWeight: 700,
              marginBottom: "24px",
              border: "1px solid rgba(2, 132, 199, 0.25)",
            }}
          >
            <img
              src="/logo.png"
              alt="BantayBarangay Logo"
              width={20}
              height={20}
              style={{ borderRadius: "5px", objectFit: "contain" }}
            />
            <span>Official Civic Reporting Platform • Barangay San Antonio, Pasig City</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.75rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "var(--text-primary)",
              marginBottom: "20px",
              letterSpacing: "-0.03em",
            }}
          >
            Report. Track. <span className="text-gradient">Improve Our Community.</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              maxWidth: "700px",
              margin: "0 auto 36px auto",
            }}
          >
            A direct civic bridge for residents to report road potholes, broken electric posts, dangling wires, flooded canals, and busted streetlights. Pin exact GPS coordinates, upload photo proof, and track live repair progress.
          </p>

          {/* Primary Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
              flexWrap: "wrap",
              marginBottom: "48px",
            }}
          >
            <NextLink
              href={user ? "/reports/new" : "/login"}
              className="btn btn-lg btn-primary"
              style={{
                background: "linear-gradient(135deg, #0284c7 0%, #0891b2 100%)",
                fontWeight: 700,
                boxShadow: "0 8px 24px rgba(2, 132, 199, 0.35)",
              }}
            >
              <Camera size={20} />
              <span>+ Report an Issue Now</span>
            </NextLink>

            <NextLink href="/map" className="btn btn-lg btn-secondary">
              <MapPin size={20} />
              <span>Explore Community Map</span>
            </NextLink>
          </div>

          {/* Public Report Tracker Box */}
          <div
            className="card"
            style={{
              maxWidth: "560px",
              margin: "0 auto",
              padding: "24px",
              boxShadow: "var(--shadow-xl)",
              border: "1.5px solid var(--border-medium)",
              backgroundColor: "var(--bg-card)",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Search size={18} color="var(--primary)" />
              <strong style={{ fontSize: "0.938rem", color: "var(--text-primary)" }}>
                Track a Report by Reference Number
              </strong>
            </div>

            <form onSubmit={handleTrackSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                className="form-control"
                style={{ flex: "1 1 240px", textTransform: "uppercase", fontWeight: 600 }}
                placeholder="e.g. BB-2026-000101"
                value={searchRef}
                onChange={(e) => {
                  setSearchRef(e.target.value);
                  setTrackerError(null);
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
                <span>Track Status</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {trackerError && (
              <div style={{ fontSize: "0.813rem", color: "var(--danger)", marginTop: "8px" }}>
                {trackerError}
              </div>
            )}

            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "10px" }}>
              Try sample reference: <strong>BB-2026-000101</strong> (Pothole) or <strong>BB-2026-000103</strong> (Streetlight)
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats Bar */}
      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "32px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--primary)" }}>48+</div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Infrastructure Reports Logged
            </div>
          </div>
          <div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--success)" }}>82%</div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Community Resolution Rate
            </div>
          </div>
          <div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--accent)" }}>4 hrs</div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Urgent Hazard Target SLA
            </div>
          </div>
          <div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--info)" }}>6 Active</div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Coordinated Civic Agencies
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: "80px 20px", maxWidth: "1160px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <span
            style={{
              fontSize: "0.813rem",
              fontWeight: 800,
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Streamlined Civic Workflow
          </span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "8px" }}>How BantayBarangay Works</h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "8px auto 0 auto" }}>
            From identifying a community issue to verified completion in four transparent steps.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Step 1 */}
          <div className="card" style={{ padding: "28px 24px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <Camera size={24} />
            </div>
            <div style={{ fontSize: "0.813rem", fontWeight: 800, color: "var(--primary)", marginBottom: "4px" }}>
              STEP 1
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "10px" }}>1. Snap & Describe</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Select the category (pothole, streetlight, cable, drainage) and upload photo evidence directly from your phone camera or gallery.
            </p>
          </div>

          {/* Step 2 */}
          <div className="card" style={{ padding: "28px 24px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "var(--info-light)",
                color: "var(--info)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <MapPin size={24} />
            </div>
            <div style={{ fontSize: "0.813rem", fontWeight: 800, color: "var(--info)", marginBottom: "4px" }}>
              STEP 2
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "10px" }}>2. Pin Location</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Use one-tap GPS or adjust the interactive map pin. Our system checks for existing nearby reports to prevent duplicates and routes to the right agency.
            </p>
          </div>

          {/* Step 3 */}
          <div className="card" style={{ padding: "28px 24px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "var(--warning-light)",
                color: "var(--warning-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <Clock size={24} />
            </div>
            <div style={{ fontSize: "0.813rem", fontWeight: 800, color: "var(--warning-dark)", marginBottom: "4px" }}>
              STEP 3
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "10px" }}>3. Live Tracking</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Receive updates as barangay personnel review, assign staff or utility crews (DPWH, Meralco, Manila Water), and begin repair operations.
            </p>
          </div>

          {/* Step 4 */}
          <div className="card" style={{ padding: "28px 24px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "var(--success-light)",
                color: "var(--success-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div style={{ fontSize: "0.813rem", fontWeight: 800, color: "var(--success-dark)", marginBottom: "4px" }}>
              STEP 4
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "10px" }}>4. Resident Verification</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              When work finishes, you receive completion photos. You verify whether it’s truly fixed: click “Yes, It’s Fixed” to close or “No” to reopen with feedback.
            </p>
          </div>
        </div>
      </section>

      {/* Emergency Hotline Disclaimer */}
      <section
        style={{
          maxWidth: "1000px",
          margin: "0 auto 60px auto",
          padding: "20px",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--danger-light)",
            border: "1.5px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <AlertTriangle size={32} color="var(--danger)" style={{ flexShrink: 0 }} />
          <div style={{ flex: "1 1 300px" }}>
            <strong style={{ color: "var(--danger-dark)", fontSize: "1rem", display: "block" }}>
              Life-Threatening Emergency Notice
            </strong>
            <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
              BantayBarangay is for civic and infrastructure tracking. In cases of active fire, medical crisis, or imminent structural collapse, call national emergency hotline <strong>911</strong> or Barangay San Antonio Operations at <strong>(02) 8643-1111</strong> immediately.
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-surface)",
          padding: "40px 20px",
          color: "var(--text-muted)",
          fontSize: "0.875rem",
        }}
      >
        <div
          style={{
            maxWidth: "1160px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img
              src="/logo.png"
              alt="BantayBarangay Logo"
              width={38}
              height={38}
              style={{ borderRadius: "10px", objectFit: "contain", boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)" }}
            />
            <div>
              <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "2px" }}>
                BantayBarangay Civic Technology
              </strong>
              <span>Barangay San Antonio, Pasig City, Metro Manila • All rights reserved.</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <NextLink href="/map" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Nearby Map
            </NextLink>
            <NextLink href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Portal Login
            </NextLink>
            <a href="/api/health" target="_blank" style={{ color: "var(--primary)", fontWeight: 600 }}>
              System Health
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
