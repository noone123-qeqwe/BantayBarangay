"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PhotoUploader from "@/components/PhotoUploader";
import InteractiveMap from "@/components/InteractiveMap";
import { CategoryItem } from "@/types";
import confetti from "canvas-confetti";
import { getLastKnownLocation, saveLastKnownLocation } from "@/lib/locationStorage";
import SmartReportAssistantModal from "@/components/SmartReportAssistantModal";
import AiReportQualityCard from "@/components/AiReportQualityCard";
import { checkReportQuality, detectSevereSafetyHazard } from "@/lib/aiService";
import { saveOfflineReport } from "@/lib/offlineQueue";
import {
  AlertTriangle,
  Lightbulb,
  Zap,
  Flame,
  Droplets,
  Waves,
  Trash2,
  TreePine,
  Signpost,
  Pipette,
  Building2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Camera,
  MapPin,
  Clock,
  ShieldAlert,
  Loader2,
  Copy,
  ExternalLink,
  Info,
  CheckCircle2,
  Edit3,
  Crosshair,
  Search,
  WifiOff,
} from "lucide-react";

// Category icon mapper
const ICON_MAP: Record<string, React.ElementType> = {
  AlertTriangle,
  Lightbulb,
  Zap,
  Flame,
  Droplets,
  Waves,
  Trash2,
  TreePine,
  Signpost,
  Pipette,
  Building2,
  Sparkles,
};

