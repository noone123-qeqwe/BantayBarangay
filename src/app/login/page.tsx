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
  ArrowLeft,
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

    router.refresh();
    router.replace(targetUrl);

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
      setError("Unable to connect. Please check your internet connection.");
    }
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
    }, 3000);
  };

  return (
    <div className="login-static-viewport" id="login-viewport">
      {/* Static Subtle Background Ambient (immobile, no movement) */}
      <div className="static-bg-glow" aria-hidden="true" />

      {/* Centered Static Modal/Card */}
      <main className="login-card-container">
        <div className="login-modern-card">
          {/* Top Brand Header */}
          <div className="login-brand-header">
            <NextLink href="/" className="brand-link" title="Return to BantayBarangay Home">
              <img
                src="/logo.png"
                alt="BantayBarangay Emblem"
                width={40}
                height={40}
                className="brand-logo-img"
              />
              <div className="brand-text-block">
                <span className="brand-name">BantayBarangay</span>
                <span className="brand-tag">Masbate City Civic Portal</span>
              </div>
            </NextLink>

            <NextLink href="/" className="back-portal-link" title="Back to Home">
              <ArrowLeft size={14} />
              <span>Portal Home</span>
            </NextLink>
          </div>

          {/* Heading Section */}
          <div className="auth-title-section">
            <h1 className="auth-heading">Sign In</h1>
            <p className="auth-desc">
              Access your civic account to track tickets and report hazards.
            </p>
          </div>

          {/* Offline Alert */}
          {isOffline && (
            <div className="status-notice status-warning" role="alert">
              <WifiOff size={15} className="notice-icon" />
              <span>You are currently offline. Please check your connection.</span>
            </div>
          )}

          {/* General Error Alert */}
          {error && (
            <div className="status-notice status-error" role="alert">
              <AlertCircle size={15} className="notice-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="login-form">
            {/* Field: Identifier */}
            <div className="form-field">
              <div className="field-header">
                <label htmlFor="identifier" className="field-title">
                  Mobile number or email
                </label>
                {phonePreview && (
                  <span className="phone-badge" aria-live="polite">
                    ✓ {phonePreview}
                  </span>
                )}
              </div>

              <div
                className={`input-box ${isIdentifierFocused ? "input-box-focused" : ""} ${
                  identifierError ? "input-box-error" : ""
                }`}
              >
                {!isEmailInput ? (
                  <div className="input-prefix-tag" title="Philippine Mobile (+63)">
                    <span className="flag-icon">🇵🇭</span>
                    <span className="prefix-code">+63</span>
                  </div>
                ) : (
                  <div className="input-prefix-icon" title="Email address">
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
                  className="native-input"
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
                />
              </div>

              {identifierError && (
                <p className="field-error-text" role="alert">
                  <AlertCircle size={12} />
                  <span>{identifierError}</span>
                </p>
              )}
            </div>

            {/* Field: Password */}
            <div className="form-field">
              <div className="field-header">
                <label htmlFor="password" className="field-title">
                  Password
                </label>
                <NextLink href="/forgot-password" className="forgot-link">
                  Forgot password?
                </NextLink>
              </div>

              <div
                className={`input-box ${isPassFocused ? "input-box-focused" : ""} ${
                  passwordError ? "input-box-error" : ""
                }`}
              >
                <div className="input-prefix-icon">
                  <Lock size={15} />
                </div>

                <input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="native-input"
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
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={status === "loading" || status === "success"}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {passwordError && (
                <p className="field-error-text" role="alert">
                  <AlertCircle size={12} />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className={`submit-btn ${status === "success" ? "submit-btn-success" : ""}`}
            >
              {status === "loading" && (
                <>
                  <Loader2 size={16} className="btn-spinner" />
                  <span>Signing in...</span>
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle2 size={16} />
                  <span>Redirecting...</span>
                </>
              )}

              {status !== "loading" && status !== "success" && (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Tap Test Accounts (Clean horizontal pill selector) */}
          <div className="demo-accounts-bar">
            <div className="demo-header">
              <span className="demo-label">
                <Sparkles size={12} className="sparkle-icon" />
                <span>Quick Test Accounts</span>
              </span>
              {autofillNotice && (
                <span className="demo-notice">
                  <Check size={11} /> {autofillNotice}
                </span>
              )}
            </div>

            <div className="demo-roles-row">
              <button
                type="button"
                onClick={() => handleQuickLogin("09204443333", "Resident", "Juan Dela Cruz")}
                className={`demo-pill ${selectedRole === "Resident" ? "demo-pill-active" : ""}`}
                title="Autofill Resident (Juan Dela Cruz)"
              >
                <User size={12} />
                <span>Resident</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("09193332222", "Staff", "Alex Santos")}
                className={`demo-pill ${selectedRole === "Staff" ? "demo-pill-active" : ""}`}
                title="Autofill Staff (Alex Santos)"
              >
                <Wrench size={12} />
                <span>Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("09182221111", "Admin", "Roberto Tan")}
                className={`demo-pill ${selectedRole === "Admin" ? "demo-pill-active" : ""}`}
                title="Autofill Admin (Roberto Tan)"
              >
                <Building2 size={12} />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("09171110000", "Super Admin", "Sys Operator")}
                className={`demo-pill ${selectedRole === "Super Admin" ? "demo-pill-active" : ""}`}
                title="Autofill Super Admin (Sys Operator)"
              >
                <Crown size={12} />
                <span>Super Admin</span>
              </button>
            </div>
          </div>

          {/* Card Footer: Register & Security */}
          <div className="card-footer-area">
            <div className="register-prompt-row">
              <span className="prompt-text">Don't have an account?</span>
              <NextLink href="/register" className="register-action-link">
                Register as Resident
              </NextLink>
            </div>

            <div className="security-tag">
              <Shield size={11} className="security-icon" />
              <span>Official Civic Platform · 256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>
      </main>

      {/* ===============================================================
          STYLES: Clean, Modern, and Completely Static
          - Position: fixed inset 0 ensures ZERO scrolling or moving
          - overflow: hidden prevents any document dragging or bouncing
          - No translateY, translateX, scale, or shaking animations
         =============================================================== */}
      <style jsx>{`
        /* Locked Static Full-Screen Viewport */
        .login-static-viewport {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100dvh;
          overflow: hidden;
          background-color: #080d1a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 100;
          overscroll-behavior: none;
          touch-action: none;
        }

        /* Static Center Glow Mesh (completely immobile) */
        .static-bg-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 600px;
          height: 600px;
          margin-top: -300px;
          margin-left: -300px;
          background: radial-gradient(
            circle,
            rgba(2, 132, 199, 0.14) 0%,
            rgba(37, 99, 235, 0.08) 40%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
        }

        /* Centered Modal Container */
        .login-card-container {
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 1;
        }

        /* Modern Glass Card */
        .login-modern-card {
          width: 100%;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 20px;
          box-shadow:
            0 24px 48px -12px rgba(0, 0, 0, 0.7),
            0 0 0 1px rgba(255, 255, 255, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        /* Brand Header */
        .login-brand-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .brand-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .brand-logo-img {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          object-fit: contain;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
        }

        .brand-text-block {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-size: 0.938rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }

        .brand-tag {
          font-size: 0.65rem;
          color: #38bdf8;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .back-portal-link {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
          text-decoration: none;
          padding: 5px 9px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: color 0.15s ease, background-color 0.15s ease;
        }

        .back-portal-link:hover {
          color: #f8fafc;
          background-color: rgba(255, 255, 255, 0.08);
        }

        /* Title Section */
        .auth-title-section {
          margin-bottom: 16px;
        }

        .auth-heading {
          font-size: 1.45rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin: 0 0 4px 0;
        }

        .auth-desc {
          font-size: 0.813rem;
          color: #94a3b8;
          line-height: 1.4;
          margin: 0;
        }

        /* Status & Error Notices */
        .status-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 0.775rem;
          margin-bottom: 12px;
        }

        .status-warning {
          background-color: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.28);
          color: #fbbf24;
        }

        .status-error {
          background-color: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.28);
          color: #fca5a5;
        }

        .notice-icon {
          flex-shrink: 0;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 14px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .field-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .field-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #cbd5e1;
        }

        .phone-badge {
          font-size: 0.7rem;
          font-weight: 700;
          color: #34d399;
          background: rgba(16, 185, 129, 0.12);
          padding: 1px 7px;
          border-radius: 9999px;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .forgot-link {
          font-size: 0.75rem;
          font-weight: 600;
          color: #38bdf8;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .forgot-link:hover {
          color: #7dd3fc;
          text-decoration: underline;
        }

        /* Input Container */
        .input-box {
          display: flex;
          align-items: center;
          height: 44px;
          background-color: rgba(7, 12, 23, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }

        .input-box-focused {
          border-color: #38bdf8;
          background-color: rgba(10, 18, 36, 0.85);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }

        .input-box-error {
          border-color: #ef4444;
          background-color: rgba(26, 12, 18, 0.8);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        .input-prefix-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          height: 100%;
          padding: 0 10px;
          background-color: rgba(255, 255, 255, 0.03);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          font-size: 0.8rem;
          user-select: none;
          flex-shrink: 0;
        }

        .flag-icon {
          font-size: 0.95rem;
        }

        .prefix-code {
          color: #38bdf8;
          font-weight: 700;
        }

        .input-prefix-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 0 11px;
          color: #64748b;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .input-box-focused .input-prefix-icon {
          color: #38bdf8;
        }

        .native-input {
          flex: 1;
          height: 100%;
          background: transparent;
          border: none;
          outline: none;
          padding: 0 11px;
          font-size: 0.875rem;
          color: #f8fafc;
          font-weight: 500;
          min-width: 0;
        }

        .native-input::placeholder {
          color: #64748b;
          font-size: 0.813rem;
          font-weight: 400;
        }

        .native-input:-webkit-autofill,
        .native-input:-webkit-autofill:hover, 
        .native-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #f8fafc !important;
          -webkit-box-shadow: 0 0 0px 1000px #090f1d inset !important;
          box-shadow: 0 0 0px 1000px #090f1d inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .password-toggle-btn {
          height: 36px;
          width: 36px;
          margin-right: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 7px;
          color: #64748b;
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.15s ease, background-color 0.15s ease;
        }

        .password-toggle-btn:hover {
          color: #38bdf8;
          background-color: rgba(56, 189, 248, 0.08);
        }

        .field-error-text {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #fca5a5;
          font-size: 0.725rem;
          font-weight: 600;
          margin: 1px 0 0 0;
        }

        /* Static Primary Submit Button */
        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 44px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          color: #ffffff;
          font-size: 0.885rem;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.15);
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          margin-top: 4px;
          transition: filter 0.15s ease, box-shadow 0.15s ease;
        }

        .submit-btn:hover:not(:disabled) {
          filter: brightness(1.08);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.5);
        }

        .submit-btn:active:not(:disabled) {
          filter: brightness(0.95);
        }

        .submit-btn:disabled {
          opacity: 0.8;
          cursor: not-allowed;
        }

        .submit-btn-success {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4) !important;
        }

        .btn-spinner {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Demo Accounts Segmented Row */
        .demo-accounts-bar {
          background: rgba(10, 16, 30, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 9px 10px;
          margin-bottom: 14px;
        }

        .demo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 7px;
        }

        .demo-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.725rem;
          font-weight: 700;
          color: #94a3b8;
        }

        .sparkle-icon {
          color: #38bdf8;
        }

        .demo-notice {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.675rem;
          font-weight: 700;
          color: #34d399;
          background: rgba(16, 185, 129, 0.12);
          padding: 1px 6px;
          border-radius: 6px;
        }

        .demo-roles-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5px;
        }

        .demo-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: 30px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 7px;
          color: #cbd5e1;
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
          white-space: nowrap;
          padding: 0 4px;
        }

        .demo-pill:hover {
          background-color: rgba(56, 189, 248, 0.1);
          border-color: rgba(56, 189, 248, 0.25);
          color: #38bdf8;
        }

        .demo-pill-active {
          background-color: rgba(56, 189, 248, 0.18) !important;
          border-color: #38bdf8 !important;
          color: #38bdf8 !important;
        }

        /* Footer Area */
        .card-footer-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding-top: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .register-prompt-row {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.775rem;
        }

        .prompt-text {
          color: #94a3b8;
        }

        .register-action-link {
          color: #38bdf8;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .register-action-link:hover {
          color: #7dd3fc;
          text-decoration: underline;
        }

        .security-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 500;
        }

        .security-icon {
          color: #0284c7;
        }

        /* Compact screens adjustments */
        @media (max-width: 380px) {
          .login-modern-card {
            padding: 18px 14px;
            border-radius: 16px;
          }

          .demo-roles-row {
            grid-template-columns: repeat(2, 1fr);
          }

          .auth-heading {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
}
