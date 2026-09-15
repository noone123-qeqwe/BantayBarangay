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
  WifiOff,
  ArrowLeft,
  ArrowRight,
  LogOut,
  Sparkles,
  MapPin,
  Activity,
  Bell,
  Check,
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
    <div className="login-portal-shell" id="login-viewport">
      {/* Background ambient lighting */}
      <div className="login-portal-glow" aria-hidden="true" />

      <main className="login-portal-split">
        {/* Left Column: Official Civic Portal Showcase (Desktop / Tablet) */}
        <section className="login-portal-showcase" aria-label="About BantayBarangay">
          <div>
            <div className="login-showcase-badge">
              <Sparkles size={13} />
              <span>Masbate City Civic Technology</span>
            </div>
          </div>

          <div>
            <h1 className="login-showcase-title">
              Empowering Citizens.
              <br />
              <span className="text-gradient">Strengthening Communities.</span>
            </h1>
            <p className="login-showcase-desc" style={{ marginTop: "12px" }}>
              The official municipal reporting and public infrastructure tracking network for Barangay Masbate City.
              Report incidents, monitor repair SLA, and receive verified announcements.
            </p>
          </div>

          <div className="login-showcase-features">
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <Activity size={18} />
              </div>
              <div>
                <div className="login-feature-title">Real-Time Incident Dispatch</div>
                <p className="login-feature-desc">
                  Direct escalation to engineering crews, electric utilities, and public safety teams.
                </p>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <MapPin size={18} />
              </div>
              <div>
                <div className="login-feature-title">Geo-Tagged Transparency</div>
                <p className="login-feature-desc">
                  Interactive community maps with verified photographic evidence and timeline updates.
                </p>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <Bell size={18} />
              </div>
              <div>
                <div className="login-feature-title">Verified Public Advisories</div>
                <p className="login-feature-desc">
                  Direct notifications on infrastructure repairs, weather notices, and barangay council announcements.
                </p>
              </div>
            </div>
          </div>

          <div className="login-showcase-seal">
            <Shield size={14} color="#38bdf8" />
            <span>Republic of the Philippines · City Government of Masbate · Official Portal</span>
          </div>
        </section>

        {/* Right Column: Clean & Professional Auth Container */}
        <section className="login-portal-card" aria-label="Sign In Form">
          {/* Top Branding Row */}
          <div className="login-portal-top">
            <NextLink href="/" className="login-portal-brand" title="Return to Home">
              <img
                src="/logo.png"
                alt="BantayBarangay Emblem"
                width={38}
                height={38}
                className="login-portal-logo"
              />
              <div className="login-portal-brand-text">
                <span className="login-portal-brand-name">BantayBarangay</span>
                <span className="login-portal-brand-tag">Masbate City Civic Net</span>
              </div>
            </NextLink>

            <NextLink href="/" className="login-portal-home-btn" title="Back to Home">
              <ArrowLeft size={13} />
              <span>Home</span>
            </NextLink>
          </div>

          {/* Title Block */}
          <div className="login-portal-title-block">
            <h2 className="login-portal-heading">Sign In</h2>
            <p className="login-portal-subheading">
              Enter your registered mobile number to access your account.
            </p>
          </div>

          {/* Active Session Notification */}
          {user && (
            <div className="login-portal-session">
              <div className="login-portal-session-text">
                Currently signed in as <strong style={{ color: "#38bdf8" }}>{user.name}</strong> ({user.role})
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                <button
                  type="button"
                  onClick={() => navigateToDashboard(user.role)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    height: "34px",
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

          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "0.8rem",
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
          <form onSubmit={handleSubmit} noValidate className="login-portal-form">
            {/* Field: Mobile Number */}
            <div className="login-portal-field">
              <div className="login-portal-field-head">
                <label htmlFor="identifier" className="login-portal-label">
                  Mobile Number
                </label>
                {phonePreview && (
                  <span
                    aria-live="polite"
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#34d399",
                      background: "rgba(16, 185, 129, 0.12)",
                      padding: "1px 8px",
                      borderRadius: "9999px",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    ✓ {phonePreview}
                  </span>
                )}
              </div>

              <div
                className={`login-portal-input-row ${isIdentifierFocused ? "focus" : ""} ${
                  identifierError ? "error" : ""
                }`}
              >
                <div className="login-portal-prefix" title="Philippine Country Code (+63)">
                  <span style={{ fontSize: "0.95rem" }}>🇵🇭</span>
                  <span style={{ color: "#38bdf8", fontWeight: 700 }}>+63</span>
                </div>

                <input
                  ref={identifierInputRef}
                  id="identifier"
                  name="identifier"
                  type="tel"
                  inputMode="tel"
                  autoComplete="username"
                  className="login-portal-input"
                  placeholder="09XXXXXXXXX"
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
                <p
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
            <div className="login-portal-field">
              <div className="login-portal-field-head">
                <label htmlFor="password" className="login-portal-label">
                  Password
                </label>
                <NextLink
                  href="/forgot-password"
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#38bdf8",
                    textDecoration: "none",
                  }}
                >
                  Forgot password?
                </NextLink>
              </div>

              <div
                className={`login-portal-input-row ${isPassFocused ? "focus" : ""} ${
                  passwordError ? "error" : ""
                }`}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    padding: "0 12px",
                    color: isPassFocused ? "#38bdf8" : "#64748b",
                    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
                    flexShrink: 0,
                  }}
                >
                  <Lock size={15} />
                </div>

                <input
                  ref={passwordInputRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="login-portal-input"
                  placeholder="Enter your account password"
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
              className="login-portal-submit-btn"
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

          {/* Footer: Register & SSL Encryption */}
          <div className="login-portal-foot">
            <div className="login-portal-register-text">
              <span>Don't have an account?</span>
              <NextLink href="/register" className="login-portal-register-link">
                Register as Resident
              </NextLink>
            </div>

            <div className="login-portal-ssl-badge">
              <Shield size={12} color="#10b981" />
              <span>Official Civic Platform · 256-Bit SSL Encrypted</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
