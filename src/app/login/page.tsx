"use client";

import React, { useState, useEffect, useRef } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { normalizePhoneNumber, isValidPhilippinePhone, formatDisplayPhone } from "@/lib/phone";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldCheck,
  Users,
  FileText,
  ChevronDown,
  Info,
  WifiOff,
  ArrowRight,
  LogOut,
  Check,
  PhoneCall,
  Maximize,
  Minimize,
} from "lucide-react";

function PhilippineFlagIcon() {
  return (
    <svg
      width="20"
      height="14"
      viewBox="0 0 20 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: "2px", flexShrink: 0, boxShadow: "0 0 1px rgba(0,0,0,0.3)" }}
      aria-label="Philippine flag"
    >
      <rect width="20" height="7" fill="#0038A8" />
      <rect y="7" width="20" height="7" fill="#CE1126" />
      <polygon points="0,0 11.5,7 0,14" fill="#FFFFFF" />
      <circle cx="3.8" cy="7" r="1.7" fill="#FCD116" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, user, logout } = useAuth();
  const router = useRouter();

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [isOffline, setIsOffline] = useState(false);

  // Focus states
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);

  const identifierInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const navigateToDashboard = (roleName?: string) => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const fromParam = searchParams.get("from");
    const upperRole = roleName?.toUpperCase();
    const defaultRoute = upperRole === "ADMIN" || upperRole === "SUPER_ADMIN" ? "/admin" : "/dashboard";
    const targetUrl = fromParam && fromParam.startsWith("/") && !fromParam.startsWith("/login") ? fromParam : defaultRoute;

    router.refresh();
    router.replace(targetUrl);

    setTimeout(() => {
      if (window.location.pathname === "/login") {
        window.location.replace(targetUrl);
      }
    }, 150);
  };

  // Fullscreen state and handler for immersive full-screen display
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);

    // Trigger proactive PWA cache & update check so mobile devices sync immediately
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("check-app-update"));
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

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
      setIdentifierError("Please enter your mobile number.");
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

  return (
    <div className="login-scenic-root" id="login-viewport">
      {/* 1. Fullscreen Aerial Background Layer (Fixed & Hardware Accelerated) */}
      <div className="login-scenic-bg" aria-hidden="true">
        <img
          src="/masbate-harbor-v3.jpg"
          alt="Masbate Harbor Background"
          className="login-scenic-bg-img"
          loading="eager"
        />
      </div>

      {/* 2. Fullscreen Subtle Dark/Blue Gradient Overlay */}
      <div className="login-scenic-overlay" aria-hidden="true" />

      {/* 3. Top Header (Branding + Fullscreen Toggle + Hotline) */}
      <header className="login-scenic-header">
        <NextLink href="/" className="login-scenic-brand" title="BantayBarangay Home">
          <img
            src="/logo.png"
            alt="BantayBarangay Emblem"
            width={44}
            height={44}
            className="login-scenic-logo"
          />
          <div className="login-scenic-brand-text">
            <div className="login-scenic-brand-title">
              <span className="brand-white">Bantay</span>
              <span className="brand-teal">Barangay</span>
            </div>
            <span className="login-scenic-brand-sub">MASBATE CITY CIVIC NETWORK</span>
          </div>
        </NextLink>

        <div className="login-scenic-header-actions">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="login-scenic-fullscreen-btn"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Mode"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>

          <a
            href="tel:0286431111"
            className="login-scenic-hotline"
            title="Emergency Hotline: (02) 8643-1111"
          >
            <PhoneCall size={14} className="login-scenic-hotline-icon" />
            <span>Hotline</span>
          </a>
        </div>
      </header>

      {/* 3. Main Content Container */}
      <main className="login-scenic-main">
        {/* Left Hero Column */}
        <section className="login-scenic-hero" aria-label="Welcome to BantayBarangay">
          {/* Section Tag */}
          <div className="login-scenic-tag">
            <span className="login-scenic-tag-bar" aria-hidden="true" />
            <span className="login-scenic-tag-text">RESIDENT ACCESS</span>
          </div>

          {/* Heading */}
          <h1 className="login-scenic-title">
            Welcome back to<br />
            your <span className="title-teal">barangay.</span>
          </h1>

          {/* Supporting Text */}
          <p className="login-scenic-desc">
            Sign in to report concerns, follow requests, and<br className="desc-break" />
            receive local safety updates.
          </p>

          {/* 3 Benefit Indicators */}
          <div className="login-scenic-pillars">
            <div className="login-pillar-col">
              <div className="login-pillar-circle">
                <ShieldCheck size={20} color="#ffffff" strokeWidth={2.2} />
              </div>
              <div className="login-pillar-text">
                <span>Safer</span>
                <span>Communities</span>
              </div>
            </div>

            <div className="login-pillar-divider" aria-hidden="true" />

            <div className="login-pillar-col">
              <div className="login-pillar-circle">
                <Users size={20} color="#ffffff" strokeWidth={2.2} />
              </div>
              <div className="login-pillar-text">
                <span>Faster</span>
                <span>Assistance</span>
              </div>
            </div>

            <div className="login-pillar-divider" aria-hidden="true" />

            <div className="login-pillar-col">
              <div className="login-pillar-circle">
                <FileText size={20} color="#ffffff" strokeWidth={2.2} />
              </div>
              <div className="login-pillar-text">
                <span>Transparent</span>
                <span>Reports</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Login Card Column */}
        <section className="login-scenic-card-col">
          <div className="login-scenic-card">
            {/* Card Header */}
            <div className="login-card-header">
              <div className="login-card-title-row">
                <span className="login-card-teal-bar" aria-hidden="true" />
                <h2 className="login-card-heading">Resident Login</h2>
              </div>
              <p className="login-card-subheading">Access your barangay services</p>
            </div>

            {/* Active Session Notice */}
            {user && (
              <div className="login-session-notice">
                <div style={{ fontSize: "0.8rem", color: "#334155", marginBottom: "8px" }}>
                  Currently signed in as <strong style={{ color: "#0284c7" }}>{user.name}</strong> ({user.role})
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => navigateToDashboard(user.role)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      height: "36px",
                      background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                      color: "#ffffff",
                      borderRadius: "8px",
                      fontSize: "0.775rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                    }}
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      router.refresh();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      height: "36px",
                      padding: "0 12px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      color: "#334155",
                      borderRadius: "8px",
                      fontSize: "0.775rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <LogOut size={13} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* Offline Alert */}
            {isOffline && (
              <div role="alert" className="login-alert warning">
                <WifiOff size={16} style={{ flexShrink: 0 }} />
                <span>You are currently offline. Please check your connection.</span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div role="alert" className="login-alert error">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="login-form">
              {/* Field 1: Mobile number */}
              <div className="login-field-group">
                <label htmlFor="identifier" className="login-field-label">
                  Mobile number
                </label>

                <div
                  className={`login-input-box ${isIdentifierFocused ? "focus" : ""} ${
                    identifierError ? "error" : ""
                  }`}
                >
                  <div className="login-phone-prefix" title="Philippine Country Code (+63)">
                    <PhilippineFlagIcon />
                    <span>+63</span>
                    <ChevronDown size={14} color="#64748b" />
                  </div>

                  <input
                    ref={identifierInputRef}
                    id="identifier"
                    name="identifier"
                    type="tel"
                    inputMode="tel"
                    autoComplete="username"
                    className="login-input"
                    placeholder="9XX XXX XXXX"
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
                  <p role="alert" className="login-error-text">
                    <AlertCircle size={12} />
                    <span>{identifierError}</span>
                  </p>
                )}
              </div>

              {/* Field 2: Password */}
              <div className="login-field-group">
                <div className="login-password-label-row">
                  <label htmlFor="password" className="login-field-label" style={{ margin: 0 }}>
                    Password
                  </label>
                  <NextLink href="/forgot-password" className="login-forgot-link">
                    Forgot password?
                  </NextLink>
                </div>

                <div
                  className={`login-input-box ${isPassFocused ? "focus" : ""} ${
                    passwordError ? "error" : ""
                  }`}
                >
                  <div className="login-input-lock">
                    <Lock size={16} color="#64748b" />
                  </div>

                  <input
                    ref={passwordInputRef}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="login-input"
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={status === "loading" || status === "success"}
                    className="login-eye-btn"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                {passwordError && (
                  <p role="alert" className="login-error-text">
                    <AlertCircle size={12} />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Row: Remember device & Encrypted */}
              <div className="login-options-row">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="login-remember-btn"
                  aria-pressed={rememberMe}
                >
                  <div className={`login-checkbox ${rememberMe ? "checked" : "unchecked"}`}>
                    {rememberMe && <Check size={12} color="#ffffff" strokeWidth={3} />}
                  </div>
                  <span className="login-remember-label">Remember this device</span>
                </button>

                <div className="login-encrypted-indicator">
                  <Shield size={14} color="#0d9488" />
                  <span>Encrypted</span>
                </div>
              </div>

              {/* Primary Button: Sign in securely */}
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="login-submit-button"
              >
                {status === "loading" && (
                  <>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Loader2 size={16} className="spin" />
                      <span>Signing in securely...</span>
                    </span>
                    <div className="login-submit-circle-arrow">
                      <ArrowRight size={14} color="#ffffff" strokeWidth={2.5} />
                    </div>
                  </>
                )}

                {status === "success" && (
                  <>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <CheckCircle2 size={16} />
                      <span>Redirecting...</span>
                    </span>
                    <div className="login-submit-circle-arrow">
                      <ArrowRight size={14} color="#ffffff" strokeWidth={2.5} />
                    </div>
                  </>
                )}

                {status !== "loading" && status !== "success" && (
                  <>
                    <span>Sign in securely</span>
                    <div className="login-submit-circle-arrow">
                      <ArrowRight size={14} color="#ffffff" strokeWidth={2.5} />
                    </div>
                  </>
                )}
              </button>

              {/* Create Resident Account */}
              <div className="login-create-account-row">
                <span>New to BantayBarangay?</span>
                <NextLink href="/register" className="login-create-account-link">
                  Create resident account
                </NextLink>
              </div>

              {/* Light Blue Information Box */}
              <div className="login-info-card" role="note">
                <Info size={18} className="login-info-card-icon" />
                <p className="login-info-card-text">
                  Your account connects you with verified services from Masbate City and your local barangay
                </p>
              </div>
            </form>
          </div>

          {/* Card Footer */}
          <div className="login-card-footer">
            <span>Official civic platform</span>
            <span>•</span>
            <span>Privacy protected</span>
          </div>
        </section>
      </main>
    </div>
  );
}
