"use client";

import React, { useEffect, useState } from "react";
import InteractiveMap from "@/components/InteractiveMap";
import { CategoryItem } from "@/types";
import { getLastKnownLocation, saveLastKnownLocation } from "@/lib/locationStorage";
import {
  MapPin,
  Filter,
  Layers,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
  Navigation,
  Check,
  RotateCcw,
  Info,
  Flame,
  ChevronRight,
  Bot,
} from "lucide-react";
import { useAiAssistant } from "@/context/AiAssistantContext";
import { AiAssistantPanel } from "@/components/AiAssistantWidget";

export default function CommunityMapPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  // AI Assistant coordination
  const {
    isOpen: isAiOpen,
    setIsOpen: setIsAiOpen,
    toggleOpen: toggleAi,
    sheetState,
    setSheetState,
  } = useAiAssistant();

  // Mobile modal sheets
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileLegend, setShowMobileLegend] = useState(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number; address?: string } | null>(() => {
    if (typeof window !== "undefined") {
      const lastKnown = getLastKnownLocation();
      if (lastKnown) {
        return {
          lat: lastKnown.latitude,
          lng: lastKnown.longitude,
          accuracy: lastKnown.accuracy,
          address: lastKnown.address,
        };
      }
    }
    return null;
  });
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locateError, setLocateError] = useState<{ title: string; message: string; hint?: string } | null>(null);
  const [centerTrigger, setCenterTrigger] = useState(0);

  const handleLocateMe = () => {
    setIsLocatingUser(true);
    setLocateError(null);
    setCenterTrigger((prev) => prev + 1);
  };

  // Immediate initialization check with last known valid device location (prevents jump to Manila on refresh)
  useEffect(() => {
    const lastKnown = getLastKnownLocation();
    if (lastKnown) {
      setUserLocation((curr) => curr || {
        lat: lastKnown.latitude,
        lng: lastKnown.longitude,
        accuracy: lastKnown.accuracy,
        address: lastKnown.address,
      });
    }
  }, []);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));

    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => setHotspots(data.hotspots || []))
      .catch(() => {});
  }, []);

  const loadMapReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.append("categoryId", selectedCategory);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedPriority !== "ALL") params.append("priority", selectedPriority);

      const res = await fetch(`/api/reports/nearby?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Map reports error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapReports();
  }, [selectedCategory, selectedStatus, selectedPriority]);

  const handleClearFilters = () => {
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
    setSelectedPriority("ALL");
  };

  const activeFiltersCount =
    (selectedCategory !== "ALL" ? 1 : 0) +
    (selectedStatus !== "ALL" ? 1 : 0) +
    (selectedPriority !== "ALL" ? 1 : 0);

  // Build filter chips
  const catName = categories.find((c) => c.id === selectedCategory)?.name;
  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (selectedCategory !== "ALL" && catName) {
    activeChips.push({ key: "cat", label: catName, onRemove: () => setSelectedCategory("ALL") });
  }
  if (selectedStatus !== "ALL") {
    activeChips.push({ key: "sta", label: selectedStatus.replace(/_/g, " "), onRemove: () => setSelectedStatus("ALL") });
  }
  if (selectedPriority !== "ALL") {
    activeChips.push({ key: "pri", label: `${selectedPriority} Priority`, onRemove: () => setSelectedPriority("ALL") });
  }

  return (
    <div className="community-map-page-wrapper">
      {/* ============================================================ */}
      {/* MOBILE-FIRST FULL BLEED MAP LAYOUT (Shown on Mobile screens) */}
      {/* ============================================================ */}
      <div className="mobile-map-experience">
        {/* Floating Top Category Pill Bar */}
        <div className="mobile-map-topbar">
          <div className="mobile-pills-scroll">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`mobile-filter-pill ${selectedCategory === "ALL" ? "active" : ""}`}
            >
              <span>All ({reports.length})</span>
            </button>

            {categories.map((c) => {
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? "ALL" : c.id)}
                  className={`mobile-filter-pill ${isSelected ? "active" : ""}`}
                >
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            aria-label="Open map filters"
            className="mobile-filter-btn"
          >
            <Filter size={16} />
            {activeFiltersCount > 0 && <span className="mobile-filter-count">{activeFiltersCount}</span>}
          </button>
        </div>

        {/* Floating Top GPS Banner (if locating or has accuracy) */}
        {isLocatingUser && (
          <div className="mobile-gps-banner">
            <Loader2 size={14} className="spin" />
            <span>Locking onto high-accuracy GPS...</span>
          </div>
        )}

        {locateError && (
          <div className="mobile-error-toast">
            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: "0.75rem", lineHeight: 1.3 }}>
              <strong>{locateError.title}:</strong> {locateError.message}
            </div>
            <button type="button" onClick={() => setLocateError(null)} className="toast-close">
              &times;
            </button>
          </div>
        )}

        {/* Full-bleed Interactive Map for Mobile */}
        <div className="mobile-map-container">
          <InteractiveMap
            interactivePicker={false}
            enableRealtimeTracking={true}
            showLocateMeControl={false}
            centerTrigger={centerTrigger}
            userLocation={userLocation}
            initialLat={userLocation?.lat}
            initialLng={userLocation?.lng}
            onUserLocationUpdate={(pos) => {
              setUserLocation(pos);
              setIsLocatingUser(false);
              setLocateError(null);
              saveLastKnownLocation({
                latitude: pos.lat,
                longitude: pos.lng,
                accuracy: pos.accuracy,
                address: pos.address,
                capturedAt: new Date().toISOString(),
                source: "DEVICE_GPS",
              });
            }}
            onLocationPermissionChange={(status, err) => {
              if (status === "denied" || status === "disabled" || status === "unavailable") {
                setLocateError(
                  err || {
                    title: "Location Unavailable",
                    message: "Please enable GPS or tap to center.",
                  }
                );
                setIsLocatingUser(false);
              } else if (status === "granted") {
                setLocateError(null);
              }
            }}
            reports={reports}
            hotspots={hotspots}
            height="100%"
            controlsOffsetTop={58}
          />
        </div>

        {/* Floating Bottom-Right Controls (Thumb zone) */}
        <div className={`mobile-floating-actions ${isAiOpen && sheetState !== "peek" ? "sheet-active" : ""}`}>
          <button
            type="button"
            onClick={() => setShowMobileLegend(true)}
            aria-label="Map legend and hotspots"
            className="mobile-fab mobile-fab-secondary"
            title="Map legend & hotspots"
          >
            <Layers size={18} />
            {hotspots.length > 0 && <span className="hotspot-badge">{hotspots.length}</span>}
          </button>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocatingUser}
            aria-label="Locate me with GPS"
            className="mobile-fab mobile-fab-primary"
            title="Locate my position"
          >
            {isLocatingUser ? <Loader2 size={20} className="spin" /> : <Navigation size={20} />}
          </button>

          {/* Floating AI Button (Visible when sheet is closed) */}
          {!isAiOpen && (
            <button
              type="button"
              onClick={() => {
                setSheetState("half");
                setIsAiOpen(true);
              }}
              aria-label="Open BantayBarangay AI Assistant"
              className="mobile-fab mobile-fab-ai"
              title="Ask AI Assistant"
            >
              <Sparkles size={20} />
            </button>
          )}
        </div>

        {/* Mobile AI Assistant Bottom Sheet */}
        {isAiOpen && (
          <>
            {sheetState === "expanded" && (
              <div
                className="mobile-sheet-backdrop"
                onClick={() => setSheetState("half")}
              />
            )}
            <AiAssistantPanel
              mode="mobile-sheet"
              sheetState={sheetState}
              onSheetStateChange={setSheetState}
              onClose={() => setIsAiOpen(false)}
            />
          </>
        )}

        {/* Mobile Filters Bottom Sheet */}
        {showMobileFilters && (
          <>
            <div className="mobile-sheet-backdrop" onClick={() => setShowMobileFilters(false)} />
            <div className="mobile-bottom-sheet map-filter-sheet">
              <div className="sheet-handle" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Filter size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 800, margin: 0 }}>Filter Map Reports</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status Filter */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.813rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px" }}>
                  Report Status
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { id: "ALL", label: "All Statuses" },
                    { id: "SUBMITTED", label: "Submitted" },
                    { id: "IN_PROGRESS", label: "In Progress" },
                    { id: "RESOLVED", label: "Resolved" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStatus(s.id)}
                      className={`sheet-option-btn ${selectedStatus === s.id ? "selected" : ""}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.813rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px" }}>
                  Hazard Priority
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { id: "ALL", label: "All Priorities" },
                    { id: "CRITICAL", label: "Critical" },
                    { id: "HIGH", label: "High" },
                    { id: "MEDIUM", label: "Medium" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPriority(p.id)}
                      className={`sheet-option-btn ${selectedPriority === p.id ? "selected" : ""}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    handleClearFilters();
                    setShowMobileFilters(false);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: "center", minHeight: "48px", borderRadius: "14px" }}
                >
                  <RotateCcw size={16} />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: "center", minHeight: "48px", borderRadius: "14px", fontWeight: 800 }}
                >
                  <span>Apply ({reports.length} markers)</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Mobile Legend & Hotspots Bottom Sheet */}
        {showMobileLegend && (
          <>
            <div className="mobile-sheet-backdrop" onClick={() => setShowMobileLegend(false)} />
            <div className="mobile-bottom-sheet map-legend-sheet">
              <div className="sheet-handle" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Layers size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 800, margin: 0 }}>Map Legend & Safety</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileLegend(false)}
                  style={{ background: "none", border: "none", padding: "6px", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Live Location Marker */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", backgroundColor: "var(--bg-subtle)", borderRadius: "12px", marginBottom: "14px" }}>
                <span style={{ position: "relative", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ position: "absolute", width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "rgba(37,99,235,0.22)" }} />
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#2563eb", border: "2px solid #ffffff", zIndex: 1 }} />
                </span>
                <div>
                  <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>Your Current Location</strong>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Real-time GPS tracking with accuracy circle
                  </span>
                </div>
              </div>

              {/* Status Marker Colors */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.813rem" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#2563eb", flexShrink: 0 }} />
                  <span>Submitted / Review</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.813rem" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#f59e0b", flexShrink: 0 }} />
                  <span>In Progress</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.813rem" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#10b981", flexShrink: 0 }} />
                  <span>Resolved</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.813rem" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#64748b", flexShrink: 0 }} />
                  <span>Closed Case</span>
                </div>
              </div>

              {/* Hotspots Section */}
              {hotspots.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", color: "var(--danger-dark)", fontSize: "0.875rem", fontWeight: 700 }}>
                    <Flame size={16} color="var(--danger)" />
                    <span>Clustered Problem Hotspots ({hotspots.length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                    {hotspots.map((spot, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "10px",
                          backgroundColor: "var(--danger-light)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          fontSize: "0.75rem",
                          color: "var(--danger-dark)",
                        }}
                      >
                        <strong>{spot.count} {spot.category}</strong> reports clustered near ({spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowMobileLegend(false)}
                className="btn btn-primary btn-block"
                style={{ justifyContent: "center", minHeight: "48px", borderRadius: "14px", fontWeight: 700 }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* DESKTOP VIEWPORT LAYOUT (Shown on Desktop screens > 768px)  */}
      {/* ============================================================ */}
      <div className="desktop-map-experience page-container">
        {/* Modern Geospatial Hub Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  backgroundColor: "var(--primary-light)",
                  color: "var(--primary-dark)",
                  fontSize: "0.688rem",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  border: "1px solid rgba(37, 99, 235, 0.2)",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--primary)" }} />
                <span>Live Geospatial Hub</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
                  }}
                >
                  <MapPin size={22} />
                </div>
                <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 1.875rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Community Infrastructure Map
                </h1>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "9999px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-xs)",
                fontSize: "0.813rem",
                color: "var(--text-secondary)",
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }} />
              <span><strong>{reports.length}</strong> active markers loaded</span>
            </div>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.938rem", maxWidth: "720px", margin: 0 }}>
            Real-time geospatial tracking of citizen infrastructure reports, municipal work crews, and public repairs across the barangay.
          </p>
        </div>

        {/* Modern Filter Dock */}
        <div
          className="card"
          style={{
            padding: "16px 20px",
            marginBottom: "18px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
            background: "var(--bg-glass-dock)",
            backdropFilter: "blur(14px)",
            borderRadius: "16px",
            border: "1px solid rgba(226, 232, 240, 0.85)",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 700 }}>
            <Filter size={16} color="var(--primary)" />
            <span>Filters:</span>
          </div>

          <select
            className="form-control"
            style={{ width: "auto", flex: "1 1 170px" }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: "auto", flex: "1 1 140px" }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            className="form-control"
            style={{ width: "auto", flex: "1 1 140px" }}
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Hazards</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocatingUser}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: "var(--primary)",
              color: userLocation ? "var(--primary-dark)" : "var(--primary)",
              backgroundColor: userLocation ? "var(--primary-light)" : "transparent",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "7px",
              borderRadius: "9999px",
              padding: "8px 16px",
            }}
          >
            {isLocatingUser ? <Loader2 size={14} className="spin" /> : <Navigation size={14} />}
            <span>{isLocatingUser ? "Locating..." : userLocation ? "Recenter My Location" : "Locate Me"}</span>
          </button>

          <button
            type="button"
            onClick={toggleAi}
            className={`btn ${isAiOpen ? "btn-primary" : "btn-secondary"} btn-sm`}
            style={{
              borderColor: isAiOpen ? "var(--primary)" : "var(--border-medium)",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "7px",
              borderRadius: "9999px",
              padding: "8px 16px",
            }}
            title={isAiOpen ? "Minimize AI Assistant" : "Open BantayBarangay AI Assistant"}
          >
            <Sparkles size={14} />
            <span>{isAiOpen ? "AI Panel Open" : "Ask AI Assistant"}</span>
          </button>

          {userLocation && userLocation.accuracy && (
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--success-dark)",
                backgroundColor: "var(--success-light)",
                padding: "5px 12px",
                borderRadius: "9999px",
                border: "1px solid var(--success)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#16a34a" }} />
              <span>GPS Active (&plusmn;{Math.round(userLocation.accuracy)}m)</span>
              {userLocation.address && (
                <span style={{ opacity: 0.85, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  • {userLocation.address}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Removable Chips */}
        {activeChips.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Active:
            </span>
            {activeChips.map((chip) => (
              <span key={chip.key} className="filter-chip">
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Remove filter ${chip.label}`}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "inherit",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <X size={13} />
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                background: "none",
                border: "none",
                color: "var(--danger)",
                fontSize: "0.813rem",
                fontWeight: 700,
                cursor: "pointer",
                marginLeft: "4px",
                textDecoration: "underline",
              }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Desktop Coordinated Map & AI Assistant Layout */}
        <div className="desktop-map-ai-container">
          <div className={`desktop-map-column ${isAiOpen ? "with-ai-open" : "full-width"}`}>
            <div
              className="card desktop-map-card"
              style={{
                padding: "8px",
                overflow: "hidden",
                borderRadius: "20px",
                border: "1px solid rgba(226, 232, 240, 0.85)",
                boxShadow: "0 10px 30px -4px rgba(15, 23, 42, 0.08)",
                position: "relative",
              }}
            >
              {loading && (
                <div style={{ padding: "8px 12px", textAlign: "center", fontSize: "0.813rem", color: "var(--primary)", fontWeight: 600 }}>
                  Updating map markers...
                </div>
              )}
              <InteractiveMap
                interactivePicker={false}
                enableRealtimeTracking={true}
                showLocateMeControl={true}
                centerTrigger={centerTrigger}
                userLocation={userLocation}
                initialLat={userLocation?.lat}
                initialLng={userLocation?.lng}
                onUserLocationUpdate={(pos) => {
                  setUserLocation(pos);
                  setIsLocatingUser(false);
                  setLocateError(null);
                  saveLastKnownLocation({
                    latitude: pos.lat,
                    longitude: pos.lng,
                    accuracy: pos.accuracy,
                    address: pos.address,
                    capturedAt: new Date().toISOString(),
                    source: "DEVICE_GPS",
                  });
                }}
                reports={reports}
                hotspots={hotspots}
                height="580px"
                controlsOffsetTop={14}
              />

              {/* Floating AI Button on map corner when AI is closed */}
              {!isAiOpen && (
                <button
                  type="button"
                  onClick={() => setIsAiOpen(true)}
                  className="desktop-floating-ai-toggle"
                  title="Open BantayBarangay AI Assistant"
                >
                  <Sparkles size={16} />
                  <span>Ask AI Assistant</span>
                </button>
              )}
            </div>
          </div>

          {/* Dedicated Desktop AI Side Panel */}
          {isAiOpen && (
            <aside className="desktop-ai-column">
              <AiAssistantPanel
                mode="desktop-side"
                onClose={() => setIsAiOpen(false)}
              />
            </aside>
          )}
        </div>

        {/* Desktop Legend & Hotspots Info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Map Legend */}
          <div className="card" style={{ padding: "20px", borderRadius: "16px", border: "1px solid rgba(226, 232, 240, 0.85)" }}>
            <h3 style={{ fontSize: "0.938rem", fontWeight: 700, marginBottom: "14px" }}>Status Marker Legend</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.813rem" }}>
              {/* Real-time User Location Marker Legend */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ position: "relative", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ position: "absolute", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "rgba(37,99,235,0.22)" }} />
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#2563eb", border: "2px solid #ffffff", zIndex: 1, boxShadow: "0 0 6px rgba(37,99,235,0.6)" }} />
                </span>
                <div>
                  <strong style={{ color: "var(--text-primary)" }}>You are here</strong>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Live device GPS tracking with accuracy indicator
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#2563eb", flexShrink: 0, boxShadow: "0 0 4px rgba(37,99,235,0.4)" }} />
                  <span>Submitted / Review</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#f59e0b", flexShrink: 0, boxShadow: "0 0 4px rgba(245,158,11,0.4)" }} />
                  <span>In Progress</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#10b981", flexShrink: 0, boxShadow: "0 0 4px rgba(16,185,129,0.4)" }} />
                  <span>Resolved</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#64748b", flexShrink: 0 }} />
                  <span>Closed Case</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hotspots Detected */}
          <div className="card" style={{ padding: "20px", borderRadius: "16px", border: "1px solid rgba(226, 232, 240, 0.85)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--danger)",
                }}
              >
                <AlertTriangle size={16} />
              </div>
              <h3 style={{ fontSize: "0.938rem", fontWeight: 700 }}>Recurring Problem Hotspots</h3>
            </div>
            {hotspots.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {hotspots.map((spot, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "10px",
                      backgroundColor: "var(--danger-light)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      fontSize: "0.813rem",
                      color: "var(--danger-dark)",
                    }}
                  >
                    <strong>{spot.count} {spot.category}</strong> reports clustered near ({spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)})
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "0.813rem", color: "var(--text-muted)" }}>
                No critical geographic problem clusters detected at this time.
              </p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .community-map-page-wrapper {
          position: relative;
          width: 100%;
        }

        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Default: Mobile first layout */
        .mobile-map-experience {
          display: block;
          position: relative;
          width: 100%;
          height: calc(100dvh - var(--header-height, 60px) - var(--bottom-nav-height, 62px));
          overflow: hidden;
        }
        .desktop-map-experience {
          display: none;
        }

        .mobile-map-container {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        /* Floating Top Bar */
        .mobile-map-topbar {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          z-index: 30;
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: none;
        }

        .mobile-pills-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          pointer-events: auto;
          padding: 2px 2px;
          flex: 1;
        }
        .mobile-pills-scroll::-webkit-scrollbar {
          display: none;
        }

        .mobile-filter-pill {
          padding: 8px 14px;
          border-radius: 9999px;
          font-size: 0.813rem;
          font-weight: 700;
          white-space: nowrap;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: var(--text-secondary);
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .mobile-filter-pill.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
        }

        .mobile-filter-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
          pointer-events: auto;
          flex-shrink: 0;
          position: relative;
        }
        .mobile-filter-count {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--primary);
          color: #ffffff;
          font-size: 0.625rem;
          font-weight: 800;
          border-radius: 9999px;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #ffffff;
        }

        /* Floating GPS Feedback */
        .mobile-gps-banner {
          position: absolute;
          top: 60px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 30;
          background: rgba(37, 99, 235, 0.94);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 9999px;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          display: flex;
          align-items: center;
          gap: 6px;
          pointer-events: none;
        }

        .mobile-error-toast {
          position: absolute;
          top: 60px;
          left: 12px;
          right: 12px;
          z-index: 30;
          background: #fffbeb;
          border: 1px solid #f59e0b;
          color: #92400e;
          padding: 8px 12px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
        }
        .toast-close {
          background: none;
          border: none;
          font-size: 1.125rem;
          color: #92400e;
          cursor: pointer;
          padding: 0 4px;
        }

        /* Floating Bottom Actions (Thumb zone) */
        .mobile-floating-actions {
          position: absolute;
          bottom: 20px;
          right: 14px;
          z-index: 30;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mobile-floating-actions.sheet-active {
          bottom: calc(52dvh + 14px);
          z-index: 92;
        }

        .mobile-fab {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.22);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          position: relative;
        }
        .mobile-fab:active {
          transform: scale(0.92);
        }
        .mobile-fab-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
        }
        .mobile-fab-secondary {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: var(--text-primary);
          border: 1px solid var(--border-subtle);
        }
        .mobile-fab-ai {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: #ffffff;
          box-shadow: 0 6px 22px rgba(124, 58, 237, 0.4);
        }
        .hotspot-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--danger);
          color: #ffffff;
          font-size: 0.625rem;
          font-weight: 800;
          border-radius: 9999px;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
        }

        /* Desktop Map + AI Coordinated Side-by-Side Layout */
        .desktop-map-ai-container {
          display: flex;
          gap: 20px;
          align-items: stretch;
          margin-bottom: 24px;
          position: relative;
          width: 100%;
        }

        .desktop-map-column {
          flex: 1;
          min-width: 0;
          transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .desktop-ai-column {
          width: 390px;
          max-width: 400px;
          flex-shrink: 0;
          position: relative;
        }

        .desktop-floating-ai-toggle {
          position: absolute;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.38);
          cursor: pointer;
          font-size: 0.813rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .desktop-floating-ai-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 26px rgba(124, 58, 237, 0.48);
        }
        .desktop-floating-ai-toggle:active {
          transform: scale(0.96);
        }

        /* Mobile Sheets */
        .mobile-sheet-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          z-index: 89;
        }
        .sheet-handle {
          width: 40px;
          height: 4px;
          border-radius: 2px;
          background: var(--border-medium);
          margin: 0 auto 16px auto;
        }
        .sheet-option-btn {
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 0.813rem;
          font-weight: 600;
          text-align: center;
          background: var(--bg-subtle);
          border: 1px solid var(--border-medium);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sheet-option-btn.selected {
          background: var(--primary-light);
          border-color: var(--primary);
          color: var(--primary-dark);
          font-weight: 800;
        }

        /* Responsive Breakpoints */
        @media (min-width: 769px) {
          .mobile-map-experience {
            display: none !important;
          }
          .desktop-map-experience {
            display: block !important;
          }
        }

        @media (min-width: 769px) and (max-width: 1080px) {
          .desktop-ai-column {
            width: 340px;
          }
          .desktop-map-ai-container {
            gap: 14px;
          }
        }
      `}</style>
    </div>
  );
}
