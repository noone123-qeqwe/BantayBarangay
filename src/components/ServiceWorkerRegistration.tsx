"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  isNewerVersion,
  CURRENT_CLIENT_VERSION,
  APP_BUILD_IDENTIFIER,
} from "@/lib/version";

const CURRENT_EXPECTED_CACHE = "bantay-app-v11-20260916";

export default function ServiceWorkerRegistration() {
  const pathname = usePathname();
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [latestBuild, setLatestBuild] = useState<string | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string>("");
  const [showPopup, setShowPopup] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Post-update confirmation modal states
  const [showPostUpdateModal, setShowPostUpdateModal] = useState(false);
  const [postUpdateVersion, setPostUpdateVersion] = useState<string | null>(null);
  const [postUpdateNotes, setPostUpdateNotes] = useState<string | null>(null);

  // 1. Check if the app was just updated on previous session/reload
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const justUpdatedVersion = localStorage.getItem("bb_just_updated_version");
      if (justUpdatedVersion) {
        setPostUpdateVersion(justUpdatedVersion);
        setPostUpdateNotes(localStorage.getItem("bb_just_updated_notes") || "");
        setShowPostUpdateModal(true);
        localStorage.removeItem("bb_just_updated_version");
        localStorage.removeItem("bb_just_updated_notes");
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  // 2. Helper to check version & build against client's active version
  const checkVersionUpdate = useCallback(async (worker?: ServiceWorker | null) => {
    try {
      // Cache-busting timestamp ensures network-fresh response across mobile browsers
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
      const serverBuild = data?.build;
      const serverNotes = data?.releaseNotes || "";
      if (!serverVersion) return;

      // Determine client's installed version and build
      const installedVersion =
        localStorage.getItem("bb_installed_version") || CURRENT_CLIENT_VERSION;
      const installedBuild =
        localStorage.getItem("bb_installed_build") || APP_BUILD_IDENTIFIER;

      // Trigger update popup if:
      // 1. Semantic version is newer (e.g. 2.7.1 > 2.7.0)
      // 2. Build identifier changed (e.g. new code push/hotfix)
      // 3. A new Service Worker is waiting to activate
      const isNewerSemver = isNewerVersion(serverVersion, installedVersion);
      const isNewBuild = Boolean(
        installedBuild && serverBuild && installedBuild !== serverBuild
      );
      const hasNewer = isNewerSemver || isNewBuild || Boolean(worker);

      if (hasNewer) {
        setLatestVersion(serverVersion);
        setLatestBuild(serverBuild || null);
        setReleaseNotes(serverNotes);

        // Check if user snoozed recently (snoozes for 5 minutes, NOT permanent)
        const dismissedVersion = localStorage.getItem("bb_dismissed_update_version");
        const dismissedTime = parseInt(
          localStorage.getItem("bb_dismissed_update_time") || "0",
          10
        );
        const isSnoozed =
          dismissedVersion === serverVersion &&
          Date.now() - dismissedTime < 5 * 60 * 1000 &&
          !worker;

        if (isSnoozed) {
          setShowPopup(false);
          return;
        }

        setShowPopup(true);
      } else {
        // App is currently on latest version
        setShowPopup(false);
      }
    } catch {
      // Silently fail network check
    }
  }, []);

  // 3. UNIVERSAL VERSION CHECK (Runs on all browsers, mobile & desktop)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial check on mount
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

    // Periodic check every 25 seconds
    const interval = setInterval(() => {
      checkVersionUpdate();
    }, 25 * 1000);

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

  // 4. SERVICE WORKER REGISTRATION & LIFECYCLE
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

        // Periodic background worker update check
        const updateInterval = setInterval(() => {
          try {
            registration.update();
          } catch {
            // Ignore
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

    return () => {
      window.removeEventListener("load", registerSW);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, [checkVersionUpdate]);

  // 5. Real Application Update Mechanism (UPDATE NOW)
  const handleUpdateNow = useCallback(async () => {
    setIsUpdating(true);

    try {
      // Clear any temporary dismissal markers
      localStorage.removeItem("bb_dismissed_update_version");
      localStorage.removeItem("bb_dismissed_update_time");

      // Mark installed version & build so it matches post-reload
      if (latestVersion) {
        localStorage.setItem("bb_installed_version", latestVersion);
        localStorage.setItem("bb_just_updated_version", latestVersion);
      }
      if (latestBuild) {
        localStorage.setItem("bb_installed_build", latestBuild);
      }
      if (releaseNotes) {
        localStorage.setItem("bb_just_updated_notes", releaseNotes);
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
  }, [latestVersion, latestBuild, releaseNotes, waitingWorker]);

  // 6. Later button: snooze popup for 5 minutes
  const handleLater = () => {
    setShowPopup(false);
    if (latestVersion) {
      try {
        localStorage.setItem("bb_dismissed_update_version", latestVersion);
        localStorage.setItem("bb_dismissed_update_time", Date.now().toString());
      } catch {
        // Ignore
      }
    }
  };

  return (
    <>
      {/* ─── A. POST-UPDATE CONFIRMATION MODAL ("UPDATE COMPLETE") ─── */}
      {showPostUpdateModal && postUpdateVersion && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Update Complete"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "350px",
              backgroundColor: "#0d1527",
              backgroundImage:
                "linear-gradient(180deg, rgba(17, 28, 52, 0.98) 0%, rgba(10, 17, 32, 0.99) 100%)",
              border: "1.5px solid rgba(16, 185, 129, 0.45)",
              borderRadius: "20px",
              padding: "28px 22px",
              boxShadow:
                "0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 35px -5px rgba(16, 185, 129, 0.25)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              color: "#f8fafc",
            }}
          >
            {/* Green Checkmark Badge */}
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "1.5px solid rgba(16, 185, 129, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#34d399",
                marginBottom: "14px",
                boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#34d399",
                marginBottom: "8px",
              }}
            >
              UPDATE COMPLETE
            </div>

            <div
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "#f8fafc",
                lineHeight: 1.3,
                marginBottom: "14px",
              }}
            >
              BantayBarangay
              <br />
              Is Up To Date!
            </div>

            <div
              style={{
                display: "inline-block",
                fontSize: "0.95rem",
                fontWeight: 800,
                color: "#38bdf8",
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "JetBrains Mono", monospace',
                backgroundColor: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                borderRadius: "9999px",
                padding: "5px 16px",
                marginBottom: postUpdateNotes ? "14px" : "22px",
              }}
            >
              Version {postUpdateVersion}
            </div>

            {postUpdateNotes && (
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "#94a3b8",
                  lineHeight: 1.45,
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  textAlign: "center",
                }}
              >
                {postUpdateNotes}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowPostUpdateModal(false)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontSize: "0.825rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                cursor: "pointer",
              }}
            >
              GOT IT, THANKS!
            </button>
          </div>
        </div>
      )}

      {/* ─── B. PRE-UPDATE AVAILABLE PROMPT MODAL ─── */}
      {showPopup && latestVersion && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Update Available"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
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

            {/* Version Display */}
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
                marginBottom: releaseNotes ? "12px" : "22px",
              }}
            >
              Version {latestVersion}
            </div>

            {releaseNotes && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#94a3b8",
                  lineHeight: 1.4,
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                {releaseNotes}
              </div>
            )}

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
      )}
    </>
  );
}
