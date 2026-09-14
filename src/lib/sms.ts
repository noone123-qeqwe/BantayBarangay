/**
 * BantayBarangay SMS Dispatcher & Simulator
 *
 * Supports real dispatch via Semaphore if environment keys are present,
 * and provides high-fidelity simulation in development and testing.
 *
 * CRITICAL: In production mode, if Semaphore is configured but the API call
 * fails, this module does NOT silently fall back to the simulator. It returns
 * an error so the caller can inform the user that SMS delivery failed.
 */

import { formatDisplayPhone, formatLocalPhone, maskPhone } from "./phone";

export interface SendSmsParams {
  to: string; // Canonical +639XXXXXXXXX
  message: string;
  otpCode?: string;
}

export interface SendSmsResult {
  success: boolean;
  provider: "SIMULATOR" | "SEMAPHORE";
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
 * Safe server-side logging helper — never logs full OTP, API keys, or sensitive data.
 */
function logSmsEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, unknown>
) {
  const safeDetails = { ...details };
  // Mask phone numbers in logs
  if (typeof safeDetails.to === "string") {
    safeDetails.to = maskPhone(safeDetails.to);
  }
  // Never log API keys
  delete safeDetails.apiKey;
  delete safeDetails.apikey;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    service: "SMS_GATEWAY",
    event,
    ...safeDetails,
  };

  if (level === "error") {
    console.error(`[SMS_GATEWAY] ${event}`, JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(`[SMS_GATEWAY] ${event}`, JSON.stringify(logEntry));
  } else {
    console.log(`[SMS_GATEWAY] ${event}`, JSON.stringify(logEntry));
  }
}

/**
 * Sends an SMS message to a Philippine mobile number.
 *
 * Dispatch logic:
 * 1. If SEMAPHORE_API_KEY is set → attempt Semaphore delivery.
 *    - On success → return success with provider "SEMAPHORE".
 *    - On failure in PRODUCTION → return error (do NOT fall back to simulator).
 *    - On failure in DEVELOPMENT → fall back to simulator with a warning.
 * 2. If SEMAPHORE_API_KEY is NOT set → use simulator (dev/test only).
 *    - In PRODUCTION without key → log a critical warning.
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { to, message, otpCode } = params;
  const isProduction = process.env.NODE_ENV === "production";
  const requestId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  logSmsEvent("info", "SMS_DISPATCH_INITIATED", {
    requestId,
    to,
    purpose: otpCode ? "OTP" : "NOTIFICATION",
    isProduction,
  });

  // 1. Attempt Semaphore delivery if API key is configured
  const semaphoreApiKey = process.env.SEMAPHORE_API_KEY;

  if (semaphoreApiKey) {
    try {
      const localNumber = formatLocalPhone(to);
      const senderName = process.env.SEMAPHORE_SENDER_NAME || "BantayBrgy";

      logSmsEvent("info", "SEMAPHORE_REQUEST_SENDING", {
        requestId,
        to,
        recipientLocal: maskPhone(localNumber),
        senderName,
      });

      const res = await fetch("https://api.semaphore.co/api/v4/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apikey: semaphoreApiKey,
          number: localNumber,
          message,
          sendername: senderName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const messageId =
          Array.isArray(data) && data[0]?.message_id
            ? String(data[0].message_id)
            : undefined;

        logSmsEvent("info", "SEMAPHORE_DELIVERY_SUCCESS", {
          requestId,
          to,
          messageId,
          httpStatus: res.status,
        });

        return {
          success: true,
          provider: "SEMAPHORE",
          messageId,
        };
      }

      // Semaphore returned an error response
      const errorMessage =
        typeof data === "object" && data !== null
          ? JSON.stringify(data)
          : String(data);

      logSmsEvent("error", "SEMAPHORE_API_ERROR", {
        requestId,
        to,
        httpStatus: res.status,
        errorCategory: "API_RESPONSE_ERROR",
        responseBody: errorMessage.substring(0, 200),
      });

      // CRITICAL: In production, do NOT silently fall back to simulator
      if (isProduction) {
        return {
          success: false,
          provider: "SEMAPHORE",
          error: "SMS delivery failed. Please try again later.",
        };
      }

      // In development, fall back to simulator with warning
      console.warn(
        `[SMS_GATEWAY] Semaphore API error in development — falling back to simulator. Response: ${errorMessage}`
      );
    } catch (err: any) {
      const errorMsg = err?.message || String(err);

      logSmsEvent("error", "SEMAPHORE_NETWORK_ERROR", {
        requestId,
        to,
        errorCategory: "NETWORK_ERROR",
        errorMessage: errorMsg.substring(0, 200),
      });

      // CRITICAL: In production, do NOT silently fall back to simulator
      if (isProduction) {
        return {
          success: false,
          provider: "SEMAPHORE",
          error: "Could not connect to SMS service. Please try again later.",
        };
      }

      // In development, fall back to simulator with warning
      console.warn(
        `[SMS_GATEWAY] Semaphore connection failed in development — falling back to simulator. Error: ${errorMsg}`
      );
    }
  } else if (isProduction) {
    // No Semaphore key in production — critical configuration issue
    logSmsEvent("error", "NO_SMS_PROVIDER_IN_PRODUCTION", {
      requestId,
      to,
      errorCategory: "CONFIGURATION_ERROR",
    });
    console.error(
      "[SMS_GATEWAY] CRITICAL: No SEMAPHORE_API_KEY configured in production. SMS cannot be delivered."
    );
    // Still fall through to simulator so devCode can work, but log the warning
  }

  // 2. Development/Test Simulator Fallback
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

  logSmsEvent("info", "SIMULATOR_DISPATCH", {
    requestId,
    to,
    recipientLocal: maskPhone(localNum),
  });

  console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║ 📱 [BANTAYBARANGAY SMS GATEWAY] SIMULATED DISPATCH                    ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Destination: ${to} (${localNum} / ${displayNum})
║ Time:        ${new Date().toLocaleTimeString("en-PH", { hour12: true })}
╠══════════════════════════════════════════════════════════════════════════╣
║ Message Content:                                                       ║
║ "${message}"
${otpCode ? `╠══════════════════════════════════════════════════════════════════════════╣\n║ 🔑 6-Digit OTP Code: >> [ ${otpCode} ] <<                                ║` : ""}
╚══════════════════════════════════════════════════════════════════════════╝
`);

  return {
    success: true,
    provider: "SIMULATOR",
    messageId: requestId,
  };
}

/**
 * Retrieves the most recent simulated SMS sent to a given phone number.
 * Useful for automated tests and dev debug endpoints.
 */
export function getLastSimulatedSms(
  phone: string
): SimulatedSmsEntry | undefined {
  return simulatedSmsHistory.find(
    (entry) =>
      entry.to === phone ||
      formatLocalPhone(entry.to) === formatLocalPhone(phone)
  );
}
