"use client";

import React, { useState, useEffect, useMemo } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import OtpInput from "@/components/OtpInput";
import {
  ShieldAlert,
  User,
  Calendar,
  Smartphone,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Edit3,
} from "lucide-react";
import confetti from "canvas-confetti";

type RegisterStep = "PERSONAL" | "MOBILE" | "OTP" | "SETUP" | "COMPLETE";

export default function RegisterPage() {
  const { register, user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<RegisterStep>("PERSONAL");

  // Step 1: Personal Information
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // Step 2: Mobile Number
  const [phone, setPhone] = useState("");

  // Step 3: OTP Verification
  const [otpCode, setOtpCode] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  // Step 4: Account Setup
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState(""); // optional

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Today's date formatted as YYYY-MM-DD for datepicker max attribute
  const todayFormatted = useMemo(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Automatic Age Calculation from Date of Birth
  // ─────────────────────────────────────────────────────────────────────────
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

  // Formatted display for birth date (e.g. "March 15, 1998")
  const formattedBirthDate = useMemo(() => {
    if (!birthDate) return "";
    const dob = new Date(birthDate + "T00:00:00");
    if (isNaN(dob.getTime())) return "";
    return dob.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [birthDate]);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Submit Personal Information
  // ─────────────────────────────────────────────────────────────────────────
  const handleStep1Personal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!birthDate) {
      setError("Please select your date of birth.");
      return;
    }

    const dob = new Date(birthDate);
    const today = new Date();
    if (dob > today) {
      setError("Date of birth cannot be in the future.");
      return;
    }

    if (calculatedAge === null || calculatedAge < 0 || calculatedAge > 125) {
      setError("Please enter a valid date of birth.");
      return;
    }

    setError(null);
    setStep("MOBILE");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Submit Mobile Number & Dispatch OTP
  // ─────────────────────────────────────────────────────────────────────────
  const handleStep2Mobile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Please enter your mobile phone number.");
      return;
    }

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
        setError(data.error || "Failed to send verification code.");
        if (data.cooldownSeconds) {
          setCooldown(data.cooldownSeconds);
        }
        setLoading(false);
        return;
      }

      setMaskedPhone(data.maskedPhone || phone);
      setCooldown(data.cooldownSeconds || 60);
      if (data.devCode) {
        setDevCode(data.devCode);
      }
      setOtpCode("");
      setStep("OTP");
    } catch (err: any) {
      setError(err.message || "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Resend OTP
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
        setError(data.error || "Failed to resend verification code.");
        if (data.cooldownSeconds) {
          setCooldown(data.cooldownSeconds);
        }
      } else {
        setCooldown(data.cooldownSeconds || 60);
        if (data.devCode) {
          setDevCode(data.devCode);
        }
        setOtpCode("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Verify OTP
  // ─────────────────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (code.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          code,
          purpose: "REGISTRATION",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid verification code.");
        setLoading(false);
        return;
      }

      setVerificationToken(data.verificationToken);
      setStep("SETUP");
    } catch (err: any) {
      setError(err.message || "Failed to verify code.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Complete Account Setup
  // ─────────────────────────────────────────────────────────────────────────
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationToken) {
      setError("Mobile verification session expired. Please verify your mobile number again.");
      setStep("MOBILE");
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

    setError(null);
    setLoading(true);

    const result = await register({
      name: name.trim(),
      birthDate,
      age: calculatedAge ?? 0,
      phone: phone.trim(),
      password,
      verificationToken,
      email: email.trim() || undefined,
    });

    if (result.success) {
      setStep("COMPLETE");
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti optional
      }
      setTimeout(() => {
        router.push("/dashboard");
      }, 2200);
    } else {
      setError(result.error || "Registration failed.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - var(--header-height))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
        backgroundColor: "var(--bg-app)",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "500px",
          width: "100%",
          padding: "36px 28px",
          boxShadow: "var(--shadow-xl)",
          border: "1.5px solid var(--border-medium)",
          borderRadius: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Official Application Logo & Branding */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src="/logo.png"
            alt="BantayBarangay Official Logo"
            width={58}
            height={58}
            style={{
              width: "58px",
              height: "58px",
              borderRadius: "16px",
              margin: "0 auto 10px auto",
              display: "block",
              boxShadow: "0 6px 20px rgba(2, 132, 199, 0.35)",
              objectFit: "contain",
            }}
          />
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Bantay<span style={{ color: "var(--primary)" }}>Barangay</span>
          </span>
          <p style={{ fontSize: "0.813rem", color: "var(--text-muted)", margin: "3px 0 0 0" }}>
            Resident Registration Portal
          </p>
        </div>

        {/* 5-Step Visual Progression Wizard */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
            padding: "0 4px",
          }}
        >
          {[
            { id: "PERSONAL", label: "Personal", num: 1 },
            { id: "MOBILE", label: "Mobile", num: 2 },
            { id: "OTP", label: "Verify", num: 3 },
            { id: "SETUP", label: "Security", num: 4 },
          ].map((s, idx) => {
            const stepOrder: Record<RegisterStep, number> = {
              PERSONAL: 1,
              MOBILE: 2,
              OTP: 3,
              SETUP: 4,
              COMPLETE: 5,
            };
            const currentStepNum = stepOrder[step];
            const isDone = currentStepNum > s.num;
            const isCurrent = currentStepNum === s.num;

            return (
              <React.Fragment key={s.id}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      backgroundColor: isDone
                        ? "var(--success)"
                        : isCurrent
                        ? "var(--primary)"
                        : "var(--bg-subtle)",
                      color: isDone || isCurrent ? "#ffffff" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      border: isCurrent ? "2px solid rgba(37, 99, 235, 0.3)" : "none",
                      boxShadow: isCurrent ? "0 0 0 3px rgba(37, 99, 235, 0.15)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isDone ? <CheckCircle2 size={15} /> : s.num}
                  </div>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? "var(--primary)" : "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {s.label}
                  </span>
                </div>

                {idx < 3 && (
                  <div
                    style={{
                      flex: 1,
                      height: "2px",
                      backgroundColor: currentStepNum > idx + 1 ? "var(--success)" : "var(--border-medium)",
                      margin: "0 6px 14px 6px",
                      transition: "background-color 0.3s ease",
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error Alert Box */}
        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "12px 14px",
              backgroundColor: "var(--danger-light)",
              color: "var(--danger-dark)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.875rem",
              marginBottom: "20px",
              fontWeight: 500,
              lineHeight: 1.4,
              border: "1px solid rgba(220, 38, 38, 0.2)",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 1: PERSONAL INFORMATION                                        */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {step === "PERSONAL" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 800 }}>Personal Information</h1>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Step 1 of 5: Enter your basic details to register as a resident
              </p>
            </div>

            <form onSubmit={handleStep1Personal}>
              <div className="form-group">
                <label className="form-label" htmlFor="full-name">
                  Full Name
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "12px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <User size={18} />
                  </div>
                  <input
                    id="full-name"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Juan Dela Cruz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: "38px" }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="birth-date">
                  Date of Birth
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "12px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Calendar size={18} />
                  </div>
                  <input
                    id="birth-date"
                    type="date"
                    max={todayFormatted}
                    className="form-control"
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      if (error) setError(null);
                    }}
                    style={{ paddingLeft: "38px" }}
                    required
                  />
                </div>
              </div>

              {/* Automatic Age Calculation Card */}
              {birthDate && calculatedAge !== null && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: "rgba(37, 99, 235, 0.08)",
                    border: "1.5px solid rgba(37, 99, 235, 0.2)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "20px",
                    animation: "fadeIn 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "var(--primary)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.875rem",
                      }}
                    >
                      {calculatedAge}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Age (Automatically Calculated)
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                        {calculatedAge} years old
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.688rem",
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: "9999px",
                      backgroundColor: "var(--success)",
                      color: "#ffffff",
                    }}
                  >
                    Verified Date
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: "10px" }}
              >
                <span>Continue to Mobile Number</span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <NextLink href="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>
                Sign In
              </NextLink>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 2: MOBILE NUMBER                                               */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {step === "MOBILE" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px auto",
                  boxShadow: "0 6px 16px rgba(2, 132, 199, 0.35)",
                }}
              >
                <Smartphone size={24} />
              </div>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 800 }}>Enter your mobile number</h1>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                We'll send a verification code to this number.
              </p>
            </div>

            {/* Step 1 Personal Summary Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-medium)",
                marginBottom: "20px",
              }}
            >
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>{name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Born {formattedBirthDate} • {calculatedAge} years old
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("PERSONAL");
                }}
                className="btn btn-sm btn-ghost"
                style={{ fontSize: "0.75rem", padding: "4px 8px" }}
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            </div>

            <form onSubmit={handleStep2Mobile}>
              <div className="form-group">
                <label className="form-label" htmlFor="mobile-phone">
                  Mobile Number
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      paddingRight: "8px",
                      borderRight: "1px solid var(--border-medium)",
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      userSelect: "none",
                    }}
                  >
                    <span>🇵🇭</span>
                    <span>+63</span>
                  </div>
                  <input
                    id="mobile-phone"
                    type="tel"
                    inputMode="tel"
                    className="form-control"
                    placeholder="917 123 4567 or 09XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ paddingLeft: "82px" }}
                    required
                  />
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                  Support <strong>09XXXXXXXXX</strong> and <strong>+639XXXXXXXXX</strong>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: "14px" }}
              >
                {loading ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
                <span>{loading ? "Sending SMS Code..." : "Send Verification Code"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("PERSONAL");
                }}
                className="btn btn-secondary"
                style={{ width: "100%", marginTop: "10px" }}
              >
                <ArrowLeft size={16} />
                <span>Back to Personal Information</span>
              </button>
            </form>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 3: OTP VERIFICATION                                            */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {step === "OTP" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px auto",
                  boxShadow: "0 6px 16px rgba(37, 99, 235, 0.35)",
                }}
              >
                <KeyRound size={24} />
              </div>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 800 }}>Verify your mobile number</h1>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "6px" }}>
                We sent a 6-digit verification code to <strong>{maskedPhone}</strong>
              </p>
            </div>

            {/* In dev mode: quick clickable demo code */}
            {devCode && (
              <div
                onClick={() => {
                  setOtpCode(devCode);
                  handleVerifyOtp(devCode);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px dashed var(--success)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "16px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={16} color="var(--success)" />
                  <span style={{ fontSize: "0.813rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Demo SMS Code: <code style={{ fontSize: "0.938rem", fontWeight: 800, color: "var(--success)" }}>{devCode}</code>
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>
                  Click to Auto-Fill
                </span>
              </div>
            )}

            <div style={{ margin: "16px 0" }}>
              <OtpInput
                length={6}
                value={otpCode}
                onChange={(val) => {
                  setOtpCode(val);
                  if (error) setError(null);
                }}
                disabled={loading}
                onComplete={(completeCode) => handleVerifyOtp(completeCode)}
              />
            </div>

            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={loading || otpCode.length < 6}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: "12px" }}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <CheckCircle2 size={18} />}
              <span>{loading ? "Verifying..." : "Verify OTP"}</span>
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "20px",
                fontSize: "0.875rem",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("MOBILE");
                }}
                className="btn btn-sm btn-ghost"
                style={{ color: "var(--text-muted)" }}
              >
                <ArrowLeft size={14} />
                <span>Change Mobile Number</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || loading}
                className="btn btn-sm btn-outline"
                style={{
                  color: cooldown > 0 ? "var(--text-muted)" : "var(--primary)",
                  cursor: cooldown > 0 ? "not-allowed" : "pointer",
                }}
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} />
                <span>{cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 4: ACCOUNT SETUP (PASSWORD)                                    */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {step === "SETUP" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px auto",
                  boxShadow: "0 6px 16px rgba(16, 185, 129, 0.35)",
                }}
              >
                <Lock size={24} />
              </div>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 800 }}>Account Setup</h1>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Step 4 of 5: Create a password to protect your resident account
              </p>
            </div>

            {/* Mobile Number Verified Banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderRadius: "var(--radius-md)",
                marginBottom: "20px",
                fontSize: "0.875rem",
                color: "var(--success)",
                fontWeight: 700,
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
            >
              <CheckCircle2 size={18} />
              <span>Mobile number verified ✓ ({maskedPhone})</span>
            </div>

            <form onSubmit={handleCompleteRegistration}>
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  placeholder="optional@example.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Optional for receiving notifications or recovery. Not required to register.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: "14px" }}
              >
                {loading ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <img
                    src="/logo.png"
                    alt="Logo"
                    width={18}
                    height={18}
                    style={{ borderRadius: "4px", objectFit: "contain", verticalAlign: "middle" }}
                  />
                )}
                <span>{loading ? "Creating Account..." : "Complete Registration"}</span>
              </button>
            </form>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 5: REGISTRATION COMPLETE                                       */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {step === "COMPLETE" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <img
              src="/logo.png"
              alt="BantayBarangay Official Logo"
              width={72}
              height={72}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "20px",
                margin: "0 auto 16px auto",
                display: "block",
                boxShadow: "0 8px 24px rgba(2, 132, 199, 0.4)",
                objectFit: "contain",
              }}
            />
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                backgroundColor: "var(--success-light)",
                color: "var(--success)",
                borderRadius: "9999px",
                fontSize: "0.813rem",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              <CheckCircle2 size={14} />
              <span>Registration Complete</span>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Registration Successful!</h2>
            <p style={{ fontSize: "0.938rem", color: "var(--text-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
              Your BantayBarangay account has been created.
            </p>

            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "var(--radius-md)",
                textAlign: "left",
                fontSize: "0.875rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Resident:</span>
                <strong>{name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-muted)" }}>Date of Birth:</span>
                <strong>{formattedBirthDate} (Age {calculatedAge})</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Mobile Number:</span>
                <strong>{phone}</strong>
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <NextLink href="/dashboard" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
                <span>Proceed to Dashboard</span>
                <ArrowRight size={18} />
              </NextLink>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
