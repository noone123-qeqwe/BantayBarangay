"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, Loader2, Check, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type SupportedLang = "msb" | "fil" | "en";

interface SmartReportAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDescription: (text: string) => void;
  initialProblem?: string;
  initialLocation?: string;
}

const MODAL_STRINGS: Record<
  SupportedLang,
  {
    title: string;
    subtitle: string;
    q1: string;
    q1Placeholder: string;
    q2: string;
    q2Placeholder: string;
    q3: string;
    q3Placeholder: string;
    q4: string;
    q4Placeholder: string;
    btnGenerating: string;
    btnGenerate: string;
    outputLabel: string;
    outputHint: string;
    btnCancel: string;
    btnApply: string;
  }
> = {
  msb: {
    title: "Buligi Ako sa Paghimo san Report",
    subtitle: "Simbaga ini nga mga halipot nga pamangkot para makahimo sin klaro nga report.",
    q1: "1. Nano an problema nga imo nakit-an? *",
    q1Placeholder: "hal. may daku nga lubak sa kalsada, pundi nga suga sa poste, nag-awas an kanal",
    q2: "2. Diin dapit eksakto nga lugar imo ini nakit-an?",
    q2Placeholder: "hal. harani sa barangay hall, kanto san kalsada, atubang san eskwelahan",
    q3: "3. May peligro ba o may narisdan nga tawo o motorista?",
    q3Placeholder: "hal. an mga motor nagakadudulas, madulom an agihan kon gab-i",
    q4: "4. Pira na ka adlaw o ka oras an problema dida?",
    q4Placeholder: "hal. 3 ka adlaw na, humalin pa san bagyo, kagab-i lang",
    btnGenerating: "Ginasurat an Klaro nga Report...",
    btnGenerate: "I-ayos an Deskripsyon",
    outputLabel: "✨ Ginsuhestiyon nga Deskripsyon (Pwede Liwaton):",
    outputHint: "Pwede mo pa ini liwaton bago gamiton sa report",
    btnCancel: "Kanselahon",
    btnApply: "Gamiton Ini sa Report",
  },
  fil: {
    title: "Tulungan Akong Sumulat ng Report",
    subtitle: "Sagutin ang ilang maiikling tanong para makabuo ng malinaw na paglalarawan.",
    q1: "1. Anong problema ang iyong nakita? *",
    q1Placeholder: "hal. malaking lubak sa daan, pundidong ilaw, umaapaw na kanal",
    q2: "2. Saan banda mo ito eksaktong nakita?",
    q2Placeholder: "hal. tapat ng barangay hall, kanto ng kalye, malapit sa eskwelahan",
    q3: "3. May nanganganib ba o nahihirapan na tao o motorista?",
    q3Placeholder: "hal. nadudulas ang mga motor, madilim ang tawiran sa gabi",
    q4: "4. Gaano na katagal ang problema roon?",
    q4Placeholder: "hal. 3 araw na, simula pa noong bagyo, kagabi lang",
    btnGenerating: "Binubuo ang Malinaw na Deskripsyon...",
    btnGenerate: "Bumuo ng Deskripsyon",
    outputLabel: "✨ Suhestiyon ng AI (Maaaring I-edit):",
    outputHint: "Maaari mong baguhin bago gamitin",
    btnCancel: "Kanselahin",
    btnApply: "Gamitin ang Deskripsyon na Ito",
  },
  en: {
    title: "Help Me Write My Report",
    subtitle: "Answer a few quick questions to create a clear description.",
    q1: "1. What problem did you see? *",
    q1Placeholder: "e.g. large pothole in road, busted streetlight, overflowing drain",
    q2: "2. Where exactly did you see it?",
    q2Placeholder: "e.g. in front of barangay hall, street intersection, near school gate",
    q3: "3. Is anyone currently in danger or having difficulty?",
    q3Placeholder: "e.g. motorcycles skidding, very dark pedestrian walkway at night",
    q4: "4. How long has the problem been there?",
    q4Placeholder: "e.g. 3 days already, since the storm, just last night",
    btnGenerating: "Crafting Clear Description...",
    btnGenerate: "Generate Clear Description",
    outputLabel: "✨ AI Suggested Description (Editable):",
    outputHint: "You can modify before applying",
    btnCancel: "Cancel",
    btnApply: "Use This Description",
  },
};

