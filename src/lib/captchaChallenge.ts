/**
 * Simple CAPTCHA Challenge — Server-side math CAPTCHA.
 * No external dependencies. Uses encrypted tokens for verification.
 */
import crypto from "crypto";

function getCaptchaSecret(): string {
  return process.env.JWT_SECRET || "bantay-captcha-key-2026";
}

const TOKEN_EXPIRY_MINUTES = 5;

interface CaptchaChallenge {
  question: string;
  token: string;
}

/**
 * Generate a math-based CAPTCHA challenge
 */
export function generateChallenge(): CaptchaChallenge {
  const operations = [
    () => {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      return { question: `What is ${a} + ${b}?`, answer: a + b };
    },
    () => {
      const a = Math.floor(Math.random() * 20) + 10;
      const b = Math.floor(Math.random() * 10) + 1;
      return { question: `What is ${a} - ${b}?`, answer: a - b };
    },
    () => {
      const a = Math.floor(Math.random() * 9) + 2;
      const b = Math.floor(Math.random() * 9) + 2;
      return { question: `What is ${a} × ${b}?`, answer: a * b };
    },
  ];

  const op = operations[Math.floor(Math.random() * operations.length)];
  const { question, answer } = op();

  // Create encrypted token containing the answer and expiry
  const payload = JSON.stringify({
    answer,
    expires: Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000,
  });

  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(getCaptchaSecret(), "salt", 32);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(payload, "utf8", "hex");
  encrypted += cipher.final("hex");

  const token = iv.toString("hex") + ":" + encrypted;

  return { question, token };
}

/**
 * Verify a CAPTCHA answer against the encrypted token
 */
export function verifyChallenge(token: string, userAnswer: number): {
  valid: boolean;
  reason?: string;
} {
  try {
    const [ivHex, encrypted] = token.split(":");
    if (!ivHex || !encrypted) {
      return { valid: false, reason: "Invalid token format" };
    }

    const iv = Buffer.from(ivHex, "hex");
    const key = crypto.scryptSync(getCaptchaSecret(), "salt", 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    const payload = JSON.parse(decrypted);

    // Check expiry
    if (Date.now() > payload.expires) {
      return { valid: false, reason: "Challenge has expired. Please request a new one." };
    }

    // Check answer
    if (payload.answer === userAnswer) {
      return { valid: true };
    }

    return { valid: false, reason: "Incorrect answer. Please try again." };
  } catch {
    return { valid: false, reason: "Invalid or corrupted challenge token." };
  }
}
