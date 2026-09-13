/**
 * offlineQueue.ts
 * Manages local offline report queue and automatic synchronization when connectivity is restored.
 */

export interface OfflineQueuedReport {
  id: string; // client temporary ID
  categoryId: string;
  categoryName?: string;
  title: string;
  description: string;
  safetyFlag: "NO" | "POSSIBLY" | "URGENT";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  latitude: number;
  longitude: number;
  address: string;
  accuracy?: number | null;
  locationSource?: string;
  locationCapturedAt?: string;
  landmark?: string;
  roadPlacement?: string;
  photos: Array<{ url: string; type: "BEFORE"; caption?: string }>;
  queuedAt: string;
  retryCount: number;
}

const STORAGE_KEY = "bantay_offline_reports_queue";

export function getOfflineQueue(): OfflineQueuedReport[] {
  if (typeof window === "undefined" && typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read offline queue:", e);
    return [];
  }
}

export function saveOfflineReport(report: Omit<OfflineQueuedReport, "id" | "queuedAt" | "retryCount">): OfflineQueuedReport {
  const queue = getOfflineQueue();
  const queuedItem: OfflineQueuedReport = {
    ...report,
    id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  };

  queue.push(queuedItem);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    // Dispatch event so UI can immediately reflect outbox status
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("offline-queue-changed", { detail: { count: queue.length } }));
    }
  } catch (e) {
    console.error("Failed to persist offline report:", e);
  }

  return queuedItem;
}

export function removeOfflineReport(id: string): void {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("offline-queue-changed", { detail: { count: queue.length } }));
    }
  } catch (e) {
    console.error("Failed to update offline queue:", e);
  }
}

export async function syncOfflineReports(): Promise<{
  synced: Array<{ tempId: string; referenceNo: string }>;
  failed: number;
}> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { synced: [], failed: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { synced: [], failed: 0 };
  }

  const synced: Array<{ tempId: string; referenceNo: string }> = [];
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: item.categoryId,
          title: item.title,
          description: item.description,
          safetyFlag: item.safetyFlag,
          priority: item.priority,
          latitude: item.latitude,
          longitude: item.longitude,
          address: item.address,
          accuracy: item.accuracy,
          locationSource: item.locationSource || "OFFLINE_QUEUED",
          locationCapturedAt: item.locationCapturedAt || item.queuedAt,
          landmark: item.landmark,
          roadPlacement: item.roadPlacement,
          photos: item.photos,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        synced.push({
          tempId: item.id,
          referenceNo: data.report?.referenceNo || "SUBMITTED",
        });
        removeOfflineReport(item.id);
      } else {
        failed++;
      }
    } catch (e) {
      console.warn(`Sync failed for offline report ${item.id}:`, e);
      failed++;
    }
  }

  if (synced.length > 0 && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("offline-reports-synced", {
        detail: { syncedCount: synced.length, reports: synced },
      })
    );
  }

  return { synced, failed };
}

// Auto-sync listener initialization
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("Internet restored. Triggering offline reports auto-sync...");
    setTimeout(syncOfflineReports, 1500);
  });
}