export default function SmartReportAssistantModal({
  isOpen,
  onClose,
  onApplyDescription,
  initialProblem = "",
  initialLocation = "",
}: SmartReportAssistantModalProps) {
  const { user } = useAuth();
  const [selectedLang, setSelectedLang] = useState<SupportedLang>(
    (user?.preferredLanguage as SupportedLang) || "msb"
  );
  const [problem, setProblem] = useState(initialProblem);
  const [location, setLocation] = useState(initialLocation);
  const [dangerOrDifficulty, setDangerOrDifficulty] = useState("");
  const [duration, setDuration] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.preferredLanguage && ["msb", "fil", "en"].includes(user.preferredLanguage)) {
      setSelectedLang(user.preferredLanguage as SupportedLang);
    }
  }, [user?.preferredLanguage]);

  if (!isOpen) return null;

  const t = MODAL_STRINGS[selectedLang];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim()) {
      const emptyMsg: Record<SupportedLang, string> = {
        msb: "Palihog isaysay an problema nga imo nakit-an.",
        fil: "Pakilarawan ang problema na iyong nakita.",
        en: "Please describe what problem you saw.",
      };
      setError(emptyMsg[selectedLang]);
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problem.trim(),
          location: location.trim(),
          dangerOrDifficulty: dangerOrDifficulty.trim(),
          duration: duration.trim(),
          language: selectedLang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate report description.");
      }

      setGeneratedText(data.description || "");
    } catch (err: any) {
      setError(err.message || "Failed to assist with report writing. You can try again or write directly.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (generatedText.trim()) {
      onApplyDescription(generatedText.trim());
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "var(--bg-card)",
          borderRadius: "20px",
          boxShadow: "0 20px 40px -8px rgba(15, 23, 42, 0.28)",
          padding: "24px",
          border: "1.5px solid rgba(226, 232, 240, 0.9)",
          animation: "modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                {t.title}
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                {t.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
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
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Language Selector Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "12px",
            marginBottom: "16px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>
            Wika / Pulong:
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            {(
              [
                { code: "msb", label: "Masbateño" },
                { code: "fil", label: "Filipino" },
                { code: "en", label: "English" },
              ] as const
            ).map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLang(lang.code)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  border: selectedLang === lang.code ? "1px solid var(--primary)" : "1px solid var(--border-medium)",
                  backgroundColor: selectedLang === lang.code ? "var(--primary)" : "var(--bg-card)",
                  color: selectedLang === lang.code ? "#ffffff" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--danger-light)",
              border: "1px solid var(--danger)",
              borderRadius: "10px",
              color: "var(--danger-dark)",
              fontSize: "0.813rem",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Guided Questions */}
        <form onSubmit={handleGenerate}>
          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label" style={{ fontSize: "0.813rem", fontWeight: 700 }}>
              {t.q1}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={t.q1Placeholder}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label" style={{ fontSize: "0.813rem", fontWeight: 700 }}>
              {t.q2}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={t.q2Placeholder}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label" style={{ fontSize: "0.813rem", fontWeight: 700 }}>
              {t.q3}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={t.q3Placeholder}
              value={dangerOrDifficulty}
              onChange={(e) => setDangerOrDifficulty(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "18px" }}>
            <label className="form-label" style={{ fontSize: "0.813rem", fontWeight: 700 }}>
              {t.q4}
            </label>
            <input
              type="text"
              className="form-control"
              placeholder={t.q4Placeholder}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="btn btn-primary btn-block"
            style={{
              justifyContent: "center",
              minHeight: "48px",
              borderRadius: "14px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)",
              border: "none",
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>{t.btnGenerating}</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>{t.btnGenerate}</span>
              </>
            )}
          </button>
        </form>

        {/* Generated Text Area */}
        {generatedText && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              backgroundColor: "var(--bg-subtle)",
              borderRadius: "14px",
              border: "1.5px solid var(--primary)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t.outputLabel}
              </span>
              <span style={{ fontSize: "0.688rem", color: "var(--text-muted)" }}>{t.outputHint}</span>
            </div>

            <textarea
              className="form-control"
              rows={4}
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              style={{ backgroundColor: "#ffffff", fontSize: "0.875rem", lineHeight: 1.5 }}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: "center", minHeight: "44px", borderRadius: "12px" }}
              >
                {t.btnCancel}
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  justifyContent: "center",
                  minHeight: "44px",
                  borderRadius: "12px",
                  fontWeight: 800,
                  backgroundColor: "var(--success-dark)",
                  borderColor: "var(--success-dark)",
                }}
              >
                <Check size={18} />
                <span>{t.btnApply}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
