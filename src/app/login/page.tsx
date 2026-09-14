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
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  WifiOff,
  User,
  Wrench,
  Building2,
  Crown,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [shake, setShake] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [autofillNotice, setAutofillNotice] = useState<string | null>(null);

  // Focus states
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);

  const identifierInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Smart input detection
  const isEmailInput = identifier.includes("@");

  const navigateToDashboard = (roleName?: string) => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const fromParam = searchParams.get("from");
    const upperRole = roleName?.toUpperCase();
    const defaultRoute = (upperRole === "ADMIN" || upperRole === "SUPER_ADMIN") ? "/admin" : "/dashboard";
    const targetUrl = fromParam && fromParam.startsWith("/") && !fromParam.startsWith("/login") ? fromParam : defaultRoute;

    // Refresh Next.js router cache and navigate
    router.refresh();
    router.replace(targetUrl);

    // Guaranteed hard navigation fallback to ensure instant transition even if router cache is stale
    setTimeout(() => {
      if (window.location.pathname === "/login") {
        window.location.replace(targetUrl);
      }
    }, 150);
  };

  // If already logged in, redirect to destination
  useEffect(() => {
    if (user) {
      navigateToDashboard(user.role);
    }
  }, [user]);

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

    setIdentifierError(null);
    setPasswordError(null);
    setError(null);

    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setError("Unable to connect. Please check your internet connection.");
      triggerShake();
      return;
    }

    const trimmedIdentifier = identifier.trim();
    let hasFieldError = false;

    if (!trimmedIdentifier) {
      setIdentifierError("Please enter your mobile number or email.");
      hasFieldError = true;
    } else {
      const hasOnlyPhoneChars = /^[\d\s\+\-\(\)]+$/.test(trimmedIdentifier);
      if (hasOnlyPhoneChars && !trimmedIdentifier.includes("@")) {
        const normalized = normalizePhoneNumber(trimmedIdentifier);
        if (!normalized) {
          setIdentifierError("Please enter a valid 11-digit mobile number (e.g. 0917 123 4567).");
          hasFieldError = true;
        }
      }
    }

    if (!password) {
      setPasswordError("Please enter your password.");
      hasFieldError = true;
    }

    if (hasFieldError) {
      triggerShake();
      if (!trimmedIdentifier) {
        identifierInputRef.current?.focus();
      } else if (!password) {
        passwordInputRef.current?.focus();
      }
      return;
    }

    setStatus("loading");

    try {
      const result = await login(trimmedIdentifier, password);

      if (result.success && result.user) {
        setStatus("success");
        navigateToDashboard(result.user.role);
      } else {
        setStatus("error");
        triggerShake();

        const rawError = (result.error || "").toLowerCase();
        if (rawError.includes("invalid") || rawError.includes("credential") || rawError.includes("401")) {
          setError("Incorrect mobile number or password. Please try again.");
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

  const handleQuickLogin = (demoIdentifier: string, roleName: string, personName: string) => {
    setIdentifier(demoIdentifier);
    setPassword("Password123!");
    setSelectedRole(roleName);
    setAutofillNotice(`${personName} (${roleName})`);
    setError(null);
    setIdentifierError(null);
    setPasswordError(null);
    setStatus("idle");

    setTimeout(() => {
      setAutofillNotice(null);
    }, 4000);
  };

  return (
    <div className="login-canvas-wrapper">
      {/* Radiant Background Ambiance */}
      <div className="ambient-sphere sphere-sapphire" aria-hidden="true" />
      <div className="ambient-sphere sphere-cyan" aria-hidden="true" />
      <div className="ambient-sphere sphere-emerald" aria-hidden="true" />

      <main className="login-center-container">
        <div className={`login-unified-card ${shake ? "card-shake" : ""}`}>

          {/* Intro Heading */}
          <div className="auth-card-header">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">
              Sign in to report community hazards, track tickets, or access barangay operations.
            </p>
          </div>

          {/* Offline Alert */}
          {isOffline && (
            <div className="status-banner banner-warning" role="alert">
              <WifiOff size={16} />
              <span>You are currently offline. Please check your internet connection.</span>
            </div>
          )}

          {/* General Error Alert */}
          {error && (
            <div className="status-banner banner-error" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div className="banner-text">
                <strong>Sign In Failed</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} noValidate className="auth-form">

            {/* Field 1: Mobile number / Email */}
            <div className="form-field-group">
              <div className="field-top-row">
                <label htmlFor="identifier" className="field-label">
                  Mobile number or email
                </label>
                {phonePreview && (
                  <span className="phone-validation-hint" aria-live="polite">
                    ✓ {phonePreview}
                  </span>
                )}
              </div>

              <div
                className={`composite-input ${isIdentifierFocused ? "composite-focus" : ""} ${identifierError ? "composite-error" : ""
                  }`}
              >
                {!isEmailInput ? (
                  <div className="country-prefix-badge" title="Philippines country code">
                    <span className="flag-icon">🇵🇭</span>
                    <span className="prefix-num">+63</span>
                  </div>
                ) : (
                  <div className="country-prefix-badge prefix-email" title="Email address">
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
                  placeholder={isEmailInput ? "name@barangay.gov.ph" : "09XXXXXXXXX"}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (identifierError) setIdentifierError(null);
                    if (error) setError(null);
                    if (status === "error") setStatus("idle");
                  }}
                  onFocus={() => setIsIdentifierFocused(true)}
                  onBlur={() => setIsIdentifierFocused(false)}
                  disabled={status === "loading" || status === "success"}
                  aria-required="true"
                  aria-invalid={!!identifierError}
                  aria-describedby={identifierError ? "identifier-error-msg" : undefined}
                />
              </div>

              {identifierError ? (
                <div id="identifier-error-msg" className="inline-field-error" role="alert">
                  <AlertCircle size={13} />
                  <span>{identifierError}</span>
                </div>
              ) : (
                <span className="field-hint-text">
                  Enter your 11-digit mobile number or official barangay email.
                </span>
              )}
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

              <div
                className={`composite-input ${isPassFocused ? "composite-focus" : ""} ${passwordError ? "composite-error" : ""
                  }`}
              >
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
                    if (passwordError) setPasswordError(null);
                    if (error) setError(null);
                    if (status === "error") setStatus("idle");
                  }}
                  onFocus={() => setIsPassFocused(true)}
                  onBlur={() => setIsPassFocused(false)}
                  disabled={status === "loading" || status === "success"}
                  aria-required="true"
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error-msg" : undefined}
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

              {passwordError && (
                <div id="password-error-msg" className="inline-field-error" role="alert">
                  <AlertCircle size={13} />
                  <span>{passwordError}</span>
                </div>
              )}
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

          {/* Registration Secondary Section */}
          <div className="register-redirect-banner">
            <span className="register-prompt">Don't have an account yet?</span>{" "}
            <NextLink href="/register" className="register-bold-link">
              Register as Resident
            </NextLink>
          </div>

          {/* Quick Test Roles Segment (Streamlined Dev Autofill) */}
          <section className="quick-roles-container" aria-label="Quick test accounts">
            <div className="quick-roles-header">
              <div className="quick-roles-title">
                <Sparkles size={13} className="sparkle-cyan" />
                <span>Dev Test Accounts</span>
              </div>
              {autofillNotice ? (
                <span className="autofill-feedback-pill">
                  <Check size={11} /> {autofillNotice}
                </span>
              ) : (
                <span className="quick-roles-sub">1-Tap Autofill</span>
              )}
            </div>

            <div className="quick-roles-grid">
              {/* Role 1: Resident */}
              <button
                type="button"
                onClick={() => handleQuickLogin("09204443333", "Resident", "Juan Dela Cruz")}
                className={`role-chip ${selectedRole === "Resident" ? "role-chip-active chip-resident" : ""}`}
                aria-pressed={selectedRole === "Resident"}
              >
                <div className="role-icon-circle icon-blue">
                  <User size={13} />
                </div>
                <div className="role-chip-text">
                  <span className="role-chip-title">Resident</span>
                  <span className="role-chip-sub">Juan Dela Cruz</span>
                </div>
                {selectedRole === "Resident" && <Check size={13} className="role-active-check text-blue" />}
              </button>

              {/* Role 2: Staff */}
              <button
                type="button"
                onClick={() => handleQuickLogin("09193332222", "Staff", "Alex Santos")}
                className={`role-chip ${selectedRole === "Staff" ? "role-chip-active chip-staff" : ""}`}
                aria-pressed={selectedRole === "Staff"}
              >
                <div className="role-icon-circle icon-emerald">
                  <Wrench size={13} />
                </div>
                <div className="role-chip-text">
                  <span className="role-chip-title">Staff</span>
                  <span className="role-chip-sub">Alex Santos</span>
                </div>
                {selectedRole === "Staff" && <Check size={13} className="role-active-check text-emerald" />}
              </button>

              {/* Role 3: Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin("09182221111", "Admin", "Roberto Tan")}
                className={`role-chip ${selectedRole === "Admin" ? "role-chip-active chip-admin" : ""}`}
                aria-pressed={selectedRole === "Admin"}
              >
                <div className="role-icon-circle icon-indigo">
                  <Building2 size={13} />
                </div>
                <div className="role-chip-text">
                  <span className="role-chip-title">Admin</span>
                  <span className="role-chip-sub">Roberto Tan</span>
                </div>
                {selectedRole === "Admin" && <Check size={13} className="role-active-check text-indigo" />}
              </button>

              {/* Role 4: Super Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin("09171110000", "Super Admin", "Sys Operator")}
                className={`role-chip ${selectedRole === "Super Admin" ? "role-chip-active chip-super" : ""}`}
                aria-pressed={selectedRole === "Super Admin"}
              >
                <div className="role-icon-circle icon-amber">
                  <Crown size={13} />
                </div>
                <div className="role-chip-text">
                  <span className="role-chip-title">Super Admin</span>
                  <span className="role-chip-sub">Sys Operator</span>
                </div>
                {selectedRole === "Super Admin" && <Check size={13} className="role-active-check text-amber" />}
              </button>
            </div>
          </section>

          {/* Bottom Security Footer */}
          <footer className="auth-card-footer">
            <Shield size={12} className="footer-shield" />
            <span>Official Civic Platform · 256-bit SSL · RA 10173</span>
          </footer>

        </div>
      </main>

      {/* ===============================================================
          STYLES: Mobile-First Modern Dark Theme Civic Login
         =============================================================== */}
      <style jsx>{`
        /* Canvas Wrapper - Complete Dark Theme */
        .login-canvas-wrapper {
          min-height: calc(100dvh - var(--header-height, 54px));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 12px 28px 12px;
          background-color: var(--bg-app, #080c15);
          background-image: 
            radial-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            radial-gradient(circle at 15% 15%, rgba(37, 99, 235, 0.16) 0%, transparent 50%),
            radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.14) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 55%);
          background-size: 28px 28px, 100% 100%, 100% 100%, 100% 100%;
          position: relative;
          overflow: hidden;
        }

        /* Ambient Glow Spheres */
        .ambient-sphere {
          position: absolute;
          border-radius: 9999px;
          filter: blur(140px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.55;
        }

        .sphere-sapphire {
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, transparent 70%);
          top: -80px;
          left: -80px;
        }

        .sphere-cyan {
          width: 440px;
          height: 440px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%);
          bottom: -60px;
          right: -60px;
        }

        .sphere-emerald {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, transparent 70%);
          top: 35%;
          left: 42%;
        }

        /* Centered Container */
        .login-center-container {
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 1;
          margin: 0 auto;
        }

        /* Modern Glassmorphic Civic Card */
        .login-unified-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          background: rgba(13, 20, 36, 0.94);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 
            0 20px 50px -10px rgba(0, 0, 0, 0.8),
            0 0 35px -5px rgba(56, 189, 248, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
          padding: 24px 20px;
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

        /* Intro Header */
        .auth-card-header {
          margin-bottom: 16px;
        }

        .auth-title {
          font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
          font-size: 1.45rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.025em;
          line-height: 1.2;
          margin: 0 0 5px 0;
        }

        .auth-subtitle {
          font-size: 0.813rem;
          color: #94a3b8;
          line-height: 1.45;
          margin: 0;
        }

        /* Status Banners */
        .status-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 0.813rem;
          margin-bottom: 14px;
        }

        .banner-warning {
          background-color: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fbbf24;
        }

        .banner-error {
          background-color: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
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
          gap: 14px;
          margin-bottom: 16px;
        }

        .form-field-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .field-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .field-label {
          font-size: 0.813rem;
          font-weight: 700;
          color: #e2e8f0;
        }

        .phone-validation-hint {
          font-size: 0.725rem;
          font-weight: 700;
          color: #34d399;
          background: rgba(16, 185, 129, 0.15);
          padding: 2px 8px;
          border-radius: 9999px;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .forgot-link {
          font-size: 0.785rem;
          font-weight: 600;
          color: #38bdf8;
          text-decoration: none;
          padding: 2px 0;
          transition: color 0.15s ease;
        }

        .forgot-link:hover, .forgot-link:focus {
          color: #7dd3fc;
          text-decoration: underline;
        }

        .composite-input {
          display: flex;
          align-items: center;
          background: #080c16;
          border: 1.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          overflow: hidden;
          height: 46px;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
        }

        .composite-focus {
          border-color: #38bdf8;
          background: #0a1122;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
        }

        .composite-error {
          border-color: #f87171 !important;
          background: #140d12;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.22);
        }

        .inline-field-error {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #fca5a5;
          font-size: 0.735rem;
          font-weight: 600;
          margin-top: 2px;
        }

        .country-prefix-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0 11px;
          height: 100%;
          background-color: #0f182c;
          border-right: 1.5px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          font-size: 0.813rem;
          font-weight: 700;
          user-select: none;
          flex-shrink: 0;
        }

        .prefix-email, .prefix-lock {
          color: #94a3b8;
          padding: 0 12px;
        }

        .styled-text-input {
          flex: 1;
          height: 100%;
          padding: 0 12px;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.875rem;
          color: #f8fafc;
          font-weight: 500;
          min-width: 0;
        }

        .styled-text-input::placeholder {
          color: #64748b;
          font-weight: 400;
          font-size: 0.813rem;
        }

        .styled-text-input:-webkit-autofill,
        .styled-text-input:-webkit-autofill:hover, 
        .styled-text-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #f8fafc !important;
          -webkit-box-shadow: 0 0 0px 1000px #080c16 inset !important;
          box-shadow: 0 0 0px 1000px #080c16 inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .eye-toggle-btn {
          height: 44px;
          width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.15s ease;
        }

        .eye-toggle-btn:hover {
          color: #f8fafc;
        }

        .field-hint-text {
          font-size: 0.72rem;
          color: #94a3b8;
          line-height: 1.35;
        }

        /* Primary Submit Button */
        .primary-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb 0%, #0284c7 100%);
          color: #ffffff;
          font-size: 0.925rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          margin-top: 4px;
          touch-action: manipulation;
        }

        .primary-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.5);
          background: linear-gradient(135deg, #1d4ed8 0%, #0369a1 100%);
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

        /* Register Redirect Secondary Section */
        .register-redirect-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 0.813rem;
          padding: 12px 0;
          margin-bottom: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .register-prompt {
          color: #94a3b8;
        }

        .register-bold-link {
          color: #38bdf8;
          font-weight: 700;
          text-decoration: none;
          padding: 4px 0;
          transition: color 0.15s ease;
        }

        .register-bold-link:hover {
          color: #7dd3fc;
          text-decoration: underline;
        }

        /* Streamlined Dev Test Accounts Box */
        .quick-roles-container {
          background: rgba(10, 16, 28, 0.6);
          border: 1px dashed rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 10px;
          margin-bottom: 14px;
        }

        .quick-roles-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          padding: 0 2px;
        }

        .quick-roles-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.735rem;
          font-weight: 700;
          color: #cbd5e1;
        }

        .sparkle-cyan {
          color: #38bdf8;
        }

        .quick-roles-sub {
          font-size: 0.688rem;
          color: #64748b;
          font-weight: 600;
        }

        .autofill-feedback-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.688rem;
          font-weight: 700;
          color: #34d399;
          background: rgba(16, 185, 129, 0.15);
          padding: 2px 7px;
          border-radius: 9999px;
          border: 1px solid rgba(16, 185, 129, 0.3);
          animation: fadeIn 0.2s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-2px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .quick-roles-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }

        /* Compact Role Chip */
        .role-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 9px;
          border-radius: 9px;
          background: #0c1424;
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          text-align: left;
          transition: all 0.16s ease;
          touch-action: manipulation;
          min-height: 38px;
        }

        .role-chip:hover {
          background: #111a30;
          border-color: rgba(255, 255, 255, 0.18);
        }

        .role-chip-active {
          box-shadow: 0 0 0 1.5px rgba(56, 189, 248, 0.4);
        }

        .chip-resident.role-chip-active {
          border-color: #38bdf8 !important;
          background: rgba(56, 189, 248, 0.12) !important;
        }

        .chip-staff.role-chip-active {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.12) !important;
        }

        .chip-admin.role-chip-active {
          border-color: #818cf8 !important;
          background: rgba(129, 140, 248, 0.12) !important;
        }

        .chip-super.role-chip-active {
          border-color: #fbbf24 !important;
          background: rgba(251, 191, 36, 0.12) !important;
        }

        .role-icon-circle {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon-blue {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
        }

        .icon-emerald {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }

        .icon-indigo {
          background: rgba(129, 140, 248, 0.15);
          color: #818cf8;
        }

        .icon-amber {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
        }

        .role-chip-text {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .role-chip-title {
          font-size: 0.725rem;
          font-weight: 700;
          color: #f8fafc;
          line-height: 1.15;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role-chip-sub {
          font-size: 0.625rem;
          color: #94a3b8;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role-active-check {
          flex-shrink: 0;
        }

        .text-blue { color: #38bdf8; }
        .text-emerald { color: #34d399; }
        .text-indigo { color: #818cf8; }
        .text-amber { color: #fbbf24; }

        /* Security Card Footer */
        .auth-card-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 0.688rem;
          color: #64748b;
          padding-top: 8px;
        }

        .footer-shield {
          color: #64748b;
          flex-shrink: 0;
        }

        /* Desktop Adjustments */
        @media (min-width: 481px) {
          .login-canvas-wrapper {
            padding: 36px 20px;
          }

          .login-unified-card {
            border-radius: 24px;
            padding: 34px 28px;
          }

          .auth-title {
            font-size: 1.65rem;
          }
        }

        /* Ultra-compact phones (<= 360px) */
        @media (max-width: 360px) {
          .login-unified-card {
            padding: 20px 14px;
            border-radius: 16px;
          }

          .auth-title {
            font-size: 1.3rem;
          }

          .quick-roles-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
