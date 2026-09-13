"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type SupportedLang = "msb" | "fil" | "en";
export type SheetState = "peek" | "half" | "expanded";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const QUICK_PROMPTS: Record<SupportedLang, string[]> = {
  msb: [
    "Paano ako maka-report sin problema?",
    "Diin dapit makit-an an akon report?",
    "Nano an buot sabihon san Under Review?",
    "Paano bag-uhon an lokasyon san report?",
    "Emergency hotlines didi sa Masbate?",
  ],
  fil: [
    "Paano mag-ulat ng lubak o problema?",
    "Ano ang kahulugan ng Under Review?",
    "Paano i-track ang aking report?",
    "Paano baguhin ang lokasyon sa mapa?",
    "Emergency hotlines sa Masbate?",
  ],
  en: [
    "How do I report a pothole or issue?",
    "What does 'Under Review' mean?",
    "How can I track my report?",
    "How do I change the report location?",
    "Emergency hotlines in Masbate?",
  ],
};

export const INITIAL_GREETING: Record<SupportedLang, string> = {
  msb: "Maayong adlaw! Ako an imo BantayBarangay Civic Assistant para sa Masbate. Pwede ka maghapot parte sa pag-report sin problema sa kalsada, suga, drainage, o pag-track san imo mga report.",
  fil: "Magandang araw! Ako ang iyong BantayBarangay Civic Assistant. Maaari mo akong tanungin ukol sa pag-uulat ng problema, pagsubaybay ng repair, o mga serbisyo ng barangay.",
  en: "Hello! I'm your BantayBarangay Civic Assistant for Masbate. Ask me anything about reporting problems, tracking repair progress, or barangay services.",
};

interface AiAssistantContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  sheetState: SheetState;
  setSheetState: (state: SheetState) => void;
  selectedLang: SupportedLang;
  setSelectedLang: (lang: SupportedLang) => void;
  messages: ChatMessage[];
  inputValue: string;
  setInputValue: (val: string) => void;
  isTyping: boolean;
  handleSendMessage: (textToSend?: string) => Promise<void>;
  handleLanguageChange: (newLang: SupportedLang) => Promise<void>;
  clearMessages: () => void;
}

const AiAssistantContext = createContext<AiAssistantContextType | undefined>(undefined);

export function AiAssistantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [sheetState, setSheetState] = useState<SheetState>("half");
  const [selectedLang, setSelectedLang] = useState<SupportedLang>(
    (user?.preferredLanguage as SupportedLang) || "msb"
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: INITIAL_GREETING[(user?.preferredLanguage as SupportedLang) || "msb"],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Sync preference if user profile updates
  useEffect(() => {
    if (user?.preferredLanguage && ["msb", "fil", "en"].includes(user.preferredLanguage)) {
      const lang = user.preferredLanguage as SupportedLang;
      setSelectedLang(lang);
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].role === "assistant") {
          return [{ role: "assistant", content: INITIAL_GREETING[lang] }];
        }
        return prev;
      });
    }
  }, [user?.preferredLanguage]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleLanguageChange = async (newLang: SupportedLang) => {
    setSelectedLang(newLang);
    if (messages.length === 1 && messages[0].role === "assistant") {
      setMessages([{ role: "assistant", content: INITIAL_GREETING[newLang] }]);
    }
    if (user) {
      try {
        await fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredLanguage: newLang }),
        });
      } catch (err) {
        console.warn("Could not persist language preference:", err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isTyping) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          language: selectedLang,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        const defaultFallback: Record<SupportedLang, string> = {
          msb: "Pwede ka mag-report sin mga problema gamit an '📍 Report an Issue' button o i-track an imo mga report sa 'Reports' tab.",
          fil: "Maaari kang mag-ulat ng mga problema gamit ang '📍 Report an Issue' button o i-track ang iyong mga report sa 'Reports' tab.",
          en: "You can report neighborhood issues using the '📍 Report an Issue' button or track existing reports in the 'Reports' tab.",
        };
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: defaultFallback[selectedLang],
          },
        ]);
      }
    } catch (err) {
      const emergencyFallback: Record<SupportedLang, string> = {
        msb: "Civic guidance is temporarily offline. Para sa mga dinalian nga peligro o emergency sa Masbate, palihog tawag sa Masbate CDRRMO (056) 333-2244 o 911.",
        fil: "Civic guidance is temporarily offline. Para sa agarang panganib o emergency sa Masbate, mangyaring tumawag sa Masbate CDRRMO (056) 333-2244 o 911.",
        en: "Civic guidance is temporarily offline. For urgent emergencies in Masbate, please contact Masbate CDRRMO (056) 333-2244 or 911.",
      };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: emergencyFallback[selectedLang],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearMessages = () => {
    setMessages([{ role: "assistant", content: INITIAL_GREETING[selectedLang] }]);
  };

  return (
    <AiAssistantContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleOpen,
        sheetState,
        setSheetState,
        selectedLang,
        setSelectedLang,
        messages,
        inputValue,
        setInputValue,
        isTyping,
        handleSendMessage,
        handleLanguageChange,
        clearMessages,
      }}
    >
      {children}
    </AiAssistantContext.Provider>
  );
}

export function useAiAssistant() {
  const context = useContext(AiAssistantContext);
  if (!context) {
    throw new Error("useAiAssistant must be used within an AiAssistantProvider");
  }
  return context;
}
