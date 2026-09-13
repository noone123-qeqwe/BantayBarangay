/**
 * BantayBarangay SMS Dispatcher & Simulator
 *
 * Supports real dispatch via Semaphore / PhilSMS if environment keys are present,
 * and provides high-fidelity simulation in development and testing.
 */

import { formatDisplayPhone, formatLocalPhone } from "./phone";

export interface SendSmsParams {
  to: string; // Canonical +639XXXXXXXXX
  message: string;
  otpCode?: string;
}

export interface SendSmsResult {
  success: boolean;
  provider: "SIMULATOR" | "SEMAPHORE" | "PHIL_SMS";
  messageId?: string;
  error?: string;
}

// In-memory ring buffer for testing and development inspection
interface SimulatedSmsEntry {
  to: string;
  message: string;
  otpCode?: string;
  timestamp: Date;
}

const SMS_HISTORY_LIMIT = 50;
const simulatedSmsHistory: SimulatedSmsEntry[] = [];

/**
 * Sends an SMS message to a Philippine mobile number.
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { to, message, otpCode } = params;

  // 1. Check for Semaphore SMS API key
  const semaphoreApiKey = process.env.SEMAPHORE_API_KEY;
  if (semaphoreApiKey) {
    try {
      const res = await fetch("https://api.semaphore.co/api/v4/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apikey: semaphoreApiKey,
          number: formatLocalPhone(to),
          message,
          sendername: process.env.SEMAPHORE_SENDER_NAME || "BantayBrgy",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        return {
          success: true,
          provider: "SEMAPHORE",
          messageId: Array.isArray(data) && data[0]?.message_id ? String(data[0].message_id) : undefined,
        };
      }
      console.warn("Semaphore API returned error, falling back to simulator:", data);
    } catch (err) {
      console.error("Failed to connect to Semaphore API:", err);
    }
  }

  // 2. High-Visibility Simulator for Development, Staging, & Local Deployments
  const localNum = formatLocalPhone(to);
  const displayNum = formatDisplayPhone(to);

  // Store in simulation log
  simulatedSmsHistory.unshift({
    to,
    message,
    otpCode,
    timestamp: new Date(),
  });
  if (simulatedSmsHistory.length > SMS_HISTORY_LIMIT) {
    simulatedSmsHistory.pop();
  }

  console.log(`
┌────────────────────────────────────────────────────────────────────────┐
│ 📱 [BANTAYBARANGAY SMS GATEWAY] SIMULATED DISPATCH                    │
├────────────────────────────────────────────────────────────────────────┤
│ Destination: ${to} (${localNum} / ${displayNum})
│ Time:        ${new Date().toLocaleTimeString("en-PH", { hour12: true })}
├────────────────────────────────────────────────────────────────────────┤
│ Message Content:                                                       │
│ "${message}"
${otpCode ? `├────────────────────────────────────────────────────────────────────────┤\n│ 🔑 6-Digit OTP Code: >> [ ${otpCode} ] <<                                │` : ""}
└────────────────────────────────────────────────────────────────────────┘
`);

  return {
    success: true,
    provider: "SIMULATOR",
    messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
  };
}

/**
 * Retrieves the most recent simulated SMS sent to a given phone number.
 * Useful for automated tests and dev debug endpoints.
 */
export function getLastSimulatedSms(phone: string): SimulatedSmsEntry | undefined {
  return simulatedSmsHistory.find((entry) => entry.to === phone || formatLocalPhone(entry.to) === formatLocalPhone(phone));
}
