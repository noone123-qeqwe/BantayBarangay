"use client";

import React, { useEffect, useState, useCallback } from "react";

export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const dismiss = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
    }, 350);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    // Check if splash screen was already displayed in this tab session
    const seen = sessionStorage.getItem("bb_splash_seen");
    if (seen) {
      return;
    }

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sessionStorage.setItem("bb_splash_seen", "true");
    setVisible(true);

    // Fast, elegant duration: 1.3s display, then 0.35s fade out (~1.65s total)
    const fadeTimer = setTimeout(() => {
      setClosing(true);
    }, prefersReducedMotion ? 600 : 1350);

    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, prefersReducedMotion ? 750 : 1700);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        dismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dismiss]);

  if (!mounted || !visible) return null;

  return (
    <div
      className={`splash-overlay ${closing ? "splash-closing" : ""}`}
      onClick={dismiss}
      role="dialog"
      aria-label="Welcome to BantayBarangay"
      aria-modal="true"
    >
      <div className="splash-ambient-glow" aria-hidden="true" />

      <div className="splash-content">
        <div className="splash-logo-wrap">
          <img
            src="/logo.png"
            alt="BantayBarangay Logo"
            className="splash-logo"
            width={88}
            height={88}
          />
        </div>

        <div className="splash-brand-wrap">
          <span className="splash-title">BantayBarangay</span>
          <span className="splash-accent-line" aria-hidden="true" />
        </div>

        <p className="splash-subtitle">Civic Infrastructure & Public Service</p>

        <p className="splash-tagline">“Simple. Secure. Connected.”</p>
      </div>
    </div>
  );
}
