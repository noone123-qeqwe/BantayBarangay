"use client";

import React, { useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Loader2,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useAiAssistant,
  SupportedLang,
  SheetState,
  QUICK_PROMPTS,
} from "@/context/AiAssistantContext";

interface AiAssistantPanelProps {
  mode: "desktop-side" | "mobile-sheet" | "floating";
  sheetState?: SheetState;
  onSheetStateChange?: (state: SheetState) => void;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function AiAssistantPanel({
  mode,
  sheetState = "half",
  onSheetStateChange,
  onClose,
  className = "",
  style = {},
}: AiAssistantPanelProps) {
  const {
    selectedLang,
    handleLanguageChange,
    messages,
    inputValue,
    setInputValue,
    isTyping,
    handleSendMessage,
    clearMessages,
  } = useAiAssistant();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const inputPlaceholder: Record<SupportedLang, string> = {
    msb: "Maghapot parte sa pag-report, status, mapa...",
    fil: "Magtanong ukol sa pag-ulat, status, mapa...",
    en: "Ask about reporting, statuses, map...",
  };

  const handleToggleExpand = () => {
    if (!onSheetStateChange) return;
    if (sheetState === "expanded") {
      onSheetStateChange("half");
    } else {
      onSheetStateChange("expanded");
    }
  };

  // Prevent event bubbling into maps or underlying elements
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`ai-assistant-panel mode-${mode} ${mode === "mobile-sheet" ? `sheet-${sheetState}` : ""} ${className}`}
      style={style}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onTouchStart={stopPropagation}
    >
      {/* Mobile Bottom Sheet Pull Handle */}
      {mode === "mobile-sheet" && (
        <div
          className="ai-sheet-handle-zone"
          onClick={handleToggleExpand}
          title="Drag or tap to expand/collapse"
        >
          <div className="ai-sheet-handle-bar" />
        </div>
      )}

      {/* Header */}
      <header className="ai-panel-header">
        <div className="ai-panel-branding">
          <div className="ai-avatar-badge">
            <Bot size={18} />
          </div>
          <div className="ai-title-group">
            <div className="ai-title-row">
              <h3 className="ai-title-text">BantayBarangay AI</h3>
              <span className="ai-status-indicator">
                <span className="status-dot" />
                Masbate Guide
              </span>
            </div>
            <p className="ai-subtitle-text">Civic Assistant & Guidance</p>
          </div>
        </div>

        <div className="ai-panel-controls">
          {/* Clear history button if more than 1 message */}
          {messages.length > 1 && (
            <button
              type="button"
              onClick={clearMessages}
              aria-label="Restart chat"
              className="ai-icon-btn"
              title="Restart conversation"
            >
              <RotateCcw size={15} />
            </button>
          )}

