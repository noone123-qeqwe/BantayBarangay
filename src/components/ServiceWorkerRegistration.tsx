"use client";

import { useEffect, useState } from "react";
import { RefreshCw, DownloadCloud } from "lucide-react";

export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Check if there is already an updated worker waiting
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
      } catch (err) {
        console.warn("ServiceWorker registration error:", err);
      }
    };

    window.addEventListener("load", registerSW);

    // Reload smoothly when the service worker changes controller
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    return () => {
      window.removeEventListener("load", registerSW);
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <aside
      aria-label="App update available"
      style={{
        position: "fixed",
        top: "calc(var(--header-height, 64px) + 12px)",
        right: "16px",
        zIndex: 9999,
        backgroundColor: "var(--primary, #0284c7)",
        color: "#ffffff",
        padding: "10px 16px",
        borderRadius: "9999px",
        boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.4)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "0.813rem",
        fontWeight: 700,
        animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <DownloadCloud size={16} />
      <span>New App Version Ready</span>
      <button
        type="button"
        onClick={handleUpdate}
        style={{
          background: "rgba(255, 255, 255, 0.2)",
          border: "none",
          borderRadius: "9999px",
          color: "#ffffff",
          padding: "4px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontWeight: 800,
          fontSize: "0.75rem",
        }}
      >
        <RefreshCw size={12} />
        <span>Update</span>
      </button>
    </aside>
  );
}
