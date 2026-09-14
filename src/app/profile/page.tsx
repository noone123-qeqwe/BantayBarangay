"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { clearLastKnownLocation } from "@/lib/locationStorage";
import {
  User,
  ShieldCheck,
  Phone,
  Calendar,
  Lock,
  Bell,
  MapPin,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Info,
  Key,
  Languages,
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [smsAlerts, setSmsAlerts] = useState(true);
  const [reportUpdates, setReportUpdates] = useState(true);
  const [announcements, setAnnouncements] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);

  const handleUpdateLanguage = async (newLang: "en" | "fil" | "msb") => {
    setIsUpdatingLanguage(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage: newLang }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        const names = { msb: "Masbateño (Minasbate)", fil: "Filipino", en: "English" };
        showToast(`Wika / Language updated to ${names[newLang]}`, "success");
      } else {
        showToast(data.error || "Failed to update language", "error");
      }
    } catch {
      showToast("Error updating language preference", "error");
    } finally {
      setIsUpdatingLanguage(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <img
          src="/logo.png"
          alt="BantayBarangay"
          width={64}
          height={64}
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "18px",
            margin: "0 auto 16px auto",
            display: "block",
            boxShadow: "0 8px 24px rgba(2, 132, 199, 0.35)",
          }}
        />
        <div style={{ fontSize: "1.1rem", color: "var(--text-muted)", fontWeight: 600 }}>
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleClearLocationCache = () => {
    clearLastKnownLocation();
    showToast("Cached device location cleared", "info");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch {
      setIsLoggingOut(false);
    }
  };

  const formattedBirthDate = user.birthDate
    ? new Date(user.birthDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="page-container" style={{ maxWidth: "640px", paddingBottom: "100px" }}>
      {/* 1. PROFILE HEADER CARD */}
      <div
        className="card"
        style={{
          padding: "24px 20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          background: "linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(13, 148, 136, 0.05) 100%)",
          border: "1.5px solid var(--border-medium)",
          borderRadius: "20px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            border: "3px solid #ffffff",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
            backgroundColor: "var(--bg-subtle)",
          }}
        >
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
            alt={user.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {user.name}
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "9999px",
                backgroundColor: ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(user.role)
                  ? "var(--primary-light)"
                  : "var(--success-light)",
                color: ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(user.role)
                  ? "var(--primary-dark)"
                  : "var(--success-dark)",
                fontSize: "0.688rem",
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              <ShieldCheck size={12} />
              <span>{user.role}</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            <Smartphone size={14} color="var(--primary)" />
            <strong style={{ fontFamily: "var(--font-mono)" }}>{user.phone || "No phone linked"}</strong>
          </div>

          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Verified Community Member
          </div>
        </div>
      </div>

      {/* 2. SECTION: ACCOUNT INFORMATION */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingLeft: "4px" }}>
          Account Details
        </div>
        <div className="card" style={{ borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={16} />
              <span>Full Name</span>
            </span>
            <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{user.name}</strong>
          </div>

          <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Phone size={16} />
              <span>Mobile Number</span>
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{user.phone}</strong>
              <CheckCircle2 size={15} color="var(--success)" />
            </div>
          </div>

          {formattedBirthDate && (
            <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={16} />
                <span>Date of Birth</span>
              </span>
              <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
                {formattedBirthDate} {user.age ? `(Age ${user.age})` : ""}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* 2.5 SECTION: LANGUAGE PREFERENCE */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingLeft: "4px" }}>
          Language Preference (Wika / Pulong)
        </div>
        <div className="card" style={{ borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Languages size={16} />
              </div>
              <div>
                <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)", display: "block" }}>
                  AI Assistant & Reporting Language
                </strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Primary language for civic assistance, guided report writing, and advice
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {[
                { code: "msb", label: "Masbateño", sub: "Minasbate (Lokal)" },
                { code: "fil", label: "Filipino", sub: "Tagalog" },
                { code: "en", label: "English", sub: "Standard" },
              ].map((lang) => {
                const isSelected = (user.preferredLanguage || "msb") === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleUpdateLanguage(lang.code as any)}
                    disabled={isUpdatingLanguage}
                    style={{
                      padding: "10px 8px",
                      borderRadius: "12px",
                      border: isSelected ? "2px solid var(--primary)" : "1.5px solid var(--border-medium)",
                      backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-subtle)",
                      color: isSelected ? "var(--primary-dark)" : "var(--text-primary)",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: "0.813rem", fontWeight: 800 }}>{lang.label}</div>
                    <div style={{ fontSize: "0.688rem", color: isSelected ? "var(--primary)" : "var(--text-muted)", marginTop: "2px" }}>
                      {lang.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION: SECURITY & CREDENTIALS */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingLeft: "4px" }}>
          Security
        </div>
        <div className="card" style={{ borderRadius: "16px", overflow: "hidden" }}>
          <NextLink
            href="/forgot-password"
            className="card-interactive"
            style={{
              padding: "16px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--border-subtle)",
              textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Key size={16} />
              </div>
              <div>
                <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)", display: "block" }}>
                  Change Password
                </strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Reset via SMS OTP verification
                </span>
              </div>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </NextLink>

          <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "var(--success-light)", color: "var(--success-dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={16} />
              </div>
              <div>
                <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)", display: "block" }}>
                  SMS Phone Verification
                </strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Secured with one-time verification
                </span>
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--success)" }}>Active</span>
          </div>
        </div>
      </div>

      {/* 4. SECTION: NOTIFICATION PREFERENCES */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingLeft: "4px" }}>
          Notifications & Alerts
        </div>
        <div className="card" style={{ borderRadius: "16px", overflow: "hidden" }}>
          <label style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Bell size={18} color="var(--primary)" />
              <div>
                <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)", display: "block" }}>
                  Report Status Updates
                </strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Notify when personnel inspect or repair reports
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={reportUpdates}
              onChange={(e) => {
                setReportUpdates(e.target.checked);
                showToast("Notification preference updated", "success");
              }}
              style={{ width: "20px", height: "20px", accentColor: "var(--primary)", cursor: "pointer" }}
            />
          </label>

          <label style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertTriangle size={18} color="var(--accent)" />
              <div>
                <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)", display: "block" }}>
                  Barangay Emergency Alerts
                </strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Urgent flood, weather, and safety bulletins
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={announcements}
              onChange={(e) => {
                setAnnouncements(e.target.checked);
                showToast("Notification preference updated", "success");
              }}
              style={{ width: "20px", height: "20px", accentColor: "var(--primary)", cursor: "pointer" }}
            />
          </label>
        </div>
      </div>

      {/* 5. SECTION: LOCATION & PERMISSIONS */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingLeft: "4px" }}>
          Location & Permissions
        </div>
        <div className="card" style={{ borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={16} />
              </div>
              <div>
                <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)", display: "block" }}>
                  Device GPS Access
                </strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  High-accuracy reporting pin detection
                </span>
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>Enabled</span>
          </div>

          <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)", display: "block" }}>
                Clear Stored Map Cache
              </strong>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Reset last-detected coordinates
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearLocationCache}
              className="btn btn-sm btn-secondary"
              style={{ fontSize: "0.75rem", fontWeight: 700 }}
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* 6. SECTION: EMERGENCY SUPPORT & HOTLINES */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingLeft: "4px" }}>
          Help & Emergency Contacts
        </div>
        <div className="card" style={{ borderRadius: "16px", overflow: "hidden" }}>
          <a
            href="tel:0286431111"
            className="card-interactive"
            style={{
              padding: "16px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--border-subtle)",
              textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Phone size={16} />
              </div>
              <div>
                <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)", display: "block" }}>
                  Barangay Operations Center
                </strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  24/7 Community Support Hotline
                </span>
              </div>
            </div>
            <span className="btn btn-sm btn-outline" style={{ fontSize: "0.75rem", fontWeight: 800 }}>
              Call Now
            </span>
          </a>

          <a
            href="tel:911"
            className="card-interactive"
            style={{
              padding: "16px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--border-subtle)",
              textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "var(--danger-light)", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={16} />
              </div>
              <div>
                <strong style={{ fontSize: "0.875rem", color: "var(--danger-dark)", display: "block" }}>
                  National Emergency Hotline
                </strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Dial 911 for fire, police, or ambulance
                </span>
              </div>
            </div>
            <span className="btn btn-sm btn-outline" style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--danger)", borderColor: "var(--danger)" }}>
              Call 911
            </span>
          </a>

          <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <HelpCircle size={16} />
              </div>
              <div>
                <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)", display: "block" }}>
                  How BantayBarangay Works
                </strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Learn about reporting and verification SLAs
                </span>
              </div>
            </div>
            <NextLink href="/" style={{ color: "var(--primary)", fontSize: "0.75rem", fontWeight: 700 }}>
              Learn More
            </NextLink>
          </div>
        </div>
      </div>

      {/* 7. SECTION: TERMS & PRIVACY */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", paddingLeft: "4px" }}>
          Legal & Privacy
        </div>
        <div className="card" style={{ padding: "16px 18px", borderRadius: "16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <FileText size={18} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <p style={{ fontSize: "0.813rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
              BantayBarangay collects report locations and evidence photos strictly for civic repairs and public safety. Your private personal details are never sold or shared with advertisers.
            </p>
          </div>
        </div>
      </div>

      {/* 8. SIGN OUT ACTION */}
      <div>
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="btn btn-outline btn-lg"
          style={{
            width: "100%",
            color: "var(--priority-critical)",
            borderColor: "rgba(220, 38, 38, 0.3)",
            backgroundColor: "var(--priority-critical-bg)",
            fontWeight: 800,
            borderRadius: "14px",
            minHeight: "50px",
          }}
        >
          <LogOut size={18} />
          <span>Sign Out of Account</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: "400px",
              width: "100%",
              padding: "28px 24px",
              textAlign: "center",
              borderRadius: "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                backgroundColor: "var(--danger-light)",
                color: "var(--danger)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <LogOut size={24} />
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "8px" }}>Sign Out?</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "22px" }}>
              Are you sure you want to sign out of your BantayBarangay account on this device?
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="btn btn-danger"
                style={{ flex: 1, fontWeight: 800 }}
              >
                {isLoggingOut ? "Signing Out..." : "Yes, Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