export default function NewReportWizard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Wizard Step: 1 to 5, or 6 (Success)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [description, setDescription] = useState("");
  const [whenStarted, setWhenStarted] = useState("TODAY");
  const [safetyFlag, setSafetyFlag] = useState<"NO" | "POSSIBLY" | "URGENT">("NO");
  const [blocksTraffic, setBlocksTraffic] = useState(false);
  const [photos, setPhotos] = useState<Array<{ url: string; type: "BEFORE"; caption?: string }>>([]);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  }>({
    latitude: 14.5839,
    longitude: 121.0615,
    address: "Waiting for location...",
  });
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationSource, setLocationSource] = useState<string>("INITIAL");
  const [locationCapturedAt, setLocationCapturedAt] = useState<string | null>(null);
  const [landmarkGuide, setLandmarkGuide] = useState("");
  const [roadPlacement, setRoadPlacement] = useState<string>("");
  const [photoGpsDetected, setPhotoGpsDetected] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocatingAddress, setIsLocatingAddress] = useState(false);
  const [addressLocateError, setAddressLocateError] = useState<string | null>(null);

  // AI Assistance & Quality State
  const [showSmartAssistant, setShowSmartAssistant] = useState(false);
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState<CategoryItem | null>(null);
  const [isCheckingCategory, setIsCheckingCategory] = useState(false);

  // Auto-suggest category from description
  useEffect(() => {
    if (description.trim().length >= 12 && categories.length > 0) {
      const timer = setTimeout(async () => {
        try {
          setIsCheckingCategory(true);
          const res = await fetch("/api/ai/suggest-category", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description }),
          });
          const data = await res.json();
          if (data.suggestion?.suggestedCategoryId) {
            const matched = categories.find((c) => c.id === data.suggestion.suggestedCategoryId);
            if (matched && matched.id !== selectedCategory?.id) {
              setAiSuggestedCategory(matched);
            }
          }
        } catch (e) {
          // Silent fallback
        } finally {
          setIsCheckingCategory(false);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [description, categories, selectedCategory]);

  const hazardCheck = detectSevereSafetyHazard(description);
  useEffect(() => {
    if (hazardCheck.isHazard && safetyFlag !== "URGENT") {
      setSafetyFlag("URGENT");
    }
  }, [hazardCheck.isHazard]);

  const qualityResult = checkReportQuality({
    categorySelected: !!selectedCategory,
    description,
    hasPhoto: photos.length > 0,
    hasLocation: hasSelectedLocation && locationConfirmed,
  });

  // Load last known valid device location if available (prevents defaulting to Manila)
  useEffect(() => {
    const lastKnown = getLastKnownLocation();
    if (lastKnown && locationSource === "INITIAL") {
      setLocation({
        latitude: lastKnown.latitude,
        longitude: lastKnown.longitude,
        address: lastKnown.address || "Resolving location...",
      });
      setLocationAccuracy(lastKnown.accuracy);
      setLocationSource(lastKnown.source || "LAST_KNOWN");
      setLocationCapturedAt(lastKnown.capturedAt);
    }
  }, [locationSource]);

  // Geocode address manually typed into the Street Address input
  const handleGeocodeAddress = async (addrToSearch?: string) => {
    const query = (addrToSearch || location.address).trim();
    if (!query) return;

    setIsLocatingAddress(true);
    setAddressLocateError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ph&limit=1&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const formattedAddress = data[0].display_name.split(",").slice(0, 4).join(", ").trim();
        const capturedAt = new Date().toISOString();
        setLocation({
          latitude: lat,
          longitude: lng,
          address: formattedAddress,
        });
        setHasSelectedLocation(true);
        setLocationAccuracy(null);
        setLocationSource("SEARCH");
        setLocationCapturedAt(capturedAt);
        setLocationConfirmed(false); // Reset so user confirms
      } else {
        setAddressLocateError(`Could not pinpoint "${query}". Try searching by street name or drag the pin directly on the map.`);
      }
    } catch (err) {
      console.error("Geocoding address error:", err);
      setAddressLocateError("Address lookup failed. You can adjust the pin directly on the map.");
    } finally {
      setIsLocatingAddress(false);
    }
  };

  // Duplicate Check
  const [potentialDuplicates, setPotentialDuplicates] = useState<any[]>([]);
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdReferenceNo, setCreatedReferenceNo] = useState<string | null>(null);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-fill physical scene coordinates from uploaded photo EXIF metadata
  const handleExifLocation = async (coords: { latitude: number; longitude: number }) => {
    setPhotoGpsDetected(coords);
    setLocationAccuracy(5); // Physical camera sensor precision (~5m)
    const capturedAt = new Date().toISOString();
    setLocationSource("PHOTO_EXIF");
    setLocationCapturedAt(capturedAt);
    setHasSelectedLocation(true);
    setLocationConfirmed(false);
    setLocation((prev) => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude,
    }));
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          const parts = data.display_name.split(",").slice(0, 4).join(", ").trim();
          setLocation((prev) => ({ ...prev, address: parts }));
        }
      }
    } catch (e) {
      console.warn("Photo EXIF reverse geocoding fallback:", e);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      } else {
        router.replace("/login");
      }
      return;
    }

    // Fetch dynamic categories
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    loadCategories();
  }, [user, loading]);

  // Duplicate check when category + location changes
  useEffect(() => {
    if (selectedCategory && location.latitude && location.longitude && currentStep === 4) {
      const checkDuplicates = async () => {
        try {
          const res = await fetch("/api/reports/duplicate-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categoryId: selectedCategory.id,
              latitude: location.latitude,
              longitude: location.longitude,
              radiusMeters: 150,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setPotentialDuplicates(data.duplicates || []);
          }
        } catch (e) {
          console.error("Duplicate check error:", e);
        }
      };
      checkDuplicates();
    }
  }, [selectedCategory, location, currentStep]);

  const handleNext = () => {
    setSubmitError(null);
    if (currentStep === 1 && !selectedCategory) {
      setSubmitError("Please select a problem category to continue.");
      return;
    }
    if (currentStep === 2 && (!description || description.trim().length < 10)) {
      setSubmitError("Please provide a clear description of at least 10 characters.");
      return;
    }
    if (currentStep === 3 && photos.length === 0) {
      setSubmitError("Please attach at least one photo of the infrastructure problem.");
      return;
    }
    if (currentStep === 4) {
      if (!hasSelectedLocation) {
        setSubmitError("Please wait for GPS detection or tap the map to select the problem location before continuing.");
        const mapElem = document.getElementById("problem-map-picker");
        if (mapElem) {
          mapElem.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      if (!locationConfirmed) {
        setSubmitError("Please review the Report Location section and click 'Confirm Location' before continuing.");
        const confirmElem = document.getElementById("report-location-confirmation");
        if (confirmElem) {
          confirmElem.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setSubmitError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const placementPrefix = roadPlacement ? `[${roadPlacement}] ` : "";
      const combinedLandmark = `${placementPrefix}${landmarkGuide.trim()}`.trim();

      if (!hasSelectedLocation || !locationConfirmed) {
        setSubmitError("Please confirm your report location before submitting.");
        setCurrentStep(4);
        return;
      }

      const payload = {
        categoryId: selectedCategory?.id,
        description: description.trim(),
        safetyFlag,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: locationAccuracy !== null && locationAccuracy !== undefined ? locationAccuracy : null,
        locationSource: locationSource && locationSource !== "INITIAL" ? locationSource : "MANUAL_PIN",
        locationCapturedAt: locationCapturedAt || new Date().toISOString(),
        address: location.address,
        landmark: combinedLandmark || (blocksTraffic ? "Blocks roadway / traffic" : undefined),
        photos,
        duplicateOfId: potentialDuplicates.length > 0 && !duplicateDismissed ? potentialDuplicates[0].id : undefined,
      };

      // If device is offline, save to offline outbox directly
      if (typeof window !== "undefined" && !navigator.onLine) {
        const offlineItem = saveOfflineReport({
          categoryId: selectedCategory?.id || "general",
          categoryName: selectedCategory?.name,
          title: `${selectedCategory?.name || "Civic Issue"} at ${location.address}`,
          description: description.trim(),
          safetyFlag,
          priority: safetyFlag === "URGENT" ? "CRITICAL" : "MEDIUM",
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          accuracy: locationAccuracy,
          locationSource: locationSource || "OFFLINE_QUEUED",
          locationCapturedAt: locationCapturedAt || new Date().toISOString(),
          landmark: combinedLandmark,
          roadPlacement,
          photos,
        });

        setCreatedReferenceNo(offlineItem.id);
        setIsOfflineSaved(true);
        setCurrentStep(6);
        return;
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report. Please try again.");
      }

      setCreatedReferenceNo(data.report.referenceNo);
      setIsOfflineSaved(false);
      setCurrentStep(6); // Success screen

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch (err: any) {
      console.error("Submission error:", err);
      // Fallback: If network failed, save to offline outbox
      if (typeof window !== "undefined" && (!navigator.onLine || err.message?.includes("fetch") || err.name === "TypeError")) {
        const placementPrefix = roadPlacement ? `[${roadPlacement}] ` : "";
        const combinedLandmark = `${placementPrefix}${landmarkGuide.trim()}`.trim();
        const offlineItem = saveOfflineReport({
          categoryId: selectedCategory?.id || "general",
          categoryName: selectedCategory?.name,
          title: `${selectedCategory?.name || "Civic Issue"} at ${location.address}`,
          description: description.trim(),
          safetyFlag,
          priority: safetyFlag === "URGENT" ? "CRITICAL" : "MEDIUM",
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          accuracy: locationAccuracy,
          locationSource: locationSource || "OFFLINE_QUEUED",
          locationCapturedAt: locationCapturedAt || new Date().toISOString(),
          landmark: combinedLandmark,
          roadPlacement,
          photos,
        });

        setCreatedReferenceNo(offlineItem.id);
        setIsOfflineSaved(true);
        setCurrentStep(6);
        return;
      }
      setSubmitError(err.message || "We couldn't submit your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (createdReferenceNo) {
      navigator.clipboard.writeText(createdReferenceNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading || !user) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "60px 20px" }}>
        <Loader2 size={32} className="spin" style={{ margin: "0 auto", color: "var(--primary)" }} />
      </div>
    );
  }

  // SUCCESS STEP (Step 6) - Section 15
  if (currentStep === 6 && createdReferenceNo) {
    return (
      <div className="page-container" style={{ maxWidth: "600px", padding: "40px 16px" }}>
        <div
          className="card"
          style={{
            padding: "40px 28px",
            textAlign: "center",
            boxShadow: "var(--shadow-xl)",
            border: `2px solid ${isOfflineSaved ? "var(--warning)" : "var(--success)"}`,
            backgroundColor: "var(--bg-surface)",
          }}
        >
          {/* Success or Offline Icon */}
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              backgroundColor: isOfflineSaved ? "var(--warning-light)" : "var(--success-light)",
              color: isOfflineSaved ? "var(--warning-dark)" : "var(--success-dark)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto",
              boxShadow: isOfflineSaved ? "0 8px 24px rgba(245, 158, 11, 0.25)" : "0 8px 24px rgba(16, 185, 129, 0.25)",
            }}
          >
            {isOfflineSaved ? <WifiOff size={32} /> : <Check size={36} strokeWidth={3} />}
          </div>

          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)" }}>
            {isOfflineSaved ? "Saved to Offline Outbox" : "Report Submitted Successfully"}
          </h1>

          {/* Reference Pill */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: isOfflineSaved ? "1.25rem" : "1.875rem",
              fontWeight: 800,
              color: isOfflineSaved ? "var(--warning-dark)" : "var(--primary)",
              margin: "16px 0",
              letterSpacing: "0.05em",
              wordBreak: "break-all",
            }}
          >
            {createdReferenceNo}
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.938rem", maxWidth: "440px", margin: "0 auto 24px auto", lineHeight: 1.5 }}>
            {isOfflineSaved
              ? "You are currently offline. We saved your report securely on this device. It will automatically submit to barangay operations as soon as your internet connection is restored."
              : "Your report has been recorded. You can track its progress from My Reports."}
          </p>

          <button
            type="button"
            onClick={handleCopyRef}
            className="btn btn-sm btn-secondary"
            style={{ margin: "0 auto 28px auto" }}
          >
            <Copy size={14} />
            <span>{copied ? "Copied to Clipboard!" : isOfflineSaved ? "Copy Outbox Reference" : "Copy Reference Number"}</span>
          </button>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            {!isOfflineSaved && (
              <NextLink href={`/reports/${createdReferenceNo}`} className="btn btn-primary btn-lg">
                <span>View Report</span>
                <ArrowRight size={18} />
              </NextLink>
            )}

            <NextLink href="/dashboard" className="btn btn-secondary btn-lg">
              <span>Back to Home Dashboard</span>
            </NextLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "800px" }}>
      {/* Wizard Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Report an Issue
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.938rem", marginTop: "2px" }}>
          Help keep our community safe and better. Follow the guided steps below.
        </p>
      </div>

      {/* Mobile-First Progress Header */}
      <div
        className="mobile-stepper-header"
        style={{
          marginBottom: "20px",
          padding: "14px 18px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "16px",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--primary)", letterSpacing: "0.04em" }}>
            Step {currentStep} of 5
          </span>
          <span style={{ fontSize: "0.813rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {currentStep === 1 && "Category Selection"}
            {currentStep === 2 && "Problem Details"}
            {currentStep === 3 && "Photo Proof"}
            {currentStep === 4 && "Location Pinning"}
            {currentStep === 5 && "Review & Submit"}
          </span>
        </div>
        {/* Animated Progress Bar */}
        <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-subtle)", borderRadius: "9999px", overflow: "hidden" }}>
          <div
            style={{
              width: `${(currentStep / 5) * 100}%`,
              height: "100%",
              backgroundColor: "var(--primary)",
              borderRadius: "9999px",
              transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>
      </div>

      {/* Progress Stepper - Desktop */}
      <div className="stepper desktop-stepper" style={{ marginBottom: "28px" }}>
        {[
          { num: 1, label: "Category" },
          { num: 2, label: "Details" },
          { num: 3, label: "Photo" },
          { num: 4, label: "Location" },
          { num: 5, label: "Review" },
        ].map((s) => (
          <div
            key={s.num}
            className={`step-item ${currentStep === s.num ? "active" : currentStep > s.num ? "completed" : ""}`}
          >
            <div className="step-circle">
              {currentStep > s.num ? <Check size={16} strokeWidth={3} /> : s.num}
            </div>
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Global Form Error */}
      {submitError && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            backgroundColor: "var(--danger-light)",
            color: "var(--danger-dark)",
            borderRadius: "var(--radius-md)",
            marginBottom: "24px",
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>{submitError}</span>
        </div>
      )}

      {/* STEP 1: CATEGORY SELECTION - Section 10 */}
      {currentStep === 1 && (
        <div className="card" style={{ padding: "28px 24px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "6px" }}>
            Select Issue Category
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "22px" }}>
            Choose the category that best matches the infrastructure problem. This routes your report to the appropriate responding team.
          </p>

          {/* AI Category Suggestion Banner */}
          {aiSuggestedCategory && selectedCategory?.id !== aiSuggestedCategory.id && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "12px 16px",
                backgroundColor: "var(--primary-light)",
                border: "1px solid var(--primary)",
                borderRadius: "var(--radius-md)",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Sparkles size={20} style={{ color: "var(--primary)", flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)", display: "block" }}>
                    AI Suggestion: {aiSuggestedCategory.name}
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Based on your details. You can apply this suggestion or keep your chosen category.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setSelectedCategory(aiSuggestedCategory);
                  setSubmitError(null);
                }}
              >
                Apply Suggestion
              </button>
            </div>
          )}

          <div
            className="category-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            {categories.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || AlertTriangle;
              const isSelected = selectedCategory?.id === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSubmitError(null);
                  }}
                  className={`category-card ${isSelected ? "selected" : ""}`}
                  style={{
                    padding: "18px 16px",
                    borderRadius: "var(--radius-lg)",
                    border: `2px solid ${isSelected ? "var(--primary)" : "var(--border-subtle)"}`,
                    backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-surface)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        backgroundColor: isSelected ? "var(--primary)" : "var(--bg-subtle)",
                        color: isSelected ? "#ffffff" : "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Icon size={22} />
                    </div>

                    {isSelected && (
                      <span
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          backgroundColor: "var(--primary)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <strong style={{ fontSize: "0.938rem", color: "var(--text-primary)", marginTop: "4px" }}>
                    {cat.name}
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    {cat.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: REPORT DETAILS - Section 11 */}
      {currentStep === 2 && (
        <div className="card" style={{ padding: "28px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>
              Describe the Problem
            </h2>
            <span style={{ fontSize: "0.813rem", fontWeight: 700, color: "var(--primary)", backgroundColor: "var(--primary-light)", padding: "4px 10px", borderRadius: "9999px" }}>
              {selectedCategory?.name}
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "22px" }}>
            Provide clear details so technicians arrive with the proper materials and equipment.
          </p>

          {/* Life Safety Hazard Alert */}
          {hazardCheck.isHazard && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px 16px",
                backgroundColor: "rgba(220, 38, 38, 0.15)",
                border: "1.5px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "var(--radius-md)",
                marginBottom: "20px",
                color: "#fca5a5",
              }}
            >
              <ShieldAlert size={24} style={{ color: "#f87171", flexShrink: 0, marginTop: "2px" }} />
              <div style={{ fontSize: "0.875rem" }}>
                <strong style={{ display: "block", color: "#f87171", fontWeight: 800 }}>
                  Immediate Safety Hazard Detected ({hazardCheck.matchedHazard || "Life-Safety Hazard"})
                </strong>
                <p style={{ margin: "4px 0 8px 0", color: "#fca5a5", lineHeight: 1.4 }}>
                  This issue poses an immediate danger to residents. If this is an active emergency requiring immediate dispatch:
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <a
                    href="tel:0286431111"
                    className="btn btn-sm"
                    style={{ backgroundColor: "#DC2626", color: "#FFFFFF", fontWeight: 700, padding: "6px 12px" }}
                  >
                    Call Pasig Emergency: (02) 8643-1111
                  </a>
                  <a
                    href="tel:911"
                    className="btn btn-sm"
                    style={{ backgroundColor: "#991B1B", color: "#FFFFFF", fontWeight: 700, padding: "6px 12px" }}
                  >
                    Call 911
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <label className="form-label" htmlFor="desc" style={{ marginBottom: 0 }}>
                Description of the Issue *
              </label>
              <button
                type="button"
                onClick={() => setShowSmartAssistant(true)}
                className="btn btn-sm"
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(79, 70, 229, 0.25)",
                }}
              >
                <Sparkles size={14} />
                <span>✨ Help Me Write My Report</span>
              </button>
            </div>
            <textarea
              id="desc"
              className="form-control"
              rows={4}
              placeholder="Describe what is happening and where the problem can be found."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "12px" }}>
              <span>Be specific about severity, dimensions, or prominent landmarks nearby.</span>
              <span>{description.length} characters (min 10)</span>
            </div>

            {/* Quick Suggestion Tags for Mobile */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                Suggested Quick Descriptions (tap to add):
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[
                  "Deep pothole on roadway",
                  "Busted streetlight / dark road",
                  "Dangling power cable / low wire",
                  "Clogged drainage / flooded street",
                  "Fallen tree branch blocking walkway",
                  "Uncollected garbage pile",
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => {
                      setDescription((curr) => (curr ? `${curr}. ${promptText}` : promptText));
                      setSubmitError(null);
                    }}
                    className="btn btn-sm btn-secondary"
                    style={{
                      fontSize: "0.75rem",
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      border: "1px solid var(--border-medium)",
                    }}
                  >
                    + {promptText}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">When did you first notice this problem?</label>
            <select
              className="form-control"
              value={whenStarted}
              onChange={(e) => setWhenStarted(e.target.value)}
            >
              <option value="TODAY">Today / Just now</option>
              <option value="FEW_DAYS">A few days ago</option>
              <option value="OVER_A_WEEK">More than a week ago</option>
              <option value="ONGOING">Persistent recurring issue</option>
            </select>
          </div>

          {/* Safety Danger Level Flag */}
          <div
            style={{
              marginTop: "24px",
              padding: "20px",
              backgroundColor: "var(--bg-subtle)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <label className="form-label" style={{ marginBottom: "12px" }}>
              <ShieldAlert size={18} color="var(--danger)" />
              <span>Is this issue dangerous or an immediate safety concern?</span>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {[
                { val: "NO", label: "No (Routine)" },
                { val: "POSSIBLY", label: "Possibly Hazard" },
                { val: "URGENT", label: "Yes — Urgent Danger!" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSafetyFlag(opt.val as any)}
                  style={{
                    padding: "12px 8px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.813rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: `2px solid ${safetyFlag === opt.val
                        ? opt.val === "URGENT"
                          ? "var(--danger)"
                          : "var(--primary)"
                        : "var(--border-medium)"
                      }`,
                    backgroundColor:
                      safetyFlag === opt.val
                        ? opt.val === "URGENT"
                          ? "var(--danger-light)"
                          : "var(--primary-light)"
                        : "var(--bg-surface)",
                    color:
                      safetyFlag === opt.val
                        ? opt.val === "URGENT"
                          ? "var(--danger-dark)"
                          : "var(--primary-dark)"
                        : "var(--text-primary)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Emergency Advisory Callout */}
            {safetyFlag === "URGENT" && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--danger-light)",
                  border: "1.5px solid var(--danger)",
                  color: "var(--danger-dark)",
                  fontSize: "0.813rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>Important Emergency Advisory:</strong> For active live wires, major gas leaks, or imminent structural collapses threatening life, contact emergency hotline <strong>911</strong> or Barangay Dispatch at <strong>(02) 8643-1111</strong> immediately.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: PHOTO UPLOAD UX - Section 12 */}
      {currentStep === 3 && (
        <div className="card" style={{ padding: "28px 24px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "6px" }}>
            Attach Photo Proof
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "22px" }}>
            Clear photos provide immediate visual evidence so repair crews bring the correct equipment and parts.
          </p>

          <PhotoUploader
            photos={photos}
            onChange={(newPhotos) => {
              setPhotos(newPhotos as any);
              setSubmitError(null);
            }}
            onExifLocation={handleExifLocation}
            maxPhotos={4}
          />

          {photoGpsDetected && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--success-light)",
                border: "1px solid var(--success)",
                color: "var(--success-dark)",
                fontSize: "0.813rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontWeight: 600,
              }}
            >
              <Camera size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Physical Photo GPS Detected:</strong> Location auto-locked to ({photoGpsDetected.latitude.toFixed(5)}, {photoGpsDetected.longitude.toFixed(5)}). We'll carry this over to the location step!
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: LOCATION UX - Section 13 */}
      {currentStep === 4 && (
        <div className="card" style={{ padding: "28px 24px" }} id="problem-map-picker">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "6px" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                Problem Location & Precision Pin
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
                Switch to Satellite view to see real pavement and roofs, use High-Accuracy GPS, or nudge the crosshair directly over the problem.
              </p>
            </div>
            {locationAccuracy && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: locationAccuracy <= 12 ? "var(--success-dark)" : "var(--primary)",
                  backgroundColor: locationAccuracy <= 12 ? "var(--success-light)" : "var(--primary-light)",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Crosshair size={13} />
                <span>Accuracy: ±{Math.round(locationAccuracy)}m</span>
              </span>
            )}
          </div>

          {photoGpsDetected && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--success-light)",
                border: "1px solid var(--success)",
                color: "var(--success-dark)",
                fontSize: "0.813rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
              }}
            >
              <Camera size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Camera GPS Locked:</strong> Coordinates auto-populated from physical photo capture ({photoGpsDetected.latitude.toFixed(5)}, {photoGpsDetected.longitude.toFixed(5)}).
              </span>
            </div>
          )}

          {/* Interactive Precision Map */}
          <InteractiveMap
            interactivePicker={true}
            autoDetectGps={true}
            initialLat={location.latitude}
            initialLng={location.longitude}
            accuracy={locationAccuracy}
            locationSource={locationSource}
            onLocationSelect={(loc) => {
              setLocation({
                latitude: loc.latitude,
                longitude: loc.longitude,
                address: loc.address,
              });
              setHasSelectedLocation(true);
              if (loc.accuracy !== undefined) {
                setLocationAccuracy(loc.accuracy);
              }
              if (loc.locationSource) {
                setLocationSource(loc.locationSource);
                if (loc.locationSource === "DEVICE_GPS") {
                  saveLastKnownLocation({
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    accuracy: loc.accuracy,
                    address: loc.address,
                    capturedAt: loc.locationCapturedAt || new Date().toISOString(),
                    source: "DEVICE_GPS",
                  });
                }
              }
              if (loc.locationCapturedAt) {
                setLocationCapturedAt(loc.locationCapturedAt);
              }
              setLocationConfirmed(false);
              setSubmitError(null);
            }}
          />

          {/* Location Refinement & Guidance Card */}
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              backgroundColor: "var(--bg-subtle)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-medium)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Street Address Field */}
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label className="form-label" style={{ margin: 0 }}>
                  <MapPin size={16} color="var(--primary)" />
                  <span>Street Address (Auto-detected or edit manually) *</span>
                </label>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  className="form-control"
                  value={location.address}
                  onChange={(e) => setLocation({ ...location, address: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleGeocodeAddress();
                    }
                  }}
                  placeholder="e.g. 123 Rizal St, or nearby landmark"
                  required
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => handleGeocodeAddress()}
                  disabled={isLocatingAddress || !location.address.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
                  title="Locate this street on the map"
                >
                  {isLocatingAddress ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
                  <span>Locate on Map</span>
                </button>
              </div>
              {addressLocateError && (
                <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <AlertTriangle size={13} />
                  <span>{addressLocateError}</span>
                </div>
              )}
              <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                💡 Tip: If your GPS was off, type your exact street/building above and click <strong>Locate on Map</strong> or tap directly on the map.
              </div>
            </div>

            {/* Exact Road Position Tags */}
            <div>
              <label className="form-label" style={{ marginBottom: "6px", display: "block" }}>
                <span>Exact Road Position / Segment</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "normal" }}> (Helps dispatch team pinpoint the exact lane or sidewalk)</span>
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  "Northbound Lane",
                  "Southbound Lane",
                  "Sidewalk / Pedestrian",
                  "Intersection / Corner",
                  "Alley / Pathway",
                  "Center Median",
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setRoadPlacement(roadPlacement === opt ? "" : opt)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: `1.5px solid ${roadPlacement === opt ? "var(--primary)" : "var(--border-medium)"}`,
                      backgroundColor: roadPlacement === opt ? "var(--primary-light)" : "var(--bg-surface)",
                      color: roadPlacement === opt ? "var(--primary-dark)" : "var(--text-secondary)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {roadPlacement === opt ? `✓ ${opt}` : opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Landmark / Dispatch Guide */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ margin: 0, marginBottom: "4px" }}>
                <Sparkles size={16} color="var(--accent)" />
                <span>Specific Landmark or Location Guide (Crucial for Dispatch Crews)</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={landmarkGuide}
                onChange={(e) => setLandmarkGuide(e.target.value)}
                placeholder="e.g. Beside Meralco pole #M-204, in front of 7-Eleven, northbound near Pearl Drive"
              />
              <span className="form-hint" style={{ marginTop: "4px", display: "block" }}>
                Gives physical landmarks on the ground so heavy trucks and technicians find the problem immediately without delays.
              </span>
            </div>

            {/* Accuracy Indicator Callout */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span>
                Geospatial Status:{" "}
                {hasSelectedLocation ? (
                  <strong style={{ color: "var(--success-dark)" }}>✓ Precision Coordinates Synced</strong>
                ) : (
                  <strong style={{ color: "var(--warning-dark)" }}>⏳ Awaiting Location Selection</strong>
                )}
              </span>
              {locationAccuracy !== null ? (
                <span style={{ color: locationAccuracy <= 15 ? "var(--success-dark)" : "var(--primary)", fontWeight: 700 }}>
                  Location accuracy: &plusmn;{Math.round(locationAccuracy)} meters
                </span>
              ) : (
                <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                  {locationSource === "MANUAL_PIN" || locationSource === "MAP_CLICK"
                    ? "Manually Pinned on Map"
                    : hasSelectedLocation
                    ? "Coordinates Selected"
                    : "No Pin Placed"}
                </span>
              )}
            </div>
          </div>

          {/* Section 6 Requirement: PREVENT INCORRECT LOCATION SUBMISSION */}
          <div
            id="report-location-confirmation"
            style={{
              marginTop: "20px",
              padding: "22px 24px",
              borderRadius: "var(--radius-lg)",
              border: locationConfirmed
                ? "2px solid var(--success)"
                : "2px solid var(--primary)",
              backgroundColor: locationConfirmed
                ? "rgba(16, 185, 129, 0.05)"
                : "var(--bg-subtle)",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={22} color={locationConfirmed ? "var(--success)" : "var(--primary)"} />
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                  Report Location
                </h3>
              </div>
              {locationConfirmed ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "var(--success-light)",
                    color: "var(--success-dark)",
                    padding: "5px 14px",
                    borderRadius: "9999px",
                    fontSize: "0.813rem",
                    fontWeight: 800,
                    border: "1px solid var(--success)",
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Location Confirmed</span>
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "var(--warning-light)",
                    color: "var(--warning-dark)",
                    padding: "5px 14px",
                    borderRadius: "9999px",
                    fontSize: "0.813rem",
                    fontWeight: 700,
                    border: "1px solid var(--warning)",
                  }}
                >
                  <AlertTriangle size={15} />
                  <span>Confirmation Required</span>
                </span>
              )}
            </div>

            {/* Map Preview (Requirement 6) */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                Map Preview
              </div>
              {hasSelectedLocation ? (
                <div
                  style={{
                    height: "190px",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    border: "1.5px solid var(--border-medium)",
                    position: "relative",
                  }}
                >
                  <InteractiveMap
                    interactivePicker={false}
                    initialLat={location.latitude}
                    initialLng={location.longitude}
                    accuracy={locationAccuracy}
                    reports={[
                      {
                        id: "preview-confirm",
                        referenceNo: "PIN",
                        title: "Selected Problem Location",
                        status: "SUBMITTED",
                        priority: "HIGH",
                        latitude: location.latitude,
                        longitude: location.longitude,
                        accuracy: locationAccuracy,
                        address: location.address,
                      },
                    ]}
                    height="190px"
                  />
                </div>
              ) : (
                <div
                  style={{
                    height: "120px",
                    backgroundColor: "var(--bg-surface)",
                    borderRadius: "var(--radius-md)",
                    border: "1.5px dashed var(--border-medium)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    color: "var(--text-muted)",
                    padding: "12px",
                    textAlign: "center",
                  }}
                >
                  <MapPin size={22} color="var(--primary)" />
                  <span style={{ fontSize: "0.813rem", fontWeight: 600 }}>
                    Map preview will appear once location is detected via GPS or pinned on the map above.
                  </span>
                </div>
              )}
            </div>

            {/* Location Specs Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Selected Address
                </div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4 }}>
                  {hasSelectedLocation ? location.address : "Awaiting location selection..."}
                </div>
              </div>

              <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Exact Coordinates
                </div>
                {hasSelectedLocation ? (
                  <>
                    <div style={{ fontSize: "0.875rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                      Lat: {location.latitude.toFixed(6)}
                    </div>
                    <div style={{ fontSize: "0.875rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                      Lng: {location.longitude.toFixed(6)}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: "0.813rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    Coordinates not locked yet
                  </div>
                )}
              </div>

              <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Location Accuracy & Source
                </div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: locationAccuracy && locationAccuracy <= 15 ? "var(--success-dark)" : "var(--primary)" }}>
                  {locationAccuracy !== null
                    ? `Location accuracy: ±${Math.round(locationAccuracy)} meters`
                    : locationSource === "MANUAL_PIN" || locationSource === "MAP_CLICK"
                    ? "Manually pinned on map"
                    : hasSelectedLocation
                    ? "Coordinates locked"
                    : "Not yet acquired"}
                </div>
                {hasSelectedLocation && locationSource && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Source: {locationSource.replace(/_/g, " ")}
                  </div>
                )}
              </div>
            </div>

            {/* Is this the correct location? Prompt & Buttons */}
            <div
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <div>
                <strong style={{ fontSize: "0.938rem", color: "var(--text-primary)", display: "block" }}>
                  Is this the correct location?
                </strong>
                <span style={{ fontSize: "0.813rem", color: "var(--text-secondary)" }}>
                  Please confirm the pin matches the exact location of the infrastructure problem before proceeding.
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    const mapElem = document.getElementById("problem-map-picker");
                    if (mapElem) {
                      mapElem.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                    setLocationConfirmed(false);
                  }}
                  className="btn btn-secondary"
                  style={{ fontWeight: 700 }}
                >
                  <Edit3 size={15} />
                  <span>Adjust Location</span>
                </button>

                <button
                  type="button"
                  disabled={!hasSelectedLocation}
                  onClick={() => {
                    if (!hasSelectedLocation) return;
                    setLocationConfirmed(true);
                    setSubmitError(null);
                  }}
                  className="btn btn-primary"
                  style={{
                    backgroundColor: locationConfirmed ? "var(--success)" : "var(--primary)",
                    borderColor: locationConfirmed ? "var(--success)" : "var(--primary)",
                    fontWeight: 800,
                    opacity: !hasSelectedLocation ? 0.6 : 1,
                    cursor: !hasSelectedLocation ? "not-allowed" : "pointer",
                  }}
                >
                  <Check size={16} />
                  <span>{locationConfirmed ? "Location Confirmed ✓" : "Confirm Location"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Duplicate Detection Alert */}
          {potentialDuplicates.length > 0 && !duplicateDismissed && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                backgroundColor: "var(--warning-light)",
                border: "1.5px solid var(--warning)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <AlertTriangle size={18} color="var(--warning-dark)" />
                <strong style={{ fontSize: "0.938rem", color: "var(--warning-dark)" }}>
                  Possible Duplicate Report Detected Nearby ({potentialDuplicates[0].distanceMeters}m away)
                </strong>
              </div>

              <p style={{ fontSize: "0.813rem", color: "var(--text-primary)", marginBottom: "12px" }}>
                A neighbor already reported a <strong>{selectedCategory?.name}</strong> at {potentialDuplicates[0].address}.
              </p>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a
                  href={`/reports/${potentialDuplicates[0].referenceNo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-secondary"
                >
                  <ExternalLink size={14} />
                  <span>View Existing Report</span>
                </a>

                <button
                  type="button"
                  onClick={() => setDuplicateDismissed(true)}
                  className="btn btn-sm btn-outline"
                >
                  <span>Submit Anyway (Link as Related)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: REVIEW SCREEN - Section 14 */}
      {currentStep === 5 && (
        <div className="card" style={{ padding: "28px 24px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "6px" }}>
            Review Report Before Submission
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "24px" }}>
            Please confirm all details are correct. You can edit any section before final submission.
          </p>

          {/* AI Pre-Submission Quality Check Checklist Card */}
          <AiReportQualityCard quality={qualityResult} onGoToStep={(step) => setCurrentStep(step)} />

          <div style={{ display: "grid", gap: "16px" }}>
            {/* 1. Issue Card */}
            <div
              style={{
                padding: "18px 20px",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Issue Details
                  </span>
                  <div style={{ fontSize: "1.063rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}>
                    {selectedCategory?.name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-sm btn-outline"
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
              </div>
              <p style={{ fontSize: "0.938rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "8px 0" }}>
                {description}
              </p>
              <div style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>
                Safety Concern: <strong style={{ color: safetyFlag === "URGENT" ? "var(--danger)" : "var(--text-primary)" }}>{safetyFlag}</strong>
              </div>
            </div>

            {/* 2. Photos Card */}
            <div
              style={{
                padding: "18px 20px",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Photos Attached ({photos.length})
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="btn btn-sm btn-outline"
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {photos.map((p, idx) => (
                  <img
                    key={idx}
                    src={p.url}
                    alt="Proof thumb"
                    style={{
                      width: "88px",
                      height: "88px",
                      objectFit: "cover",
                      borderRadius: "var(--radius-md)",
                      border: "1.5px solid var(--border-medium)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 3. Report Location Card */}
            <div
              style={{
                padding: "18px 20px",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Report Location
                  </span>
                  <span
                    style={{
                      fontSize: "0.688rem",
                      fontWeight: 800,
                      color: "var(--success-dark)",
                      backgroundColor: "var(--success-light)",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      border: "1px solid var(--success)",
                    }}
                  >
                    <CheckCircle2 size={12} />
                    <span>Location Confirmed</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="btn btn-sm btn-outline"
                >
                  <Edit3 size={13} />
                  <span>Adjust Location</span>
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={18} color="var(--primary)" />
                <strong style={{ fontSize: "0.938rem", color: "var(--text-primary)" }}>{location.address}</strong>
              </div>

              {/* Confirmed Map Preview */}
              <div
                style={{
                  height: "170px",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: "1px solid var(--border-medium)",
                  marginTop: "12px",
                  marginBottom: "12px",
                  position: "relative",
                }}
              >
                <InteractiveMap
                  interactivePicker={false}
                  initialLat={location.latitude}
                  initialLng={location.longitude}
                  accuracy={locationAccuracy}
                  reports={[
                    {
                      id: "review-preview",
                      referenceNo: "CONFIRMED",
                      title: "Confirmed Problem Location",
                      status: "SUBMITTED",
                      priority: "HIGH",
                      latitude: location.latitude,
                      longitude: location.longitude,
                      accuracy: locationAccuracy,
                      address: location.address,
                    },
                  ]}
                  height="170px"
                />
              </div>

              {(roadPlacement || landmarkGuide) && (
                <div style={{ marginTop: "8px", fontSize: "0.813rem", color: "var(--primary-dark)", backgroundColor: "var(--primary-light)", padding: "8px 12px", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", gap: "3px" }}>
                  {roadPlacement && (
                    <div>
                      <strong>Placement:</strong> {roadPlacement}
                    </div>
                  )}
                  {landmarkGuide && (
                    <div>
                      <strong>Landmark Guide:</strong> {landmarkGuide}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", flexWrap: "wrap", gap: "8px" }}>
                <span>GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
                {locationAccuracy !== null && (
                  <span style={{ color: "var(--success-dark)", fontWeight: 700 }}>
                    Location accuracy: &plusmn;{Math.round(locationAccuracy)} meters
                  </span>
                )}
                <span>Source: {locationSource.replace(/_/g, " ")}</span>
              </div>
            </div>

            {/* 4. Responsibility Card */}
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--primary-light)",
                border: "1px solid rgba(2, 132, 199, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Building2 size={24} color="var(--primary)" />
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary-dark)", textTransform: "uppercase" }}>
                  Possible Responsible Agency
                </span>
                <strong style={{ display: "block", fontSize: "0.938rem", color: "var(--primary-dark)" }}>
                  {selectedCategory?.defaultAgency?.name || "Community Operations & Maintenance"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons (Back & Continue / Submit Report) */}
      <div
        className="wizard-nav-footer"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "24px",
          gap: "12px",
        }}
      >
        {currentStep > 1 ? (
          <button type="button" onClick={handleBack} className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        ) : (
          <NextLink href="/dashboard" className="btn btn-secondary">
            <span>Cancel</span>
          </NextLink>
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary btn-lg"
            style={{ minWidth: "140px", fontWeight: 800, minHeight: "48px" }}
          >
            <span>Continue</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !locationConfirmed}
            className="btn btn-primary btn-lg"
            style={{
              padding: "12px 28px",
              fontWeight: 800,
              boxShadow: "0 6px 20px var(--primary-glow)",
              minHeight: "50px",
              minWidth: "180px",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Submit Report</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Smart Report Assistant Modal */}
      <SmartReportAssistantModal
        isOpen={showSmartAssistant}
        onClose={() => setShowSmartAssistant(false)}
        initialProblem={description}
        initialLocation={location.address !== "Waiting for location..." ? location.address : ""}
        onApplyDescription={(draftText) => {
          setDescription(draftText);
          setShowSmartAssistant(false);
        }}
      />

      <style jsx>{`
        @media (max-width: 640px) {
          .desktop-stepper {
            display: none !important;
          }
          .category-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .category-card {
            padding: 12px 10px !important;
            gap: 6px !important;
          }
          .wizard-nav-footer {
            padding-bottom: 24px;
          }
        }
        @media (min-width: 641px) {
          .mobile-stepper-header {
            display: none !important;
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
