"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Download, X, Share, PlusSquare, CheckCircle, Smartphone, Shield, Zap } from "lucide-react";

export default function AppInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
    return null;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running as installed standalone app
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      return isStandaloneMedia || isIosStandalone;
    };

    const standalone = checkStandalone();
    setIsStandalone(standalone);

    if (standalone) return; // Don't show prompts if already installed

    // Check if iOS
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPhone|iPad|iPod/i.test(ua);
    setIsIos(isIosDevice);

    // Check if dismissed previously in last 2 days
    const dismissedTime = localStorage.getItem("bantay_install_dismissed");
    if (!dismissedTime || Date.now() - parseInt(dismissedTime, 10) > 2 * 24 * 60 * 60 * 1000) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => {
        setBannerDismissed(false);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // Capture beforeinstallprompt event (Chrome, Android, Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setBannerDismissed(false);
    };

    // Listen for custom trigger from any button in the app (e.g. Navbar or Profile)
    const handleCustomTrigger = () => {
      if (isIosDevice) {
        setShowIosGuide(true);
      } else if (deferredPrompt) {
        promptInstall();
      } else {
        // Fallback info modal
        setShowIosGuide(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("trigger-app-install", handleCustomTrigger);

    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setBannerDismissed(true);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("trigger-app-install", handleCustomTrigger);
    };
  }, [deferredPrompt]);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      if (isIos) {
        setShowIosGuide(true);
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setBannerDismissed(true);
      setInstalledSuccess(true);
    }
  };

  const handleDismiss = () => {
    setBannerDismissed(true);
    localStorage.setItem("bantay_install_dismissed", Date.now().toString());
  };

  // If already standalone or successfully installed, don't show prompt banner
  if (isStandalone) return null;

  return (
    <>
      {/* 1. Installed Success Notification */}
      {installedSuccess && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: "calc(var(--bottom-nav-height, 64px) + 16px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            backgroundColor: "#059669",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "9999px",
            boxShadow: "0 10px 30px rgba(5, 150, 105, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 700,
            fontSize: "0.875rem",
          }}
        >
          <CheckCircle size={18} />
          <span>BantayBarangay App Installed Successfully!</span>
        </div>
      )}

      {/* 2. Floating Mobile Install Card / Bottom Sheet Banner */}
      {!bannerDismissed && (
        <aside
          aria-label="Install BantayBarangay application"
          className="install-app-banner"
          style={{
            position: "fixed",
            bottom: "calc(var(--bottom-nav-height, 64px) + 14px)",
            left: "14px",
            right: "14px",
            maxWidth: "460px",
            margin: "0 auto",
            zIndex: 44,
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1.5px solid rgba(56, 189, 248, 0.3)",
            borderRadius: "22px",
            padding: "16px 18px",
            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(2, 132, 199, 0.2)",
            color: "#ffffff",
            animation: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            {/* App Icon */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                overflow: "hidden",
                flexShrink: 0,
                border: "1.5px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              }}
            >
              <img
                src="/icon-192x192.png?v=2"
                alt="BantayBarangay Icon"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h4 style={{ fontSize: "0.938rem", fontWeight: 800, margin: 0, color: "#f8fafc" }}>
                  Install BantayBarangay App
                </h4>
                <button
                  type="button"
                  onClick={handleDismiss}
                  aria-label="Close install prompt"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "4px 0 12px 0", lineHeight: 1.4 }}>
                Install on your home screen for offline reporting, faster loading, and immediate emergency hotline access.
              </p>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {isIos ? (
                  <button
                    type="button"
                    onClick={() => setShowIosGuide(true)}
                    style={{
                      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "9999px",
                      fontSize: "0.813rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 12px rgba(2, 132, 199, 0.4)",
                    }}
                  >
                    <Smartphone size={14} />
                    <span>How to Install</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={promptInstall}
                    style={{
                      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 18px",
                      borderRadius: "9999px",
                      fontSize: "0.813rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 12px rgba(2, 132, 199, 0.4)",
                    }}
                  >
                    <Download size={14} />
                    <span>Install App</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDismiss}
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#cbd5e1",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "9999px",
                    fontSize: "0.813rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 3. iOS Safari "Add to Home Screen" Instruction Modal */}
      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowIosGuide(false)}
        >
          <div
            style={{
              backgroundColor: "#1e293b",
              borderRadius: "24px",
              padding: "28px 24px",
              maxWidth: "400px",
              width: "100%",
              color: "#f8fafc",
              border: "1px solid #334155",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img
                  src="/icon-192x192.png?v=2"
                  alt="App icon"
                  style={{ width: "36px", height: "36px", borderRadius: "10px" }}
                />
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, margin: 0 }}>Install on iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "20px", lineHeight: 1.5 }}>
              Install BantayBarangay as a standalone app on your Apple home screen in 2 simple taps:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.05)", padding: "12px 14px", borderRadius: "14px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--primary, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                  <Share size={18} />
                </div>
                <div style={{ fontSize: "0.875rem" }}>
                  <strong>Step 1:</strong> Tap the <strong>Share</strong> button in Safari toolbar.
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.05)", padding: "12px 14px", borderRadius: "14px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--primary, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                  <PlusSquare size={18} />
                </div>
                <div style={{ fontSize: "0.875rem" }}>
                  <strong>Step 2:</strong> Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="btn btn-primary"
              style={{ width: "100%", padding: "12px", borderRadius: "12px", fontWeight: 700 }}
            >
              Got It
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
