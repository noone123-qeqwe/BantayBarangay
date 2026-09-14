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
  ChevronDown,
  ChevronUp,
  Shield,
  ArrowRight,
  MapPin,
  Clock,
  Check,
  Activity,
  FileCheck2,
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
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);

  const identifierInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect whether user is typing an email or phone number
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
      setError("Please enter your mobile number or email address.");
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

    // If looks like a phone number but fails Philippine format
    const hasOnlyPhoneChars = /^[\d\s\+\-\(\)]+$/.test(trimmedIdentifier);
    if (hasOnlyPhoneChars && !trimmedIdentifier.includes("@")) {
      const normalized = normalizePhoneNumber(trimmedIdentifier);
      if (!normalized) {
        setError("Please enter a valid Philippine mobile number (e.g. 0917 123 4567) or staff email.");
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
          setError("Incorrect mobile number/email or password. Please check your credentials.");
        } else if (rawError.includes("deactivated")) {
          setError("Your account is currently deactivated. Please contact your Barangay Hall.");
        } else if (rawError.includes("too many") || rawError.includes("rate") || rawError.includes("429")) {
          setError("Too many login attempts. Please wait a moment and try again.");
        } else if (rawError.includes("network") || rawError.includes("fetch") || rawError.includes("connection")) {
          setError("Unable to connect. Please check your internet connection and try again.");
        } else {
          setError(result.error || "Incorrect credentials. Please try again.");
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
      {/* Decorative ambient background glows */}
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />
      <div className="ambient-glow ambient-glow-3" />

      <main className="login-container">
        {/* Dual-Panel Showcase Card */}
        <div className={`split-card-wrapper ${shake ? "shake-card" : ""}`}>
          
          {/* ========================================================
              LEFT PANEL: Brand Showcase & Civic Highlights (Desktop)
             ======================================================== */}
          <section className="showcase-panel">
            {/* Subtle background mesh & decorative grid */}
            <div className="showcase-grid-bg" />
            <div className="showcase-glow" />

            <div className="showcase-content">
              {/* Header Badge & Brand */}
              <div className="showcase-brand-header">
                <div className="showcase-logo-box">
                  <img
                    src="/logo.png"
                    alt="BantayBarangay Official Logo"
                    width={46}
                    height={46}
                    className="showcase-logo"
                  />
                </div>
                <div>
                  <div className="showcase-brand-title">BantayBarangay</div>
                  <div className="showcase-brand-pill">
                    <Shield size={11} />
                    <span>Civic Action Platform</span>
                  </div>
                </div>
              </div>

              {/* Showcase Heading */}
              <div className="showcase-hero-text">
                <h2 className="showcase-headline">
                  Empowering communities through <span className="text-highlight">rapid action</span>.
                </h2>
                <p className="showcase-subtext">
                  Directly report civic issues, monitor repair timelines in real-time, and verify completed solutions together.
                </p>
              </div>

              {/* 3 Core Value Pillars */}
              <div className="showcase-features">
                <div className="feature-item">
                  <div className="feature-icon-box blue-box">
                    <MapPin size={18} />
                  </div>
                  <div className="feature-text">
                    <strong>Pinpoint GPS Geotagging</strong>
                    <span>Instant coordinate lock & duplicate report prevention.</span>
                  </div>
                </div>

                <div className="feature-item">
                  <div className="feature-icon-box emerald-box">
                    <Activity size={18} />
                  </div>
                  <div className="feature-text">
                    <strong>Transparent Status Timelines</strong>
                    <span>Track progress from triage to agency assignment and resolution.</span>
                  </div>
                </div>

                <div className="feature-item">
                  <div className="feature-icon-box amber-box">
                    <FileCheck2 size={18} />
                  </div>
                  <div className="feature-text">
                    <strong>Citizen Verification Loop</strong>
                    <span>Residents confirm with photo proof before reports are closed.</span>
                  </div>
                </div>
              </div>

              {/* Simulated Live Ticket Card */}
              <div className="showcase-live-card">
                <div className="live-card-top">
                  <span className="live-tag">
                    <span className="pulse-dot" />
                    Live Community Proof
                  </span>
                  <span className="resolved-status-badge">
                    <Check size={12} strokeWidth={3} />
                    Resolved
                  </span>
                </div>
                <div className="live-card-title">Streetlight Power Restored</div>
                <div className="live-card-meta">
                  <span>Verified by Resident</span> • <span>Completed in 18 hrs</span>
                </div>
              </div>

              {/* Bottom Quote / Security Note */}
              <div className="showcase-footer">
                <ShieldCheck size={15} className="footer-shield-icon" />
                <span>Encrypted & Protected Community Civic Network</span>
              </div>
            </div>
          </section>

          {/* ========================================================
              RIGHT PANEL: Focused Authentication Form
             ======================================================== */}
          <section className="form-panel">
            {/* Mobile Header (Shown on small screens) */}
            <div className="mobile-header">
              <img
                src="/logo.png"
                alt="BantayBarangay Logo"
                width={52}
                height={52}
                className="mobile-logo"
              />
              <span className="civic-portal-pill">
                <Shield size={12} />
                <span>Official Civic Portal</span>
              </span>
            </div>

            {/* Form Title & Subtitle */}
            <div className="form-heading-group">
              <div className="desktop-badge">
                <Shield size={12} />
                <span>Official Civic Portal</span>
              </div>
              <h1 className="form-title">Welcome Back</h1>
              <p className="form-subtitle">
                Sign in to report issues, track tickets, and view updates.
              </p>
            </div>

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
              
              {/* 1. Mobile Number or Email */}
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="identifier" className="field-label">
                    Mobile Number or Email
                  </label>
                  {phonePreview && (
                    <span className="format-preview" aria-live="polite">
                      ✓ {phonePreview}
                    </span>
                  )}
                </div>

                <div className={`input-container ${isIdentifierFocused ? "is-focused" : ""} ${error && !identifier.trim() ? "is-error" : ""}`}>
                  {!isEmailInput ? (
                    <div className="input-prefix-flag" title="Philippines (+63)">
                      <span className="flag-emoji" aria-hidden="true">🇵🇭</span>
                      <span className="country-code">+63</span>
                    </div>
                  ) : (
                    <div className="input-prefix-icon">
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
                    className="native-input"
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
                    aria-describedby="identifier-hint"
                  />

                  <div className="input-suffix-icon">
                    {isEmailInput ? <Mail size={18} /> : <Smartphone size={18} />}
                  </div>
                </div>

                <p id="identifier-hint" className="field-helper">
                  Enter your 11-digit mobile number or registered barangay account.
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

              {/* 3. Multi-State Submit Button */}
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className={`primary-submit-btn ${status === "success" ? "btn-state-success" : ""}`}
                aria-live="polite"
              >
                {status === "loading" && (
                  <>
                    <Loader2 size={20} className="spin-animation" />
                    <span>Signing in...</span>
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

            {/* Registration Callout */}
            <div className="register-callout">
              <span className="register-prompt">Don't have an account?</span>{" "}
              <NextLink href="/register" className="register-link">
                Create an account
                <ArrowRight size={14} className="link-arrow" />
              </NextLink>
            </div>

            {/* Demo Accounts Pill & Drawer (Convenient for evaluators & testing) */}
            <div className="demo-accordion-card">
              <button
                type="button"
                onClick={() => setShowDemoDrawer(!showDemoDrawer)}
                className="demo-accordion-toggle"
                aria-expanded={showDemoDrawer}
              >
                <div className="demo-toggle-left">
                  <Sparkles size={14} className="sparkle-icon" />
                  <span>One-Click Demo Accounts</span>
                </div>
                {showDemoDrawer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showDemoDrawer && (
                <div className="demo-grid-body">
                  <p className="demo-hint-text">
                    Select any role to autofill test credentials:
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

            {/* Security Trust Footer */}
            <footer className="form-trust-footer">
              <ShieldCheck size={14} className="trust-icon" />
              <span>Official Civic Platform • 256-Bit SSL Encrypted</span>
            </footer>
          </section>

        </div>
      </main>

      {/* ========================================================
          STYLES (Responsive Split-Screen Layout)
         ======================================================== */}
      <style jsx>{`
        .login-screen-wrapper {
          min-height: calc(100vh - var(--header-height, 64px));
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          position: relative;
          overflow: hidden;
          background: #f8fafc;
        }

        /* Ambient Dynamic Glows */
        .ambient-glow {
          position: absolute;
          border-radius: 9999px;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }

        .ambient-glow-1 {
          width: 440px;
          height: 440px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, transparent 70%);
          top: -120px;
          left: 10%;
        }

        .ambient-glow-2 {
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(13, 148, 136, 0.14) 0%, transparent 70%);
          bottom: -100px;
          right: 5%;
        }

        .ambient-glow-3 {
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%);
          top: 40%;
          right: 35%;
        }

        .login-container {
          width: 100%;
          max-width: 1020px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Dual-Panel Card Wrapper */
        .split-card-wrapper {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          box-shadow: 0 20px 48px -12px rgba(15, 23, 42, 0.12), 0 4px 16px -2px rgba(15, 23, 42, 0.04);
          overflow: hidden;
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .shake-card {
          animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(3px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        /* ----------------------------------------------------
           LEFT SHOWCASE PANEL
           ---------------------------------------------------- */
        .showcase-panel {
          position: relative;
          background: linear-gradient(145deg, #091329 0%, #0d1e3d 45%, #152b55 100%);
          color: #ffffff;
          padding: 44px 38px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }

        .showcase-grid-bg {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.7;
          pointer-events: none;
        }

        .showcase-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.4) 0%, transparent 70%);
          top: -60px;
          left: -60px;
          filter: blur(60px);
          pointer-events: none;
        }

        .showcase-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .showcase-brand-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
        }

        .showcase-logo-box {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 6px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .showcase-logo {
          border-radius: 8px;
          object-fit: contain;
        }

        .showcase-brand-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .showcase-brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.688rem;
          font-weight: 700;
          color: #93c5fd;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }

        .showcase-hero-text {
          margin-bottom: 30px;
        }

        .showcase-headline {
          font-size: 1.85rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.22;
          letter-spacing: -0.03em;
          margin-bottom: 12px;
        }

        .text-highlight {
          background: linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .showcase-subtext {
          font-size: 0.906rem;
          color: #cbd5e1;
          line-height: 1.5;
        }

        /* Feature Pillars */
        .showcase-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 28px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .feature-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .blue-box {
          background: rgba(37, 99, 235, 0.25);
          color: #60a5fa;
        }

        .emerald-box {
          background: rgba(16, 185, 129, 0.25);
          color: #34d399;
        }

        .amber-box {
          background: rgba(245, 158, 11, 0.25);
          color: #fbbf24;
        }

        .feature-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .feature-text strong {
          font-size: 0.844rem;
          color: #ffffff;
          font-weight: 700;
        }

        .feature-text span {
          font-size: 0.781rem;
          color: #94a3b8;
          line-height: 1.35;
        }

        /* Live Preview Card */
        .showcase-live-card {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }

        .live-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .live-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.688rem;
          font-weight: 700;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .pulse-dot {
          width: 7px;
          height: 7px;
          background-color: #10b981;
          border-radius: 9999px;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: pulse 1.8s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .resolved-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.688rem;
          font-weight: 800;
          color: #10b981;
          background: rgba(16, 185, 129, 0.18);
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .live-card-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #ffffff;
        }

        .live-card-meta {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 3px;
        }

        .showcase-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: #94a3b8;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-shield-icon {
          color: #38bdf8;
          flex-shrink: 0;
        }

        /* ----------------------------------------------------
           RIGHT FORM PANEL
           ---------------------------------------------------- */
        .form-panel {
          padding: 44px 38px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .mobile-header {
          display: none;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }

        .mobile-logo {
          border-radius: 14px;
          object-fit: contain;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
          margin-bottom: 8px;
        }

        .civic-portal-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.2);
          color: #2563eb;
          border-radius: 9999px;
          font-size: 0.688rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .form-heading-group {
          margin-bottom: 24px;
        }

        .desktop-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.2);
          color: #2563eb;
          border-radius: 9999px;
          font-size: 0.688rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 12px;
        }

        .form-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
          line-height: 1.2;
          margin: 0;
        }

        .form-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 6px;
          line-height: 1.45;
        }

        /* Alert Boxes */
        .alert-box {
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
          font-size: 0.781rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .alert-description {
          font-size: 0.813rem;
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
          font-size: 0.844rem;
          font-weight: 700;
          color: #1e293b;
          user-select: none;
        }

        .format-preview {
          font-size: 0.719rem;
          font-weight: 700;
          color: #065f46;
          background: #d1fae5;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .forgot-link {
          font-size: 0.813rem;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .forgot-link:hover, .forgot-link:focus-visible {
          color: #1d4ed8;
          text-decoration: underline;
          outline: none;
        }

        /* Input Container System */
        .input-container {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          min-height: 48px;
          padding: 0 14px;
          transition: border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background 0.2s ease;
          position: relative;
        }

        .input-container:hover {
          background: #ffffff;
          border-color: #94a3b8;
        }

        .input-container.is-focused {
          background: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.16);
        }

        .input-container.is-error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3.5px rgba(239, 68, 68, 0.15);
          background: #fff5f5;
        }

        .input-prefix-flag {
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
          font-size: 1rem;
          line-height: 1;
        }

        .country-code {
          font-family: inherit;
        }

        .input-prefix-icon {
          color: #64748b;
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
          color: #0f172a;
          font-size: 0.906rem;
          font-weight: 500;
          padding: 10px 8px;
          height: 100%;
        }

        .native-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .native-input:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .input-suffix-icon {
          color: #94a3b8;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .password-toggle-btn {
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
          transition: color 0.15s ease, background-color 0.15s ease;
        }

        .password-toggle-btn:hover {
          color: #2563eb;
          background-color: #f1f5f9;
        }

        .field-helper {
          font-size: 0.719rem;
          color: #64748b;
          margin-top: 5px;
          padding-left: 2px;
          line-height: 1.35;
        }

        /* Primary Submit Button */
        .primary-submit-btn {
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
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
          cursor: pointer;
          user-select: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .primary-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
          transform: translateY(-1px);
        }

        .primary-submit-btn:active:not(:disabled) {
          transform: scale(0.99);
        }

        .primary-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-state-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35) !important;
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
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
          font-size: 0.844rem;
          color: #475569;
        }

        .register-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #2563eb;
          font-weight: 700;
          text-decoration: none;
          transition: gap 0.15s ease, color 0.15s ease;
        }

        .register-link:hover {
          color: #1d4ed8;
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
          margin-top: 16px;
          background-color: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .demo-accordion-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #475569;
          font-size: 0.75rem;
          font-weight: 700;
          transition: background-color 0.15s ease;
        }

        .demo-accordion-toggle:hover {
          background-color: rgba(37, 99, 235, 0.05);
        }

        .demo-toggle-left {
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .sparkle-icon {
          color: #2563eb;
        }

        .demo-grid-body {
          padding: 10px 12px 12px;
          border-top: 1px solid #e2e8f0;
          animation: fadeIn 0.2s ease;
        }

        .demo-hint-text {
          font-size: 0.688rem;
          color: #64748b;
          margin-bottom: 8px;
        }

        .demo-buttons-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }

        .demo-role-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 9px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .demo-role-btn:hover {
          border-color: #2563eb;
          background-color: #eff6ff;
          transform: translateY(-1px);
        }

        .role-icon {
          flex-shrink: 0;
        }

        .resident-icon { color: #2563eb; }
        .staff-icon { color: #f59e0b; }
        .admin-icon { color: #dc2626; }
        .super-icon { color: #8b5cf6; }

        .role-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .role-title {
          font-size: 0.719rem;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role-meta {
          font-size: 0.625rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Trust Footer */
        .form-trust-footer {
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.688rem;
          font-weight: 600;
          color: #64748b;
        }

        .trust-icon {
          color: #0d9488;
        }

        /* ----------------------------------------------------
           RESPONSIVE BREAKPOINTS
           ---------------------------------------------------- */
        @media (max-width: 960px) {
          .split-card-wrapper {
            grid-template-columns: 1fr;
            max-width: 480px;
            margin: 0 auto;
            border-radius: 24px;
          }

          .showcase-panel {
            display: none;
          }

          .mobile-header {
            display: flex;
          }

          .desktop-badge {
            display: none;
          }

          .form-panel {
            padding: 36px 28px;
          }

          .form-heading-group {
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .login-screen-wrapper {
            padding: 16px 12px;
          }

          .form-panel {
            padding: 26px 18px;
          }

          .form-title {
            font-size: 1.5rem;
          }

          .demo-buttons-grid {
            grid-template-columns: 1fr;
          }

          .input-container {
            min-height: 46px;
          }

          .primary-submit-btn {
            min-height: 46px;
          }
        }

        /* Reduced Motion Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .split-card-wrapper,
          .alert-box,
          .demo-grid-body,
          .primary-submit-btn,
          .shake-card,
          .pulse-dot {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
