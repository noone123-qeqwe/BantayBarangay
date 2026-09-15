"use client";

import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw, Sparkles, X, Check, Loader2 } from "lucide-react";

interface VersionInfo {
  version: string;
  build: string;
  releaseNotes?: string;
}

const CURRENT_EXPECTED_CACHE = "bantay-app-v5-20260915";

export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  // 1. Purge legacy caches and Register Service Worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Clean up older caches immediately
    if ("caches" in window) {
      caches.keys().then((keys) => {
        const staleKeys = keys.filter((k) => k !== CURRENT_EXPECTED_CACHE);
        if (staleKeys.length > 0) {
          Promise.all(staleKeys.map((k) => caches.delete(k)));
        }
      });
    }

    let swRegistration: ServiceWorkerRegistration | null = null;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        swRegistration = registration;

        // Force an immediate update check from the server
        try {
          await registration.update();
        } catch {
          // Ignore network glitch during update check
        }

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

        // Periodic background update check (every 3 minutes)
        const updateInterval = setInterval(() => {
          try {
            registration.update();
          } catch {
            // Ignore background check failure
          }
        }, 3 * 60 * 1000);

        return () => clearInterval(updateInterval);
      } catch (err) {
        console.warn("ServiceWorker registration error:", err);
      }
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
    }

    // Reload smoothly when the service worker changes controller
    let isReloading = false;
    const handleControllerChange = () => {
      if (!isReloading) {
        isReloading = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Background update check on tab/app visibility regain
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

  // 2. Periodic Build/Version API Poller (covers PWA standalone mode)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let initialBuild: string | null = null;

    const checkAppVersion = async () => {
      try {
        const res = await fetch("/api/version", {
          cache: "no-store",
          headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
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

    // Check every 2 minutes
    const versionInterval = setInterval(checkAppVersion, 2 * 60 * 1000);

    // Check when user refocuses the app
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
  const handleApplyUpdate = useCallback(async () => {
    setIsRefreshing(true);

    try {
      sessionStorage.removeItem("bantay_update_dismissed");

      // Wipe client caches directly
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      if (waitingWorker) {
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
        waitingWorker.postMessage({ type: "CLEAR_ALL_CACHES" });
      }

      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
        }
      }

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

  const displayVersion = versionInfo?.version ? `v${versionInfo.version}` : "v2.5.0";
  const releaseNotes =
    versionInfo?.releaseNotes ||
    "A clean obsidian redesign for login, registration, and dashboard is ready. Tap refresh to update instantly.";

  return (
    <aside
      role="dialog"
      aria-live="polite"
      aria-label="New update available"
      style={{
        position: "fixed",
        zIndex: 999999,
        left: "16px",
        right: "16px",
        bottom: "calc(var(--bottom-nav-height, 64px) + 16px)",
        maxWidth: "440px",
        margin: "0 auto",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(8, 13, 26, 0.99) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1.5px solid rgba(56, 189, 248, 0.35)",
          borderRadius: "20px",
          padding: "18px 20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          color: "#f8fafc",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #0284c7 0%, #10b981 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <Sparkles size={15} />
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 9px",
                borderRadius: "9999px",
                fontSize: "0.725rem",
                fontWeight: 700,
                color: "#38bdf8",
                background: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#34d399",
                  boxShadow: "0 0 6px #34d399",
                }}
              />
              <span>Update Ready · {displayVersion}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss update notification"
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div>
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: "#f8fafc",
              margin: "0 0 4px 0",
            }}
          >
            New Update Available
          </h2>
          <p
            style={{
              fontSize: "0.825rem",
              color: "#cbd5e1",
              lineHeight: 1.4,
              margin: "0 0 10px 0",
            }}
          >
            {releaseNotes}
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.75rem",
              color: "#34d399",
              fontWeight: 600,
            }}
          >
            <Check size={14} />
            <span>Instant reload · Preserves your data & sign-in</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
          <button
            type="button"
            onClick={handleApplyUpdate}
            disabled={isRefreshing}
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0284c7 0%, #10b981 100%)",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 700,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)",
              cursor: "pointer",
            }}
          >
            {isRefreshing ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>Updating App...</span>
              </>
            ) : (
              <>
                <RefreshCw size={15} />
                <span>Refresh & Apply Update</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            disabled={isRefreshing}
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#94a3b8",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Later
          </button>
        </div>
      </div>
    </aside>
  );
}
