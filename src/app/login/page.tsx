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
  ArrowLeft,
  ArrowRight,
  LogOut,
} from "lucide-react";

export default function LoginPage() {
  const { login, user, logout } = useAuth();
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
    <div
      className="login-page-canvas"
      id="login-viewport"
      style={{
        width: "100%",
        minHeight: "calc(100vh - var(--header-height, 60px))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        position: "relative",
        backgroundColor: "#080d1a",
        overflow: "hidden",
      }}
    >
      {/* Static Subtle Background Ambient (immobile) */}
      <div className="login-ambient-glow" aria-hidden="true" />

      {/* Centered Modal Container */}
      <main
        className="login-card-container"
        style={{
          width: "100%",
          maxWidth: "448px",
          position: "relative",
          zIndex: 2,
          margin: "0 auto",
        }}
      >
        <div
          className="login-modern-card"
          style={{
            width: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            border: "1.5px solid rgba(56, 189, 248, 0.22)",
            borderRadius: "20px",
            boxShadow: "0 24px 60px -12px rgba(0, 0, 0, 0.8)",
            padding: "28px 24px 22px 24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Top Brand Header */}
          <div
            className="login-brand-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "18px",
            }}
          >
            <NextLink
              href="/"
              className="login-brand-link"
              title="Return to BantayBarangay Home"
              style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
            >
              <img
                src="/logo.png"
                alt="BantayBarangay Emblem"
                width={38}
                height={38}
                className="login-brand-logo"
                style={{ width: "38px", height: "38px", borderRadius: "10px", objectFit: "contain" }}
              />
              <div className="login-brand-text" style={{ display: "flex", flexDirection: "column" }}>
                <span
                  className="login-brand-name"
                  style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1.15 }}
                >
                  BantayBarangay
                </span>
                <span
                  className="login-brand-tag"
                  style={{ fontSize: "0.65rem", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase" }}
                >
                  Masbate City Civic Portal
                </span>
              </div>
            </NextLink>

            <NextLink
              href="/"
              className="login-portal-back"
              title="Back to Home"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#94a3b8",
                textDecoration: "none",
                padding: "6px 10px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </NextLink>
          </div>

          {/* Heading Section */}
          <div className="login-title-block" style={{ marginBottom: "16px" }}>
            <h1
              className="login-title-heading"
              style={{ fontSize: "1.55rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 4px 0", lineHeight: 1.2 }}
            >
              Sign In
            </h1>
            <p className="login-title-sub" style={{ fontSize: "0.813rem", color: "#94a3b8", margin: 0, lineHeight: 1.4 }}>
              Enter your credentials to access tickets, announcements, and civic reports.
            </p>
          </div>

          {/* Active Session Notification (Allows desktop users who are already logged in to switch account or jump to dashboard) */}
          {user && (
            <div
              className="login-active-session-banner"
              style={{
                background: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.28)",
                borderRadius: "12px",
                padding: "12px 14px",
                marginBottom: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div className="login-active-session-text" style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                You are currently signed in as{" "}
                <span className="login-active-session-name" style={{ color: "#38bdf8", fontWeight: 700 }}>
                  {user.name}
                </span>{" "}
                ({user.role}).
              </div>
              <div className="login-active-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => navigateToDashboard(user.role)}
                  className="login-dash-btn"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    height: "34px",
                    background: "#0284c7",
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
                  className="login-switch-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    height: "34px",
                    padding: "0 12px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#f8fafc",
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
              className="login-alert-banner login-alert-warning"
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 12px",
                borderRadius: "10px",
                fontSize: "0.785rem",
                marginBottom: "14px",
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                color: "#fbbf24",
              }}
            >
              <WifiOff size={15} style={{ flexShrink: 0 }} />
              <span>You are currently offline. Please check your connection.</span>
            </div>
          )}

          {/* General Error Alert */}
          {error && (
            <div
              className="login-alert-banner login-alert-error"
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 12px",
                borderRadius: "10px",
                fontSize: "0.785rem",
                marginBottom: "14px",
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="login-form-element"
            style={{ display: "flex", flexDirection: "column", gap: "13px", marginBottom: "14px" }}
          >
            {/* Field: Identifier */}
            <div className="login-field-wrapper" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div
                className="login-field-head"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <label
                  htmlFor="identifier"
                  className="login-field-label"
                  style={{ fontSize: "0.813rem", fontWeight: 600, color: "#cbd5e1" }}
                >
                  Mobile number
                </label>
                {phonePreview && (
                  <span
                    className="login-phone-valid-hint"
                    aria-live="polite"
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#34d399",
                      background: "rgba(16, 185, 129, 0.12)",
                      padding: "1px 7px",
                      borderRadius: "9999px",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    ✓ {phonePreview}
                  </span>
                )}
              </div>

              <div
                className={`login-input-row ${isIdentifierFocused ? "login-input-row-focus" : ""} ${
                  identifierError ? "login-input-row-error" : ""
                }`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "46px",
                  backgroundColor: "rgba(7, 12, 23, 0.85)",
                  border: isIdentifierFocused
                    ? "1.5px solid #38bdf8"
                    : identifierError
                    ? "1.5px solid #ef4444"
                    : "1.5px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                {!isEmailInput ? (
                  <div
                    className="login-prefix-badge"
                    title="Philippine Mobile (+63)"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      height: "100%",
                      padding: "0 11px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      borderRight: "1.5px solid rgba(255, 255, 255, 0.1)",
                      color: "#94a3b8",
                      fontSize: "0.813rem",
                      userSelect: "none",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: "0.95rem" }}>🇵🇭</span>
                    <span style={{ color: "#38bdf8", fontWeight: 700 }}>+63</span>
                  </div>
                ) : (
                  <div
                    className="login-prefix-icon-only"
                    title="Email address"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      padding: "0 12px",
                      color: isIdentifierFocused ? "#38bdf8" : "#64748b",
                      borderRight: "1.5px solid rgba(255, 255, 255, 0.1)",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={16} />
                  </div>
                )}

                <input
                  ref={identifierInputRef}
                  id="identifier"
                  name="identifier"
                  type={isEmailInput ? "email" : "tel"}
                  inputMode={isEmailInput ? "email" : "tel"}
                  autoComplete="username"
                  className="login-core-input"
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
                  style={{
                    flex: 1,
                    height: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: "0 12px",
                    fontSize: "0.885rem",
                    color: "#f8fafc",
                    fontWeight: 500,
                  }}
                />
              </div>

              {identifierError && (
                <p
                  className="login-field-error-msg"
                  role="alert"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#fca5a5",
                    fontSize: "0.725rem",
                    fontWeight: 600,
                    margin: "1px 0 0 0",
                  }}
                >
                  <AlertCircle size={12} />
                  <span>{identifierError}</span>
                </p>
              )}
            </div>

            {/* Field: Password */}
            <div className="login-field-wrapper" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div
                className="login-field-head"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <label
                  htmlFor="password"
                  className="login-field-label"
                  style={{ fontSize: "0.813rem", fontWeight: 600, color: "#cbd5e1" }}
                >
                  Password
                </label>
                <NextLink
                  href="/forgot-password"
                  className="login-forgot-anchor"
                  style={{ fontSize: "0.75rem", fontWeight: 600, color: "#38bdf8", textDecoration: "none" }}
                >
                  Forgot password?
                </NextLink>
              </div>

              <div
                className={`login-input-row ${isPassFocused ? "login-input-row-focus" : ""} ${
                  passwordError ? "login-input-row-error" : ""
                }`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "46px",
                  backgroundColor: "rgba(7, 12, 23, 0.85)",
                  border: isPassFocused
                    ? "1.5px solid #38bdf8"
                    : passwordError
                    ? "1.5px solid #ef4444"
                    : "1.5px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  className="login-prefix-icon-only"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    padding: "0 12px",
                    color: isPassFocused ? "#38bdf8" : "#64748b",
                    borderRight: "1.5px solid rgba(255, 255, 255, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <Lock size={16} />
                </div>

                <input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="login-core-input"
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
                  style={{
                    flex: 1,
                    height: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: "0 12px",
                    fontSize: "0.885rem",
                    color: "#f8fafc",
                    fontWeight: 500,
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-eye-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={status === "loading" || status === "success"}
                  tabIndex={0}
                  style={{
                    height: "38px",
                    width: "38px",
                    marginRight: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                    border: "none",
                    borderRadius: "7px",
                    color: "#64748b",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {passwordError && (
                <p
                  className="login-field-error-msg"
                  role="alert"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#fca5a5",
                    fontSize: "0.725rem",
                    fontWeight: 600,
                    margin: "1px 0 0 0",
                  }}
                >
                  <AlertCircle size={12} />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className={`login-submit-button ${status === "success" ? "login-submit-success" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                height: "46px",
                borderRadius: "10px",
                background:
                  status === "success"
                    ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                    : "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
                color: "#ffffff",
                fontSize: "0.938rem",
                fontWeight: 700,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                cursor: status === "loading" || status === "success" ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                marginTop: "4px",
              }}
            >
              {status === "loading" && (
                <>
                  <Loader2 size={16} className="spin" />
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

          {/* Card Footer: Register & Security */}
          <div
            className="login-card-foot"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              paddingTop: "6px",
              borderTop: "1px solid rgba(255, 255, 255, 0.07)",
            }}
          >
            <div
              className="login-register-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.785rem",
              }}
            >
              <span style={{ color: "#94a3b8" }}>Don't have an account?</span>
              <NextLink
                href="/register"
                className="login-register-link"
                style={{ color: "#38bdf8", fontWeight: 700, textDecoration: "none" }}
              >
                Register as Resident
              </NextLink>
            </div>

            <div
              className="login-sec-pill"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.65rem",
                color: "#64748b",
                fontWeight: 500,
              }}
            >
              <Shield size={11} color="#0284c7" />
              <span>Official Civic Platform · 256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
