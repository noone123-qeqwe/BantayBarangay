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
    <div className="login-page-bg">
      <div className={`login-split-card ${shake ? "card-shake" : ""}`}>
        
        {/* ===============================================================
            LEFT COLUMN: Civic Tech Showcase
           =============================================================== */}
        <section className="left-showcase-panel" aria-label="BantayBarangay Overview">
          {/* Logo & Brand Name */}
          <div className="brand-header">
            <div className="brand-emblem-box">
              <ShieldCheck size={22} className="brand-emblem-icon" />
            </div>
            <span className="brand-title-text">BantayBarangay</span>
          </div>

          {/* Smart Community Governance Pill */}
          <div className="smart-gov-badge">
            <Sparkles size={13} className="sparkle-badge-icon" />
            <span>smart community governance</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-heading">
            Empowering<br />
            communities<br />
            through transparent<br />
            action.
          </h1>

          {/* Supporting Text */}
          <p className="hero-subtext">
            Report infrastructure hazards, track emergency responses in real time, and verify completed municipal fixes together.
          </p>

          {/* Live Municipal Dispatch Card */}
          <div className="dispatch-live-card">
            <div className="dispatch-header-row">
              <div className="dispatch-label-wrap">
                <Radio size={13} className="radio-pulse-icon" />
                <span>live municipal dispatch</span>
              </div>
              <div className="dispatch-status-resolved">
                <Check size={13} strokeWidth={3} />
                <span>resolved</span>
              </div>
            </div>

            <div className="dispatch-issue-title">
              Streetlight cable hazard repaired
            </div>

            <div className="dispatch-agency-meta">
              Barangay engineering team · verified in 18 hrs
            </div>

            <div className="dispatch-card-divider" />

            <div className="dispatch-resident-verified">
              <Check size={13} strokeWidth={3} className="check-verified-icon" />
              <span>confirmed and verified by resident</span>
            </div>
          </div>

          {/* 3 Feature Pillars */}
          <div className="feature-pillars-list">
            <div className="pillar-item">
              <div className="pillar-icon-box">
                <MapPin size={16} />
              </div>
              <div className="pillar-text-content">
                <div className="pillar-title">Precise GPS pinpointing</div>
                <div className="pillar-desc">Instant coordinates with duplicate detection.</div>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-box">
                <Zap size={16} />
              </div>
              <div className="pillar-text-content">
                <div className="pillar-title">Real-time status progression</div>
                <div className="pillar-desc">Track issues from review to completion.</div>
              </div>
            </div>

            <div className="pillar-item">
              <div className="pillar-icon-box">
                <Layers size={16} />
              </div>
              <div className="pillar-text-content">
                <div className="pillar-title">Resident verification loop</div>
                <div className="pillar-desc">Photo proof confirms reports before closing.</div>
              </div>
            </div>
          </div>

          {/* Left Footer Security Compliance */}
          <div className="left-security-notice">
            <ShieldCheck size={14} className="sec-icon" />
            <span>256-bit SSL encrypted · government and civic data privacy compliant</span>
          </div>
        </section>

        {/* ===============================================================
            RIGHT COLUMN: Sign In Form & Quick Roles
           =============================================================== */}
        <section className="right-auth-panel" aria-label="Sign In">
          
          {/* Top Badge: Official Civic Portal */}
          <div className="civic-portal-pill">
            <Shield size={13} className="civic-pill-shield" />
            <span>official civic portal</span>
          </div>

          {/* Form Title & Subtitle */}
          <h2 className="auth-card-title">Welcome back</h2>
          <p className="auth-card-subtitle">
            Sign in to report issues, track tickets, or access barangay operations.
          </p>

          {/* Offline Alert */}
          {isOffline && (
            <div className="inline-alert alert-warning" role="alert">
              <WifiOff size={16} />
              <span>You are currently offline. Check your internet connection.</span>
            </div>
          )}

          {/* Error Message Alert */}
          {error && (
            <div className="inline-alert alert-error" role="alert">
              <AlertCircle size={16} />
              <div className="alert-content">
                <strong>Unable to sign in</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} noValidate className="auth-form-elements">
            
            {/* Field 1: Mobile number or email */}
            <div className="field-group">
              <div className="field-label-container">
                <label htmlFor="identifier" className="field-label-text">
                  Mobile number or email
                </label>
                {phonePreview && (
                  <span className="phone-preview-tag">
                    ✓ {phonePreview}
                  </span>
                )}
              </div>

              <div className="dual-input-wrapper">
                {!isEmailInput ? (
                  <div className="country-prefix-box">
                    <span>PH +63</span>
                  </div>
                ) : (
                  <div className="country-prefix-box">
                    <Mail size={15} />
                  </div>
                )}

                <div className={`input-core-container ${isIdentifierFocused ? "focused-border" : ""} ${error && !identifier.trim() ? "error-border" : ""}`}>
                  <input
                    ref={identifierInputRef}
                    id="identifier"
                    name="identifier"
                    type={isEmailInput ? "email" : "tel"}
                    inputMode={isEmailInput ? "email" : "tel"}
                    autoComplete="username"
                    className="inner-input-field"
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
              </div>

              <p className="field-helper-caption">
                Enter your 11-digit mobile number or official barangay email.
              </p>
            </div>

            {/* Field 2: Password */}
            <div className="field-group">
              <div className="field-label-container">
                <label htmlFor="password" className="field-label-text">
                  Password
                </label>
                <NextLink href="/forgot-password" className="forgot-password-anchor">
                  Forgot password?
                </NextLink>
              </div>

              <div className={`password-input-wrapper ${isPassFocused ? "focused-border" : ""} ${error && !password ? "error-border" : ""}`}>
                <input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="inner-input-field"
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
                  className="password-eye-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={status === "loading" || status === "success"}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Action Button (Emerald Green) */}
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className={`emerald-signin-button ${status === "success" ? "signin-success" : ""}`}
            >
              {status === "loading" && (
                <>
                  <Loader2 size={18} className="spin-animation" />
                  <span>Signing in...</span>
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle2 size={18} />
                  <span>Login Successful</span>
                </>
              )}

              {status !== "loading" && status !== "success" && (
                <>
                  <LogIn size={17} />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>

          {/* Registration Navigation Callout */}
          <div className="auth-account-callout">
            <span className="callout-label">Don't have an account yet?</span>{" "}
            <NextLink href="/register" className="callout-link-blue">
              Create one
            </NextLink>
          </div>

          {/* Quick Test Roles - One-Click Autofill Box */}
          <div className="quick-roles-card">
            <div className="quick-roles-title-bar">
              <Sparkles size={13} className="roles-icon-sparkle" />
              <span>quick test roles - one-click autofill</span>
            </div>

            <div className="quick-roles-grid">
              <button
                type="button"
                onClick={() => handleQuickLogin("09204443333", "Resident")}
                className={`role-button-card ${selectedRole === "Resident" ? "role-card-active" : ""}`}
              >
                <User size={15} className="role-btn-icon" />
                <span className="role-btn-label">Resident</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("09193332222", "Staff")}
                className={`role-button-card ${selectedRole === "Staff" ? "role-card-active" : ""}`}
              >
                <Wrench size={15} className="role-btn-icon" />
                <span className="role-btn-label">Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("09182221111", "Admin")}
                className={`role-button-card ${selectedRole === "Admin" ? "role-card-active" : ""}`}
              >
                <Building2 size={15} className="role-btn-icon" />
                <span className="role-btn-label">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("09171110000", "Super Admin")}
                className={`role-button-card ${selectedRole === "Super Admin" ? "role-card-active" : ""}`}
              >
                <Crown size={15} className="role-btn-icon" />
                <span className="role-btn-label">Super</span>
              </button>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="right-bottom-security">
            <ShieldCheck size={14} className="bottom-shield-icon" />
            <span>official civic platform · 256-bit SSL encrypted</span>
          </div>

        </section>

      </div>

      {/* ===============================================================
          STYLES: Precise Replica of Reference Design
         =============================================================== */}
      <style jsx>{`
        /* Page Canvas */
        .login-page-bg {
          min-height: calc(100vh - var(--header-height, 60px));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background-color: #060a12;
          background-image: 
            radial-gradient(circle at 15% 20%, rgba(13, 148, 136, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 85% 80%, rgba(37, 99, 235, 0.08) 0%, transparent 40%);
        }

        /* Outer Split Card */
        .login-split-card {
          width: 100%;
          max-width: 980px;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          border-radius: 20px;
          border: 1px solid #1e293b;
          overflow: hidden;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
        }

        .card-shake {
          animation: shakeEffect 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes shakeEffect {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(3px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        /* =============================================================
           LEFT PANEL: Deep Navy Civic Showcase
           ============================================================= */
        .left-showcase-panel {
          background-color: #07101f;
          padding: 42px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid rgba(255, 255, 255, 0.07);
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .brand-emblem-box {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background-color: #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
          flex-shrink: 0;
        }

        .brand-emblem-icon {
          color: #ffffff;
        }

        .brand-title-text {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        /* Smart Community Governance Pill */
        .smart-gov-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 9999px;
          background-color: rgba(20, 184, 166, 0.12);
          border: 1px solid rgba(20, 184, 166, 0.3);
          color: #34d399;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 24px;
          align-self: flex-start;
        }

        .sparkle-badge-icon {
          color: #34d399;
        }

        /* Hero Typography */
        .hero-heading {
          font-family: var(--font-heading);
          font-size: 2.15rem;
          font-weight: 800;
          line-height: 1.18;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin: 0 0 16px 0;
        }

        .hero-subtext {
          font-size: 0.906rem;
          color: #8da0b6;
          line-height: 1.55;
          margin: 0 0 28px 0;
          max-width: 420px;
        }

        /* Live Municipal Dispatch Card */
        .dispatch-live-card {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px 18px;
          margin-bottom: 28px;
        }

        .dispatch-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .dispatch-label-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #8b949e;
          font-weight: 500;
        }

        .radio-pulse-icon {
          color: #58a6ff;
        }

        .dispatch-status-resolved {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #34d399;
        }

        .dispatch-issue-title {
          font-size: 0.938rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .dispatch-agency-meta {
          font-size: 0.781rem;
          color: #8b949e;
          margin-bottom: 12px;
        }

        .dispatch-card-divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.07);
          margin-bottom: 10px;
        }

        .dispatch-resident-verified {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.781rem;
          font-weight: 600;
          color: #34d399;
        }

        .check-verified-icon {
          color: #34d399;
        }

        /* 3 Feature Pillars */
        .feature-pillars-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 28px;
        }

        .pillar-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .pillar-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(52, 211, 153, 0.3);
          background-color: rgba(52, 211, 153, 0.06);
          color: #34d399;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pillar-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.25;
        }

        .pillar-desc {
          font-size: 0.781rem;
          color: #8b949e;
          line-height: 1.35;
          margin-top: 2px;
        }

        /* Left Footer Security Notice */
        .left-security-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.719rem;
          color: #64748b;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .sec-icon {
          color: #64748b;
          flex-shrink: 0;
        }

        /* =============================================================
           RIGHT PANEL: Dark Slate Form & Quick Roles
           ============================================================= */
        .right-auth-panel {
          background-color: #10151c;
          padding: 42px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* Official Civic Portal Badge */
        .civic-portal-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 9999px;
          background-color: rgba(30, 58, 138, 0.35);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #60a5fa;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 20px;
          align-self: flex-start;
        }

        .civic-pill-shield {
          color: #60a5fa;
        }

        .auth-card-title {
          font-family: var(--font-heading);
          font-size: 1.95rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin: 0 0 8px 0;
          line-height: 1.2;
        }

        .auth-card-subtitle {
          font-size: 0.875rem;
          color: #8da0b6;
          line-height: 1.45;
          margin: 0 0 24px 0;
        }

        /* Alert Box */
        .inline-alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.813rem;
          line-height: 1.4;
          margin-bottom: 18px;
        }

        .alert-error {
          background-color: rgba(220, 38, 38, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        .alert-warning {
          background-color: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: #fde68a;
        }

        .alert-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Form Structure */
        .auth-form-elements {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
        }

        .field-label-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 7px;
        }

        .field-label-text {
          font-size: 0.813rem;
          font-weight: 500;
          color: #cbd5e1;
        }

        .phone-preview-tag {
          font-size: 0.688rem;
          font-weight: 700;
          color: #34d399;
          background-color: rgba(16, 185, 129, 0.15);
          padding: 1px 7px;
          border-radius: 9999px;
        }

        .forgot-password-anchor {
          font-size: 0.781rem;
          font-weight: 500;
          color: #60a5fa;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .forgot-password-anchor:hover {
          color: #93c5fd;
          text-decoration: underline;
        }

        /* Split Dual Input for Identifier */
        .dual-input-wrapper {
          display: flex;
          align-items: stretch;
          gap: 6px;
        }

        .country-prefix-box {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          background-color: #1a222d;
          border: 1px solid #30363d;
          border-radius: 8px;
          color: #e6edf3;
          font-size: 0.813rem;
          font-weight: 600;
          user-select: none;
          flex-shrink: 0;
        }

        .input-core-container {
          flex: 1;
          display: flex;
          align-items: center;
          background-color: #161b22;
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 0 12px;
          height: 46px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .password-input-wrapper {
          display: flex;
          align-items: center;
          background-color: #161b22;
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 0 12px;
          height: 46px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .focused-border {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2) !important;
        }

        .error-border {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
        }

        .inner-input-field {
          flex: 1;
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 500;
          height: 100%;
        }

        .inner-input-field::placeholder {
          color: #6e7681;
          font-weight: 400;
        }

        .password-eye-toggle {
          background: transparent;
          border: none;
          color: #8b949e;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: color 0.15s ease;
        }

        .password-eye-toggle:hover {
          color: #ffffff;
        }

        .field-helper-caption {
          font-size: 0.719rem;
          color: #64748b;
          margin-top: 5px;
          margin-bottom: 0;
        }

        /* Submit Button: Emerald Green */
        .emerald-signin-button {
          width: 100%;
          height: 48px;
          margin-top: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 10px;
          font-size: 0.938rem;
          font-weight: 700;
          color: #ffffff;
          background-color: #0d7658;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 14px rgba(13, 118, 88, 0.4);
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
        }

        .emerald-signin-button:hover:not(:disabled) {
          background-color: #0b684d;
          box-shadow: 0 6px 18px rgba(13, 118, 88, 0.55);
        }

        .emerald-signin-button:active:not(:disabled) {
          transform: scale(0.99);
        }

        .emerald-signin-button:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .signin-success {
          background-color: #059669 !important;
        }

        .spin-animation {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Account Callout */
        .auth-account-callout {
          text-align: center;
          margin-top: 18px;
          font-size: 0.813rem;
        }

        .callout-label {
          color: #8b949e;
        }

        .callout-link-blue {
          color: #60a5fa;
          font-weight: 600;
          text-decoration: none;
          margin-left: 4px;
        }

        .callout-link-blue:hover {
          text-decoration: underline;
        }

        /* Quick Test Roles Box */
        .quick-roles-card {
          margin-top: 22px;
          padding: 14px;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
        }

        .quick-roles-title-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.719rem;
          font-weight: 600;
          color: #8b949e;
          margin-bottom: 10px;
        }

        .roles-icon-sparkle {
          color: #8b949e;
        }

        .quick-roles-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .role-button-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 8px;
          background-color: #161b22;
          border: 1px solid #30363d;
          border-radius: 8px;
          color: #c9d1d9;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .role-button-card:hover {
          border-color: #38bdf8;
          color: #ffffff;
          background-color: #1c232d;
        }

        .role-card-active {
          border-color: #38bdf8 !important;
          color: #38bdf8 !important;
          background-color: #1c232d !important;
          box-shadow: 0 0 0 1px #38bdf8;
        }

        .role-btn-icon {
          color: inherit;
        }

        .role-btn-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: inherit;
        }

        /* Right Bottom Security Footer */
        .right-bottom-security {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.719rem;
          color: #64748b;
        }

        .bottom-shield-icon {
          color: #64748b;
        }

        /* =============================================================
           RESPONSIVE BREAKPOINTS
           ============================================================= */
        @media (max-width: 960px) {
          .login-page-bg {
            padding: 24px 12px;
          }

          .login-split-card {
            grid-template-columns: 1fr;
            max-width: 480px;
          }

          .left-showcase-panel {
            padding: 32px 24px;
          }

          .right-auth-panel {
            padding: 32px 24px;
          }

          .hero-heading {
            font-size: 1.85rem;
          }
        }

        @media (max-width: 480px) {
          .left-showcase-panel {
            padding: 24px 18px;
          }

          .right-auth-panel {
            padding: 24px 18px;
          }

          .hero-heading {
            font-size: 1.65rem;
          }

          .auth-card-title {
            font-size: 1.65rem;
          }

          .dual-input-wrapper {
            flex-direction: column;
            gap: 6px;
          }

          .country-prefix-box {
            height: 38px;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .card-shake,
          .emerald-signin-button,
          .spin-animation {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
