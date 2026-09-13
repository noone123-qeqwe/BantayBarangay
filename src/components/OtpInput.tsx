"use client";

import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  onComplete,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of single characters
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Extract only digits
    const cleanDigit = rawVal.replace(/\D/g, "");

    if (!cleanDigit) {
      // Empty input (cleared)
      const newDigits = [...digits];
      newDigits[index] = "";
      const newVal = newDigits.join("");
      onChange(newVal);
      return;
    }

    // Take the last character entered
    const char = cleanDigit[cleanDigit.length - 1];
    const newDigits = [...digits];
    newDigits[index] = char;
    const newVal = newDigits.join("");
    onChange(newVal);

    // Auto-focus next input box if available
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }

    // Trigger onComplete if all digits filled
    if (newVal.length === length && onComplete) {
      onComplete(newVal);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Current box is already empty, move to previous and clear it
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const numericChars = pastedData.replace(/\D/g, "").slice(0, length);

    if (numericChars) {
      onChange(numericChars);

      // Focus last filled box or next box
      const targetIndex = Math.min(numericChars.length, length - 1);
      inputRefs.current[targetIndex]?.focus();

      if (numericChars.length === length && onComplete) {
        onComplete(numericChars);
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        margin: "12px 0",
      }}
    >
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2} // Allow typing to replace
            value={digits[index]}
            disabled={disabled}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${index + 1} of ${length}`}
            style={{
              width: "48px",
              height: "56px",
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: 800,
              fontFamily: "var(--font-heading), monospace",
              color: "var(--text-primary)",
              backgroundColor: disabled ? "var(--bg-subtle)" : "var(--bg-surface)",
              border: isFilled
                ? "2px solid var(--primary)"
                : "1.5px solid var(--border-medium)",
              borderRadius: "12px",
              boxShadow: isFilled ? "0 0 0 3px rgba(37, 99, 235, 0.15)" : "none",
              transition: "all 0.15s ease",
              outline: "none",
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.25)";
            }}
            onBlurCapture={(e) => {
              if (!digits[index]) {
                e.currentTarget.style.borderColor = "var(--border-medium)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          />
        );
      })}
    </div>
  );
}
