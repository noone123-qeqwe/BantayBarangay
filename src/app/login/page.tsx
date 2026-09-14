"use client";

import React, { useState, useEffect, useRef } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { normalizePhoneNumber, isValidPhilippinePhone, formatDisplayPhone } from "@/lib/phone";
import {
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  User,
  Crown,
  WifiOff,
  Shield,
  ArrowRight,
  MapPin,
  Check,
  Activity,
  FileCheck2,
  Zap,
  Building2,
  Wrench,
  Clock,
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

  // Field focus states
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);

  const identifierInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Smart input detection
  const isEmailInput = identifier.includes("@");

  // If already logged in, seamlessly forward to dashboard
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Network connection monitor
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
        }, 450);
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
    <div className="login-root-container">
      {/* Dynamic Background Mesh */}
      <div className="bg-mesh-glow glow-primary" />
      <div className="bg-mesh-glow glow-secondary" />
      <div className="bg-mesh-glow glow-accent" />

      <div className="login-full-wrapper">
        {/* ===============================================================
            LEFT SECTION: Immersive Civic Intelligence Showcase (Hero)
           =============================================================== */}
        <section className="civic-showcase-panel">
          {/* Subtle blueprint grid overlay */}
          <div className="showcase-grid-overlay" />

          {/* Top Brand Header */}
          <div className="showcase-header">
            <div className="showcase-brand-mark">
              <div className="logo-glow-container">
                <img
                  src="/logo.png"
                  alt="BantayBarangay Official Logo"
                  width={48}
                  height={48}
                  className="brand-logo-img"
                />
              </div>
              <div>
                <h2 className="brand-name">BantayBarangay</h2>
                <div className="brand-badge">
                  <span className="badge-live-pulse" />
                  <span>Civic Infrastructure Platform</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Typography */}
          <div className="showcase-hero-body">
            <div className="hero-pill-tag">
              <Sparkles size={13} className="sparkle-svg" />
              <span>Smart Community Governance</span>
            </div>
            <h1 className="hero-title">
              Empowering communities through <span className="hero-highlight">transparent action</span>.
            </h1>
            <p className="hero-description">
              Report infrastructure hazards, track emergency responses in real-time, and verify completed municipal fixes together.
            </p>
          </div>

          {/* Live Community Activity HUD Card */}
          <div className="showcase-live-hud">
            <div className="hud-header">
              <div className="hud-title-wrap">
                <Activity size={15} className="hud-pulse-icon" />
                <span className="hud-label">Live Municipal Dispatch</span>
              </div>
              <span className="hud-status-badge">
                <Check size={12} strokeWidth={3} />
                <span>Resolved</span>
              </span>
            </div>
            
            <div className="hud-body">
              <div className="hud-ticket-title">Streetlight Cable Hazard Repaired</div>
              <div className="hud-ticket-details">
                <span className="hud-agency">
                  <Wrench size={12} />
                  <span>Barangay Engineering Team</span>
                </span>
                <span className="hud-time">
                  <Clock size={12} />
                  <span>Verified in 18 hrs</span>
                </span>
              </div>
            </div>

            <div className="hud-footer">
              <div className="citizen-verified-tag">
                <CheckCircle2 size={13} className="check-verified" />
                <span>Confirmed & Verified by Resident</span>
              </div>
            </div>
          </div>

          {/* 3 Core Value Pillars */}
          <div className="showcase-pillars">
            <div className="pillar-item">
              <div className="pillar-icon-box icon-blue">
                <MapPin size={18} />
              </div>
              <div className="pillar-text">
                <h4>Precise GPS Pinpointing</h4>
                <p>Instant coordinates and automated duplicate detection.</p>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-box icon-teal">
                <Zap size={18} />
              </div>
              <div className="pillar-text">
                <h4>Real-Time Status Progression</h4>
                <p>Track issues from review to agency dispatch and completion.</p>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-box icon-amber">
                <FileCheck2 size={18} />
              </div>
              <div className="pillar-text">
                <h4>Resident Verification Loop</h4>
                <p>You confirm with photo proof before reports are closed.</p>
              </div>
            </div>
          </div>

          {/* Footer Security Assurance */}
          <div className="showcase-bottom-seal">
            <ShieldCheck size={16} className="seal-icon" />
            <span>256-Bit SSL Encrypted • Government & Civic Data Privacy Compliant</span>
          </div>
        </section>

        {/* ===============================================================
            RIGHT SECTION: Modern, Spacious Authentication Form
           =============================================================== */}
        <section className="civic-auth-panel">
          <div className={`auth-inner-content ${shake ? "shake-effect" : ""}`}>
            
            {/* Mobile Header Branding (Visible on mobile/tablets) */}
            <div className="mobile-brand-banner">
              <img
                src="/logo.png"
                alt="BantayBarangay Logo"
                width={50}
                height={50}
                className="mobile-logo-img"
              />
              <span className="mobile-portal-badge">
                <Shield size={12} />
                <span>Official Civic Portal</span>
              </span>
            </div>

            {/* Form Title & Subtitle */}
            <div className="auth-header">
              <div className="portal-badge-desktop">
                <Shield size={12} />
                <span>Official Civic Portal</span>
              </div>
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-subtitle">
                Sign in to report issues, track tickets, or access barangay operations.
              </p>
            </div>

            {/* Offline Alert */}
            {isOffline && (
              <div className="status-banner banner-warning" role="alert">
                <WifiOff size={18} className="banner-icon" />
                <span>You appear to be offline. Please check your internet connection.</span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="status-banner banner-error" role="alert">
                <AlertCircle size={18} className="banner-icon" />
                <div className="banner-text">
                  <strong>Sign In Failed</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Main Login Form */}
            <form onSubmit={handleSubmit} noValidate className="auth-form">
              
              {/* Field 1: Mobile Number or Email */}
              <div className="form-field-group">
                <div className="field-label-row">
                  <label htmlFor="identifier" className="field-label">
                    Mobile Number or Email
                  </label>
                  {phonePreview && (
                    <span className="phone-format-pill">
                      ✓ {phonePreview}
                    </span>
                  )}
                </div>

                <div className={`field-input-box ${isIdentifierFocused ? "focused" : ""} ${error && !identifier.trim() ? "has-error" : ""}`}>
                  {!isEmailInput ? (
                    <div className="flag-prefix-pill" title="Philippines Country Code (+63)">
                      <span className="flag-emoji" aria-hidden="true">🇵🇭</span>
                      <span className="country-code">+63</span>
                    </div>
                  ) : (
                    <div className="email-prefix-icon">
                      <Mail size={18} />
                    </div>
                  )}

                  <input
                    ref={identifierInputRef}
                    id="identifier"
                    name="identifier"
                    type={isEmailInput ? "email" : "tel"}
                    inputMode={isEmailInput ? "email" : "tel"}
                    autoComplete="username"
                    className="core-input"
                    placeholder="09XXXXXXXXX or staff@bantay.ph"
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

                  <div className="field-suffix-icon">
                    {isEmailInput ? <Mail size={18} /> : <Smartphone size={18} />}
                  </div>
                </div>

                <p className="field-hint-text">
                  Enter your 11-digit mobile number or official barangay email account.
                </p>
              </div>

              {/* Field 2: Password */}
              <div className="form-field-group">
                <div className="field-label-row">
                  <label htmlFor="password" className="field-label">
                    Password
                  </label>
                  <NextLink href="/forgot-password" className="forgot-password-link">
                    Forgot Password?
                  </NextLink>
                </div>

                <div className={`field-input-box ${isPassFocused ? "focused" : ""} ${error && !password ? "has-error" : ""}`}>
                  <div className="password-prefix-icon">
                    <Lock size={18} />
                  </div>

                  <input
                    ref={passwordInputRef}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="core-input"
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
                    className="eye-toggle-button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={status === "loading" || status === "success"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Sign In Primary Action Button */}
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className={`auth-submit-btn ${status === "success" ? "btn-success" : ""}`}
              >
                {status === "loading" && (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    <span>Signing you in...</span>
                  </>
                )}

                {status === "success" && (
                  <>
                    <CheckCircle2 size={19} className="animate-bounce-in" />
                    <span>Login Successful</span>
                  </>
                )}

                {status !== "loading" && status !== "success" && (
                  <>
                    <LogIn size={19} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Registration Navigation */}
            <div className="auth-footer-callout">
              <span>Don't have an account yet?</span>{" "}
              <NextLink href="/register" className="callout-link">
                <span>Create an account</span>
                <ArrowRight size={14} className="arrow-slide" />
              </NextLink>
            </div>

            {/* Quick Demo Accounts Bar (Convenient 1-Click Role Selector) */}
            <div className="quick-demo-container">
              <div className="demo-bar-header">
                <Sparkles size={13} className="sparkle-colored" />
                <span>Quick Test Roles (One-Click Auto-Fill)</span>
              </div>
              
              <div className="demo-chips-grid">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("09204443333", "Resident")}
                  className={`role-chip ${selectedRole === "Resident" ? "chip-active" : ""}`}
                >
                  <User size={13} className="chip-icon icon-resident" />
                  <span className="chip-name">Resident</span>
                  <span className="chip-sub">Juan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("09193332222", "Staff")}
                  className={`role-chip ${selectedRole === "Staff" ? "chip-active" : ""}`}
                >
                  <Wrench size={13} className="chip-icon icon-staff" />
                  <span className="chip-name">Staff</span>
                  <span className="chip-sub">Alex</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("09182221111", "Admin")}
                  className={`role-chip ${selectedRole === "Admin" ? "chip-active" : ""}`}
                >
                  <Building2 size={13} className="chip-icon icon-admin" />
                  <span className="chip-name">Admin</span>
                  <span className="chip-sub">Roberto</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("09171110000", "Super Admin")}
                  className={`role-chip ${selectedRole === "Super Admin" ? "chip-active" : ""}`}
                >
                  <Crown size={13} className="chip-icon icon-super" />
                  <span className="chip-name">Super</span>
                  <span className="chip-sub">Operator</span>
                </button>
              </div>
            </div>

            {/* End-to-End Security Seal */}
            <div className="security-seal-row">
              <ShieldCheck size={14} className="seal-shield" />
              <span>Official Civic Platform • 256-Bit SSL Encrypted</span>
            </div>
          </div>
        </section>

      </div>

      {/* ===============================================================
          STYLES: High-Impact, Responsive Modern Architecture
         =============================================================== */}
      <style jsx>{`
        .login-root-container {
          min-height: calc(100vh - var(--header-height, 64px));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #f1f5f9;
          position: relative;
          overflow: hidden;
        }

        /* Ambient Dynamic Background Meshes */
        .bg-mesh-glow {
          position: absolute;
          border-radius: 9999px;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.6;
        }

        .glow-primary {
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, transparent 70%);
          top: -140px;
          left: 5%;
        }

        .glow-secondary {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(13, 148, 136, 0.18) 0%, transparent 70%);
          bottom: -120px;
          right: 5%;
        }

        .glow-accent {
          width: 360px;
          height: 360px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
          top: 35%;
          left: 45%;
        }

        /* Full Outer Card Container */
        .login-full-wrapper {
          width: 100%;
          max-width: 1120px;
          min-height: 640px;
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 28px;
          box-shadow: 0 24px 60px -12px rgba(15, 23, 42, 0.14), 0 8px 24px -4px rgba(15, 23, 42, 0.06);
          overflow: hidden;
          position: relative;
          z-index: 1;
          animation: slideUpFade 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .shake-effect {
          animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(3px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        /* -----------------------------------------------------------
           LEFT SHOWCASE PANEL
           ----------------------------------------------------------- */
        .civic-showcase-panel {
          background: linear-gradient(150deg, #091224 0%, #0d1b38 45%, #13274e 100%);
          color: #ffffff;
          padding: 48px 44px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .showcase-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px);
          background-size: 26px 26px;
          opacity: 0.65;
          pointer-events: none;
        }

        .showcase-header {
          position: relative;
          z-index: 2;
        }

        .showcase-brand-mark {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .logo-glow-container {
          background: rgba(255, 255, 255, 0.1);
          border: 1.5px solid rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(12px);
          padding: 6px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .brand-logo-img {
          border-radius: 8px;
          object-fit: contain;
        }

        .brand-name {
          font-size: 1.35rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.025em;
          margin: 0;
          line-height: 1.2;
        }

        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #93c5fd;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 3px;
        }

        .badge-live-pulse {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background-color: #38bdf8;
          box-shadow: 0 0 8px #38bdf8;
        }

        /* Hero Typography */
        .showcase-hero-body {
          position: relative;
          z-index: 2;
          margin-top: 24px;
          margin-bottom: 24px;
        }

        .hero-pill-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 11px;
          background: rgba(37, 99, 235, 0.25);
          border: 1px solid rgba(96, 165, 250, 0.35);
          border-radius: 9999px;
          font-size: 0.719rem;
          font-weight: 700;
          color: #bfdbfe;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 14px;
        }

        .sparkle-svg {
          color: #60a5fa;
        }

        .hero-title {
          font-size: 1.95rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.22;
          letter-spacing: -0.03em;
          margin: 0 0 12px 0;
        }

        .hero-highlight {
          background: linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-fill-color: transparent;
        }

        .hero-description {
          font-size: 0.922rem;
          color: #cbd5e1;
          line-height: 1.55;
          margin: 0;
        }

        /* Live Activity HUD Card */
        .showcase-live-hud {
          position: relative;
          z-index: 2;
          background: rgba(255, 255, 255, 0.07);
          border: 1.5px solid rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(14px);
          border-radius: 18px;
          padding: 16px 18px;
          margin-bottom: 24px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
        }

        .hud-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .hud-title-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.719rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hud-pulse-icon {
          color: #38bdf8;
        }

        .hud-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.719rem;
          font-weight: 800;
          color: #34d399;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(52, 211, 153, 0.35);
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .hud-ticket-title {
          font-size: 0.938rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .hud-ticket-details {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.781rem;
          color: #cbd5e1;
        }

        .hud-agency, .hud-time {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .hud-footer {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .citizen-verified-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.719rem;
          color: #6ee7b7;
          font-weight: 600;
        }

        .check-verified {
          color: #34d399;
        }

        /* Pillars List */
        .showcase-pillars {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 24px;
        }

        .pillar-item {
          display: flex;
          align-items: flex-start;
          gap: 13px;
        }

        .pillar-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .icon-blue { background: rgba(37, 99, 235, 0.28); color: #60a5fa; }
        .icon-teal { background: rgba(13, 148, 136, 0.28); color: #2dd4bf; }
        .icon-amber { background: rgba(245, 158, 11, 0.28); color: #fbbf24; }

        .pillar-text h4 {
          font-size: 0.844rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 2px 0;
        }

        .pillar-text p {
          font-size: 0.781rem;
          color: #94a3b8;
          margin: 0;
          line-height: 1.35;
        }

        .showcase-bottom-seal {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.719rem;
          color: #94a3b8;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .seal-icon {
          color: #38bdf8;
          flex-shrink: 0;
        }

        /* -----------------------------------------------------------
           RIGHT FORM PANEL
           ----------------------------------------------------------- */
        .civic-auth-panel {
          padding: 48px 44px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .auth-inner-content {
          max-width: 420px;
          width: 100%;
          margin: 0 auto;
        }

        /* Mobile Header */
        .mobile-brand-banner {
          display: none;
          flex-direction: column;
          align-items: center;
          margin-bottom: 22px;
        }

        .mobile-logo-img {
          border-radius: 12px;
          object-fit: contain;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28);
          margin-bottom: 8px;
        }

        .mobile-portal-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.22);
          color: #2563eb;
          border-radius: 9999px;
          font-size: 0.688rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Form Heading Group */
        .auth-header {
          margin-bottom: 24px;
        }

        .portal-badge-desktop {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.2);
          color: #2563eb;
          border-radius: 9999px;
          font-size: 0.688rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 12px;
        }

        .auth-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          margin: 0;
          line-height: 1.2;
        }

        .auth-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 6px;
          line-height: 1.45;
        }

        /* Status Banners */
        .status-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.844rem;
          margin-bottom: 20px;
          line-height: 1.4;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .banner-error {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1.5px solid #fecaca;
        }

        .banner-warning {
          background-color: #fffbeb;
          color: #92400e;
          border: 1.5px solid #fde68a;
        }

        .banner-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .banner-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .banner-text strong {
          font-size: 0.781rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        /* Form Components */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-field-group {
          display: flex;
          flex-direction: column;
        }

        .field-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 7px;
        }

        .field-label {
          font-size: 0.844rem;
          font-weight: 700;
          color: #1e293b;
          user-select: none;
        }

        .phone-format-pill {
          font-size: 0.719rem;
          font-weight: 700;
          color: #065f46;
          background: #d1fae5;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .forgot-password-link {
          font-size: 0.813rem;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .forgot-password-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        /* Input Box System */
        .field-input-box {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          min-height: 48px;
          padding: 0 14px;
          transition: border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background 0.2s ease;
        }

        .field-input-box:hover {
          background: #ffffff;
          border-color: #94a3b8;
        }

        .field-input-box.focused {
          background: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.18);
        }

        .field-input-box.has-error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3.5px rgba(239, 68, 68, 0.15);
          background: #fff5f5;
        }

        .flag-prefix-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding-right: 10px;
          border-right: 1.5px solid #e2e8f0;
          color: #334155;
          font-size: 0.875rem;
          font-weight: 700;
          user-select: none;
          flex-shrink: 0;
        }

        .flag-emoji {
          font-size: 1.05rem;
        }

        .email-prefix-icon, .password-prefix-icon {
          color: #64748b;
          display: flex;
          align-items: center;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .core-input {
          flex: 1;
          width: 100%;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #0f172a;
          font-size: 0.906rem;
          font-weight: 500;
          padding: 10px 8px;
          height: 100%;
        }

        .core-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .field-suffix-icon {
          color: #94a3b8;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .eye-toggle-button {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 6px;
          margin-right: -4px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .eye-toggle-button:hover {
          color: #2563eb;
          background: #f1f5f9;
        }

        .field-hint-text {
          font-size: 0.719rem;
          color: #64748b;
          margin-top: 5px;
          padding-left: 2px;
          line-height: 1.35;
        }

        /* Primary Submit Button */
        .auth-submit-btn {
          width: 100%;
          min-height: 50px;
          margin-top: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 12px;
          font-size: 0.969rem;
          font-weight: 700;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 4px 18px rgba(37, 99, 235, 0.38);
          cursor: pointer;
          user-select: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .auth-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          box-shadow: 0 6px 22px rgba(37, 99, 235, 0.48);
          transform: translateY(-1px);
        }

        .auth-submit-btn:active:not(:disabled) {
          transform: scale(0.99);
        }

        .auth-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          box-shadow: 0 4px 18px rgba(16, 185, 129, 0.38) !important;
        }

        .animate-spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-bounce-in {
          animation: bounceIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }

        @keyframes bounceIn {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Register Link Callout */
        .auth-footer-callout {
          text-align: center;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
          font-size: 0.844rem;
          color: #475569;
        }

        .callout-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.15s ease, gap 0.15s ease;
        }

        .callout-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .callout-link:hover .arrow-slide {
          transform: translateX(3px);
        }

        .arrow-slide {
          transition: transform 0.15s ease;
        }

        /* Quick Demo Accounts Bar */
        .quick-demo-container {
          margin-top: 16px;
          padding: 12px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 14px;
        }

        .demo-bar-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.719rem;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 9px;
        }

        .sparkle-colored {
          color: #2563eb;
        }

        .demo-chips-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }

        .role-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 7px 4px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
        }

        .role-chip:hover {
          border-color: #2563eb;
          background: #eff6ff;
          transform: translateY(-1px);
        }

        .chip-active {
          border-color: #2563eb !important;
          background: #eff6ff !important;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }

        .chip-icon {
          margin-bottom: 2px;
        }

        .icon-resident { color: #2563eb; }
        .icon-staff { color: #f59e0b; }
        .icon-admin { color: #dc2626; }
        .icon-super { color: #8b5cf6; }

        .chip-name {
          font-size: 0.688rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.1;
        }

        .chip-sub {
          font-size: 0.594rem;
          color: #64748b;
          line-height: 1.1;
        }

        /* End-to-End Security Seal */
        .security-seal-row {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.688rem;
          font-weight: 600;
          color: #64748b;
        }

        .seal-shield {
          color: #0d9488;
        }

        /* -----------------------------------------------------------
           RESPONSIVE DESIGN BREAKPOINTS
           ----------------------------------------------------------- */
        @media (max-width: 1040px) {
          .login-full-wrapper {
            grid-template-columns: 1fr;
            max-width: 480px;
            min-height: auto;
          }

          .civic-showcase-panel {
            display: none;
          }

          .mobile-brand-banner {
            display: flex;
          }

          .portal-badge-desktop {
            display: none;
          }

          .civic-auth-panel {
            padding: 38px 28px;
          }

          .auth-header {
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .login-root-container {
            padding: 16px 12px;
          }

          .civic-auth-panel {
            padding: 28px 18px;
          }

          .auth-title {
            font-size: 1.6rem;
          }

          .demo-chips-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .field-input-box {
            min-height: 46px;
          }

          .auth-submit-btn {
            min-height: 46px;
          }
        }

        /* Accessibility: Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .login-full-wrapper,
          .status-banner,
          .auth-submit-btn,
          .shake-effect {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
