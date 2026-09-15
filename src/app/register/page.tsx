"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import OtpInput from "@/components/OtpInput";
import {
  User,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Shield,
  Mail,
  Smartphone,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";

type RegisterPhase = "DETAILS" | "OTP" | "COMPLETE";

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<RegisterPhase>("DETAILS");

  // Phase 1 Fields
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Focus states
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Phase 2 OTP Fields
  const [otpCode, setOtpCode] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  // Status & error states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Today formatted as YYYY-MM-DD for birthdate max constraint
  const todayFormatted = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  // Automatic Age Calculation from Date of Birth
  const calculatedAge = useMemo(() => {
    if (!birthDate) return null;
    const dob = new Date(birthDate);
    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age >= 0 ? age : null;
  }, [birthDate]);

  const formattedBirthDate = useMemo(() => {
    if (!birthDate) return "";
    const dob = new Date(birthDate + "T00:00:00");
    if (isNaN(dob.getTime())) return "";
    return dob.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [birthDate]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 1: Submit Details & Request OTP
  // ─────────────────────────────────────────────────────────────────────────
  const handleProceedToOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (!birthDate) {
      setError("Please select your date of birth.");
      return;
    }

    if (calculatedAge === null || calculatedAge < 0 || calculatedAge > 125) {
      setError("Please enter a valid date of birth.");
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError("Please enter your Philippine mobile phone number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: trimmedPhone,
          purpose: "REGISTRATION",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to dispatch verification code.");
        if (data.cooldownSeconds) {
          setCooldown(data.cooldownSeconds);
        }
        setLoading(false);
        return;
      }

      setMaskedPhone(data.maskedPhone || trimmedPhone);
      setCooldown(data.cooldownSeconds || 60);
      if (data.devCode) {
        setDevCode(data.devCode);
      }
      setOtpCode("");
      setPhase("OTP");
    } catch (err: any) {
      setError(err.message || "Network error. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 2: Resend OTP
  // ─────────────────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          purpose: "REGISTRATION",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        if (data.cooldownSeconds) setCooldown(data.cooldownSeconds);
      } else {
        setCooldown(data.cooldownSeconds || 60);
        if (data.devCode) setDevCode(data.devCode);
        setOtpCode("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 2: Verify OTP & Finalize Registration
  // ─────────────────────────────────────────────────────────────────────────
  const handleVerifyAndRegister = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (code.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Verify OTP code
      const otpRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          code,
          purpose: "REGISTRATION",
        }),
      });

      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        setError(otpData.error || "Invalid verification code.");
        setLoading(false);
        return;
      }

      const verifiedToken = otpData.verificationToken;
      setVerificationToken(verifiedToken);

      // 2. Register resident account
      const regResult = await register({
        name: name.trim(),
        birthDate,
        age: calculatedAge ?? 0,
        phone: phone.trim(),
        password,
        verificationToken: verifiedToken,
        email: email.trim() || undefined,
      });

      if (regResult.success) {
        setPhase("COMPLETE");
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Confetti optional
        }
        setTimeout(() => {
          router.replace("/dashboard");
        }, 2000);
      } else {
        setError(regResult.error || "Registration failed. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete registration.");
      setLoading(false);
    }
  };

  return (
    <div
      className="register-page-canvas"
      id="register-viewport"
      style={{
        width: "100%",
        minHeight: "calc(100vh - var(--header-height, 60px))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 16px",
        position: "relative",
        backgroundColor: "#080d1a",
        overflowX: "hidden",
      }}
    >
      {/* Static Subtle Ambient Center Glow */}
      <div className="register-ambient-glow" aria-hidden="true" />

      {/* Main Card Container */}
      <main
        className="register-card-container"
        style={{
          width: "100%",
          maxWidth: "470px",
          position: "relative",
          zIndex: 2,
          margin: "0 auto",
        }}
      >
        <div
          className="register-modern-card"
          style={{
            width: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            border: "1.5px solid rgba(56, 189, 248, 0.22)",
            borderRadius: "20px",
            boxShadow: "0 24px 60px -12px rgba(0, 0, 0, 0.8)",
            padding: "28px 24px 24px 24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Top Brand Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "18px",
            }}
          >
            <NextLink
              href="/"
              title="Return to Home"
              style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
            >
              <img
                src="/logo.png"
                alt="BantayBarangay Emblem"
                width={38}
                height={38}
                style={{ width: "38px", height: "38px", borderRadius: "10px", objectFit: "contain" }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1.15 }}>
                  BantayBarangay
                </span>
                <span style={{ fontSize: "0.65rem", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase" }}>
                  Resident Registration
                </span>
              </div>
            </NextLink>

            <NextLink
              href="/login"
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#38bdf8",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                backgroundColor: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
              }}
            >
              Sign In
            </NextLink>
          </div>

          {/* Minimal 2-Step Indicator */}
          {phase !== "COMPLETE" && (
            <div
              className="register-stepper"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "5px 12px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "9999px",
                marginBottom: "18px",
                width: "fit-content",
              }}
            >
              <div
                className={`register-step-chip ${phase === "DETAILS" ? "register-step-active" : "register-step-done"}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: phase === "DETAILS" ? "#38bdf8" : "#10b981",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: phase === "DETAILS" ? "#0284c7" : "#10b981",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                  }}
                >
                  {phase === "DETAILS" ? "1" : "✓"}
                </span>
                <span>Account Info</span>
              </div>

              <div style={{ width: "14px", height: "1px", background: "rgba(255, 255, 255, 0.12)" }} />

              <div
                className={`register-step-chip ${phase === "OTP" ? "register-step-active" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: phase === "OTP" ? "#38bdf8" : "#64748b",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: phase === "OTP" ? "#0284c7" : "rgba(255, 255, 255, 0.08)",
                    color: phase === "OTP" ? "#ffffff" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                  }}
                >
                  2
                </span>
                <span>SMS Verification</span>
              </div>
            </div>
          )}

          {/* Heading Section */}
          {phase === "DETAILS" && (
            <div style={{ marginBottom: "16px" }}>
              <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 4px 0" }}>
                Create Resident Account
              </h1>
              <p style={{ fontSize: "0.813rem", color: "#94a3b8", margin: 0, lineHeight: 1.4 }}>
                Join your barangay network to report hazards and track infrastructure tickets.
              </p>
            </div>
          )}

          {phase === "OTP" && (
            <div style={{ marginBottom: "16px" }}>
              <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 4px 0" }}>
                Verify Mobile Number
              </h1>
              <p style={{ fontSize: "0.813rem", color: "#94a3b8", margin: 0, lineHeight: 1.4 }}>
                Enter the 6-digit security code sent to <strong>{maskedPhone}</strong>
              </p>
            </div>
          )}

          {/* Error Notice */}
          {error && (
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
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              PHASE 1: ACCOUNT DETAILS & CREDENTIALS
             ───────────────────────────────────────────────────────────────── */}
          {phase === "DETAILS" && (
            <form onSubmit={handleProceedToOtp} noValidate className="register-form-grid">
              {/* Full Name */}
              <div className="register-field">
                <label className="register-label" htmlFor="reg-name">
                  Full Name
                </label>
                <div
                  className={`register-input-container ${focusedField === "name" ? "register-input-focused" : ""}`}
                >
                  <div className="register-input-icon">
                    <User size={16} />
                  </div>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Juan Dela Cruz"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError(null);
                    }}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className="register-core-input"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="register-field">
                <div className="register-field-header">
                  <label className="register-label" htmlFor="reg-dob">
                    Date of Birth
                  </label>
                  {calculatedAge !== null && (
                    <span className="register-age-badge" aria-live="polite">
                      {calculatedAge} years old
                    </span>
                  )}
                </div>
                <div
                  className={`register-input-container ${focusedField === "dob" ? "register-input-focused" : ""}`}
                >
                  <div className="register-input-icon">
                    <Calendar size={16} />
                  </div>
                  <input
                    id="reg-dob"
                    name="birthDate"
                    type="date"
                    max={todayFormatted}
                    required
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      if (error) setError(null);
                    }}
                    onFocus={() => setFocusedField("dob")}
                    onBlur={() => setFocusedField(null)}
                    className="register-core-input"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="register-field">
                <label className="register-label" htmlFor="reg-phone">
                  Philippine Mobile Number
                </label>
                <div
                  className={`register-input-container ${focusedField === "phone" ? "register-input-focused" : ""}`}
                >
                  <div className="register-prefix-pill" title="Philippines (+63)">
                    <span style={{ fontSize: "0.95rem" }}>🇵🇭</span>
                    <span style={{ color: "#38bdf8", fontWeight: 700 }}>+63</span>
                  </div>
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    required
                    placeholder="09XXXXXXXXX or 9XXXXXXXXX"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (error) setError(null);
                    }}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    className="register-core-input"
                  />
                </div>
              </div>

              {/* Password & Confirm Password (Clean 2-column on desktop) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="register-field">
                  <label className="register-label" htmlFor="reg-pass">
                    Password
                  </label>
                  <div
                    className={`register-input-container ${focusedField === "pass" ? "register-input-focused" : ""}`}
                  >
                    <div className="register-input-icon">
                      <Lock size={15} />
                    </div>
                    <input
                      id="reg-pass"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min 6 chars"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocusedField("pass")}
                      onBlur={() => setFocusedField(null)}
                      className="register-core-input"
                    />
                  </div>
                </div>

                <div className="register-field">
                  <label className="register-label" htmlFor="reg-confirm">
                    Confirm
                  </label>
                  <div
                    className={`register-input-container ${focusedField === "confirm" ? "register-input-focused" : ""}`}
                  >
                    <input
                      id="reg-confirm"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Re-type"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      onFocus={() => setFocusedField("confirm")}
                      onBlur={() => setFocusedField(null)}
                      className="register-core-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                        padding: "0 10px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Email */}
              <div className="register-field">
                <div className="register-field-header">
                  <label className="register-label" htmlFor="reg-email">
                    Email Address
                  </label>
                  <span style={{ fontSize: "0.688rem", color: "#64748b" }}>Optional</span>
                </div>
                <div
                  className={`register-input-container ${focusedField === "email" ? "register-input-focused" : ""}`}
                >
                  <div className="register-input-icon">
                    <Mail size={16} />
                  </div>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    placeholder="resident@example.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="register-core-input"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="register-submit-btn"
                style={{ marginTop: "8px" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Dispatching SMS Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Mobile Verification</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              PHASE 2: OTP VERIFICATION
             ───────────────────────────────────────────────────────────────── */}
          {phase === "OTP" && (
            <div>
              {/* Dev mode 1-tap auto fill pill */}
              {devCode && (
                <div
                  onClick={() => {
                    setOtpCode(devCode);
                    handleVerifyAndRegister(devCode);
                  }}
                  className="register-demo-sms-tag"
                  title="Click to automatically fill demo OTP code"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Sparkles size={14} color="#34d399" />
                    <span style={{ fontSize: "0.775rem", fontWeight: 700, color: "#cbd5e1" }}>
                      Demo Code: <code style={{ color: "#34d399", fontWeight: 800 }}>{devCode}</code>
                    </span>
                  </div>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#38bdf8" }}>
                    Click to 1-Tap Fill
                  </span>
                </div>
              )}

              {/* Summary of resident details */}
              <div className="register-otp-phone-pill">
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.813rem", fontWeight: 700, color: "#f8fafc" }}>
                    {name}
                  </span>
                  <span style={{ fontSize: "0.725rem", color: "#94a3b8" }}>
                    Born {formattedBirthDate} ({calculatedAge} yrs) · {phone}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setPhase("DETAILS");
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#38bdf8",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  Edit
                </button>
              </div>

              {/* 6-Digit Otp Input Box */}
              <div style={{ margin: "16px 0 20px 0" }}>
                <OtpInput
                  length={6}
                  value={otpCode}
                  onChange={(val) => {
                    setOtpCode(val);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  onComplete={(completeCode) => handleVerifyAndRegister(completeCode)}
                  autoFocus={true}
                />
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => handleVerifyAndRegister()}
                disabled={loading || otpCode.length < 6}
                className="register-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Verifying & Creating Account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Verify & Create Account</span>
                  </>
                )}
              </button>

              {/* Secondary actions: Resend and Change Number */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "16px",
                  padding: "0 4px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setPhase("DETAILS");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    fontSize: "0.775rem",
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Back to details</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "transparent",
                    border: "none",
                    color: cooldown > 0 ? "#64748b" : "#38bdf8",
                    fontSize: "0.775rem",
                    fontWeight: 600,
                    cursor: cooldown > 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <RefreshCw size={12} className={loading ? "spin" : ""} />
                  <span>{cooldown > 0 ? `Resend (${cooldown}s)` : "Resend Code"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              PHASE 3: COMPLETE
             ───────────────────────────────────────────────────────────────── */}
          {phase === "COMPLETE" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "2px solid #10b981",
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                  boxShadow: "0 0 24px rgba(16, 185, 129, 0.35)",
                }}
              >
                <Check size={28} strokeWidth={2.5} />
              </div>

              <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 6px 0" }}>
                Registration Successful!
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 20px 0" }}>
                Welcome, <strong>{name}</strong>! Your BantayBarangay resident account is active.
              </p>

              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  textAlign: "left",
                  fontSize: "0.8rem",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "#94a3b8" }}>Mobile:</span>
                  <strong style={{ color: "#f8fafc" }}>{phone}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Date of Birth:</span>
                  <strong style={{ color: "#f8fafc" }}>{formattedBirthDate} (Age {calculatedAge})</strong>
                </div>
              </div>

              <NextLink
                href="/dashboard"
                className="register-submit-btn"
                style={{ textDecoration: "none" }}
              >
                <span>Proceed to Resident Dashboard</span>
                <ArrowRight size={16} />
              </NextLink>
            </div>
          )}

          {/* Footer Security Tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "0.65rem",
              color: "#64748b",
              marginTop: "20px",
              paddingTop: "14px",
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <Shield size={11} color="#0284c7" />
            <span>Official Civic Platform · 256-Bit SSL Encrypted · RA 10173</span>
          </div>
        </div>
      </main>
    </div>
  );
}
