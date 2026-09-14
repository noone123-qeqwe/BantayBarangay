"use client";

import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, Sparkles, X, ArrowRight, ShieldCheck, Check, Loader2 } from "lucide-react";

interface VersionInfo {
  version: string;
  build: string;
  releaseNotes?: string;
}

export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  // 1. Check Service Worker Updates
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let swRegistration: ServiceWorkerRegistration | null = null;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        swRegistration = registration;

        // Check if a worker is already waiting in background
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        // Listen for new service worker installation
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
            }
          });
        });

        // Periodic background update check (every 5 minutes)
        const updateInterval = setInterval(() => {
          try {
            registration.update();
          } catch {
            // Ignore background check failure
          }
        }, 5 * 60 * 1000);

        return () => clearInterval(updateInterval);
      } catch (err) {
        console.warn("ServiceWorker registration error:", err);
      }
    };

    window.addEventListener("load", registerSW);

    // Reload smoothly when the service worker changes controller
    let isReloading = false;
    const handleControllerChange = () => {
      if (!isReloading) {
        isReloading = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Background update check on tab visibility regain
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && swRegistration) {
        try {
          swRegistration.update();
        } catch {
          // Ignore
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("load", registerSW);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 2. Periodic Build/Version API Poller (covers non-SW and private modes)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let initialBuild: string | null = null;

    const checkAppVersion = async () => {
      try {
        const res = await fetch("/api/version", {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        });
        if (!res.ok) return;

        const data: VersionInfo = await res.json();
        setVersionInfo(data);

        if (!initialBuild) {
          initialBuild = data.build;
        } else if (initialBuild !== data.build) {
          // New build deployed on the server
          setUpdateAvailable(true);
        }
      } catch {
        // Silently fail network check
      }
    };

    // Initial check
    checkAppVersion();

    // Check every 3 minutes
    const versionInterval = setInterval(checkAppVersion, 3 * 60 * 1000);

    // Check when user refocuses the app/tab
    const onFocus = () => checkAppVersion();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(versionInterval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // 3. Custom Event listener for testing and manual triggers
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleManualPrompt = (e: any) => {
      setDismissed(false);
      setUpdateAvailable(true);
      if (e?.detail) {
        setVersionInfo(e.detail);
      }
    };

    window.addEventListener("bantay:simulate-update", handleManualPrompt);
    return () => {
      window.removeEventListener("bantay:simulate-update", handleManualPrompt);
    };
  }, []);

  // 4. Handle User Refresh Action
  const handleApplyUpdate = useCallback(() => {
    setIsRefreshing(true);

    try {
      // Clear any session storage markers
      sessionStorage.removeItem("bantay_update_dismissed");

      if (waitingWorker) {
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
      }

      // Refresh page with cache-busting reload
      setTimeout(() => {
        window.location.reload();
      }, 350);
    } catch {
      window.location.reload();
    }
  }, [waitingWorker]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("bantay_update_dismissed", "true");
    } catch {
      // Ignore
    }
  };

  // Don't render if no update is available or dismissed
  if (!updateAvailable || dismissed) {
    return null;
  }

  const displayVersion = versionInfo?.version ? `v${versionInfo.version}` : "v2.4.0";
  const releaseNotes =
    versionInfo?.releaseNotes ||
    "A new version of BantayBarangay is ready with performance upgrades, authentication stability fixes, and design improvements.";

  return (
    <aside
      role="dialog"
      aria-live="polite"
      aria-label="New update available"
      className="update-popover-wrapper"
    >
      <div className="update-popover-card">
        {/* Top Edge Specular Glow */}
        <div className="popover-top-shine" aria-hidden="true" />

        <div className="popover-header">
          <div className="popover-badge-group">
            <div className="popover-icon-circle">
              <Sparkles size={16} className="sparkle-icon" />
            </div>
            <div className="update-tag-pill">
              <span className="live-status-dot" />
              <span>Update Ready · {displayVersion}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss update notification"
            className="popover-close-btn"
          >
            <X size={15} />
          </button>
        </div>

        <div className="popover-content">
          <h2 className="popover-title">New Update Available</h2>
          <p className="popover-desc">{releaseNotes}</p>

          <div className="popover-benefit-pill">
            <Check size={13} className="benefit-check" />
            <span>Instant reload · Preserves your data & sign-in</span>
          </div>
        </div>

        <div className="popover-actions">
          <button
            type="button"
            onClick={handleApplyUpdate}
            disabled={isRefreshing}
            className="popover-btn-primary"
          >
            {isRefreshing ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Reloading App...</span>
              </>
            ) : (
              <>
                <RefreshCw size={15} className="refresh-icon" />
                <span>Refresh & Apply Update</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            disabled={isRefreshing}
            className="popover-btn-secondary"
          >
            Later
          </button>
        </div>
      </div>

      <style jsx>{`
        .update-popover-wrapper {
          position: fixed;
          z-index: 99999;
          left: 14px;
          right: 14px;
          bottom: calc(var(--bottom-nav-height, 64px) + 14px);
          max-width: 440px;
          margin: 0 auto;
          animation: popoverSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
          pointer-events: auto;
        }

        @keyframes popoverSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .update-popover-card {
          width: 100%;
          background: linear-gradient(180deg, rgba(14, 22, 42, 0.96) 0%, rgba(8, 14, 28, 0.98) 100%);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(56, 189, 248, 0.35);
          border-radius: 20px;
          box-shadow: 
            0 24px 60px -12px rgba(0, 0, 0, 0.85),
            0 0 35px -5px rgba(2, 132, 199, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          padding: 18px 18px 16px 18px;
          position: relative;
          overflow: hidden;
        }

        .popover-top-shine {
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.8), #ffffff, rgba(56, 189, 248, 0.8), transparent);
          pointer-events: none;
        }

        .popover-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .popover-badge-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .popover-icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(16, 185, 129, 0.18) 100%);
          border: 1px solid rgba(56, 189, 248, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #38bdf8;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
        }

        .sparkle-icon {
          animation: pulseIcon 2s infinite ease-in-out;
        }

        @keyframes pulseIcon {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.85; }
        }

        .update-tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          border-radius: 9999px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          font-size: 0.7rem;
          font-weight: 700;
          color: #7dd3fc;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .live-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px #34d399;
          animation: liveDotPulse 1.8s infinite ease-in-out;
        }

        @keyframes liveDotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.85); opacity: 0.5; }
        }

        .popover-close-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          border: none;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .popover-close-btn:hover {
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.14);
        }

        .popover-content {
          margin-bottom: 14px;
        }

        .popover-title {
          font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
          font-size: 1.125rem;
          font-weight: 800;
          color: #f8fafc;
          margin: 0 0 5px 0;
          letter-spacing: -0.02em;
          line-height: 1.25;
        }

        .popover-desc {
          font-size: 0.813rem;
          color: #94a3b8;
          line-height: 1.45;
          margin: 0 0 10px 0;
        }

        .popover-benefit-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          font-size: 0.725rem;
          font-weight: 600;
          color: #34d399;
        }

        .benefit-check {
          color: #34d399;
          flex-shrink: 0;
        }

        .popover-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .popover-btn-primary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 55%, #1d4ed8 100%);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.25),
            0 8px 20px -4px rgba(37, 99, 235, 0.45);
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          touch-action: manipulation;
        }

        .popover-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            0 10px 24px -4px rgba(37, 99, 235, 0.6);
          background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 55%, #1e40af 100%);
        }

        .popover-btn-primary:active:not(:disabled) {
          transform: scale(0.98);
        }

        .popover-btn-primary:disabled {
          opacity: 0.8;
          cursor: not-allowed;
        }

        .refresh-icon {
          transition: transform 0.4s ease;
        }

        .popover-btn-primary:hover .refresh-icon {
          transform: rotate(180deg);
        }

        .spin-icon {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .popover-btn-secondary {
          padding: 0 16px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .popover-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        /* Desktop Viewports */
        @media (min-width: 641px) {
          .update-popover-wrapper {
            left: auto;
            right: 24px;
            bottom: 24px;
            width: 390px;
          }
        }
      `}</style>
    </aside>
  );
}
