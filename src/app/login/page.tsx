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
  ShieldCheck,
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
          
          {/* Intro Heading */}
          <div className="auth-card-header">
            <h2 className="auth-title">Welcome back</h2>
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
            <Shield size={13} className="footer-shield" />
            <span>Official Civic Platform · 256-bit SSL Encrypted · RA 10173</span>
          </div>

        </div>
      </main>

      {/* ===============================================================
          STYLES: Centered Luminous Authentication Card
         =============================================================== */}
      <style jsx>{`
        /* Canvas Wrapper */
        .login-canvas-wrapper {
          min-height: calc(100vh - var(--header-height, 60px));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 36px 20px;
          background-color: #f8fafc;
          background-image: 
            radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 85% 80%, rgba(16, 185, 129, 0.07) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 55%);
          position: relative;
          overflow: hidden;
        }

        /* Ambient Glow Spheres */
        .ambient-sphere {
          position: absolute;
          border-radius: 9999px;
          filter: blur(130px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.65;
        }

        .sphere-sapphire {
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.16) 0%, transparent 70%);
          top: -60px;
          left: -60px;
        }

        .sphere-cyan {
          width: 440px;
          height: 440px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.14) 0%, transparent 70%);
          bottom: -50px;
          right: -50px;
        }

        .sphere-emerald {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
          top: 35%;
          left: 45%;
        }

        /* Centered Container */
        .login-center-container {
          width: 100%;
          max-width: 480px;
          position: relative;
          z-index: 1;
          margin: 0 auto;
        }

        /* Pure Clean Auth Card */
        .login-unified-card {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          border-radius: 24px;
          background: rgba(14, 21, 38, 0.9);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.06);
          padding: 38px 34px;
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
          margin-bottom: 20px;
        }

        .auth-title {
          font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
          font-size: 1.75rem;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.03em;
          line-height: 1.2;
          margin: 0 0 6px 0;
        }

        .auth-subtitle {
          font-size: 0.85rem;
          color: #94a3b8;
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
          gap: 16px;
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
          transition: color 0.15s ease;
        }

        .forgot-link:hover {
          color: #7dd3fc;
          text-decoration: underline;
        }

        .composite-input {
          display: flex;
          align-items: center;
          background: #080c15;
          border: 1.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .composite-focus {
          border-color: #38bdf8;
          background: #0b1120;
          box-shadow: 0 0 0 3.5px rgba(56, 189, 248, 0.2);
        }

        .composite-error {
          border-color: #f87171;
          background: #0b1120;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
        }

        .country-prefix-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0 13px;
          height: 44px;
          background-color: #121c32;
          border-right: 1.5px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
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
          height: 44px;
          padding: 0 14px;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.875rem;
          color: #f8fafc;
          font-weight: 500;
        }

        .styled-text-input::placeholder {
          color: #64748b;
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
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .eye-toggle-btn:hover {
          color: #f8fafc;
        }

        .field-hint-text {
          font-size: 0.725rem;
          color: #94a3b8;
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
          margin-bottom: 18px;
        }

        .register-prompt {
          color: #94a3b8;
        }

        .register-bold-link {
          color: #38bdf8;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .register-bold-link:hover {
          color: #7dd3fc;
          text-decoration: underline;
        }

        /* Quick Test Roles Box */
        .quick-roles-container {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 13px;
          margin-bottom: 16px;
        }

        .quick-roles-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .quick-roles-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.735rem;
          font-weight: 700;
          color: #cbd5e1;
        }

        .sparkle-gold {
          color: #fbbf24;
        }

        .quick-roles-sub {
          font-size: 0.688rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .quick-roles-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 7px;
        }

        .role-select-card {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 8px 10px;
          border-radius: 10px;
          background: #0d1527;
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          text-align: left;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .role-select-card:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
        }

        .role-card-active {
          border-color: #38bdf8 !important;
          background: rgba(56, 189, 248, 0.15) !important;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3) !important;
        }

        .card-staff.role-card-active {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3) !important;
        }

        .card-admin.role-card-active {
          border-color: #818cf8 !important;
          background: rgba(129, 140, 248, 0.15) !important;
          box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.3) !important;
        }

        .card-super.role-card-active {
          border-color: #fbbf24 !important;
          background: rgba(251, 191, 36, 0.15) !important;
          box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.3) !important;
        }

        .role-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .role-avatar-circle {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-blue {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
        }

        .avatar-emerald {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }

        .avatar-indigo {
          background: rgba(129, 140, 248, 0.15);
          color: #818cf8;
        }

        .avatar-amber {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
        }

        .text-blue { color: #38bdf8; }
        .text-emerald { color: #34d399; }
        .text-indigo { color: #818cf8; }
        .text-amber { color: #fbbf24; }

        .role-card-meta {
          display: flex;
          flex-direction: column;
        }

        .role-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: #f8fafc;
          line-height: 1.2;
        }

        .role-user-name {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Card Footer */
        .auth-card-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.713rem;
          color: #64748b;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .footer-shield {
          color: #64748b;
        }

        @media (max-width: 480px) {
          .login-unified-card {
            padding: 28px 20px;
          }

          .quick-roles-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
