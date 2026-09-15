"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { isNewerVersion, CURRENT_CLIENT_VERSION } from "@/lib/version";

const CURRENT_EXPECTED_CACHE = "bantay-app-v6-20260916";

export default function ServiceWorkerRegistration() {
  const pathname = usePathname();
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper to check version against installed client version
  const checkVersionUpdate = useCallback(async (worker?: ServiceWorker | null) => {
    try {
      // Use cache-busting timestamp query parameter so mobile browsers never return cached 304 responses
      const res = await fetch(`/api/version?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          Pragma: "no-cache",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
      if (!res.ok) return;

      const data = await res.json();
      const serverVersion = data?.version;
      if (!serverVersion) return;

      // Determine client's installed version (stored in localStorage or fallback to running build version)
      const installedVersion =
        localStorage.getItem("bb_installed_version") || CURRENT_CLIENT_VERSION;

      // Display popup when server version is strictly newer OR when a new worker is actively waiting
      const hasNewer = isNewerVersion(serverVersion, installedVersion) || !!worker;

      if (hasNewer) {
        setLatestVersion(serverVersion);

        // Check if user previously clicked "Later" for this exact version (unless a worker is actively waiting)
        const dismissedVersion = localStorage.getItem("bb_dismissed_update_version");
        if (dismissedVersion === serverVersion && !worker) {
          setShowPopup(false);
          return;
        }

        setShowPopup(true);
      } else {
        // No newer version available; ensure popup is closed
        setShowPopup(false);
      }
    } catch {
      // Silently fail network check
    }
  }, []);

  // 1. UNIVERSAL VERSION CHECK (Runs on ALL mobile & desktop browsers, regardless of ServiceWorker support)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check on initial load
    checkVersionUpdate();

    // Check when user navigates, switches tabs, or refocuses the app
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkVersionUpdate();
      }
    };

    // Custom event listener so any button or notification can trigger update check
    const handleCustomCheck = () => {
      checkVersionUpdate();
    };

    // Periodic check every 30 seconds
    const interval = setInterval(() => {
      checkVersionUpdate();
    }, 30 * 1000);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    window.addEventListener("check-app-update", handleCustomCheck);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
      window.removeEventListener("check-app-update", handleCustomCheck);
    };
  }, [checkVersionUpdate, pathname]);

  // 2. SERVICE WORKER REGISTRATION & LIFECYCLE (When supported by environment)
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

        // Proactively check for SW updates
        try {
          await registration.update();
        } catch {
          // Ignore network glitch during update check
        }

        // Check if a worker is already waiting in background
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          checkVersionUpdate(registration.waiting);
        }

        // Listen for new service worker installation
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              checkVersionUpdate(newWorker);
            }
          });
        });

        // Periodic background worker update
        const updateInterval = setInterval(() => {
          try {
            registration.update();
          } catch {
            // Ignore
          }
        }, 5 * 60 * 1000);

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

    return () => {
      window.removeEventListener("load", registerSW);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [checkVersionUpdate]);

  // 3. Real Application Update Mechanism (UPDATE NOW)
  const handleUpdateNow = useCallback(async () => {
    setIsUpdating(true);

    try {
      // Clear any dismissal markers
      localStorage.removeItem("bb_dismissed_update_version");

      // Mark installed version as the new latest version so it won't prompt again after reload
      if (latestVersion) {
        localStorage.setItem("bb_installed_version", latestVersion);
      }

      // Wipe client caches directly
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      // Message waiting service worker to take over immediately
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

      // Reload with fresh assets
      setTimeout(() => {
        window.location.reload();
      }, 250);
    } catch {
      window.location.reload();
    }
  }, [latestVersion, waitingWorker]);

  // 4. Later button: simply close the popup and remember dismissal
  const handleLater = () => {
    setShowPopup(false);
    if (latestVersion) {
      try {
        localStorage.setItem("bb_dismissed_update_version", latestVersion);
      } catch {
        // Ignore
      }
    }
  };

  // Do not display if no update is available or if dismissed
  if (!showPopup || !latestVersion) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Update Available"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* 
        Final Appearance:
        ┌─────────────────────────┐
        │    UPDATE AVAILABLE     │
        │                         │
        │ A new version is        │
        │ available!              │
        │                         │
        │      Version 2.4.6      │
        │                         │
        │ [ UPDATE NOW ] [ LATER ]│
        └─────────────────────────┘
      */}
      <div
        style={{
          width: "100%",
          maxWidth: "340px",
          backgroundColor: "#0d1527",
          backgroundImage:
            "linear-gradient(180deg, rgba(17, 28, 52, 0.98) 0%, rgba(10, 17, 32, 0.99) 100%)",
          border: "1.5px solid rgba(245, 158, 11, 0.45)",
          borderRadius: "18px",
          padding: "26px 22px",
          boxShadow:
            "0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 35px -5px rgba(245, 158, 11, 0.22)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          color: "#f8fafc",
        }}
      >
        {/* Header: UPDATE AVAILABLE */}
        <div
          style={{
            fontSize: "0.85rem",
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#fbbf24",
            marginBottom: "12px",
          }}
        >
          UPDATE AVAILABLE
        </div>

        {/* Subtitle: A new version is available! */}
        <div
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "#f8fafc",
            lineHeight: 1.35,
            marginBottom: "18px",
          }}
        >
          A new version is
          <br />
          available!
        </div>

        {/* Version Display: Version X.X.X (Only latest version, no current version) */}
        <div
          style={{
            display: "inline-block",
            fontSize: "1.1rem",
            fontWeight: 800,
            color: "#fbbf24",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "JetBrains Mono", monospace',
            backgroundColor: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "9999px",
            padding: "6px 18px",
            marginBottom: "22px",
          }}
        >
          Version {latestVersion}
        </div>

        {/* Action Buttons: [ UPDATE NOW ] [ LATER ] */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            width: "100%",
          }}
        >
          <button
            type="button"
            onClick={handleUpdateNow}
            disabled={isUpdating}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#080c15",
              fontSize: "0.825rem",
              fontWeight: 800,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
              cursor: isUpdating ? "wait" : "pointer",
              opacity: isUpdating ? 0.75 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            {isUpdating ? "UPDATING..." : "UPDATE NOW"}
          </button>

          <button
            type="button"
            onClick={handleLater}
            disabled={isUpdating}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              color: "#94a3b8",
              fontSize: "0.825rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              cursor: isUpdating ? "not-allowed" : "pointer",
              transition: "background-color 0.15s ease, color 0.15s ease",
            }}
          >
            LATER
          </button>
        </div>
      </div>
    </div>
  );
}
