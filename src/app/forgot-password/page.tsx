"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import OtpInput from "@/components/OtpInput";
import {
  ShieldAlert,
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
} from "lucide-react";

type ForgotStep = "PHONE" | "OTP" | "NEW_PASSWORD" | "SUCCESS";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotStep>("PHONE");

  // Step 1: Phone
  const [phone, setPhone] = useState("");

  // Step 2: OTP
  const [otpCode, setOtpCode] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  // Step 3: Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 1: Send Password Reset OTP
  // ───────────────────────────────────────────────────────────────────────────
  const handleSendResetOtp = async (e: React.FormEvent) => {
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
          purpose: "PASSWORD_RESET",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset code.");
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
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 2: Resend OTP
  // ───────────────────────────────────────────────────────────────────────────
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
          purpose: "PASSWORD_RESET",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
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

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 2: Verify OTP
  // ───────────────────────────────────────────────────────────────────────────
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
          purpose: "PASSWORD_RESET",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid verification code.");
        setLoading(false);
        return;
      }

      setVerificationToken(data.verificationToken);
      setStep("NEW_PASSWORD");
    } catch (err: any) {
      setError(err.message || "Failed to verify code.");
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 3: Submit New Password
  // ───────────────────────────────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationToken) {
      setError("Session expired. Please request a new verification code.");
      setStep("PHONE");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationToken,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        setLoading(false);
        return;
      }

      setStep("SUCCESS");
    } catch (err: any) {
      setError(err.message || "Network error while resetting password.");
    } finally {
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
          maxWidth: "480px",
          width: "100%",
          padding: "36px 28px",
          boxShadow: "var(--shadow-xl)",
          border: "1.5px solid var(--border-medium)",
          borderRadius: "20px",
        }}
      >
        {/* Error Alert */}
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
              border: "1px solid rgba(220, 38, 38, 0.2)",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 1: ENTER MOBILE NUMBER                                         */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {step === "PHONE" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <img
                src="/logo.png"
                alt="BantayBarangay Official Logo"
                width={64}
                height={64}
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "18px",
                  margin: "0 auto 16px auto",
                  display: "block",
                  boxShadow: "0 8px 24px rgba(2, 132, 199, 0.35)",
                  objectFit: "contain",
                }}
              />
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Forgot Password</h1>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "6px" }}>
                Enter the mobile number associated with your account.
              </p>
            </div>

            <form onSubmit={handleSendResetOtp}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-phone">
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
                    id="reset-phone"
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
                  We will send a 6-digit verification code to this mobile number
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: "14px" }}
              >
                {loading ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
                <span>{loading ? "Sending Code..." : "Send Verification Code"}</span>
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Remember your password?{" "}
              <NextLink href="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>
                Sign In
              </NextLink>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 2: VERIFY OTP                                                  */}
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
                We sent a verification code to your mobile number <strong>{maskedPhone}</strong>
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
              <span>{loading ? "Verifying..." : "Verify Code"}</span>
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
                  setStep("PHONE");
                }}
                className="btn btn-sm btn-ghost"
                style={{ color: "var(--text-muted)" }}
              >
                <ArrowLeft size={14} />
                <span>Change Number</span>
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
                <span>{cooldown > 0 ? `Resend (${cooldown}s)` : "Resend Code"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 3: CREATE NEW PASSWORD                                         */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {step === "NEW_PASSWORD" && (
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
              <h1 style={{ fontSize: "1.375rem", fontWeight: 800 }}>Create New Password</h1>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Set a new password for account <strong>{maskedPhone}</strong>
              </p>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmNewPassword">
                  Confirm New Password
                </label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  className="form-control"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: "14px" }}
              >
                {loading ? <Loader2 size={18} className="spin" /> : <CheckCircle2 size={18} />}
                <span>{loading ? "Resetting Password..." : "Reset Password"}</span>
              </button>
            </form>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 4: SUCCESS CONFIRMATION                                        */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {step === "SUCCESS" && (
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
              <span>Password Reset</span>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Password Reset!</h2>
            <p style={{ fontSize: "0.938rem", color: "var(--text-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
              Your password has been successfully updated. You can now sign in using your mobile number and new password.
            </p>
            <div style={{ marginTop: "24px" }}>
              <NextLink href="/login" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
                <span>Proceed to Sign In</span>
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
