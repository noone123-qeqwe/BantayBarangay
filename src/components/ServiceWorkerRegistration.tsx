"use client";

import React, { useEffect, useState, useCallback } from "react";
import { isNewerVersion, BASELINE_INSTALLED_VERSION } from "@/lib/version";

const CURRENT_EXPECTED_CACHE = "bantay-app-v5-20260915";

export default function ServiceWorkerRegistration() {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper to check version against installed version
  const checkVersionUpdate = useCallback(async (worker?: ServiceWorker | null) => {
    try {
      const res = await fetch("/api/version", {
        cache: "no-store",
        headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
      });
      if (!res.ok) return;

      const data = await res.json();
      const serverVersion = data?.version;
      if (!serverVersion) return;

      setLatestVersion(serverVersion);

      // Determine installed version from storage or baseline
      const installedVersion =
        localStorage.getItem("bb_installed_version") || BASELINE_INSTALLED_VERSION;

      // Only display popup when latest version is strictly newer than installed version
      const hasNewer = isNewerVersion(serverVersion, installedVersion);

      // If a service worker is waiting or installed, that also indicates a pending update
      if (hasNewer || worker) {
        const dismissedFor = sessionStorage.getItem("bb_update_dismissed");
        if (dismissedFor !== serverVersion) {
          setShowPopup(true);
        }
      } else {
        setShowPopup(false);
      }
    } catch {
      // Silently fail network check
    }
  }, []);

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

        // Periodic background update check (every 2 minutes)
        const updateInterval = setInterval(() => {
          try {
            registration.update();
            checkVersionUpdate();
          } catch {
            // Ignore
          }
        }, 2 * 60 * 1000);

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

    // Background update check on tab/app visibility regain or focus
    const handleCheck = () => {
      if (document.visibilityState === "visible") {
        if (swRegistration) {
          try {
            swRegistration.update();
          } catch {
            // Ignore
          }
        }
        checkVersionUpdate();
      }
    };

    document.addEventListener("visibilitychange", handleCheck);
    window.addEventListener("focus", handleCheck);

    // Initial check on mount
    checkVersionUpdate();

    return () => {
      window.removeEventListener("load", registerSW);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      document.removeEventListener("visibilitychange", handleCheck);
      window.removeEventListener("focus", handleCheck);
    };
  }, [checkVersionUpdate]);

  // 2. Real Application Update Mechanism (UPDATE NOW)
  const handleUpdateNow = useCallback(async () => {
    setIsUpdating(true);

    try {
      sessionStorage.removeItem("bb_update_dismissed");

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
      }, 300);
    } catch {
      window.location.reload();
    }
  }, [latestVersion, waitingWorker]);

  // 3. Later button: simply close the popup
  const handleLater = () => {
    setShowPopup(false);
    if (latestVersion) {
      try {
        sessionStorage.setItem("bb_update_dismissed", latestVersion);
      } catch {
        // Ignore
      }
    }
  };

  // Do not display if no update is available or dismissed
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