          {/* Expand/Collapse toggle for mobile sheet */}
          {mode === "mobile-sheet" && onSheetStateChange && (
            <button
              type="button"
              onClick={handleToggleExpand}
              aria-label={sheetState === "expanded" ? "Minimize sheet" : "Expand sheet"}
              className="ai-icon-btn"
              title={sheetState === "expanded" ? "Shrink sheet" : "Expand sheet"}
            >
              {sheetState === "expanded" ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          )}

          {/* Close button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close BantayBarangay AI"
              className="ai-icon-btn ai-close-btn"
              title="Close panel"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Language Selector Bar (Masbateño / Filipino / English) */}
      <nav className="ai-lang-selector-bar" aria-label="Language selection">
        <span className="ai-lang-label">Wika / Pulong:</span>
        <div className="ai-lang-buttons-row">
          {(
            [
              { code: "msb", label: "Masbateño" },
              { code: "fil", label: "Filipino" },
              { code: "en", label: "English" },
            ] as const
          ).map((lang) => {
            const isActive = selectedLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`ai-lang-btn ${isActive ? "active" : ""}`}
                aria-pressed={isActive}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Chat Messages Stream (Strictly Internal Scrolling) */}
      <div className="ai-messages-scroll-area" ref={messagesContainerRef}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`ai-message-bubble-wrapper ${isUser ? "user" : "assistant"}`}
            >
              <div className={`ai-message-avatar ${isUser ? "user-avatar" : "bot-avatar"}`}>
                {isUser ? <User size={13} /> : <Bot size={13} />}
              </div>

              <div className={`ai-message-bubble ${isUser ? "user-bubble" : "assistant-bubble"}`}>
                <div className="ai-message-text">{msg.content}</div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="ai-message-bubble-wrapper assistant typing">
            <div className="ai-message-avatar bot-avatar">
              <Bot size={13} />
            </div>
            <div className="ai-message-bubble assistant-bubble typing-bubble">
              <Loader2 size={13} className="spin" />
              <span>Assistant is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} style={{ height: 1 }} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="ai-chips-shelf">
        <div className="ai-chips-scroll">
          {QUICK_PROMPTS[selectedLang].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="ai-chip-pill"
              title={`Ask: "${prompt}"`}
            >
              <Sparkles size={11} className="ai-chip-icon" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fixed Chat Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="ai-input-dock"
      >
        <div className="ai-input-container">
          <input
            type="text"
            placeholder={inputPlaceholder[selectedLang]}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            className="ai-text-input"
            aria-label="Type your message to BantayBarangay AI"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            aria-label="Send message"
            className="ai-send-btn"
            title="Send"
          >
            {isTyping ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
          </button>
        </div>
      </form>

      <style jsx>{`
        /* ==========================================================================
           1. CORE AI PANEL SHELL
           ========================================================================== */
        .ai-assistant-panel {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.95);
          box-shadow: 0 16px 36px -4px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.08);
          overflow: hidden;
          position: relative;
          z-index: 50;
          box-sizing: border-box;
          color: var(--text-primary);
        }

        /* --------------------------------------------------------------------------
           A. Desktop Side Panel Mode (Docked cleanly next to the map)
           -------------------------------------------------------------------------- */
        .mode-desktop-side {
          width: 100%;
          max-width: 400px;
          height: 580px;
          min-height: 540px;
          border-radius: 20px;
          flex-shrink: 0;
          animation: sidePanelSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes sidePanelSlideIn {
          from {
            opacity: 0;
            transform: translateX(18px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* --------------------------------------------------------------------------
           B. Mobile Bottom Sheet Mode
           -------------------------------------------------------------------------- */
        .mode-mobile-sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          background: #ffffff;
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-bottom: none;
          box-shadow: 0 -8px 30px rgba(15, 23, 42, 0.22);
          z-index: 90;
          transition: height 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          padding-bottom: max(env(safe-area-inset-bottom, 0px), 8px);
          animation: bottomSheetSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .mode-mobile-sheet.sheet-half {
          height: 52dvh;
          max-height: 52dvh;
        }

        .mode-mobile-sheet.sheet-expanded {
          height: calc(88dvh - var(--safe-area-top, 0px));
          max-height: calc(88dvh - var(--safe-area-top, 0px));
        }

        .mode-mobile-sheet.sheet-peek {
          height: 180px;
        }

        @keyframes bottomSheetSlideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .ai-sheet-handle-zone {
          width: 100%;
          padding: 8px 0 4px 0;
          display: flex;
          justify-content: center;
          cursor: grab;
          user-select: none;
          touch-action: pan-y;
        }

        .ai-sheet-handle-bar {
          width: 44px;
          height: 5px;
          border-radius: 9999px;
          background: #cbd5e1;
          transition: background-color 0.2s ease;
        }

        .ai-sheet-handle-zone:hover .ai-sheet-handle-bar {
          background: #94a3b8;
        }

        /* --------------------------------------------------------------------------
           C. Floating Modal Mode (For pages outside of /map)
           -------------------------------------------------------------------------- */
        .mode-floating {
          position: fixed;
          bottom: calc(var(--bottom-nav-height, 62px) + 12px);
          right: 16px;
          width: calc(100vw - 32px);
          max-width: 380px;
          height: 520px;
          max-height: calc(100vh - 120px);
          border-radius: 20px;
          z-index: 90;
          animation: floatingPopUp 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (min-width: 1024px) {
          .mode-floating {
            bottom: 24px;
            right: 24px;
          }
        }

        @keyframes floatingPopUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ==========================================================================
           2. HEADER COMPONENT
           ========================================================================== */
        .ai-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #ffffff;
          border-bottom: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }

        .ai-panel-branding {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ai-avatar-badge {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          flex-shrink: 0;
        }

        .ai-title-group {
          display: flex;
          flex-direction: column;
        }

        .ai-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-title-text {
          font-size: 0.938rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          margin: 0;
          line-height: 1.2;
        }

        .ai-status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.688rem;
          font-weight: 700;
          color: #15803d;
          background: #f0fdf4;
          padding: 2px 7px;
          border-radius: 9999px;
          border: 1px solid #bbf7d0;
          line-height: 1;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #16a34a;
        }

        .ai-subtitle-text {
          font-size: 0.688rem;
          color: var(--text-muted);
          margin: 1px 0 0 0;
          font-weight: 500;
        }

        .ai-panel-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ai-icon-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .ai-icon-btn:hover {
          background: var(--bg-subtle);
          color: var(--text-primary);
        }

        .ai-close-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        /* ==========================================================================
           3. LANGUAGE SELECTOR BAR
           ========================================================================== */
        .ai-lang-selector-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 14px;
          background: #f8fafc;
          border-bottom: 1px solid var(--border-subtle);
          flex-shrink: 0;
          gap: 6px;
          flex-wrap: wrap;
        }

        .ai-lang-label {
          font-size: 0.688rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }

        .ai-lang-buttons-row {
          display: flex;
          gap: 4px;
          flex-wrap: nowrap;
          align-items: center;
        }

        .ai-lang-btn {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid var(--border-medium);
          background: #ffffff;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          line-height: 1.2;
        }

        .ai-lang-btn:hover {
          background: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary);
        }

        .ai-lang-btn.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
        }

        /* ==========================================================================
           4. CHAT MESSAGES SCROLL AREA (Independent Scrolling)
           ========================================================================== */
        .ai-messages-scroll-area {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #f8fafc;
          scroll-behavior: smooth;
        }

        /* Custom Slim Scrollbar */
        .ai-messages-scroll-area::-webkit-scrollbar {
          width: 5px;
        }
        .ai-messages-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-messages-scroll-area::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .ai-messages-scroll-area::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .ai-message-bubble-wrapper {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          width: 100%;
        }

        .ai-message-bubble-wrapper.user {
          flex-direction: row-reverse;
        }

        .ai-message-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 0.688rem;
          font-weight: 800;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
        }

        .user-avatar {
          background: var(--primary);
          color: #ffffff;
        }

        .bot-avatar {
          background: #ffffff;
          color: var(--primary);
          border: 1px solid var(--border-medium);
        }

        .ai-message-bubble {
          max-width: 82%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 0.813rem;
          line-height: 1.48;
          word-break: break-word;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .user-bubble {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border-top-right-radius: 4px;
        }

        .assistant-bubble {
          background: #ffffff;
          color: var(--text-primary);
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-top-left-radius: 4px;
        }

        .typing-bubble {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 0.75rem;
          padding: 8px 12px;
        }

        .ai-message-text {
          white-space: pre-wrap;
        }

        /* ==========================================================================
           5. QUICK PROMPTS CHIPS SHELF
           ========================================================================== */
        .ai-chips-shelf {
          background: #ffffff;
          border-top: 1px solid var(--border-subtle);
          padding: 6px 12px;
          flex-shrink: 0;
        }

        .ai-chips-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding: 2px 0;
        }
        .ai-chips-scroll::-webkit-scrollbar {
          display: none;
        }

        .ai-chip-pill {
          padding: 5px 11px;
          border-radius: 9999px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          font-size: 0.688rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .ai-chip-pill:hover {
          background: var(--primary-light);
          color: var(--primary-dark);
          border-color: var(--primary);
          transform: translateY(-1px);
        }

        .ai-chip-pill:active {
          transform: scale(0.97);
        }

        .ai-chip-icon {
          color: var(--primary);
          flex-shrink: 0;
        }

        /* ==========================================================================
           6. FIXED INPUT DOCK
           ========================================================================== */
        .ai-input-dock {
          background: #ffffff;
          border-top: 1px solid var(--border-subtle);
          padding: 10px 12px;
          flex-shrink: 0;
        }

        .ai-input-container {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid var(--border-medium);
          border-radius: 9999px;
          padding: 3px 4px 3px 14px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .ai-input-container:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
          background: #ffffff;
        }

        .ai-text-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.813rem;
          color: var(--text-primary);
          min-width: 0;
          padding: 6px 0;
        }

        .ai-text-input:focus {
          outline: none;
        }

        .ai-text-input::placeholder {
          color: #94a3b8;
        }

        .ai-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary);
          color: #ffffff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ai-send-btn:hover:not(:disabled) {
          background: var(--primary-hover);
          transform: scale(1.05);
        }

        .ai-send-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .ai-send-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function AiAssistantWidget() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useAiAssistant();

  // Hide on auth pages and cinematic intro
  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/";
  if (isAuthPage) return null;

  // On /map, the community map page coordinates and renders the dedicated desktop side panel & mobile bottom sheet
  if (pathname === "/map") {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button on non-map pages */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open BantayBarangay AI Assistant"
          className="global-ai-fab"
          title="Ask BantayBarangay AI"
        >
          <Sparkles size={20} />
          <span className="global-ai-fab-label">AI Assistant</span>
        </button>
      )}

      {/* Floating Assistant Window for non-map pages */}
      {isOpen && (
        <AiAssistantPanel mode="floating" onClose={() => setIsOpen(false)} />
      )}

      <style jsx>{`
        .global-ai-fab {
          position: fixed;
          bottom: calc(var(--bottom-nav-height, 62px) + 16px);
          right: 18px;
          z-index: 80;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 6px 22px rgba(124, 58, 237, 0.38);
          cursor: pointer;
          font-size: 0.813rem;
          font-weight: 800;
          letter-spacing: -0.01em;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .global-ai-fab:hover {
          transform: scale(1.04);
          box-shadow: 0 8px 28px rgba(124, 58, 237, 0.48);
        }
        .global-ai-fab:active {
          transform: scale(0.96);
        }

        @media (min-width: 1024px) {
          .global-ai-fab {
            bottom: 24px;
            right: 24px;
          }
        }
      `}</style>
    </>
  );
}
