"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Sparkles, ChevronRight, Radio, Shield, Zap, Lock } from "lucide-react";

export default function CinematicIntroPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [progress, setProgress] = useState(0);
  const [telemetryIndex, setTelemetryIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const telemetrySteps = [
    { title: "INITIALIZING SECURE MUNICIPAL NODE", color: "#38bdf8" },
    { title: "SYNCING BARANGAY GIS & SATELLITE TELEMETRY", color: "#60a5fa" },
    { title: "ESTABLISHING 256-BIT ENCRYPTED CHANNEL", color: "#34d399" },
    { title: "AUTHENTICATION GATEWAY READY · LAUNCHING", color: "#10b981" },
  ];

  const handleProceed = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }, 450);
  }, [isExiting, user, router]);

  // Keyboard shortcut listener to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        handleProceed();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleProceed]);

  // Smooth cinematic progress counter
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2600; // 2.6 seconds total cinematic duration

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 28) {
        setTelemetryIndex(0);
      } else if (pct < 60) {
        setTelemetryIndex(1);
      } else if (pct < 88) {
        setTelemetryIndex(2);
      } else {
        setTelemetryIndex(3);
      }

      if (elapsed >= duration) {
        clearInterval(timer);
        handleProceed();
      }
    }, 24);

    return () => clearInterval(timer);
  }, [handleProceed]);

  return (
    <div className={`cinematic-canvas ${isExiting ? "canvas-exit" : ""}`}>
      {/* Dynamic Ambient Background Beams */}
      <div className="beam-ambient beam-sapphire" />
      <div className="beam-ambient beam-cyan" />
      <div className="beam-ambient beam-emerald" />

      {/* Cyber-Civic Coordinate Grid & Radar Sweep */}
      <div className="radar-grid-bg" />
      <div className="radar-sweep-line" />

      {/* Top Bar: Skip Intro Pill */}
      <div className="top-control-bar">
        <div className="top-system-tag">
          <span className="live-telemetry-dot" />
          <span>BANTAYBARANGAY OS v2.6 · LIVE CIVIC NET</span>
        </div>

        <button
          type="button"
          onClick={handleProceed}
          className="skip-intro-btn"
          aria-label="Skip cinematic introduction"
        >
          <span>Skip Intro</span>
          <ChevronRight size={14} />
          <kbd className="skip-kbd">ESC</kbd>
        </button>
      </div>

      {/* Main Cinematic Centerpiece */}
      <main className="cinematic-hero-core">
        
        {/* Layer 1: Concentric Neon Orbital Rings */}
        <div className="orbit-rings-container">
          <div className="orbit-ring ring-outer" />
          <div className="orbit-ring ring-mid" />
          <div className="orbit-ring ring-pulse" />

          {/* Central Emblem Badge with Specular Light Flare */}
          <div className="central-emblem-gem">
            <div className="specular-shine" />
            <ShieldCheck size={48} className="emblem-shield-svg" />
          </div>
        </div>

        {/* Layer 2: Typographic Brand Reveal */}
        <div className="brand-reveal-block">
          <h1 className="cinematic-brand-title">
            BANTAY<span className="brand-accent">BARANGAY</span>
          </h1>

          <div className="cinematic-subline">
            <span>OFFICIAL CIVIC INFRASTRUCTURE</span>
            <span className="subline-dot">·</span>
            <span className="subline-highlight">TRANSPARENT COMMUNITY RESPONSE</span>
          </div>
        </div>

        {/* Layer 3: Dynamic Telemetry Terminal & Progress Bar */}
        <div className="telemetry-deck">
          <div className="telemetry-status-row">
            <div className="status-indicator-wrap">
              <span
                className="status-pulse-light"
                style={{ backgroundColor: telemetrySteps[telemetryIndex].color }}
              />
              <span
                className="status-text-content"
                style={{ color: telemetrySteps[telemetryIndex].color }}
              >
                {telemetrySteps[telemetryIndex].title}
              </span>
            </div>

            <span className="progress-percent-number">{progress}%</span>
          </div>

          {/* Glowing Precision Progress Bar */}
          <div className="progress-track-wrapper">
            <div
              className="progress-fill-bar"
              style={{ width: `${progress}%` }}
            >
              <div className="progress-light-head" />
            </div>
          </div>

          {/* Telemetry Micro-Badges */}
          <div className="micro-telemetry-row">
            <div className="telemetry-badge">
              <Radio size={11} className="badge-icon-cyan" />
              <span>REGION IV-A / NCR MUNICIPAL NODES</span>
            </div>
            <div className="telemetry-badge">
              <Lock size={11} className="badge-icon-emerald" />
              <span>256-BIT SSL · DATA PRIVACY RA 10173</span>
            </div>
            <div className="telemetry-badge hide-mobile">
              <Zap size={11} className="badge-icon-amber" />
              <span>LATENCY: 8ms</span>
            </div>
          </div>
        </div>

      </main>

      {/* Bottom Compliance & Civic Watermark */}
      <footer className="cinematic-footer">
        <span>Republic of the Philippines · Barangay Community Incident Command</span>
      </footer>

      {/* ===============================================================
          STYLES: High-Budget Cinema-Grade Visuals
         =============================================================== */}
      <style jsx>{`
        /* Fullscreen Viewport Canvas */
        .cinematic-canvas {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 99999;
          background-color: #030712;
          background-image: 
            radial-gradient(circle at 50% 40%, rgba(15, 23, 42, 0.9) 0%, #030712 90%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px;
          overflow: hidden;
          color: #ffffff;
          user-select: none;
          transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .canvas-exit {
          opacity: 0;
          transform: scale(1.04);
          filter: brightness(1.2);
        }

        /* Ambient Lighting Beams */
        .beam-ambient {
          position: absolute;
          border-radius: 50%;
          filter: blur(140px);
          pointer-events: none;
          opacity: 0.5;
        }

        .beam-sapphire {
          width: 550px;
          height: 550px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, transparent 70%);
          top: 10%;
          left: 20%;
          animation: floatBeam1 9s ease-in-out infinite alternate;
        }

        .beam-cyan {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.24) 0%, transparent 70%);
          bottom: 10%;
          right: 15%;
          animation: floatBeam2 11s ease-in-out infinite alternate;
        }

        .beam-emerald {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
          top: 35%;
          right: 30%;
          animation: floatBeam3 8s ease-in-out infinite alternate;
        }

        @keyframes floatBeam1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, -30px) scale(1.15); }
        }

        @keyframes floatBeam2 {
          0% { transform: translate(0, 0) scale(1.1); }
          100% { transform: translate(-50px, 30px) scale(0.95); }
        }

        @keyframes floatBeam3 {
          0% { transform: translate(0, 0); }
          100% { transform: translate(25px, 35px); }
        }

        /* Radar Grid Background */
        .radar-grid-bg {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 48px 48px;
          background-position: center center;
          pointer-events: none;
          opacity: 0.7;
        }

        /* Radar Sweep Effect */
        .radar-sweep-line {
          position: absolute;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: conic-gradient(from 0deg at 50% 50%, rgba(56, 189, 248, 0.12) 0deg, transparent 65deg, transparent 360deg);
          animation: radarRotate 6s linear infinite;
          pointer-events: none;
        }

        @keyframes radarRotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* Top Bar */
        .top-control-bar {
          width: 100%;
          max-width: 1180px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 10;
        }

        .top-system-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono, monospace);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #94a3b8;
        }

        .live-telemetry-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 10px #10b981;
          animation: pulseDot 1.6s infinite;
        }

        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 14px #34d399; }
        }

        .skip-intro-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          color: #cbd5e1;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .skip-intro-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(56, 189, 248, 0.4);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .skip-kbd {
          font-family: var(--font-mono, monospace);
          font-size: 0.65rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 1px 5px;
          border-radius: 4px;
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        /* Centerpiece */
        .cinematic-hero-core {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          z-index: 10;
          max-width: 780px;
          margin: auto 0;
        }

        /* Concentric Orbital Rings */
        .orbit-rings-container {
          position: relative;
          width: 170px;
          height: 170px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
        }

        .orbit-ring {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .ring-outer {
          width: 168px;
          height: 168px;
          border: 1px dashed rgba(56, 189, 248, 0.35);
          animation: spinClockwise 16s linear infinite;
        }

        .ring-mid {
          width: 136px;
          height: 136px;
          border: 1px solid rgba(37, 99, 235, 0.3);
          border-top-color: #38bdf8;
          border-bottom-color: #34d399;
          animation: spinCounter 10s linear infinite;
        }

        .ring-pulse {
          width: 108px;
          height: 108px;
          background: rgba(37, 99, 235, 0.15);
          box-shadow: 0 0 35px rgba(37, 99, 235, 0.4);
          animation: pulseGlow 2s ease-in-out infinite alternate;
        }

        @keyframes spinClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spinCounter {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes pulseGlow {
          0% { transform: scale(0.95); opacity: 0.6; }
          100% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 50px rgba(56, 189, 248, 0.6); }
        }

        /* Central Shield Emblem */
        .central-emblem-gem {
          width: 88px;
          height: 88px;
          border-radius: 22px;
          background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 
            0 10px 30px rgba(37, 99, 235, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.35),
            inset 0 2px 4px rgba(255, 255, 255, 0.4);
          position: relative;
          overflow: hidden;
          animation: emblemEntrance 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes emblemEntrance {
          0% { transform: scale(0.6) rotate(-15deg); opacity: 0; filter: blur(8px); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; filter: blur(0); }
        }

        .specular-shine {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 42%,
            rgba(255, 255, 255, 0.65) 50%,
            transparent 58%
          );
          transform: rotate(25deg);
          animation: lightSweep 2.8s infinite;
        }

        @keyframes lightSweep {
          0% { transform: translateY(-100%) rotate(25deg); }
          40%, 100% { transform: translateY(100%) rotate(25deg); }
        }

        .emblem-shield-svg {
          color: #ffffff;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
          position: relative;
          z-index: 2;
        }

        /* Brand Typography */
        .brand-reveal-block {
          margin-bottom: 32px;
        }

        .cinematic-brand-title {
          font-family: var(--font-heading, "Plus Jakarta Sans", sans-serif);
          font-size: clamp(2.3rem, 5.5vw, 3.5rem);
          font-weight: 800;
          letter-spacing: 0.18em;
          color: #ffffff;
          margin: 0 0 10px 0;
          line-height: 1.1;
          text-shadow: 0 0 40px rgba(56, 189, 248, 0.4);
          animation: trackingReveal 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes trackingReveal {
          0% { letter-spacing: 0.05em; opacity: 0; transform: translateY(14px); }
          100% { letter-spacing: 0.18em; opacity: 1; transform: translateY(0); }
        }

        .brand-accent {
          background: linear-gradient(135deg, #38bdf8 0%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cinematic-subline {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: clamp(0.725rem, 1.8vw, 0.85rem);
          font-weight: 700;
          letter-spacing: 0.18em;
          color: #94a3b8;
          text-transform: uppercase;
          animation: fadeUp 1.4s ease 0.4s both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .subline-dot {
          color: #38bdf8;
        }

        .subline-highlight {
          color: #38bdf8;
        }

        /* Telemetry Deck */
        .telemetry-deck {
          width: 100%;
          max-width: 520px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .telemetry-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-mono, monospace);
          font-size: 0.725rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .status-indicator-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-pulse-light {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          transition: background-color 0.3s ease;
        }

        .status-text-content {
          transition: color 0.3s ease;
        }

        .progress-percent-number {
          color: #38bdf8;
        }

        /* Progress Bar */
        .progress-track-wrapper {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill-bar {
          height: 100%;
          background: linear-gradient(90deg, #2563eb 0%, #06b6d4 60%, #10b981 100%);
          border-radius: 9999px;
          position: relative;
          transition: width 0.08s linear;
        }

        .progress-light-head {
          position: absolute;
          right: 0;
          top: -2px;
          bottom: -2px;
          width: 10px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 12px #38bdf8;
        }

        /* Micro Telemetry Row */
        .micro-telemetry-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 6px;
          flex-wrap: wrap;
        }

        .telemetry-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-mono, monospace);
          font-size: 0.65rem;
          color: #64748b;
          letter-spacing: 0.04em;
        }

        .badge-icon-cyan { color: #38bdf8; }
        .badge-icon-emerald { color: #34d399; }
        .badge-icon-amber { color: #fbbf24; }

        /* Footer */
        .cinematic-footer {
          font-size: 0.725rem;
          color: #64748b;
          letter-spacing: 0.05em;
          text-align: center;
          position: relative;
          z-index: 10;
        }

        @media (max-width: 640px) {
          .cinematic-canvas {
            padding: 20px 16px;
          }

          .cinematic-brand-title {
            letter-spacing: 0.12em;
          }

          .cinematic-subline {
            flex-direction: column;
            gap: 4px;
            letter-spacing: 0.1em;
          }

          .subline-dot {
            display: none;
          }

          .hide-mobile {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
