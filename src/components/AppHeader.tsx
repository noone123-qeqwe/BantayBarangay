"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import NextLink from "next/link";
import { ArrowLeft, WifiOff, PhoneCall, Shield, Maximize, Minimize } from "lucide-react";

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone = () => {
      const isMedia =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches;
      const isIos = (window.navigator as any).standalone === true;
      return isMedia || isIos;
    };

    setIsStandalone(checkStandalone());
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("fullscreenchange", handleFsChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
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

  // Determine screen title
  const getScreenTitle = () => {
    if (pathname === "/dashboard") return "BantayBarangay";
    if (pathname === "/map") return "Community Map";
    if (pathname === "/reports") return "Civic Reports";
    if (pathname === "/reports/new") return "Report an Issue";
    if (pathname.startsWith("/reports/")) return "Report Details";
    if (pathname === "/notifications") return "Notifications";
    if (pathname === "/profile") return "My Profile";
    if (pathname === "/login") return "Sign In";
    if (pathname === "/register") return "Register";
    return "BantayBarangay";
  };

  // Do not render on auth pages or landing to avoid duplicate stacked headers
  const isAuthPage = ["/login", "/register", "/forgot-password", "/"].includes(pathname);
  if (isAuthPage) return null;

  // Only render in standalone app mode to provide the dedicated App Bar
  if (!isStandalone) return null;

  const isSubPage = ["/reports/new", "/notifications", "/profile"].includes(pathname) || pathname.startsWith("/reports/");

  return (
    <header
      className="standalone-app-header"
      style={{
        position: "sticky",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        color: "#ffffff",
        paddingTop: "env(safe-area-inset-top, 0px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div
        style={{
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          maxWidth: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isSubPage ? (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <NextLink
              href="/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                color: "#ffffff",
              }}
            >
              <img
                src="/icon-192x192.png?v=2"
                alt="Logo"
                style={{ width: "28px", height: "28px", borderRadius: "8px" }}
              />
            </NextLink>
          )}

          <h1 style={{ fontSize: "1.063rem", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
            {getScreenTitle()}
          </h1>
        </div>

        {/* Right Action Icons: Offline indicator & Emergency quick-dial */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!isOnline && (
            <span
              title="Offline Mode"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                fontSize: "0.688rem",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "9999px",
              }}
            >
              <WifiOff size={11} />
              <span>Offline</span>
            </span>
          )}

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: isFullscreen ? "var(--primary, #38bdf8)" : "#cbd5e1",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>

          <a
            href="tel:0286431111"
            title="Call Pasig Emergency Hotline"
            style={{
              backgroundColor: "rgba(220, 38, 38, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              color: "#fca5a5",
              borderRadius: "9999px",
              padding: "5px 10px",
              fontSize: "0.75rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <PhoneCall size={12} />
            <span>Hotline</span>
          </a>
        </div>
      </div>
    </header>
  );
}
