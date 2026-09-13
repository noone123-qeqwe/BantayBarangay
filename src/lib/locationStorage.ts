/**
 * BantayBarangay Location Storage & Persistence Service
 * 
 * Enforces location priority:
 * 1. Current device GPS / Geolocation API (highest priority)
 * 2. Last known valid device location (used across refreshes and page switches while GPS acquires)
 * 3. Manual location selected by the user
 * 
 * Guarantees that the app never falls back to an assumed default location (like Manila)
 * when a user is in Masbate City or any other municipality.
 */

export interface StoredLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  capturedAt: string;
  source: "DEVICE_GPS" | "LAST_KNOWN" | "MANUAL";
}

const STORAGE_KEY = "bantay_last_known_device_location";

/**
 * Validates that latitude and longitude are valid numbers within reasonable bounds.
 */
export function isValidCoordinate(lat: any, lng: any): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

/**
 * Retrieves the last known valid device location from client storage.
 * Returns null if not in browser, not found, or corrupted.
 */
export function getLastKnownLocation(): StoredLocation | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      isValidCoordinate(parsed.latitude, parsed.longitude) &&
      typeof parsed.accuracy === "number"
    ) {
      return {
        latitude: parseFloat(parsed.latitude.toFixed(6)),
        longitude: parseFloat(parsed.longitude.toFixed(6)),
        accuracy: parsed.accuracy,
        address: parsed.address || undefined,
        capturedAt: parsed.capturedAt || new Date().toISOString(),
        source: parsed.source || "LAST_KNOWN",
      };
    }
  } catch (err) {
    console.warn("Failed to retrieve last known location from storage:", err);
  }

  return null;
}

/**
 * Persists the user's valid device location to client storage.
 * Only valid coordinates are saved.
 */
export function saveLastKnownLocation(location: {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  address?: string | null;
  capturedAt?: string | null;
  source?: "DEVICE_GPS" | "LAST_KNOWN" | "MANUAL";
}): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  if (!isValidCoordinate(location.latitude, location.longitude)) {
    console.warn("Attempted to save invalid coordinates:", location);
    return;
  }

  try {
    const data: StoredLocation = {
      latitude: parseFloat(location.latitude.toFixed(6)),
      longitude: parseFloat(location.longitude.toFixed(6)),
      accuracy: typeof location.accuracy === "number" ? location.accuracy : 15,
      address: location.address || undefined,
      capturedAt: location.capturedAt || new Date().toISOString(),
      source: location.source || "DEVICE_GPS",
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("Failed to save last known location to storage:", err);
  }
}

/**
 * Clears the stored location if the user explicitly clears data.
 */
export function clearLastKnownLocation(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear last known location:", err);
  }
}
