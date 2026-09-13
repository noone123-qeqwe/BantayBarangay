"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import NextLink from "next/link";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import { saveLastKnownLocation, getLastKnownLocation } from "@/lib/locationStorage";
import {
  MapPin,
  Navigation,
  Loader2,
  Check,
  AlertTriangle,
  X,
  Search,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  Copy,
  LocateFixed,
  ChevronRight,
  ShieldAlert,
  Compass,
  Info,
} from "lucide-react";

export interface LocationPayload {
  latitude: number;
  longitude: number;
  address: string;
  accuracy?: number | null;
  locationSource?: string;
  locationCapturedAt?: string;
}

interface InteractiveMapProps {
  initialLat?: number;
  initialLng?: number;
  accuracy?: number | null;
  locationSource?: string | null;
  onLocationSelect?: (location: LocationPayload) => void;
  interactivePicker?: boolean;
  autoDetectGps?: boolean;
  enableRealtimeTracking?: boolean;
  userLocation?: { lat: number; lng: number; accuracy?: number | null; address?: string } | null;
  onUserLocationUpdate?: (pos: { lat: number; lng: number; accuracy: number; address?: string }) => void;
  onLocationPermissionChange?: (
    status: "granted" | "denied" | "disabled" | "unavailable" | "prompt",
    err?: { title: string; message: string; hint?: string }
  ) => void;
  showLocateMeControl?: boolean;
  centerTrigger?: number;
  reports?: Array<{
    id: string;
    referenceNo: string;
    title: string;
    description?: string;
    status: any;
    priority: any;
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    address: string;
    landmark?: string | null;
    createdAt?: string;
    category?: { name: string };
    photos?: Array<{ photoUrl: string }>;
    photoUrl?: string | null;
  }>;
  hotspots?: Array<{
    category: string;
    count: number;
    latitude: number;
    longitude: number;
  }>;
  height?: string;
  controlsOffsetTop?: number;
}

