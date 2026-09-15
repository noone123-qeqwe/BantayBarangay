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
  ArrowLeft,
  ArrowRight,
  LogOut,
  Sparkles,
  MapPin,
  Activity,
  Bell,
  Check,
  PhoneCall,
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
  const [isMobileIdentifierFocused, setIsMobileIdentifierFocused] = useState(false);
  const [isMobilePassFocused, setIsMobilePassFocused] = useState(false);

  const identifierInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const mobileIdentifierInputRef = useRef<HTMLInputElement>(null);
  const mobilePasswordInputRef = useRef<HTMLInputElement>(null);

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
    <>
      {/* =====================================================================
          DESKTOP CIVIC PORTAL LAYOUT (VIEWPORT > 768px)
          ===================================================================== */}
      {/* =====================================================================
          DESKTOP CIVIC PORTAL LAYOUT (VIEWPORT > 768px, SCENIC MASBATE AERIAL)
          ===================================================================== */}
      <div className="login-desktop-shell login-desktop-only" id="login-viewport">
        {/* Ambient aerial overlay for contrast */}
        <div className="login-desktop-overlay" aria-hidden="true" />

        {/* 1. Header (Logo + Hotline) */}
        <header className="login-desktop-header">
          <NextLink href="/" className="login-desktop-brand" title="Return to Home">
            <img
              src="/logo.png"
              alt="BantayBarangay Emblem"
              width={42}
              height={42}
              className="login-desktop-logo"
            />
            <div className="login-desktop-brand-text">
              <span className="login-desktop-brand-name">BantayBarangay</span>
              <span className="login-desktop-brand-sub">MASBATE CITY CIVIC NETWORK</span>
            </div>
          </NextLink>

          <a
            href="tel:0286431111"
            className="login-desktop-hotline-btn"
            title="Emergency Hotline"
          >
            <PhoneCall size={13} style={{ color: "#f472b6" }} />
            <span>Hotline</span>
          </a>
        </header>

        {/* 2. Main Two-Column Content Grid */}
        <main className="login-desktop-main">
          {/* Left Column: Civic Showcase */}
          <section className="login-desktop-left" aria-label="About BantayBarangay">
            <div className="login-desktop-tag">
              <span className="login-desktop-tag-bar" aria-hidden="true" />
              <span className="login-desktop-tag-text">RESIDENT ACCESS</span>
            </div>

            <h1 className="login-desktop-title">
              Welcome back to<br />
              <span className="login-desktop-title-teal">your barangay.</span>
            </h1>

            <p className="login-desktop-desc">
              Sign in to report concerns, follow requests, and receive local safety updates.
            </p>

            {/* 3 Value Pillars */}
            <div className="login-desktop-pillars">
              <div className="login-pillar-item">
                <div className="login-pillar-icon">
                  <ShieldCheck size={20} />
                </div>
                <div className="login-pillar-text">
                  <span>Safer</span>
                  <span>Communities</span>
                </div>
              </div>

              <div className="login-pillar-divider" aria-hidden="true" />

              <div className="login-pillar-item">
                <div className="login-pillar-icon">
                  <Users size={20} />
                </div>
                <div className="login-pillar-text">
                  <span>Faster</span>
                  <span>Assistance</span>
                </div>
              </div>

              <div className="login-pillar-divider" aria-hidden="true" />

              <div className="login-pillar-item">
                <div className="login-pillar-icon">
                  <FileText size={20} />
                </div>
                <div className="login-pillar-text">
                  <span>Transparent</span>
                  <span>Reports</span>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Clean White Login Card */}
          <section className="login-desktop-right">
            <div className="login-card-shell">
              {/* Card Header */}
              <div className="login-card-header">
                <div className="login-card-title-row">
                  <span className="login-card-tag-bar" aria-hidden="true" />
                  <h2 className="login-card-title">Resident Login</h2>
                </div>
                <p className="login-card-subtitle">Access your barangay services</p>
              </div>

              {/* Active Session Notice */}
              {user && (
                <div className="login-card-session">
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
                <div role="alert" className="login-card-alert warning">
                  <WifiOff size={16} style={{ flexShrink: 0 }} />
                  <span>You are currently offline. Please check your connection.</span>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div role="alert" className="login-card-alert error">
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="login-card-form">
                {/* Mobile number Field */}
                <div className="login-card-field">
                  <label htmlFor="identifier" className="login-card-label">
                    Mobile number
                  </label>

                  <div
                    className={`login-card-input-box ${isIdentifierFocused ? "focus" : ""} ${
                      identifierError ? "error" : ""
                    }`}
                  >
                    <div className="login-card-prefix" title="Philippine Country Code (+63)">
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
                      className="login-card-input"
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
                    <p role="alert" className="login-field-error">
                      <AlertCircle size={12} />
                      <span>{identifierError}</span>
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="login-card-field">
                  <div className="login-card-field-header">
                    <label htmlFor="password" className="login-card-label" style={{ margin: 0 }}>
                      Password
                    </label>
                    <NextLink href="/forgot-password" className="login-card-forgot">
                      Forgot password?
                    </NextLink>
                  </div>

                  <div
                    className={`login-card-input-box ${isPassFocused ? "focus" : ""} ${
                      passwordError ? "error" : ""
                    }`}
                  >
                    <div className="login-card-lock-icon">
                      <Lock size={16} color="#64748b" />
                    </div>

                    <input
                      ref={passwordInputRef}
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="login-card-input"
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
                      className="login-card-eye-btn"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  {passwordError && (
                    <p role="alert" className="login-field-error">
                      <AlertCircle size={12} />
                      <span>{passwordError}</span>
                    </p>
                  )}
                </div>

                {/* Options Row: Remember this device & Encrypted */}
                <div className="login-card-options">
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className="login-card-remember-btn"
                    aria-pressed={rememberMe}
                  >
                    <div className={`login-mobile-checkbox ${rememberMe ? "checked" : "unchecked"}`}>
                      {rememberMe && <Check size={12} color="#ffffff" strokeWidth={3} />}
                    </div>
                    <span className="login-card-remember-text">Remember this device</span>
                  </button>

                  <div className="login-card-encrypted">
                    <Shield size={14} color="#0d9488" />
                    <span>Encrypted</span>
                  </div>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="login-card-submit-btn"
                >
                  {status === "loading" && (
                    <>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Loader2 size={16} className="spin" />
                        <span>Signing in securely...</span>
                      </span>
                      <div className="login-card-submit-arrow">
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
                      <div className="login-card-submit-arrow">
                        <ArrowRight size={14} color="#ffffff" strokeWidth={2.5} />
                      </div>
                    </>
                  )}

                  {status !== "loading" && status !== "success" && (
                    <>
                      <span>Sign in securely</span>
                      <div className="login-card-submit-arrow">
                        <ArrowRight size={14} color="#ffffff" strokeWidth={2.5} />
                      </div>
                    </>
                  )}
                </button>

                {/* Register Link */}
                <div className="login-card-register">
                  <span>New to BantayBarangay?</span>
                  <NextLink href="/register" className="login-card-register-link">
                    Create resident account
                  </NextLink>
                </div>

                {/* Verified Services Callout */}
                <div className="login-card-callout" role="note">
                  <Info size={17} className="login-card-callout-icon" />
                  <p className="login-card-callout-text">
                    Your account connects you with verified services from Masbate City and your local barangay.
                  </p>
                </div>
              </form>
            </div>

            {/* Footer below card */}
            <div className="login-desktop-footer">
              <span>Official civic platform</span>
              <span>•</span>
              <span>Privacy protected</span>
            </div>
          </section>
        </main>
      </div>

    {/* =====================================================================
        DEDICATED MOBILE CIVIC INTERFACE (VIEWPORT <= 768px, MATCHING IMAGE)
        ===================================================================== */}
    <div className="login-mobile-screen login-mobile-only" id="login-mobile-viewport">
      {/* 1. Header with Masbate City Seal & Hotline */}
      <header className="login-mobile-header">
        <NextLink href="/" className="login-mobile-header-brand" title="BantayBarangay Home">
          <img
            src="/logo.png"
            alt="BantayBarangay Emblem"
            width={36}
            height={36}
            className="login-mobile-header-logo"
          />
          <div className="login-mobile-header-text">
            <span className="login-mobile-header-title">BantayBarangay</span>
            <span className="login-mobile-header-sub">MASBATE CITY CIVIC NETWORK</span>
          </div>
        </NextLink>

        <a
          href="tel:0286431111"
          className="login-mobile-header-hotline"
          title="Emergency Hotline"
        >
          <PhoneCall size={12} style={{ color: "#e879f9" }} />
          <span>Hotline</span>
        </a>
      </header>

      {/* 2. Mobile Body Area */}
      <main className="login-mobile-body">
        {/* Resident Access Tag */}
        <div className="login-mobile-tag">
          <span className="login-mobile-tag-bar" aria-hidden="true" />
          <span className="login-mobile-tag-text">RESIDENT ACCESS</span>
        </div>

        {/* Hero Title */}
        <h1 className="login-mobile-title">
          Welcome back to<br />your barangay.
        </h1>

        {/* Hero Description */}
        <p className="login-mobile-desc">
          Sign in to report concerns, follow requests, and receive local safety updates.
        </p>

        {/* Active Session Notification */}
        {user && (
          <div
            style={{
              background: "rgba(56, 189, 248, 0.08)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "14px",
              padding: "12px 14px",
              marginBottom: "16px",
            }}
          >
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
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "12px",
              fontSize: "0.8rem",
              marginBottom: "16px",
              backgroundColor: "#fef3c7",
              border: "1px solid #fde68a",
              color: "#b45309",
            }}
          >
            <WifiOff size={16} style={{ flexShrink: 0 }} />
            <span>You are currently offline. Please check your connection.</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "12px",
              fontSize: "0.8rem",
              marginBottom: "16px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* 3. White Civic Login Card */}
        <section className="login-mobile-card" aria-label="Sign In Form">
          {/* Card Left Accent Bar */}
          <div className="login-mobile-card-tab" aria-hidden="true" />

          <form onSubmit={handleSubmit} noValidate className="login-mobile-form">
            {/* Field: Mobile number */}
            <div className="login-mobile-field">
              <label htmlFor="mobile-identifier" className="login-mobile-label">
                Mobile number
              </label>

              <div
                className={`login-mobile-input-box ${isMobileIdentifierFocused ? "focus" : ""} ${
                  identifierError ? "error" : ""
                }`}
              >
                <div className="login-mobile-phone-prefix" title="Philippine Country Code (+63)">
                  <PhilippineFlagIcon />
                  <span>+63</span>
                </div>

                <input
                  ref={mobileIdentifierInputRef}
                  id="mobile-identifier"
                  name="identifier"
                  type="tel"
                  inputMode="tel"
                  autoComplete="username"
                  className="login-mobile-input"
                  placeholder="9XX XXX XXXX"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (identifierError) setIdentifierError(null);
                    if (error) setError(null);
                    if (status === "error") setStatus("idle");
                  }}
                  onFocus={() => setIsMobileIdentifierFocused(true)}
                  onBlur={() => setIsMobileIdentifierFocused(false)}
                  disabled={status === "loading" || status === "success"}
                  aria-required="true"
                  aria-invalid={!!identifierError}
                />
              </div>

              {identifierError && (
                <p
                  role="alert"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#dc2626",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    margin: "4px 0 0 0",
                  }}
                >
                  <AlertCircle size={12} />
                  <span>{identifierError}</span>
                </p>
              )}
            </div>

            {/* Field: Password */}
            <div className="login-mobile-field">
              <div className="login-mobile-pass-head">
                <label htmlFor="mobile-password" className="login-mobile-label" style={{ margin: 0 }}>
                  Password
                </label>
                <NextLink href="/forgot-password" className="login-mobile-forgot">
                  Forgot password?
                </NextLink>
              </div>

              <div
                className={`login-mobile-input-box ${isMobilePassFocused ? "focus" : ""} ${
                  passwordError ? "error" : ""
                }`}
              >
                <div className="login-mobile-lock-icon">
                  <Lock size={16} />
                </div>

                <input
                  ref={mobilePasswordInputRef}
                  id="mobile-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="login-mobile-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                    if (error) setError(null);
                    if (status === "error") setStatus("idle");
                  }}
                  onFocus={() => setIsMobilePassFocused(true)}
                  onBlur={() => setIsMobilePassFocused(false)}
                  disabled={status === "loading" || status === "success"}
                  aria-required="true"
                  aria-invalid={!!passwordError}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={status === "loading" || status === "success"}
                  className="login-mobile-eye-btn"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {passwordError && (
                <p
                  role="alert"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#dc2626",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    margin: "4px 0 0 0",
                  }}
                >
                  <AlertCircle size={12} />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* Options Row: Remember this device & Encrypted */}
            <div className="login-mobile-options">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="login-mobile-remember-btn"
                aria-pressed={rememberMe}
              >
                <div className={`login-mobile-checkbox ${rememberMe ? "checked" : "unchecked"}`}>
                  {rememberMe && <Check size={12} color="#ffffff" strokeWidth={3} />}
                </div>
                <span className="login-mobile-remember-label">Remember this device</span>
              </button>

              <div className="login-mobile-encrypted">
                <Shield size={14} color="#0d9488" />
                <span>Encrypted</span>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="login-mobile-submit"
            >
              {status === "loading" && (
                <>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Loader2 size={16} className="spin" />
                    <span>Signing in securely...</span>
                  </span>
                  <div className="login-mobile-submit-arrow">
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
                  <div className="login-mobile-submit-arrow">
                    <ArrowRight size={14} color="#ffffff" strokeWidth={2.5} />
                  </div>
                </>
              )}

              {status !== "loading" && status !== "success" && (
                <>
                  <span>Sign in securely</span>
                  <div className="login-mobile-submit-arrow">
                    <ArrowRight size={14} color="#ffffff" strokeWidth={2.5} />
                  </div>
                </>
              )}
            </button>

            {/* Create Resident Account */}
            <div className="login-mobile-register">
              <span>New to BantayBarangay?</span>
              <NextLink href="/register" className="login-mobile-register-link">
                Create resident account
              </NextLink>
            </div>
          </form>
        </section>

        {/* 4. Callout Notification Box */}
        <div className="login-mobile-callout" role="note">
          <AlertCircle size={18} className="login-mobile-callout-icon" />
          <p className="login-mobile-callout-text" style={{ margin: 0 }}>
            Your account connects you with verified services from Masbate City and your local barangay.
          </p>
        </div>

        {/* 5. Footer */}
        <footer className="login-mobile-footer">
          <span>Official civic platform</span>
          <span>•</span>
          <span>Privacy protected</span>
        </footer>
      </main>
    </div>
  </>
);
}
