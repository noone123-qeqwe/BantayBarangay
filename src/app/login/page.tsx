"use client";

import React, { useState, useEffect, useRef } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { normalizePhoneNumber, isValidPhilippinePhone, formatDisplayPhone } from "@/lib/phone";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Shield,
  MapPin,
  Zap,
  Check,
  WifiOff,
  User,
  Wrench,
  Building2,
  Crown,
  Sparkles,
  Radio,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [shake, setShake] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Focus states
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);

  const identifierInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Smart input detection
  const isEmailInput = identifier.includes("@");

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Network connection listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setError(null);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setError("Unable to connect. Please check your internet connection.");
    };

    if (typeof window !== "undefined") {
      setIsOffline(!window.navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  // Format hint helper for Philippine mobile numbers
  const getPhonePreview = () => {
    const trimmed = identifier.trim();
    if (!trimmed || trimmed.includes("@")) return null;
    const cleanDigits = trimmed.replace(/\D/g, "");
    if (cleanDigits.length >= 10 && isValidPhilippinePhone(trimmed)) {
      return formatDisplayPhone(trimmed);
    }
    return null;
  };

  const phonePreview = getPhonePreview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setError("Unable to connect. Please check your internet connection.");
      triggerShake();
      return;
    }

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      setError("Please enter your mobile number or email.");
      identifierInputRef.current?.focus();
      triggerShake();
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      passwordInputRef.current?.focus();
      triggerShake();
      return;
    }

    const hasOnlyPhoneChars = /^[\d\s\+\-\(\)]+$/.test(trimmedIdentifier);
    if (hasOnlyPhoneChars && !trimmedIdentifier.includes("@")) {
      const normalized = normalizePhoneNumber(trimmedIdentifier);
      if (!normalized) {
        setError("Please enter a valid Philippine mobile number (e.g. 0917 123 4567) or email.");
        identifierInputRef.current?.focus();
        triggerShake();
        return;
      }
    }

    setError(null);
    setStatus("loading");

    try {
      const result = await login(trimmedIdentifier, password);

      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          router.push("/dashboard");
        }, 400);
      } else {
        setStatus("error");
        triggerShake();

        const rawError = (result.error || "").toLowerCase();
        if (rawError.includes("invalid") || rawError.includes("credential") || rawError.includes("401")) {
          setError("Incorrect mobile number/email or password. Please try again.");
        } else if (rawError.includes("deactivated")) {
          setError("Your account is currently deactivated. Please contact your Barangay Hall.");
        } else if (rawError.includes("too many") || rawError.includes("rate") || rawError.includes("429")) {
          setError("Too many login attempts. Please wait a moment and try again.");
        } else if (rawError.includes("network") || rawError.includes("fetch") || rawError.includes("connection")) {
          setError("Unable to connect. Please check your internet connection.");
        } else {
          setError(result.error || "Incorrect credentials. Please try again.");
        }
      }
    } catch {
      setStatus("error");
      triggerShake();
      setError("Unable to connect. Please check your internet connection.");
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleQuickLogin = (demoIdentifier: string, roleName: string) => {
    setIdentifier(demoIdentifier);
    setPassword("Password123!");
    setSelectedRole(roleName);
    setError(null);
    setStatus("idle");
  };

  return (
    <div className="login-canvas-wrapper">
      {/* Radiant Background Ambiance */}
      <div className="ambient-sphere sphere-sapphire" aria-hidden="true" />
      <div className="ambient-sphere sphere-cyan" aria-hidden="true" />
      <div className="ambient-sphere sphere-emerald" aria-hidden="true" />

      <main className="login-center-container">
        <div className={`login-unified-card ${shake ? "card-shake" : ""}`}>
          
          {/* ===============================================================
              LEFT COLUMN: Deep Civic Tech Showcase
             =============================================================== */}
          <section className="left-civic-showcase" aria-label="BantayBarangay Platform Overview">
            
            {/* Top Brand Header */}
            <div>
              <div className="brand-header-row">
                <div className="brand-badge-box">
                  <ShieldCheck size={22} className="brand-badge-icon" />
                </div>
                <div className="brand-text-block">
                  <span className="brand-name">Bantay<span className="brand-highlight">Barangay</span></span>
                  <span className="brand-subtext">Civic Reporting & Response</span>
                </div>
              </div>

              <div className="smart-gov-chip">
                <span className="live-pulsing-dot" />
                <span>Smart Civic Governance System</span>
              </div>

              {/* Bold Value Proposition */}
              <h1 className="showcase-headline">
                Empowering communities through <span className="headline-gradient">transparent action.</span>
              </h1>

              <p className="showcase-description">
                Report road hazards, broken streetlights, and sanitation issues in real time. Track verified municipal resolutions transparently together.
              </p>
            </div>

            {/* Live Municipal Dispatch Spotlight Card */}
            <div className="dispatch-spotlight-card">
              <div className="dispatch-top-meta">
                <div className="dispatch-pulse-tag">
                  <Radio size={13} className="radio-pulse" />
                  <span>LIVE DISPATCH FEED</span>
                </div>
                <div className="dispatch-status-pill">
                  <Check size={12} strokeWidth={3} />
                  <span>RESOLVED</span>
                </div>
              </div>

              <h3 className="dispatch-issue-text">
                Streetlight Cable Hazard Repaired
              </h3>

              <div className="dispatch-location-meta">
                <span>Barangay Engineering Unit</span>
                <span className="bullet-sep">·</span>
                <span className="dispatch-sla-time">Verified in 18 hrs</span>
              </div>

              <div className="dispatch-resident-proof">
                <div className="proof-check-circle">
                  <Check size={11} strokeWidth={3} />
                </div>
                <span>Confirmed & verified with photo proof by resident</span>
              </div>
            </div>

            {/* 3 Core Civic Pillars */}
            <div className="civic-pillars-grid">
              <div className="pillar-row">
                <div className="pillar-icon-gem gem-blue">
                  <MapPin size={16} />
                </div>
                <div className="pillar-info">
                  <strong className="pillar-headline">Precise GPS Pinpointing</strong>
                  <span className="pillar-caption">Instant geo-coordinates with duplicate hazard detection.</span>
                </div>
              </div>

              <div className="pillar-row">
                <div className="pillar-icon-gem gem-cyan">
                  <Zap size={16} />
                </div>
                <div className="pillar-info">
                  <strong className="pillar-headline">Real-Time SLA Tracking</strong>
                  <span className="pillar-caption">Live progression from triage to agency field dispatch.</span>
                </div>
              </div>

              <div className="pillar-row">
                <div className="pillar-icon-gem gem-emerald">
                  <Layers size={16} />
                </div>
                <div className="pillar-info">
                  <strong className="pillar-headline">Citizen Verification Loop</strong>
                  <span className="pillar-caption">Community photo proof confirms reports before closure.</span>
                </div>
              </div>
            </div>

            {/* Showcase Footer Compliance */}
            <footer className="showcase-compliance-row">
              <Shield size={13} className="shield-compliance-icon" />
              <span>Official Civic Platform · 256-Bit SSL Encrypted · RA 10173 Compliant</span>
            </footer>

          </section>

          {/* ===============================================================
              RIGHT COLUMN: Pristine Authentication Form
             =============================================================== */}
          <section className="right-auth-card" aria-label="Sign In to BantayBarangay">
            
            {/* Header / Intro */}
            <div className="auth-card-header">
              <div className="civic-badge-pill">
                <Shield size={12} />
                <span>OFFICIAL RESIDENT & STAFF PORTAL</span>
              </div>

              <h2 className="auth-title">Welcome back</h2>
              <p className="auth-subtitle">
                Sign in to report community hazards, monitor active tickets, or access barangay operations.
              </p>
            </div>

            {/* Offline Alert */}
            {isOffline && (
              <div className="status-banner banner-warning" role="alert">
                <WifiOff size={16} />
                <span>You are currently offline. Please check your internet connection.</span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="status-banner banner-error" role="alert">
                <AlertCircle size={16} />
                <div className="banner-text">
                  <strong>Authentication Failed</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} noValidate className="auth-form">
              
              {/* Field 1: Mobile number or email */}
              <div className="form-field-group">
                <div className="field-top-row">
                  <label htmlFor="identifier" className="field-label">
                    Mobile number or email
                  </label>
                  {phonePreview && (
                    <span className="phone-validation-hint">
                      ✓ {phonePreview}
                    </span>
                  )}
                </div>

                <div className={`composite-input ${isIdentifierFocused ? "composite-focus" : ""} ${error && !identifier.trim() ? "composite-error" : ""}`}>
                  {!isEmailInput ? (
                    <div className="country-prefix-badge">
                      <span className="flag-icon">🇵🇭</span>
                      <span className="prefix-num">+63</span>
                    </div>
                  ) : (
                    <div className="country-prefix-badge prefix-email">
                      <Mail size={15} />
                    </div>
                  )}

                  <input
                    ref={identifierInputRef}
                    id="identifier"
                    name="identifier"
                    type={isEmailInput ? "email" : "tel"}
                    inputMode={isEmailInput ? "email" : "tel"}
                    autoComplete="username"
                    className="styled-text-input"
                    placeholder="09XXXXXXXXX or staff@bantay"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError(null);
                      if (status === "error") setStatus("idle");
                    }}
                    onFocus={() => setIsIdentifierFocused(true)}
                    onBlur={() => setIsIdentifierFocused(false)}
                    disabled={status === "loading" || status === "success"}
                    aria-required="true"
                    aria-invalid={!!error && !identifier.trim()}
                  />
                </div>
                <span className="field-hint-text">
                  Enter your 11-digit mobile number or official barangay email.
                </span>
              </div>

              {/* Field 2: Password */}
              <div className="form-field-group">
                <div className="field-top-row">
                  <label htmlFor="password" className="field-label">
                    Password
                  </label>
                  <NextLink href="/forgot-password" className="forgot-link">
                    Forgot password?
                  </NextLink>
                </div>

                <div className={`composite-input ${isPassFocused ? "composite-focus" : ""} ${error && !password ? "composite-error" : ""}`}>
                  <div className="country-prefix-badge prefix-lock">
                    <Lock size={15} />
                  </div>

                  <input
                    ref={passwordInputRef}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="styled-text-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                      if (status === "error") setStatus("idle");
                    }}
                    onFocus={() => setIsPassFocused(true)}
                    onBlur={() => setIsPassFocused(false)}
                    disabled={status === "loading" || status === "success"}
                    aria-required="true"
                    aria-invalid={!!error && !password}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="eye-toggle-btn"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={status === "loading" || status === "success"}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className={`primary-submit-btn ${status === "success" ? "btn-success-state" : ""}`}
              >
                {status === "loading" && (
                  <>
                    <Loader2 size={18} className="spin-loader" />
                    <span>Signing in securely...</span>
                  </>
                )}

                {status === "success" && (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Redirecting to Dashboard...</span>
                  </>
                )}

                {status !== "loading" && status !== "success" && (
                  <>
                    <span>Sign In to Platform</span>
                    <ArrowRight size={17} className="btn-arrow-icon" />
                  </>
                )}
              </button>
            </form>

            {/* Registration Link */}
            <div className="register-redirect-banner">
              <span className="register-prompt">Don't have an account yet?</span>{" "}
              <NextLink href="/register" className="register-bold-link">
                Register as Resident
              </NextLink>
            </div>

            {/* Quick Test Roles Segment (One-Click Autofill) */}
            <div className="quick-roles-container">
              <div className="quick-roles-header">
                <div className="quick-roles-title">
                  <Sparkles size={13} className="sparkle-gold" />
                  <span>Quick Test Accounts · One-Click Autofill</span>
                </div>
                <span className="quick-roles-sub">Click any role to test:</span>
              </div>

              <div className="quick-roles-grid">
                {/* Role 1: Resident */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin("09204443333", "Resident")}
                  className={`role-select-card card-resident ${selectedRole === "Resident" ? "role-card-active" : ""}`}
                >
                  <div className="role-card-top">
                    <div className="role-avatar-circle avatar-blue">
                      <User size={14} />
                    </div>
                    {selectedRole === "Resident" && <Check size={14} className="role-check-icon text-blue" />}
                  </div>
                  <div className="role-card-meta">
                    <span className="role-name">Resident</span>
                    <span className="role-user-name">Juan Dela Cruz</span>
                  </div>
                </button>

                {/* Role 2: Staff */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin("09193332222", "Staff")}
                  className={`role-select-card card-staff ${selectedRole === "Staff" ? "role-card-active" : ""}`}
                >
                  <div className="role-card-top">
                    <div className="role-avatar-circle avatar-emerald">
                      <Wrench size={14} />
                    </div>
                    {selectedRole === "Staff" && <Check size={14} className="role-check-icon text-emerald" />}
                  </div>
                  <div className="role-card-meta">
                    <span className="role-name">Barangay Staff</span>
                    <span className="role-user-name">Alex Santos</span>
                  </div>
                </button>

                {/* Role 3: Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin("09182221111", "Admin")}
                  className={`role-select-card card-admin ${selectedRole === "Admin" ? "role-card-active" : ""}`}
                >
                  <div className="role-card-top">
                    <div className="role-avatar-circle avatar-indigo">
                      <Building2 size={14} />
                    </div>
                    {selectedRole === "Admin" && <Check size={14} className="role-check-icon text-indigo" />}
                  </div>
                  <div className="role-card-meta">
                    <span className="role-name">Barangay Admin</span>
                    <span className="role-user-name">Roberto Tan</span>
                  </div>
                </button>

                {/* Role 4: Super Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin("09171110000", "Super Admin")}
                  className={`role-select-card card-super ${selectedRole === "Super Admin" ? "role-card-active" : ""}`}
                >
                  <div className="role-card-top">
                    <div className="role-avatar-circle avatar-amber">
                      <Crown size={14} />
                    </div>
                    {selectedRole === "Super Admin" && <Check size={14} className="role-check-icon text-amber" />}
                  </div>
                  <div className="role-card-meta">
                    <span className="role-name">Super Admin</span>
                    <span className="role-user-name">System Operator</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Security Footer */}
            <div className="auth-card-footer">
              <ShieldCheck size={14} className="footer-shield" />
              <span>Government of the Philippines · Republic Act No. 10173</span>
            </div>

          </section>

        </div>
      </main>

      {/* ===============================================================
          STYLES: High-End Luminous Civic-Tech Theme
         =============================================================== */}
      <style jsx>{`
        /* Canvas Wrapper - Seamless full-height viewport */
        .login-canvas-wrapper {
          min-height: calc(100vh - var(--header-height, 60px));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 36px 20px;
          background-color: #f8fafc;
          background-image: 
            radial-gradient(circle at 12% 18%, rgba(37, 99, 235, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 88% 82%, rgba(16, 185, 129, 0.07) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 55%);
          position: relative;
          overflow: hidden;
        }

        /* Ambient Glow Spheres */
        .ambient-sphere {
          position: absolute;
          border-radius: 9999px;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.65;
        }

        .sphere-sapphire {
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%);
          top: -80px;
          left: -80px;
        }

        .sphere-cyan {
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.14) 0%, transparent 70%);
          bottom: -60px;
          right: -60px;
        }

        .sphere-emerald {
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
          top: 40%;
          left: 45%;
        }

        /* Main Container */
        .login-center-container {
          width: 100%;
          max-width: 1080px;
          position: relative;
          z-index: 1;
        }

        /* Unified Split Card */
        .login-unified-card {
          width: 100%;
          display: grid;
          grid-template-columns: 1.08fr 1fr;
          border-radius: 24px;
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 
            0 25px 50px -12px rgba(15, 23, 42, 0.08),
            0 0 0 1px rgba(255, 255, 255, 0.8);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card-shake {
          animation: shakeCardEffect 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes shakeCardEffect {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(3px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        /* =============================================================
           LEFT PANEL: Deep Navy Sapphire Showcase
           ============================================================= */
        .left-civic-showcase {
          background: linear-gradient(155deg, #090f1d 0%, #0f1c34 50%, #091222 100%);
          padding: 44px 40px;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
        }

        .left-civic-showcase::before {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background-image: radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.22) 0%, transparent 50%),
                            radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.18) 0%, transparent 50%);
          pointer-events: none;
        }

        .brand-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .brand-badge-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
          flex-shrink: 0;
        }

        .brand-badge-icon {
          color: #ffffff;
        }

        .brand-text-block {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
          font-size: 1.45rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #ffffff;
          line-height: 1.1;
        }

        .brand-highlight {
          color: #38bdf8;
        }

        .brand-subtext {
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }

        .smart-gov-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin-bottom: 22px;
          position: relative;
          z-index: 1;
        }

        .live-pulsing-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: pulseGreen 1.8s infinite;
        }

        @keyframes pulseGreen {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 12px #34d399; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }

        .showcase-headline {
          font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
          font-size: 2.1rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.03em;
          color: #f8fafc;
          margin-bottom: 14px;
          position: relative;
          z-index: 1;
        }

        .headline-gradient {
          background: linear-gradient(135deg, #38bdf8 0%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .showcase-description {
          font-size: 0.925rem;
          line-height: 1.6;
          color: #cbd5e1;
          margin-bottom: 28px;
          position: relative;
          z-index: 1;
        }

        /* Dispatch Spotlight Card */
        .dispatch-spotlight-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 16px 18px;
          margin-bottom: 26px;
          position: relative;
          z-index: 1;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
        }

        .dispatch-top-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .dispatch-pulse-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.688rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #38bdf8;
        }

        .radio-pulse {
          color: #38bdf8;
        }

        .dispatch-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #34d399;
          font-size: 0.688rem;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .dispatch-issue-text {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }

        .dispatch-location-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.775rem;
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .bullet-sep {
          color: #64748b;
        }

        .dispatch-sla-time {
          color: #38bdf8;
          font-weight: 600;
        }

        .dispatch-resident-proof {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.75rem;
          font-weight: 600;
          color: #a7f3d0;
        }

        .proof-check-circle {
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
        }

        /* 3 Pillars List */
        .civic-pillars-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 24px;
          position: relative;
          z-index: 1;
        }

        .pillar-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .pillar-icon-gem {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .gem-blue {
          background: rgba(37, 99, 235, 0.2);
          color: #60a5fa;
          border: 1px solid rgba(37, 99, 235, 0.35);
        }

        .gem-cyan {
          background: rgba(6, 182, 212, 0.2);
          color: #38bdf8;
          border: 1px solid rgba(6, 182, 212, 0.35);
        }

        .gem-emerald {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.35);
        }

        .pillar-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .pillar-headline {
          font-size: 0.85rem;
          font-weight: 700;
          color: #ffffff;
        }

        .pillar-caption {
          font-size: 0.775rem;
          color: #94a3b8;
          line-height: 1.35;
        }

        /* Left Showcase Compliance Footer */
        .showcase-compliance-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.713rem;
          color: #64748b;
          letter-spacing: 0.01em;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          z-index: 1;
        }

        .shield-compliance-icon {
          color: #38bdf8;
          flex-shrink: 0;
        }

        /* =============================================================
           RIGHT PANEL: Pure Clean Auth Card
           ============================================================= */
        .right-auth-card {
          background-color: #ffffff;
          padding: 44px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .auth-card-header {
          margin-bottom: 22px;
        }

        .civic-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          margin-bottom: 12px;
        }

        .auth-title {
          font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin: 0 0 6px 0;
        }

        .auth-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        /* Status Banners */
        .status-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.813rem;
          margin-bottom: 18px;
        }

        .banner-warning {
          background-color: #fffbeb;
          border: 1px solid #fde68a;
          color: #b45309;
        }

        .banner-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .banner-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Form Controls */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 18px;
        }

        .form-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .field-label {
          font-size: 0.813rem;
          font-weight: 700;
          color: #1e293b;
        }

        .phone-validation-hint {
          font-size: 0.725rem;
          font-weight: 700;
          color: #059669;
          background: #ecfdf5;
          padding: 2px 8px;
          border-radius: 9999px;
          border: 1px solid #a7f3d0;
        }

        .forgot-link {
          font-size: 0.785rem;
          font-weight: 600;
          color: #2563eb;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .forgot-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .composite-input {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .composite-focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.12);
        }

        .composite-error {
          border-color: #ef4444;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .country-prefix-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0 14px;
          height: 44px;
          background-color: #f1f5f9;
          border-right: 1.5px solid #e2e8f0;
          color: #334155;
          font-size: 0.813rem;
          font-weight: 700;
          user-select: none;
          flex-shrink: 0;
        }

        .prefix-email, .prefix-lock {
          color: #64748b;
          padding: 0 12px;
        }

        .styled-text-input {
          flex: 1;
          height: 44px;
          padding: 0 14px;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.875rem;
          color: #0f172a;
          font-weight: 500;
        }

        .styled-text-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .eye-toggle-btn {
          height: 44px;
          width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .eye-toggle-btn:hover {
          color: #0f172a;
        }

        .field-hint-text {
          font-size: 0.725rem;
          color: #64748b;
        }

        /* Primary Submit Button */
        .primary-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 46px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          font-size: 0.925rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          margin-top: 4px;
        }

        .primary-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.45);
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }

        .primary-submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .primary-submit-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .btn-success-state {
          background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35) !important;
        }

        .spin-loader {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .btn-arrow-icon {
          transition: transform 0.2s ease;
        }

        .primary-submit-btn:hover .btn-arrow-icon {
          transform: translateX(3px);
        }

        /* Register Redirect */
        .register-redirect-banner {
          text-align: center;
          font-size: 0.813rem;
          margin-bottom: 20px;
        }

        .register-prompt {
          color: #64748b;
        }

        .register-bold-link {
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .register-bold-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        /* Quick Test Roles Box */
        .quick-roles-container {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 18px;
        }

        .quick-roles-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .quick-roles-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #334155;
        }

        .sparkle-gold {
          color: #d97706;
        }

        .quick-roles-sub {
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 500;
        }

        .quick-roles-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .role-select-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 9px 12px;
          border-radius: 10px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          cursor: pointer;
          text-align: left;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .role-select-card:hover {
          transform: translateY(-1px);
          border-color: #cbd5e1;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
        }

        .role-card-active {
          border-color: #2563eb !important;
          background: #eff6ff !important;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
        }

        .card-staff.role-card-active {
          border-color: #059669 !important;
          background: #ecfdf5 !important;
          box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2) !important;
        }

        .card-admin.role-card-active {
          border-color: #6366f1 !important;
          background: #eef2ff !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
        }

        .card-super.role-card-active {
          border-color: #d97706 !important;
          background: #fffbeb !important;
          box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2) !important;
        }

        .role-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .role-avatar-circle {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-blue {
          background: #eff6ff;
          color: #2563eb;
        }

        .avatar-emerald {
          background: #ecfdf5;
          color: #059669;
        }

        .avatar-indigo {
          background: #eef2ff;
          color: #6366f1;
        }

        .avatar-amber {
          background: #fffbeb;
          color: #d97706;
        }

        .text-blue { color: #2563eb; }
        .text-emerald { color: #059669; }
        .text-indigo { color: #6366f1; }
        .text-amber { color: #d97706; }

        .role-card-meta {
          display: flex;
          flex-direction: column;
        }

        .role-name {
          font-size: 0.775rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }

        .role-user-name {
          font-size: 0.688rem;
          color: #64748b;
          font-weight: 500;
        }

        /* Card Footer */
        .auth-card-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.713rem;
          color: #94a3b8;
          padding-top: 10px;
          border-top: 1px solid #f1f5f9;
        }

        .footer-shield {
          color: #64748b;
        }

        /* =============================================================
           RESPONSIVE MOBILE BREAKPOINTS
           ============================================================= */
        @media (max-width: 980px) {
          .login-unified-card {
            grid-template-columns: 1fr;
            max-width: 520px;
          }

          .left-civic-showcase {
            display: none;
          }

          .right-auth-card {
            padding: 36px 24px;
          }

          .login-canvas-wrapper {
            padding: 24px 16px;
          }
        }

        @media (max-width: 480px) {
          .quick-roles-grid {
            grid-template-columns: 1fr;
          }

          .auth-title {
            font-size: 1.6rem;
          }
        }
      `}</style>
    </div>
  );
}
