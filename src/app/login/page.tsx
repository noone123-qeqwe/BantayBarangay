"use client";

import React, { useState, useEffect, useRef } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { normalizePhoneNumber, isValidPhilippinePhone, formatDisplayPhone } from "@/lib/phone";
import {
  Smartphone,
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
  ChevronDown,
  ChevronUp,
  Shield,
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
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);

  // Field focus states for visual highlights
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

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
      setError("Unable to connect. Please check your internet connection and try again.");
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

    // Check offline state
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      setError("Unable to connect. Please check your internet connection and try again.");
      triggerShake();
      return;
    }

    const trimmedIdentifier = identifier.trim();

    // Field-level validation
    if (!trimmedIdentifier) {
      setError("Please enter your mobile number.");
      phoneInputRef.current?.focus();
      triggerShake();
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      passwordInputRef.current?.focus();
      triggerShake();
      return;
    }

    // If looks like a phone number but fails Philippine format
    const hasOnlyPhoneChars = /^[\d\s\+\-\(\)]+$/.test(trimmedIdentifier);
    if (hasOnlyPhoneChars && !trimmedIdentifier.includes("@")) {
      const normalized = normalizePhoneNumber(trimmedIdentifier);
      if (!normalized) {
        setError("Please enter a valid Philippine mobile number (e.g., 0917 123 4567 or +639171234567).");
        phoneInputRef.current?.focus();
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
        }, 500);
      } else {
        setStatus("error");
        triggerShake();

        // Friendly error messages avoiding technical jargon
        const rawError = (result.error || "").toLowerCase();
        if (rawError.includes("invalid") || rawError.includes("credential") || rawError.includes("401")) {
          setError("Incorrect mobile number or password. Please check your credentials and try again.");
        } else if (rawError.includes("deactivated")) {
          setError("Your account is currently deactivated. Please contact your Barangay Hall.");
        } else if (rawError.includes("too many") || rawError.includes("rate") || rawError.includes("429")) {
          setError("Too many login attempts. Please wait a moment and try again.");
        } else if (rawError.includes("network") || rawError.includes("fetch") || rawError.includes("connection")) {
          setError("Unable to connect. Please check your internet connection and try again.");
        } else {
          setError(result.error || "Incorrect mobile number or password. Please try again.");
        }
      }
    } catch {
      setStatus("error");
      triggerShake();
      setError("Unable to connect. Please check your internet connection and try again.");
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleQuickLogin = (demoIdentifier: string) => {
    setIdentifier(demoIdentifier);
    setPassword("Password123!");
    setError(null);
    setStatus("idle");
  };

  return (
    <div className="login-screen-wrapper">
      {/* Subtle Civic Decorative Ambient Mesh */}
      <div className="ambient-glow ambient-glow-top" />
      <div className="ambient-glow ambient-glow-bottom" />

      <main className="login-container">
        {/* Main Authentication Card */}
        <div className={`login-card ${shake ? "shake-card" : ""}`}>
          
          {/* Header & Official Identity */}
          <header className="login-header">
            <div className="logo-badge-wrapper">
              <img
                src="/logo.png"
                alt="BantayBarangay Official Logo"
                width={62}
                height={62}
                className="official-logo"
              />
              <span className="civic-emblem-badge">
                <Shield size={12} className="emblem-icon" />
                <span>Masbate Civic Portal</span>
              </span>
            </div>

            <h1 className="welcome-title">Welcome to BantayBarangay</h1>
            <p className="welcome-subtitle">
              Sign in to report, track, and help improve your community.
            </p>
          </header>

          {/* Network Offline Warning */}
          {isOffline && (
            <div className="alert-box alert-warning" role="alert">
              <WifiOff size={18} className="alert-icon" />
              <span>You appear to be offline. Please check your internet connection.</span>
            </div>
          )}

          {/* Friendly Error Alert */}
          {error && (
            <div className="alert-box alert-danger" role="alert" aria-live="assertive">
              <AlertCircle size={18} className="alert-icon" />
              <div className="alert-text-wrapper">
                <span className="alert-title">Sign In Failed</span>
                <span className="alert-description">{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="login-form">
            
            {/* 1. Mobile Number Field */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="identifier" className="field-label">
                  Mobile Number
                </label>
                {phonePreview && (
                  <span className="format-preview" aria-live="polite">
                    ✓ {phonePreview}
                  </span>
                )}
              </div>

              <div className={`input-container ${isPhoneFocused ? "is-focused" : ""} ${error && !identifier.trim() ? "is-error" : ""}`}>
                <div className="input-prefix-flag" title="Philippines Country Code (+63)">
                  <span className="flag-emoji" aria-hidden="true">🇵🇭</span>
                  <span className="country-code">+63</span>
                </div>

                <input
                  ref={phoneInputRef}
                  id="identifier"
                  name="identifier"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="native-input"
                  placeholder="09XXXXXXXXX or 9XXXXXXXXX"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError(null);
                    if (status === "error") setStatus("idle");
                  }}
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={() => setIsPhoneFocused(false)}
                  disabled={status === "loading" || status === "success"}
                  aria-required="true"
                  aria-invalid={!!error && !identifier.trim()}
                  aria-describedby="phone-hint"
                />

                <div className="input-suffix-icon">
                  <Smartphone size={18} />
                </div>
              </div>

              <p id="phone-hint" className="field-helper">
                Enter your 11-digit mobile number (e.g. 0917 123 4567) or registered staff account.
              </p>
            </div>

            {/* 2. Password Field */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password" className="field-label">
                  Password
                </label>
                <NextLink
                  href="/forgot-password"
                  className="forgot-link"
                  tabIndex={0}
                >
                  Forgot Password?
                </NextLink>
              </div>

              <div className={`input-container ${isPassFocused ? "is-focused" : ""} ${error && !password ? "is-error" : ""}`}>
                <div className="input-prefix-icon">
                  <Lock size={18} />
                </div>

                <input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="native-input native-input-masked"
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
                  className="password-toggle-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  disabled={status === "loading" || status === "success"}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 3. Multi-State Login Button */}
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className={`primary-submit-btn ${status === "success" ? "btn-state-success" : ""}`}
              aria-live="polite"
            >
              {status === "loading" && (
                <>
                  <Loader2 size={20} className="spin-animation" />
                  <span>Signing you in...</span>
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle2 size={20} className="success-bounce" />
                  <span>Login Successful</span>
                </>
              )}

              {status !== "loading" && status !== "success" && (
                <>
                  <LogIn size={20} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Registration Option */}
          <div className="register-callout">
            <span className="register-prompt">Don't have an account?</span>{" "}
            <NextLink href="/register" className="register-link">
              Create an account
              <ArrowRight size={14} className="link-arrow" />
            </NextLink>
          </div>

          {/* Quick Demo Switcher (Collapsible for test environments) */}
          <div className="demo-accordion-card">
            <button
              type="button"
              onClick={() => setShowDemoDrawer(!showDemoDrawer)}
              className="demo-accordion-toggle"
              aria-expanded={showDemoDrawer}
            >
              <div className="demo-toggle-left">
                <Sparkles size={14} className="sparkle-icon" />
                <span>Quick Demo Accounts</span>
              </div>
              {showDemoDrawer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showDemoDrawer && (
              <div className="demo-grid-body">
                <p className="demo-hint-text">
                  Click any role to fill credentials and test authentication:
                </p>
                <div className="demo-buttons-grid">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("09204443333")}
                    className="demo-role-btn"
                  >
                    <User size={14} className="role-icon resident-icon" />
                    <div className="role-text">
                      <span className="role-title">Resident</span>
                      <span className="role-meta">Juan Dela Cruz</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("09193332222")}
                    className="demo-role-btn"
                  >
                    <ShieldCheck size={14} className="role-icon staff-icon" />
                    <div className="role-text">
                      <span className="role-title">Barangay Staff</span>
                      <span className="role-meta">Alex Santos</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("09182221111")}
                    className="demo-role-btn"
                  >
                    <Crown size={14} className="role-icon admin-icon" />
                    <div className="role-text">
                      <span className="role-title">Barangay Admin</span>
                      <span className="role-meta">Roberto Tan</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("09171110000")}
                    className="demo-role-btn"
                  >
                    <Crown size={14} className="role-icon super-icon" />
                    <div className="role-text">
                      <span className="role-title">Super Admin</span>
                      <span className="role-meta">System Operator</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Trust & Civic Security Badge */}
          <footer className="login-footer">
            <div className="trust-pill">
              <ShieldCheck size={14} className="trust-icon" />
              <span>Official Civic Platform • 256-Bit Encrypted</span>
            </div>
            <p className="civic-motto">
              Report. Track. Improve Our Community.
            </p>
          </footer>
        </div>
      </main>

      {/* Modern Scoped Styling with Mobile-First Responsive Breakpoints */}
      <style jsx>{`
        .login-screen-wrapper {
          min-height: calc(100vh - var(--header-height, 60px));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          padding-top: max(24px, env(safe-area-inset-top, 24px));
          padding-bottom: max(32px, env(safe-area-inset-bottom, 32px));
          position: relative;
          overflow: hidden;
          background-color: var(--bg-app, #f8fafc);
        }

        /* Ambient Glows */
        .ambient-glow {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.45;
          z-index: 0;
        }

        .ambient-glow-top {
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(6, 182, 212, 0.1) 100%);
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
        }

        .ambient-glow-bottom {
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 80%);
          bottom: -80px;
          right: -40px;
        }

        .login-container {
          width: 100%;
          max-width: 450px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Authentication Card */
        .login-card {
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-medium, #cbd5e1);
          border-radius: 24px;
          padding: 34px 28px;
          box-shadow: 0 12px 36px -6px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04);
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
          animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Shake animation on invalid submit */
        .shake-card {
          animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1.5px, 0, 0); }
          20%, 80% { transform: translate3d(2.5px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        /* Header & Branding */
        .login-header {
          text-align: center;
          margin-bottom: 26px;
        }

        .logo-badge-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 16px;
        }

        .official-logo {
          border-radius: 18px;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.28);
          object-fit: contain;
          margin-bottom: 10px;
          transition: transform 0.2s ease;
        }

        .official-logo:hover {
          transform: scale(1.04);
        }

        .civic-emblem-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.2);
          color: var(--primary, #2563eb);
          border-radius: 9999px;
          font-size: 0.688rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .emblem-icon {
          color: var(--primary, #2563eb);
        }

        .welcome-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary, #0f172a);
          letter-spacing: -0.025em;
          line-height: 1.25;
          margin: 0;
        }

        .welcome-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted, #64748b);
          margin-top: 6px;
          line-height: 1.45;
        }

        /* Alert Boxes */
        .alert-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          font-size: 0.875rem;
          margin-bottom: 20px;
          line-height: 1.4;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .alert-danger {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .alert-warning {
          background-color: #fffbeb;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .alert-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .alert-text-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .alert-title {
          font-weight: 700;
          font-size: 0.813rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .alert-description {
          font-size: 0.844rem;
        }

        /* Form Components */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 7px;
        }

        .field-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          user-select: none;
        }

        .format-preview {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--status-resolved-dark, #065f46);
          background: var(--status-resolved-bg, #d1fae5);
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .forgot-link {
          font-size: 0.813rem;
          font-weight: 700;
          color: var(--primary, #2563eb);
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .forgot-link:hover, .forgot-link:focus-visible {
          color: var(--primary-dark, #1e40af);
          text-decoration: underline;
          outline: none;
        }

        /* Input Container System */
        .input-container {
          display: flex;
          align-items: center;
          background: var(--bg-surface, #ffffff);
          border: 1.5px solid var(--border-medium, #cbd5e1);
          border-radius: 12px;
          min-height: 50px;
          padding: 0 14px;
          transition: border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
          position: relative;
        }

        .input-container.is-focused {
          border-color: var(--primary, #2563eb);
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.18);
        }

        .input-container.is-error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3.5px rgba(239, 68, 68, 0.15);
        }

        .input-prefix-flag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding-right: 10px;
          border-right: 1.5px solid var(--border-subtle, #e2e8f0);
          color: var(--text-secondary, #334155);
          font-size: 0.938rem;
          font-weight: 700;
          user-select: none;
          flex-shrink: 0;
        }

        .flag-emoji {
          font-size: 1.1rem;
          line-height: 1;
        }

        .country-code {
          font-family: var(--font-sans, inherit);
        }

        .input-prefix-icon {
          color: var(--text-muted, #64748b);
          display: flex;
          align-items: center;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .native-input {
          flex: 1;
          width: 100%;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: var(--text-primary, #0f172a);
          font-size: 0.969rem;
          font-weight: 500;
          padding: 12px 10px;
          height: 100%;
        }

        .native-input::placeholder {
          color: var(--text-muted, #94a3b8);
          font-weight: 400;
        }

        .native-input:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .input-suffix-icon {
          color: var(--text-muted, #64748b);
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .password-toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-muted, #64748b);
          cursor: pointer;
          padding: 8px;
          margin-right: -6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease, background-color 0.15s ease;
        }

        .password-toggle-btn:hover {
          color: var(--primary, #2563eb);
          background-color: var(--bg-subtle, #f1f5f9);
        }

        .password-toggle-btn:focus-visible {
          outline: 2px solid var(--primary, #2563eb);
        }

        .field-helper {
          font-size: 0.75rem;
          color: var(--text-muted, #64748b);
          margin-top: 5px;
          padding-left: 2px;
          line-height: 1.35;
        }

        /* Primary Submit Button */
        .primary-submit-btn {
          width: 100%;
          min-height: 52px;
          margin-top: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 14px;
          font-size: 1.031rem;
          font-weight: 800;
          color: #ffffff;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 18px rgba(37, 99, 235, 0.38);
          cursor: pointer;
          user-select: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .primary-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          box-shadow: 0 6px 24px rgba(37, 99, 235, 0.48);
          transform: translateY(-1px);
        }

        .primary-submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

        .primary-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-state-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          box-shadow: 0 4px 18px rgba(16, 185, 129, 0.4) !important;
        }

        .spin-animation {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .success-bounce {
          animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }

        @keyframes scaleUp {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Register Callout */
        .register-callout {
          text-align: center;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid var(--border-subtle, #e2e8f0);
          font-size: 0.875rem;
          color: var(--text-secondary, #334155);
        }

        .register-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--primary, #2563eb);
          font-weight: 700;
          text-decoration: none;
          transition: gap 0.15s ease, color 0.15s ease;
        }

        .register-link:hover {
          color: var(--primary-dark, #1e40af);
          text-decoration: underline;
        }

        .register-link:hover .link-arrow {
          transform: translateX(3px);
        }

        .link-arrow {
          transition: transform 0.15s ease;
        }

        /* Demo Accordion Card */
        .demo-accordion-card {
          margin-top: 20px;
          background-color: var(--bg-subtle, #f8fafc);
          border: 1px dashed var(--border-medium, #cbd5e1);
          border-radius: 14px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .demo-accordion-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-secondary, #334155);
          font-size: 0.781rem;
          font-weight: 700;
          transition: background-color 0.15s ease;
        }

        .demo-accordion-toggle:hover {
          background-color: rgba(37, 99, 235, 0.04);
        }

        .demo-toggle-left {
          display: flex;
          align-items: center;
          gap: 7px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .sparkle-icon {
          color: var(--primary, #2563eb);
        }

        .demo-grid-body {
          padding: 12px 14px 14px;
          border-top: 1px solid var(--border-subtle, #e2e8f0);
          animation: fadeIn 0.2s ease;
        }

        .demo-hint-text {
          font-size: 0.719rem;
          color: var(--text-muted, #64748b);
          margin-bottom: 10px;
        }

        .demo-buttons-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .demo-role-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-subtle, #e2e8f0);
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .demo-role-btn:hover {
          border-color: var(--primary, #2563eb);
          background-color: var(--primary-light, #eff6ff);
          transform: translateY(-1px);
        }

        .role-icon {
          flex-shrink: 0;
        }

        .resident-icon { color: var(--primary, #2563eb); }
        .staff-icon { color: var(--accent, #f59e0b); }
        .admin-icon { color: #dc2626; }
        .super-icon { color: #8b5cf6; }

        .role-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .role-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role-meta {
          font-size: 0.656rem;
          color: var(--text-muted, #64748b);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Trust Footer */
        .login-footer {
          margin-top: 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .trust-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: var(--bg-subtle, #f1f5f9);
          border-radius: 9999px;
          font-size: 0.688rem;
          font-weight: 600;
          color: var(--text-secondary, #475569);
        }

        .trust-icon {
          color: var(--secondary, #0d9488);
        }

        .civic-motto {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted, #64748b);
          margin: 0;
        }

        /* Responsive Breakpoints & Mobile Optimization */
        @media (max-width: 480px) {
          .login-screen-wrapper {
            padding: 16px 12px;
          }

          .login-card {
            padding: 26px 18px;
            border-radius: 20px;
          }

          .welcome-title {
            font-size: 1.375rem;
          }

          .welcome-subtitle {
            font-size: 0.813rem;
          }

          .demo-buttons-grid {
            grid-template-columns: 1fr;
          }

          .input-container {
            min-height: 48px;
          }

          .primary-submit-btn {
            min-height: 48px;
            font-size: 0.969rem;
          }
        }

        /* Reduced Motion Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .login-card,
          .alert-box,
          .demo-grid-body,
          .primary-submit-btn,
          .shake-card {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