export default function InteractiveMap({
  initialLat = 14.5839,
  initialLng = 121.0615,
  accuracy: initialAccuracy = null,
  locationSource: initialLocationSource = "INITIAL",
  onLocationSelect,
  interactivePicker = false,
  autoDetectGps = false,
  enableRealtimeTracking = false,
  userLocation = null,
  onUserLocationUpdate,
  onLocationPermissionChange,
  showLocateMeControl,
  centerTrigger = 0,
  reports = [],
  hotspots = [],
  height = "440px",
  controlsOffsetTop = 12,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const tileLayersRef = useRef<{ street: any; satellite: any } | null>(null);
  const reportsLayerGroupRef = useRef<any>(null);

  // Dedicated Real-Time User Location Marker & Circle Refs
  const userLocationMarkerRef = useRef<any>(null);
  const userLocationCircleRef = useRef<any>(null);
  const userLiveCoordsRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);
  const realtimeWatchIdRef = useRef<number | null>(null);
  const hasInitiallyCenteredUserRef = useRef(false);
  const [liveUserCoords, setLiveUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [locateBtnState, setLocateBtnState] = useState<"idle" | "locating" | "found">("idle");
  const locateBtnTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (locateBtnTimerRef.current) clearTimeout(locateBtnTimerRef.current);
    };
  }, []);

  // Keep callback refs stable
  const onUserLocationUpdateRef = useRef(onUserLocationUpdate);
  useEffect(() => {
    onUserLocationUpdateRef.current = onUserLocationUpdate;
  }, [onUserLocationUpdate]);

  const onLocationPermissionChangeRef = useRef(onLocationPermissionChange);
  useEffect(() => {
    onLocationPermissionChangeRef.current = onLocationPermissionChange;
  }, [onLocationPermissionChange]);

  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Does the map currently have a real placed pin (or is it in unplaced/detecting state)?
  const isInitialSourceValid =
    initialLocationSource !== "INITIAL" &&
    initialLocationSource !== "UNSET" &&
    initialLocationSource !== null &&
    initialLocationSource !== undefined;

  const [hasPlacedPin, setHasPlacedPin] = useState<boolean>(
    !interactivePicker || isInitialSourceValid
  );

  // Manual editing protection flag: user explicitly moved the pin
  const isManuallyEditedRef = useRef(false);
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);

  const [activeLayer, setActiveLayer] = useState<"street" | "satellite">("street");
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  }>({
    lat: initialLat,
    lng: initialLng,
    address: isInitialSourceValid ? "Resolving address..." : "Detecting location...",
  });

  // GPS & Permission States
  const [permissionState, setPermissionState] = useState<
    "prompt" | "locating" | "granted" | "denied" | "blocked" | "disabled" | "unavailable" | "not-supported"
  >("prompt");
  const [isLocating, setIsLocating] = useState(false);
  const [locatingStatus, setLocatingStatus] = useState<string | null>(null);
  const [locatingSample, setLocatingSample] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(initialAccuracy);
  const [currentLocationSource, setCurrentLocationSource] = useState<string>(
    initialLocationSource || "INITIAL"
  );
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Reverse geocoding state & sequencing
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [nudgeStep, setNudgeStep] = useState<"fine" | "standard">("fine"); // fine: ~1m, standard: ~5m
  const reverseGeocodeReqIdRef = useRef(0);

  // Address search inside map
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Selected report for mobile Bottom Sheet (Viewer mode)
  const [activeReport, setActiveReport] = useState<any | null>(null);

  // Active GPS watch handle ref
  const activeWatchIdRef = useRef<number | null>(null);
  const activeTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const stopActiveGpsWatch = useCallback(() => {
    if (activeWatchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(activeWatchIdRef.current);
      activeWatchIdRef.current = null;
    }
    if (activeTimeoutIdRef.current !== null) {
      clearTimeout(activeTimeoutIdRef.current);
      activeTimeoutIdRef.current = null;
    }
    setIsLocating(false);
    setLocatingStatus(null);
  }, []);

  // Truthful Reverse Geocoding with timeout, cancellation of superseded requests, and truthful fallback
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    const reqId = ++reverseGeocodeReqIdRef.current;
    try {
      setIsGeocoding(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { "Accept-Language": "en" },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      // Check if this request was superseded by a newer one
      if (reqId !== reverseGeocodeReqIdRef.current) {
        return "";
      }

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const houseNumber = addr.house_number || addr.building || "";
        const road = addr.road || addr.pedestrian || addr.street || addr.footway || addr.path || addr.highway || "";
        const neighbourhood = addr.neighbourhood || addr.subdivision || addr.suburb || addr.quarter || addr.village || "";
        const city = addr.city || addr.town || addr.municipality || addr.county || "";
        const province = addr.state || addr.region || addr.province || "";

        const parts: string[] = [];
        if (houseNumber) parts.push(houseNumber);
        if (road) parts.push(road);
        if (neighbourhood && neighbourhood !== road) parts.push(neighbourhood);
        if (city && city !== neighbourhood) parts.push(city);
        if (province && province !== city && parts.length < 3) parts.push(province);

        if (parts.length > 0) {
          return parts.join(", ");
        }
        if (data.display_name) {
          return data.display_name.split(",").slice(0, 4).join(", ").trim();
        }
      }
    } catch (e) {
      console.warn("Reverse geocoding network/timeout error:", e);
    } finally {
      if (reqId === reverseGeocodeReqIdRef.current) {
        setIsGeocoding(false);
      }
    }
    return `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }, []);

  // Stop Real-time User Location Watch
  const stopRealtimeTracking = useCallback(() => {
    if (realtimeWatchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(realtimeWatchIdRef.current);
      realtimeWatchIdRef.current = null;
    }
  }, []);

  // Update or instantiate the Real-Time User Marker and Accuracy Halo
  const updateUserMarker = useCallback(
    async (lat: number, lng: number, accuracy: number, allowFlyTo: boolean = false, initialAddress?: string) => {
      if (!mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;

      // Jitter Filter: prevent micro-teleportation when stationary
      if (userLiveCoordsRef.current) {
        const prev = userLiveCoordsRef.current;
        const dLat = (lat - prev.lat) * 111320;
        const dLng = (lng - prev.lng) * (111320 * Math.cos((lat * Math.PI) / 180));
        const distMeters = Math.sqrt(dLat * dLat + dLng * dLng);

        // Ignore sub-meter fluctuations if accuracy didn't noticeably improve
        if (distMeters < 1.2 && accuracy >= prev.accuracy - 2) {
          return;
        }

        // Filter out erratic poor accuracy spikes (> 150m) if we already have reliable GPS lock (< 40m)
        if (accuracy > 150 && prev.accuracy <= 40) {
          return;
        }
      }

      userLiveCoordsRef.current = { lat, lng, accuracy };
      setLiveUserCoords({ lat, lng, accuracy });

      const buildPopupContent = (addr?: string) => `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2px 4px; min-width: 185px;">
          <div style="font-weight: 800; color: #1d4ed8; font-size: 13px; display: flex; align-items: center; gap: 5px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #2563eb;"></span>
            You are here
          </div>
          ${addr ? `<div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 5px; line-height: 1.3;">${addr}</div>` : ""}
          <div style="font-size: 11px; color: #475569; line-height: 1.4; margin-bottom: 4px;">
            <div><strong>Latitude:</strong> ${lat.toFixed(6)}</div>
            <div><strong>Longitude:</strong> ${lng.toFixed(6)}</div>
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 2px 6px; border-radius: 4px; display: inline-block;">
            GPS Accuracy: &plusmn;${Math.round(accuracy)}m
          </div>
        </div>
      `;

      // 1. Update/Add User Location Accuracy Radius Circle
      if (!userLocationCircleRef.current) {
        userLocationCircleRef.current = L.circle([lat, lng], {
          radius: Math.max(accuracy, 5),
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.14,
          weight: 1.5,
          dashArray: "4, 4",
        }).addTo(mapInstanceRef.current);
      } else {
        userLocationCircleRef.current.setLatLng([lat, lng]);
        userLocationCircleRef.current.setRadius(Math.max(accuracy, 5));
      }

      // 2. Update/Add User Location "You are here" Marker
      if (!userLocationMarkerRef.current) {
        const userIcon = L.divIcon({
          className: "user-live-location-icon",
          html: `
            <div class="user-pulse-marker" title="You are here">
              <div class="user-pulse-ring"></div>
              <div class="user-core-dot"></div>
              <div class="user-location-badge">You</div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const marker = L.marker([lat, lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(mapInstanceRef.current);

        marker.bindPopup(buildPopupContent(initialAddress));
        userLocationMarkerRef.current = marker;
      } else {
        userLocationMarkerRef.current.setLatLng([lat, lng]);
        userLocationMarkerRef.current.setPopupContent(buildPopupContent(initialAddress));
      }

      // Initial center if requested
      if (allowFlyTo && !hasInitiallyCenteredUserRef.current) {
        hasInitiallyCenteredUserRef.current = true;
        mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1 });
      }

      // Reverse geocode to resolve readable address & persist to storage
      reverseGeocode(lat, lng).then((resolvedAddr) => {
        const addrToUse = resolvedAddr || initialAddress;
        if (addrToUse && userLocationMarkerRef.current) {
          userLocationMarkerRef.current.setPopupContent(buildPopupContent(addrToUse));
        }

        saveLastKnownLocation({
          latitude: lat,
          longitude: lng,
          accuracy,
          address: addrToUse,
          capturedAt: new Date().toISOString(),
          source: "DEVICE_GPS",
        });

        if (onUserLocationUpdateRef.current) {
          onUserLocationUpdateRef.current({ lat, lng, accuracy, address: addrToUse });
        }
      });
    },
    [reverseGeocode]
  );

  // High-accuracy continuous geolocation monitoring
  const startRealtimeLocationTracking = useCallback(
    (flyToOnSuccess = true) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        if (onLocationPermissionChangeRef.current) onLocationPermissionChangeRef.current("unavailable");
        return;
      }

      stopRealtimeTracking();

      realtimeWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (onLocationPermissionChangeRef.current) onLocationPermissionChangeRef.current("granted");

          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const acc = pos.coords.accuracy || 15;

          updateUserMarker(lat, lng, acc, flyToOnSuccess);
        },
        (err) => {
          if (err.code === 1) {
            if (onLocationPermissionChangeRef.current) onLocationPermissionChangeRef.current("denied");
          } else {
            if (onLocationPermissionChangeRef.current) onLocationPermissionChangeRef.current("unavailable");
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        }
      );
    },
    [updateUserMarker, stopRealtimeTracking]
  );

  // Prominent Floating "Locate Me" Action with Status Transitions
  const handleLocateMeAction = useCallback(() => {
    setLocateBtnState("locating");

    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocateBtnState("idle");
      if (onLocationPermissionChangeRef.current) {
        onLocationPermissionChangeRef.current("unavailable", {
          title: "Unable to Find Your Location",
          message: "Please try again or manually select a location on the map.",
          hint: "Geolocation is not supported by your browser.",
        });
      }
      return;
    }

    // High accuracy acquisition to find coordinates and smoothly center
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const acc = pos.coords.accuracy || 15;

        // Update user marker and accuracy circle
        updateUserMarker(lat, lng, acc, false);

        // Center map smoothly on the user's location
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1 });
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.openPopup();
          }
        }

        // Transition state: ✓ Location Found
        setLocateBtnState("found");
        if (locateBtnTimerRef.current) clearTimeout(locateBtnTimerRef.current);
        locateBtnTimerRef.current = setTimeout(() => {
          setLocateBtnState("idle");
        }, 2500);

        // Notify parent
        if (onLocationPermissionChangeRef.current) {
          onLocationPermissionChangeRef.current("granted");
        }

        // Ensure continuous watch is active if tracking is enabled
        if (enableRealtimeTracking) {
          startRealtimeLocationTracking(false);
        }
      },
      (err) => {
        setLocateBtnState("idle");
        if (err.code === 1) {
          // PERMISSION_DENIED
          if (onLocationPermissionChangeRef.current) {
            onLocationPermissionChangeRef.current("denied", {
              title: "Location Permission Required",
              message: "Please allow location access to find your current position.",
              hint: "Click the lock icon (🔒) in your browser address bar and set Location to Allow.",
            });
          }
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE
          if (onLocationPermissionChangeRef.current) {
            onLocationPermissionChangeRef.current("disabled", {
              title: "Location Services Disabled",
              message: "Please enable location services and try again.",
              hint: "Please enable location services in your device settings and try again.",
            });
          }
        } else {
          // TIMEOUT or OTHER
          if (onLocationPermissionChangeRef.current) {
            onLocationPermissionChangeRef.current("unavailable", {
              title: "Unable to Find Your Location",
              message: "Please try again or manually select a location on the map.",
              hint: "Check your GPS signal and network connection.",
            });
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [updateUserMarker, enableRealtimeTracking, startRealtimeLocationTracking]);

  // Synchronize external trigger (e.g. from header "Locate Me" button)
  useEffect(() => {
    if (centerTrigger > 0) {
      handleLocateMeAction();
    }
  }, [centerTrigger, handleLocateMeAction]);

  // Recenter map smoothly onto user marker
  const centerOnUserLocation = useCallback(() => {
    handleLocateMeAction();
  }, [handleLocateMeAction]);

  // Helper to lazily create or move the precision draggable marker
  const ensurePrecisionMarker = useCallback(
    async (lat: number, lng: number) => {
      if (!mapInstanceRef.current) return null;
      const L = (await import("leaflet")).default;

      if (!markerRef.current) {
        const precisionIcon = L.divIcon({
          className: "precision-crosshair-icon",
          html: `
            <div style="position: relative; width: 38px; height: 46px; cursor: grab;">
              <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 34px; height: 44px; display: flex; flex-direction: column; align-items: center;">
                <div style="width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(2,132,199,0.55); display: flex; align-items: center; justify-content: center; color: white;">
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 6px rgba(0,0,0,0.3);"></div>
                </div>
                <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 9px solid #0369a1; margin-top: -1px;"></div>
              </div>
            </div>
          `,
          iconSize: [38, 46],
          iconAnchor: [19, 46],
        });

        const marker = L.marker([lat, lng], {
          draggable: true,
          icon: precisionIcon,
          autoPan: true,
        }).addTo(mapInstanceRef.current);

        marker.on("dragstart", () => {
          stopActiveGpsWatch();
          isManuallyEditedRef.current = true;
          setIsManuallyEdited(true);
        });

        marker.on("dragend", async () => {
          stopActiveGpsWatch();
          isManuallyEditedRef.current = true;
          setIsManuallyEdited(true);

          const pos = marker.getLatLng();
          const pLat = parseFloat(pos.lat.toFixed(6));
          const pLng = parseFloat(pos.lng.toFixed(6));
          const capturedAt = new Date().toISOString();

          if (accuracyCircleRef.current) {
            accuracyCircleRef.current.remove();
            accuracyCircleRef.current = null;
          }
          setGpsAccuracy(null);
          setCurrentLocationSource("MANUAL_PIN");

          const address = await reverseGeocode(pLat, pLng);
          if (address) {
            setSelectedLocation({ lat: pLat, lng: pLng, address });
            if (onLocationSelect) {
              onLocationSelect({
                latitude: pLat,
                longitude: pLng,
                address,
                accuracy: null,
                locationSource: "MANUAL_PIN",
                locationCapturedAt: capturedAt,
              });
            }
          }
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }

      setHasPlacedPin(true);
      return markerRef.current;
    },
    [reverseGeocode, onLocationSelect, stopActiveGpsWatch]
  );

  // High-Accuracy Real Device GPS Acquisition & Multi-Sample Refinement
  const acquireDeviceLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setPermissionState("not-supported");
      setGpsError("Geolocation is not supported by your device browser.");
      return;
    }

    stopActiveGpsWatch();

    // Reset manual override flag since user explicitly requested GPS location
    isManuallyEditedRef.current = false;
    setIsManuallyEdited(false);

    setIsLocating(true);
    setPermissionState("locating");
    setGpsError(null);
    setLocatingStatus("Requesting device GPS (High Accuracy mode)...");
    setLocatingSample(0);

    let bestPos: GeolocationPosition | null = null;
    let sampleCount = 0;

    // Safety timeout after 14 seconds
    activeTimeoutIdRef.current = setTimeout(() => {
      stopActiveGpsWatch();
      if (!bestPos) {
        setPermissionState("unavailable");
        setGpsError(
          "We couldn't get your exact location. GPS signal timed out. Please enable location services or manually select the location on the map."
        );
      }
    }, 14000);

    activeWatchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        // If user manually dragged or clicked map during watch, abort updating coordinates
        if (isManuallyEditedRef.current) {
          stopActiveGpsWatch();
          return;
        }

        sampleCount++;
        setLocatingSample(sampleCount);
        setPermissionState("granted");

        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const acc = pos.coords.accuracy; // in meters

        // Accept first position or any newer position with equal or better accuracy
        if (!bestPos || acc <= bestPos.coords.accuracy || (acc <= 25 && sampleCount > 1)) {
          bestPos = pos;
          setGpsAccuracy(acc);
          const capturedAt = new Date().toISOString();
          setCurrentLocationSource("DEVICE_GPS");

          setLocatingStatus(
            acc <= 20
              ? `High-accuracy GPS locked: ±${Math.round(acc)}m (Sample ${sampleCount}/4)`
              : `Refining satellite lock: ±${Math.round(acc)}m (Sample ${sampleCount}/4)...`
          );

          // Update Leaflet map and marker
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 18);

            const L = (await import("leaflet")).default;
            if (accuracyCircleRef.current) {
              accuracyCircleRef.current.remove();
            }
            accuracyCircleRef.current = L.circle([lat, lng], {
              radius: Math.max(acc, 5),
              color: "#0284c7",
              fillColor: "#38bdf8",
              fillOpacity: 0.18,
              weight: 2,
              dashArray: "4, 4",
            }).addTo(mapInstanceRef.current);
          }

          await ensurePrecisionMarker(lat, lng);

          // Reverse geocode truthful address
          const address = await reverseGeocode(lat, lng);

          // Verify user didn't manually intervene during asynchronous reverse geocode
          if (!isManuallyEditedRef.current && address) {
            setSelectedLocation({ lat, lng, address });
            if (onLocationSelect) {
              onLocationSelect({
                latitude: lat,
                longitude: lng,
                address,
                accuracy: acc,
                locationSource: "DEVICE_GPS",
                locationCapturedAt: capturedAt,
              });
            }
          }
        }

        // Conclude watch if accuracy is high (<= 15 meters) or reached 4 samples
        if (acc <= 15 || sampleCount >= 4) {
          stopActiveGpsWatch();
        }
      },
      (err) => {
        stopActiveGpsWatch();
        if (err.code === 1) {
          // PERMISSION_DENIED
          setPermissionState("denied");
          setGpsError(
            "Location permission was denied in your browser settings. Please enable location services or manually select the location on the map."
          );
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE
          setPermissionState("disabled");
          setGpsError(
            "Location services may be disabled on your device. Please enable location services or manually select the location on the map."
          );
        } else {
          // TIMEOUT
          setPermissionState("unavailable");
          setGpsError(
            "Location request timed out. Please check your GPS signal or manually select the location on the map."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0, // Never accept stale cached coordinates!
      }
    );
  }, [reverseGeocode, onLocationSelect, stopActiveGpsWatch, ensurePrecisionMarker]);

  // Monitor Geolocation Permission API if supported
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" as any })
        .then((permissionStatus) => {
          if (permissionStatus.state === "denied") {
            setPermissionState("denied");
          } else if (permissionStatus.state === "granted") {
            setPermissionState("granted");
          } else {
            setPermissionState("prompt");
          }

          permissionStatus.onchange = () => {
            if (permissionStatus.state === "denied") {
              setPermissionState("denied");
            } else if (permissionStatus.state === "granted") {
              setPermissionState("granted");
            } else {
              setPermissionState("prompt");
            }
          };
        })
        .catch(() => {
          // Permissions API query not supported in this browser
        });
    }
  }, []);

  // Clean up watch on unmount
  useEffect(() => {
    return () => {
      stopActiveGpsWatch();
      stopRealtimeTracking();
    };
  }, [stopActiveGpsWatch, stopRealtimeTracking]);

  // Recenter map on user location if triggered externally
  useEffect(() => {
    if (centerTrigger && centerTrigger > 0) {
      centerOnUserLocation();
    }
  }, [centerTrigger, centerOnUserLocation]);

  // Real-time tracking lifecycle
  useEffect(() => {
    if (enableRealtimeTracking && mapReady && mapInstanceRef.current) {
      startRealtimeLocationTracking(false);
    }
    return () => {
      stopRealtimeTracking();
    };
  }, [enableRealtimeTracking, mapReady, startRealtimeLocationTracking, stopRealtimeTracking]);

  // Sync external userLocation prop
  useEffect(() => {
    if (userLocation && userLocation.lat && userLocation.lng && mapReady && mapInstanceRef.current) {
      updateUserMarker(userLocation.lat, userLocation.lng, userLocation.accuracy || 15, false);
    }
  }, [userLocation, mapReady, updateUserMarker]);

  // Re-sync user marker when map becomes ready
  useEffect(() => {
    if (mapReady && liveUserCoords && mapInstanceRef.current) {
      updateUserMarker(liveUserCoords.lat, liveUserCoords.lng, liveUserCoords.accuracy, false);
    }
  }, [mapReady, liveUserCoords, updateUserMarker]);

  // Auto-detect GPS if configured and not yet manually selected
  useEffect(() => {
    if (interactivePicker && autoDetectGps && !isManuallyEditedRef.current && initialLocationSource === "INITIAL") {
      acquireDeviceLocation();
    }
  }, [interactivePicker, autoDetectGps, initialLocationSource, acquireDeviceLocation]);

  // Synchronize when parent passes new coordinates from external source (e.g. photo EXIF or search)
  useEffect(() => {
    if (mapInstanceRef.current && interactivePicker && isInitialSourceValid) {
      ensurePrecisionMarker(initialLat, initialLng).then(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([initialLat, initialLng], 18);
        }
      });
      setSelectedLocation((prev) => ({
        ...prev,
        lat: initialLat,
        lng: initialLng,
      }));
    }
  }, [initialLat, initialLng, interactivePicker, isInitialSourceValid, ensurePrecisionMarker]);

  // Search street, building, or landmark anywhere in Philippines
  const handleSearchStreet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&limit=6&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();

      if (data && data.length > 0) {
        setSearchResults(data);
        setSearchError(null);
      } else {
        setSearchResults([]);
        setSearchError(`No locations found for "${query}". Try searching by street name or drag the pin on the map.`);
      }
    } catch (err) {
      setSearchResults([]);
      setSearchError("Location search failed. Please check your network or drag the pin on the map.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = async (item: any) => {
    stopActiveGpsWatch();
    isManuallyEditedRef.current = true;
    setIsManuallyEdited(true);

    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const address = item.display_name.split(",").slice(0, 4).join(", ").trim();
    const capturedAt = new Date().toISOString();

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 18);
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
    }

    await ensurePrecisionMarker(lat, lng);

    setGpsAccuracy(null);
    setCurrentLocationSource("SEARCH");
    setSelectedLocation({ lat, lng, address });
    setSearchResults([]);
    setSearchError(null);

    if (onLocationSelect) {
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        address,
        accuracy: null,
        locationSource: "SEARCH",
        locationCapturedAt: capturedAt,
      });
    }
  };

  // Switch between Standard Map and Satellite Imagery
  const currentActiveLayerRef = useRef<"street" | "satellite">("street");
  const toggleTileLayer = (mode: "street" | "satellite") => {
    if (!mapInstanceRef.current || !tileLayersRef.current) return;
    if (mode === currentActiveLayerRef.current) return;

    const currentLayer = tileLayersRef.current[currentActiveLayerRef.current];
    const nextLayer = tileLayersRef.current[mode];

    if (currentLayer && mapInstanceRef.current.hasLayer(currentLayer)) {
      mapInstanceRef.current.removeLayer(currentLayer);
    }
    if (nextLayer) {
      nextLayer.addTo(mapInstanceRef.current);
    }
    currentActiveLayerRef.current = mode;
    setActiveLayer(mode);
  };

  // Micro-nudge pin controls for ultra-precise placement
  const nudgePin = async (dLat: number, dLng: number) => {
    stopActiveGpsWatch();
    isManuallyEditedRef.current = true;
    setIsManuallyEdited(true);

    const currentLat = selectedLocation.lat || initialLat;
    const currentLng = selectedLocation.lng || initialLng;

    const delta = nudgeStep === "fine" ? 0.00001 : 0.000045; // ~1.1m vs ~5m
    const newLat = parseFloat((currentLat + dLat * delta).toFixed(6));
    const newLng = parseFloat((currentLng + dLng * delta).toFixed(6));
    const capturedAt = new Date().toISOString();

    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([newLat, newLng]);
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
    }

    await ensurePrecisionMarker(newLat, newLng);

    setGpsAccuracy(null);
    setCurrentLocationSource("MANUAL_PIN");

    const address = await reverseGeocode(newLat, newLng);
    if (address) {
      setSelectedLocation({ lat: newLat, lng: newLng, address });
      if (onLocationSelect) {
        onLocationSelect({
          latitude: newLat,
          longitude: newLng,
          address,
          accuracy: null,
          locationSource: "MANUAL_PIN",
          locationCapturedAt: capturedAt,
        });
      }
    }
  };

  const centerOnPin = () => {
    if (mapInstanceRef.current && hasPlacedPin) {
      mapInstanceRef.current.setView([selectedLocation.lat, selectedLocation.lng], 18);
    }
  };

  const copyCoordinates = () => {
    if (!hasPlacedPin) return;
    const text = `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    const initLeaflet = async () => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const L = (await import("leaflet")).default;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const defaultZoom = interactivePicker ? (hasPlacedPin ? 18 : 16) : 16;
      let initialMapLat = userLocation?.lat;
      let initialMapLng = userLocation?.lng;
      let initialMapAcc = userLocation?.accuracy || 15;
      let initialMapAddr = userLocation?.address;

      if ((!initialMapLat || !initialMapLng) && typeof window !== "undefined") {
        const lastKnown = getLastKnownLocation();
        if (lastKnown) {
          initialMapLat = lastKnown.latitude;
          initialMapLng = lastKnown.longitude;
          initialMapAcc = lastKnown.accuracy;
          initialMapAddr = lastKnown.address;
        }
      }

      if (!initialMapLat || !initialMapLng) {
        initialMapLat = initialLat;
        initialMapLng = initialLng;
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        touchZoom: true,
        tapTolerance: 15,
      }).setView([initialMapLat, initialMapLng], defaultZoom);
      mapInstanceRef.current = map;

      // 1. Street Map Layer
      const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      });

      // 2. Aerial Satellite Layer
      const satelliteLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 19,
        }
      );

      tileLayersRef.current = { street: streetLayer, satellite: satelliteLayer };
      streetLayer.addTo(map);

      // Attach Real-time user location or static/persisted userLocation if present
      const effectiveUserLat = userLocation?.lat || (typeof window !== "undefined" ? getLastKnownLocation()?.latitude : null);
      const effectiveUserLng = userLocation?.lng || (typeof window !== "undefined" ? getLastKnownLocation()?.longitude : null);
      const effectiveUserAcc = userLocation?.accuracy || (typeof window !== "undefined" ? getLastKnownLocation()?.accuracy : 15);
      const effectiveUserAddr = userLocation?.address || (typeof window !== "undefined" ? getLastKnownLocation()?.address : undefined);

      if (effectiveUserLat && effectiveUserLng) {
        hasInitiallyCenteredUserRef.current = true;
        updateUserMarker(effectiveUserLat, effectiveUserLng, effectiveUserAcc || 15, false, effectiveUserAddr);
      }

      if (enableRealtimeTracking) {
        startRealtimeLocationTracking(!effectiveUserLat);
      }

      // Picker Mode: If an initial valid location exists (e.g. photo EXIF or existing report), place marker
      if (interactivePicker && hasPlacedPin) {
        await ensurePrecisionMarker(initialLat, initialLng);

        if (initialAccuracy && initialAccuracy > 0) {
          accuracyCircleRef.current = L.circle([initialLat, initialLng], {
            radius: Math.max(initialAccuracy, 5),
            color: "#0284c7",
            fillColor: "#38bdf8",
            fillOpacity: 0.18,
            weight: 2,
            dashArray: "4, 4",
          }).addTo(map);
        }

        reverseGeocode(initialLat, initialLng).then((addr) => {
          if (isMounted && addr) {
            setSelectedLocation((prev) => ({ ...prev, address: addr }));
          }
        });
      }

      // Picker Mode: Tap/click anywhere on the map to place/move the pin
      if (interactivePicker) {
        map.on("click", async (e: any) => {
          stopActiveGpsWatch();
          isManuallyEditedRef.current = true;
          setIsManuallyEdited(true);

          const lat = parseFloat(e.latlng.lat.toFixed(6));
          const lng = parseFloat(e.latlng.lng.toFixed(6));
          const capturedAt = new Date().toISOString();

          await ensurePrecisionMarker(lat, lng);

          if (accuracyCircleRef.current) {
            accuracyCircleRef.current.remove();
            accuracyCircleRef.current = null;
          }
          setGpsAccuracy(null);
          setCurrentLocationSource("MAP_CLICK");

          const address = await reverseGeocode(lat, lng);
          if (isMounted && address) {
            setSelectedLocation({ lat, lng, address });
            if (onLocationSelect) {
              onLocationSelect({
                latitude: lat,
                longitude: lng,
                address,
                accuracy: null,
                locationSource: "MAP_CLICK",
                locationCapturedAt: capturedAt,
              });
            }
          }
        });
      }

      // Hotspots Visualization
      if (hotspots.length > 0) {
        hotspots.forEach((spot) => {
          L.circle([spot.latitude, spot.longitude], {
            color: "#ef4444",
            fillColor: "#ef4444",
            fillOpacity: 0.22,
            weight: 2,
            radius: 100,
          })
            .addTo(map)
            .bindPopup(`<strong>Hazard Cluster:</strong><br/>${spot.count} ${spot.category} reports in this 100m zone.`);
        });
      }

      setMapReady(true);
    };

    initLeaflet();

    return () => {
      isMounted = false;
      setMapReady(false);
      stopActiveGpsWatch();
      stopRealtimeTracking();
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current = null;
      }
      if (userLocationCircleRef.current) {
        userLocationCircleRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dedicated dynamic report markers updater for Viewer Mode (handles async report loading)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || interactivePicker) return;

    let isMounted = true;
    const updateReportsLayer = async () => {
      const L = (await import("leaflet")).default;

      if (!reportsLayerGroupRef.current) {
        reportsLayerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      } else {
        reportsLayerGroupRef.current.clearLayers();
      }

      if (reports.length === 0) return;

      reports.forEach((rep) => {
        const statusColor =
          rep.status === "RESOLVED"
            ? "#10b981"
            : rep.status === "IN_PROGRESS"
            ? "#2563eb"
            : rep.status === "CLOSED"
            ? "#64748b"
            : "#0284c7";

        const customIcon = L.divIcon({
          className: "custom-map-pin",
          html: `<div style="background: ${statusColor}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 12px;">!</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([rep.latitude, rep.longitude], { icon: customIcon }).addTo(
          reportsLayerGroupRef.current
        );

        if (rep.accuracy && rep.accuracy > 0) {
          L.circle([rep.latitude, rep.longitude], {
            radius: rep.accuracy,
            color: statusColor,
            fillColor: statusColor,
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: "3, 3",
          }).addTo(reportsLayerGroupRef.current);
        }

        marker.on("click", () => {
          if (isMounted) {
            setActiveReport(rep);
          }
        });
      });

      // IMPORTANT: Never override user's viewport with foreign seed report bounds
      // if real-time tracking is enabled or if a user location is active!
      const hasActiveUserLocation = !!(userLiveCoordsRef.current || userLocation);
      if (!enableRealtimeTracking && !hasActiveUserLocation) {
        if (reports.length > 1) {
          const bounds = L.latLngBounds(reports.map((r) => [r.latitude, r.longitude]));
          mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
        } else if (reports.length === 1) {
          mapInstanceRef.current.setView([reports[0].latitude, reports[0].longitude], 17);
        }
      }
    };

    updateReportsLayer();

    return () => {
      isMounted = false;
    };
  }, [reports, interactivePicker, mapReady, enableRealtimeTracking, userLocation]);

  // Synchronize Leaflet tile grid with container resize (e.g. desktop AI panel toggle, responsive resize)
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;
    const container = mapContainerRef.current;
    let resizeTimer: any = null;

    const observer = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 50);
    });

    observer.observe(container);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [mapReady]);

  return (
    <div style={{ position: "relative" }}>
      {/* 1. PICKER CONTROLS & HUD */}
      {interactivePicker && (
        <div style={{ marginBottom: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Street / Landmark Search Bar */}
          <form onSubmit={handleSearchStreet} style={{ display: "flex", gap: "8px", position: "relative" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search street, landmark, or area (e.g. Emerald Ave, Shaw Blvd, Amber St)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "36px", height: "42px", fontSize: "0.875rem" }}
              />
              <Search
                size={16}
                color="var(--primary)"
                style={{ position: "absolute", left: "12px", top: "13px" }}
              />
            </div>
            <button type="submit" disabled={isSearching} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
              {isSearching ? <Loader2 size={14} className="spin" /> : <span>Find on Map</span>}
            </button>
          </form>

          {/* Interactive Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1.5px solid var(--primary)",
                borderRadius: "var(--radius-md)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                padding: "8px",
                maxHeight: "220px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                zIndex: 1000,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
                <span>Select Matching Location ({searchResults.length} found):</span>
                <button
                  type="button"
                  onClick={() => setSearchResults([])}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.75rem" }}
                >
                  Close &times;
                </button>
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSearchResult(item)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--primary-light)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <MapPin size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span style={{ fontSize: "0.813rem", color: "var(--text-primary)", lineHeight: 1.3 }}>
                    {item.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Search Error Notice */}
          {searchError && (
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--danger-light)",
                color: "var(--danger-dark)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.813rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{searchError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSearchError(null)}
                style={{ background: "none", border: "none", color: "var(--danger-dark)", cursor: "pointer", fontWeight: 700 }}
              >
                &times;
              </button>
            </div>
          )}

          {/* Active Locating Feedback Banner */}
          {isLocating && (
            <div
              style={{
                padding: "12px 14px",
                backgroundColor: "var(--primary-light)",
                border: "1.5px solid var(--primary)",
                borderRadius: "var(--radius-md)",
                color: "var(--primary-dark)",
                fontSize: "0.813rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Loader2 size={18} className="spin" style={{ flexShrink: 0 }} />
              <div>
                <strong>{locatingStatus || "Detecting your high-accuracy location via device GPS..."}</strong>
                <div style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "2px" }}>
                  Waiting for reliable satellite lock. You can also tap the map or drag the pin anytime.
                </div>
              </div>
            </div>
          )}

          {/* Requirement 5: Location Permission & Service Handling Banner */}
          {gpsError && (
            <div
              role="alert"
              style={{
                padding: "14px 16px",
                backgroundColor: "#fffbeb",
                border: "1.5px solid #f59e0b",
                borderRadius: "var(--radius-md)",
                color: "#92400e",
                fontSize: "0.813rem",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong style={{ fontSize: "0.875rem" }}>We couldn&apos;t get your exact location.</strong>
                  <div style={{ marginTop: "3px", lineHeight: 1.4 }}>
                    {gpsError}
                  </div>
                  <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#78350f" }}>
                    {permissionState === "denied" || permissionState === "blocked" ? (
                      <span>
                        <strong>To enable GPS:</strong> Click the lock/info icon (🔒) in your browser address bar and set <strong>Location</strong> to <em>Allow</em>.
                      </span>
                    ) : permissionState === "disabled" ? (
                      <span>
                        <strong>To enable GPS:</strong> Turn on <strong>Location Services</strong> in your phone or computer settings.
                      </span>
                    ) : (
                      <span>
                        Please check your network connection or tap directly on the map to position the pin.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ marginLeft: "30px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginTop: "2px" }}>
                <button
                  type="button"
                  onClick={acquireDeviceLocation}
                  className="btn btn-sm btn-secondary"
                  style={{
                    padding: "4px 12px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    borderColor: "#d97706",
                    color: "#92400e",
                  }}
                >
                  <Navigation size={12} />
                  <span>Retry Device GPS</span>
                </button>
                <span style={{ fontSize: "0.75rem", color: "#78350f", fontWeight: 600 }}>
                  or tap the map directly to select your location.
                </span>
              </div>
            </div>
          )}

          {/* Low Confidence Warning (Accuracy > 35m) */}
          {gpsAccuracy !== null && gpsAccuracy > 35 && !isManuallyEdited && (
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "var(--radius-md)",
                color: "#92400e",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Info size={15} color="#d97706" style={{ flexShrink: 0 }} />
              <span>
                <strong>Approximate GPS Reading:</strong> Accuracy is ±{Math.round(gpsAccuracy)}m. You can drag the pin or tap the map to fine-tune your exact location.
              </span>
            </div>
          )}

          {/* Action Bar: "Use My Current Location", Accuracy Status Badge & Coordinates HUD */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <button
              type="button"
              onClick={acquireDeviceLocation}
              disabled={isLocating}
              className="btn btn-secondary btn-sm"
              style={{
                borderColor: "var(--primary)",
                color: "var(--primary)",
                backgroundColor: "var(--primary-light)",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {isLocating ? <Loader2 size={15} className="spin" /> : <Navigation size={15} />}
              <span>{isLocating ? "Acquiring GPS..." : "Use My Current Location"}</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {/* GPS Accuracy Indicator (Requirement 2 & 4) */}
              {hasPlacedPin && gpsAccuracy !== null && !isManuallyEdited && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: gpsAccuracy <= 15 ? "var(--success-dark)" : gpsAccuracy <= 35 ? "var(--primary)" : "#b45309",
                    backgroundColor: gpsAccuracy <= 15 ? "var(--success-light)" : gpsAccuracy <= 35 ? "var(--primary-light)" : "#fef3c7",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    border: `1px solid ${gpsAccuracy <= 15 ? "var(--success)" : gpsAccuracy <= 35 ? "var(--primary)" : "#f59e0b"}`,
                  }}
                >
                  <Crosshair size={13} />
                  <span>Location accuracy: &plusmn;{Math.round(gpsAccuracy)} meters</span>
                </span>
              )}

              {/* Manual Placement Status Pill */}
              {hasPlacedPin && isManuallyEdited && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--primary-dark)",
                    backgroundColor: "var(--primary-light)",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    border: "1px solid var(--primary)",
                  }}
                >
                  <MapPin size={13} />
                  <span>Manually pinned on map</span>
                </span>
              )}

              {/* Unplaced Marker Notice */}
              {!hasPlacedPin && !isLocating && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#92400e",
                    backgroundColor: "#fef3c7",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    border: "1px solid #f59e0b",
                  }}
                >
                  <MapPin size={13} />
                  <span>Tap map to place pin</span>
                </span>
              )}

              {/* Coordinates HUD & Copy */}
              {hasPlacedPin && (
                <button
                  type="button"
                  onClick={copyCoordinates}
                  title="Copy Exact Coordinates"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                    padding: "4px 10px",
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border-medium)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                  }}
                >
                  {copiedCoords ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                  <span>
                    {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. LEAFLET MAP CONTAINER */}
      <div
        style={{
          position: "relative",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1.5px solid var(--border-medium)",
        }}
      >
        <div ref={mapContainerRef} style={{ width: "100%", height, minHeight: "340px" }} />

        {/* Unplaced Pin Floating Guidance Overlay */}
        {interactivePicker && !hasPlacedPin && !isLocating && (
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(6px)",
              padding: "8px 16px",
              borderRadius: "9999px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              border: "1px solid var(--primary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.813rem",
              fontWeight: 700,
              color: "var(--primary-dark)",
              pointerEvents: "none",
            }}
          >
            <MapPin size={16} color="var(--primary)" />
            <span>Tap anywhere on the map to set the problem pin</span>
          </div>
        )}

        {/* Floating Layer Switcher (Street vs Satellite View) */}
        <div
          style={{
            position: "absolute",
            top: `${controlsOffsetTop}px`,
            right: "12px",
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
            borderRadius: "var(--radius-md)",
            padding: "3px",
            display: "flex",
            gap: "2px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            border: "1px solid var(--border-medium)",
          }}
        >
          <button
            type="button"
            onClick={() => toggleTileLayer("street")}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 700,
              backgroundColor: activeLayer === "street" ? "var(--primary)" : "transparent",
              color: activeLayer === "street" ? "#ffffff" : "var(--text-secondary)",
              transition: "all 0.15s ease",
            }}
          >
            Street
          </button>
          <button
            type="button"
            onClick={() => toggleTileLayer("satellite")}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 700,
              backgroundColor: activeLayer === "satellite" ? "var(--primary)" : "transparent",
              color: activeLayer === "satellite" ? "#ffffff" : "var(--text-secondary)",
              transition: "all 0.15s ease",
            }}
          >
            Satellite
          </button>
        </div>

        {/* Prominent Floating "Locating you..." Status Banner */}
        {enableRealtimeTracking && !liveUserCoords && (
          <div
            style={{
              position: "absolute",
              top: `${controlsOffsetTop}px`,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 18px",
              borderRadius: "9999px",
              backgroundColor: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(8px)",
              border: "1.5px solid var(--primary)",
              boxShadow: "0 4px 16px rgba(37, 99, 235, 0.25)",
              color: "var(--primary-dark)",
              fontSize: "0.813rem",
              fontWeight: 700,
              pointerEvents: "none",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <Loader2 size={14} className="spin" color="var(--primary)" />
            <span>Locating you...</span>
          </div>
        )}

        {/* Prominent Floating "Locate Me" Button */}
        {(showLocateMeControl ?? true) && (
          <div
            style={{
              position: "absolute",
              top: `${controlsOffsetTop + 40}px`,
              right: "12px",
              zIndex: 1000,
            }}
          >
            <button
              type="button"
              onClick={handleLocateMeAction}
              disabled={locateBtnState === "locating"}
              title="Find and center on my current position"
              aria-label="Find my location"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "9999px",
                backgroundColor: "rgba(255, 255, 255, 0.97)",
                backdropFilter: "blur(8px)",
                border:
                  locateBtnState === "found"
                    ? "1.5px solid #16a34a"
                    : locateBtnState === "locating"
                    ? "1.5px solid #2563eb"
                    : "1.5px solid var(--border-medium)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.16)",
                cursor: locateBtnState === "locating" ? "wait" : "pointer",
                fontSize: "0.813rem",
                fontWeight: 700,
                color:
                  locateBtnState === "found"
                    ? "#15803d"
                    : locateBtnState === "locating"
                    ? "#1d4ed8"
                    : "#1e40af",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                if (locateBtnState === "idle") {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 99, 235, 0.25)";
                  e.currentTarget.style.borderColor = "#2563eb";
                }
              }}
              onMouseLeave={(e) => {
                if (locateBtnState === "idle") {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.97)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.16)";
                  e.currentTarget.style.borderColor = "var(--border-medium)";
                }
              }}
            >
              {locateBtnState === "locating" ? (
                <>
                  <Loader2 size={15} className="spin" color="#2563eb" />
                  <span>Locating...</span>
                </>
              ) : locateBtnState === "found" ? (
                <>
                  <Check size={15} color="#16a34a" />
                  <span>Location Found</span>
                </>
              ) : (
                <>
                  <MapPin size={15} color="#2563eb" />
                  <span>Locate Me</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Micro-nudge Precision Touch Controls */}
        {interactivePicker && hasPlacedPin && (
          <div
            style={{
              position: "absolute",
              right: "12px",
              bottom: "12px",
              zIndex: 1000,
              backgroundColor: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(8px)",
              padding: "8px",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              border: "1px solid var(--border-medium)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "2px" }}>
              <span style={{ fontSize: "0.625rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Nudge Pin
              </span>
              <button
                type="button"
                onClick={() => setNudgeStep(nudgeStep === "fine" ? "standard" : "fine")}
                title="Toggle Step Size (1m fine vs 5m step)"
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 800,
                  color: "var(--primary)",
                  backgroundColor: "var(--primary-light)",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {nudgeStep === "fine" ? "1m" : "5m"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => nudgePin(1, 0)}
              title="Nudge North"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "6px",
                border: "1px solid var(--border-medium)",
                background: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowUp size={15} color="var(--primary)" />
            </button>

            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                onClick={() => nudgePin(0, -1)}
                title="Nudge West"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-medium)",
                  background: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeft size={15} color="var(--primary)" />
              </button>

              <button
                type="button"
                onClick={centerOnPin}
                title="Re-center on pin"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "6px",
                  border: "1px solid var(--primary)",
                  background: "var(--primary-light)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LocateFixed size={14} color="var(--primary)" />
              </button>

              <button
                type="button"
                onClick={() => nudgePin(0, 1)}
                title="Nudge East"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-medium)",
                  background: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={15} color="var(--primary)" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => nudgePin(-1, 0)}
              title="Nudge South"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "6px",
                border: "1px solid var(--border-medium)",
                background: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowDown size={15} color="var(--primary)" />
            </button>
          </div>
        )}
      </div>

      {/* 3. MOBILE BOTTOM SHEET (Viewer Mode) */}
      {activeReport && (
        <>
          {/* Backdrop overlay */}
          <div
            onClick={() => setActiveReport(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              zIndex: 99,
            }}
          />

          <div
            className="bottom-sheet mobile-bottom-sheet"
            style={{
              position: "fixed",
              bottom: "var(--bottom-nav-height, 0px)",
              left: 0,
              right: 0,
              zIndex: 100,
              backgroundColor: "var(--bg-card)",
              borderTopLeftRadius: "var(--radius-xl)",
              borderTopRightRadius: "var(--radius-xl)",
              boxShadow: "0 -10px 32px rgba(15, 23, 42, 0.25)",
              padding: "16px 20px 20px 20px",
              border: "1px solid var(--border-medium)",
              animation: "slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
              maxHeight: "75vh",
              overflowY: "auto",
            }}
          >
            <div style={{ width: "40px", height: "4px", backgroundColor: "var(--border-medium)", borderRadius: "2px", margin: "0 auto 14px auto" }} />

            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
              {/* Optional Thumbnail */}
              {(activeReport.photos?.[0]?.photoUrl || activeReport.photoUrl) && (
                <div
                  style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    flexShrink: 0,
                    border: "1.5px solid var(--border-medium)",
                    backgroundColor: "var(--bg-subtle)",
                  }}
                >
                  <img
                    src={activeReport.photos?.[0]?.photoUrl || activeReport.photoUrl || ""}
                    alt={activeReport.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)" }}>
                    {activeReport.referenceNo}
                  </span>
                  <StatusBadge status={activeReport.status} size="sm" />
                  {activeReport.priority && <PriorityBadge priority={activeReport.priority} />}
                </div>
                <h3 style={{ fontSize: "1.063rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>
                  {activeReport.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveReport(null)}
                aria-label="Close report details"
                style={{
                  background: "var(--bg-subtle)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.813rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
              <MapPin size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeReport.address}</span>
            </div>

            {activeReport.accuracy && (
              <div style={{ fontSize: "0.75rem", color: "var(--success-dark)", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16a34a" }} />
                <span>Verified GPS accuracy: &plusmn;{Math.round(activeReport.accuracy)} meters</span>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <NextLink
                href={`/reports/${activeReport.referenceNo}`}
                className="btn btn-primary btn-block"
                style={{
                  justifyContent: "center",
                  minHeight: "48px",
                  borderRadius: "14px",
                  fontWeight: 800,
                  fontSize: "0.938rem",
                }}
              >
                <span>View Full Report Details</span>
                <ChevronRight size={18} />
              </NextLink>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        :global(.user-live-location-icon) {
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
        :global(.user-pulse-marker) {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        :global(.user-pulse-ring) {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.25);
          animation: userLocationPulse 2s ease-out infinite;
          pointer-events: none;
        }
        :global(.user-core-dot) {
          position: relative;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #2563eb;
          border: 3px solid #ffffff;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.7), 0 2px 6px rgba(0, 0, 0, 0.3);
          z-index: 2;
        }
        :global(.user-location-badge) {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: #1e40af;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 9999px;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
          pointer-events: none;
          letter-spacing: 0.3px;
          z-index: 3;
        }
        @keyframes userLocationPulse {
          0% {
            transform: scale(0.5);
            opacity: 0.9;
          }
          70% {
            transform: scale(1.6);
            opacity: 0.15;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
