import { normalizePhoneNumber, formatLocalPhone, formatDisplayPhone, maskPhone, isValidPhilippinePhone } from "./src/lib/phone";
import prisma from "./src/lib/db";
import bcrypt from "bcryptjs";

const BASE_URL = "http://localhost:3000";

async function runMobileAuthTests() {
  console.log("═════════════════════════════════════════════════════════════════════");
  console.log("🚀 BantayBarangay Mobile Phone & SMS OTP Authentication Test Suite");
  console.log("═════════════════════════════════════════════════════════════════════\n");

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Phone Normalization & Formatting
  // ─────────────────────────────────────────────────────────────────────────
  console.log("TEST 1: Testing Philippine Phone Number Normalization...");
  const sample1 = "09171234567";
  const sample2 = "+639171234567";
  const sample3 = "639171234567";
  const sample4 = "+63 917 123 4567";
  const sample5 = "0917-123-4567";

  const norm1 = normalizePhoneNumber(sample1);
  const norm2 = normalizePhoneNumber(sample2);
  const norm3 = normalizePhoneNumber(sample3);
  const norm4 = normalizePhoneNumber(sample4);
  const norm5 = normalizePhoneNumber(sample5);

  if (norm1 !== "+639171234567") throw new Error(`Normalization failed for ${sample1}: got ${norm1}`);
  if (norm2 !== "+639171234567") throw new Error(`Normalization failed for ${sample2}: got ${norm2}`);
  if (norm3 !== "+639171234567") throw new Error(`Normalization failed for ${sample3}: got ${norm3}`);
  if (norm4 !== "+639171234567") throw new Error(`Normalization failed for ${sample4}: got ${norm4}`);
  if (norm5 !== "+639171234567") throw new Error(`Normalization failed for ${sample5}: got ${norm5}`);

  if (norm1 !== norm2) throw new Error("09171234567 and +639171234567 did not normalize to the same number!");
  console.log("   ✅ '09171234567' and '+639171234567' both normalize to:", norm1);

  // Invalid numbers
  if (normalizePhoneNumber("123456") !== null) throw new Error("Short number should be invalid");
  if (normalizePhoneNumber("08171234567") !== null) throw new Error("08 prefix should be invalid");
  if (normalizePhoneNumber("invalid") !== null) throw new Error("Text should be invalid");
  console.log("   ✅ Invalid numbers correctly rejected.");

  // Masking format
  const masked = maskPhone(norm1);
  if (masked !== "09********67") throw new Error(`Expected masked format 09********67, got ${masked}`);
  console.log("   ✅ Masked format matches specification:", masked);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: OTP Generation, Secure Hashing, and Storage
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\nTEST 2: Testing OTP Generation & Secure Bcrypt Storage...");
  const testPhone = "09998887766";
  const normTestPhone = normalizePhoneNumber(testPhone)!;

  // Clean test user if existed from previous run
  await prisma.user.deleteMany({ where: { phone: normTestPhone } });
  await prisma.otpVerification.deleteMany({ where: { phone: normTestPhone } });

  // Request OTP via API
  const sendRes = await fetch(`${BASE_URL}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: testPhone,
      purpose: "REGISTRATION",
    }),
  });

  const sendData = await sendRes.json();
  if (!sendRes.ok || !sendData.success) {
    throw new Error(`OTP send failed: ${JSON.stringify(sendData)}`);
  }
  console.log("   ✅ OTP requested successfully for:", sendData.maskedPhone);
  const otpCode = sendData.devCode;
  if (!otpCode || !/^\d{6}$/.test(otpCode)) {
    throw new Error(`Dev code not returned or invalid 6-digit: ${otpCode}`);
  }
  console.log("   ✅ Received 6-digit OTP code:", otpCode);

  // Verify DB record: OTP must be HASHED, NOT plaintext!
  const dbRecord = await prisma.otpVerification.findFirst({
    where: { phone: normTestPhone, purpose: "REGISTRATION", isUsed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!dbRecord) throw new Error("OTP record not found in database");
  if (dbRecord.otpHash === otpCode) {
    throw new Error("SECURITY FAILURE: OTP was stored as plaintext in the database!");
  }
  const isHashValid = await bcrypt.compare(otpCode, dbRecord.otpHash);
  if (!isHashValid) throw new Error("Bcrypt hash does not match the generated code!");
  console.log("   ✅ Security verified: OTP is securely hashed with bcrypt in DB:", dbRecord.otpHash.substring(0, 20) + "...");

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: Resend Cooldown & Abuse Protection
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\nTEST 3: Testing Resend Cooldown (60s)...");
  const immediateResend = await fetch(`${BASE_URL}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: testPhone,
      purpose: "REGISTRATION",
    }),
  });

  if (immediateResend.status !== 429) {
    throw new Error(`Expected 429 cooldown status, got ${immediateResend.status}`);
  }
  const cooldownData = await immediateResend.json();
  console.log("   ✅ Resend cooldown correctly enforced:", cooldownData.error);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: Invalid OTP & Attempt Tracking
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\nTEST 4: Testing Invalid OTP Attempt Tracking...");
  const badVerifyRes = await fetch(`${BASE_URL}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: testPhone,
      code: "000000",
      purpose: "REGISTRATION",
    }),
  });

  if (badVerifyRes.status !== 400) {
    throw new Error("Bad OTP should return 400");
  }
  const badVerifyData = await badVerifyRes.json();
  console.log("   ✅ Invalid code rejected:", badVerifyData.error);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: Verify Correct OTP & Obtain Verification Token
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\nTEST 5: Verifying Correct OTP Code...");
  const verifyRes = await fetch(`${BASE_URL}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: testPhone,
      code: otpCode,
      purpose: "REGISTRATION",
    }),
  });

  const verifyData = await verifyRes.json();
  if (!verifyRes.ok || !verifyData.verificationToken) {
    throw new Error(`OTP verify failed: ${JSON.stringify(verifyData)}`);
  }
  const verificationToken = verifyData.verificationToken;
  console.log("   ✅ OTP Verified! Granted single-use verification token:", verificationToken);

  // Check that the OTP is marked used
  const usedRecord = await prisma.otpVerification.findUnique({
    where: { id: dbRecord.id },
  });
  if (!usedRecord?.isUsed) throw new Error("OTP was not marked as isUsed: true");
  console.log("   ✅ OTP marked as used in DB, preventing replay attacks.");

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: Complete Registration with Personal Info (DOB + Calculated Age)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\nTEST 6: Completing Resident Registration with Personal Info & Dynamic Age...");
  
  // Test future date rejection
  const futureDateRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Tito Sotto",
      birthDate: "2035-01-01",
      phone: testPhone,
      password: "SecurePassword123!",
      verificationToken,
    }),
  });
  if (futureDateRes.status !== 400) {
    throw new Error("Future birthDate should have returned 400");
  }
  const futureDateData = await futureDateRes.json();
  console.log("   ✅ Future date correctly rejected:", futureDateData.error);

  // Test valid registration
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Tito Sotto",
      birthDate: "1998-03-15",
      phone: testPhone,
      password: "SecurePassword123!",
      verificationToken,
    }),
  });

  const regData = await regRes.json();
  if (!regRes.ok || !regData.user) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  const sessionCookie = regRes.headers.get("set-cookie") || "";
  console.log("   ✅ Resident registered successfully!");
  console.log("   User Name:", regData.user.name);
  console.log("   User Phone:", regData.user.phone);
  console.log("   User Birth Date:", regData.user.birthDate);
  console.log("   User Calculated Age:", regData.user.age);
  console.log("   User Email:", regData.user.email ?? "(None - mobile only)");
  console.log("   Session Cookie Granted:", sessionCookie.includes("bantay_session"));

  if (regData.user.age !== 28) {
    throw new Error(`Expected age 28 for birthDate 1998-03-15, got ${regData.user.age}`);
  }
  console.log("   ✅ Server-side dynamic age calculation verified: exactly 28 years old!");

  // Verify verification token is consumed
  const tokenRecord = await prisma.otpVerification.findUnique({
    where: { id: dbRecord.id },
  });
  if (tokenRecord?.verificationToken !== null) {
    throw new Error("Verification token was not consumed!");
  }
  console.log("   ✅ Verification token consumed and invalidated.");

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 7: Account Uniqueness Enforcement
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\nTEST 7: Testing Account Uniqueness Enforcement...");
  // Try to send registration OTP again for the same number (both formats)
  const dup1 = await fetch(`${BASE_URL}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: testPhone, // "09998887766"
      purpose: "REGISTRATION",
    }),
  });

  const dup1Data = await dup1.json();
  if (dup1.status !== 400 || !dup1Data.error.includes("already registered")) {
    throw new Error(`Expected uniqueness error for 09 format, got: ${JSON.stringify(dup1Data)}`);
  }
  console.log("   ✅ Duplicate registration blocked for 09... format:", dup1Data.error);

  const dup2 = await fetch(`${BASE_URL}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "+639998887766", // "+63..." format
      purpose: "REGISTRATION",
    }),
  });

  const dup2Data = await dup2.json();
  if (dup2.status !== 400 || !dup2Data.error.includes("already registered")) {
    throw new Error(`Expected uniqueness error for +63 format, got: ${JSON.stringify(dup2Data)}`);
  }
  console.log("   ✅ Duplicate registration blocked for +63... format:", dup2Data.error);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 8: Login with Mobile Number + Password
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\nTEST 8: Testing Login with Mobile Number (both formats)...");
  // Login with 09XXXXXXXXX
  const login1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "09998887766",
      password: "SecurePassword123!",
    }),
  });
  const login1Data = await login1.json();
  if (!login1.ok || login1Data.user.phone !== normTestPhone) {
    throw new Error(`Login with 09... format failed: ${JSON.stringify(login1Data)}`);
  }
  console.log("   ✅ Login with '09998887766' succeeded for:", login1Data.user.name);

  // Login with +639XXXXXXXXX
  const login2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "+639998887766",
      password: "SecurePassword123!",
    }),
  });
  const login2Data = await login2.json();
  if (!login2.ok || login2Data.user.phone !== normTestPhone) {
    throw new Error(`Login with +63... format failed: ${JSON.stringify(login2Data)}`);
  }
  console.log("   ✅ Login with '+639998887766' succeeded for:", login2Data.user.name);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 9: Mobile Password Recovery (Forgot Password Flow)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\nTEST 9: Testing Mobile Number Password Recovery (Forgot Password)...");
  // Step 9.1: Request reset OTP
  const forgotSend = await fetch(`${BASE_URL}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "09998887766",
      purpose: "PASSWORD_RESET",
    }),
  });
  const forgotSendData = await forgotSend.json();
  if (!forgotSend.ok || !forgotSendData.devCode) {
    throw new Error(`Forgot password OTP send failed: ${JSON.stringify(forgotSendData)}`);
  }
  const resetOtp = forgotSendData.devCode;
  console.log("   ✅ Password reset OTP received:", resetOtp);

  // Step 9.2: Verify reset OTP
  const forgotVerify = await fetch(`${BASE_URL}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "09998887766",
      code: resetOtp,
      purpose: "PASSWORD_RESET",
    }),
  });
  const forgotVerifyData = await forgotVerify.json();
  if (!forgotVerify.ok || !forgotVerifyData.verificationToken) {
    throw new Error(`Forgot password verify failed: ${JSON.stringify(forgotVerifyData)}`);
  }
  const resetToken = forgotVerifyData.verificationToken;
  console.log("   ✅ Reset OTP verified, token granted:", resetToken);

  // Step 9.3: Reset password
  const resetRes = await fetch(`${BASE_URL}/api/auth/forgot-password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      verificationToken: resetToken,
      newPassword: "BrandNewPassword999!",
    }),
  });
  const resetData = await resetRes.json();
  if (!resetRes.ok || !resetData.success) {
    throw new Error(`Password reset failed: ${JSON.stringify(resetData)}`);
  }
  console.log("   ✅ Password updated successfully:", resetData.message);

  // Step 9.4: Old password should now fail
  const oldLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "09998887766",
      password: "SecurePassword123!",
    }),
  });
  if (oldLogin.status !== 401) {
    throw new Error("Old password should have been rejected after reset!");
  }
  console.log("   ✅ Old password correctly rejected after reset.");

  // Step 9.5: Login with new password
  const newLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "09998887766",
      password: "BrandNewPassword999!",
    }),
  });
  const newLoginData = await newLogin.json();
  if (!newLogin.ok || !newLoginData.user) {
    throw new Error("Login with new password failed!");
  }
  console.log("   ✅ Login with new password succeeded!");

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 10: Backward Compatibility for Existing Users (Email & Mobile)
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\nTEST 10: Testing Backward Compatibility for Seeded Accounts...");
  // Login staff with email
  const staffEmailLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "staff@bantay.ph",
      password: "Password123!",
    }),
  });
  const staffEmailData = await staffEmailLogin.json();
  if (!staffEmailLogin.ok || staffEmailData.user.role !== "STAFF") {
    throw new Error(`Staff login by email failed: ${JSON.stringify(staffEmailData)}`);
  }
  console.log("   ✅ Staff logged in via email (staff@bantay.ph):", staffEmailData.user.name);

  // Login staff with mobile number
  const staffPhoneLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "09193332222",
      password: "Password123!",
    }),
  });
  const staffPhoneData = await staffPhoneLogin.json();
  if (!staffPhoneLogin.ok || staffPhoneData.user.role !== "STAFF") {
    throw new Error(`Staff login by mobile failed: ${JSON.stringify(staffPhoneData)}`);
  }
  console.log("   ✅ Staff logged in via mobile number (09193332222):", staffPhoneData.user.name);

  // Login admin with mobile number
  const adminPhoneLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "09182221111",
      password: "Password123!",
    }),
  });
  const adminPhoneData = await adminPhoneLogin.json();
  if (!adminPhoneLogin.ok || adminPhoneData.user.role !== "ADMIN") {
    throw new Error(`Admin login by mobile failed: ${JSON.stringify(adminPhoneData)}`);
  }
  console.log("   ✅ Admin logged in via mobile number (09182221111):", adminPhoneData.user.name);

  console.log("\n═════════════════════════════════════════════════════════════════════");
  console.log("🎉 ALL 10 MOBILE AUTHENTICATION TESTS PASSED SUCCESSFULLY!");
  console.log("═════════════════════════════════════════════════════════════════════\n");
}

runMobileAuthTests()
  .catch((err) => {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
