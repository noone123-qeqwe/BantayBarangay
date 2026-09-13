/**
 * Automated Test Suite for BantayBarangay Redesigned Login Interface & Auth API
 * 
 * Verifies:
 * 1. Philippine mobile number normalization & validation logic
 * 2. Mobile login with standard domestic format (09XXXXXXXXX)
 * 3. Mobile login with international E.164 format (+639XXXXXXXXX)
 * 4. Mobile login with spaced / dashed user formatting ("0920 444 3333")
 * 5. Role-based authentication (Resident, Staff, Admin)
 * 6. Protection against account enumeration (same error for bad password vs non-existent user)
 * 7. Validation rejection on empty / invalid fields
 * 8. Session token issuance and cookie attributes
 */

import {
  normalizePhoneNumber,
  isValidPhilippinePhone,
  formatDisplayPhone,
  formatLocalPhone,
} from "./src/lib/phone";

async function runLoginTests() {
  console.log("===============================================================================");
  console.log("🚀 STARTING BANTAYBARANGAY LOGIN INTERFACE & AUTH TEST SUITE");
  console.log("===============================================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, desc: string) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${desc}`);
      failed++;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Phone Number Utilities
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("--- TEST GROUP 1: Philippine Mobile Number Normalization & Formatting ---");
  
  assert(isValidPhilippinePhone("09204443333"), "Validates domestic standard 09204443333");
  assert(isValidPhilippinePhone("+639204443333"), "Validates E.164 standard +639204443333");
  assert(isValidPhilippinePhone("639204443333"), "Validates 639204443333 without plus");
  assert(isValidPhilippinePhone("0920 444 3333"), "Validates spaced domestic format");
  assert(isValidPhilippinePhone("0920-444-3333"), "Validates dashed domestic format");
  assert(!isValidPhilippinePhone("12345"), "Rejects too short input");
  assert(!isValidPhilippinePhone("08123456789"), "Rejects invalid domestic prefix (08...)");
  assert(!isValidPhilippinePhone("091234567890123"), "Rejects too long input");

  assert(normalizePhoneNumber("09204443333") === "+639204443333", "Normalizes 09204443333 to +639204443333");
  assert(normalizePhoneNumber("+639204443333") === "+639204443333", "Normalizes +639204443333 to +639204443333");
  assert(normalizePhoneNumber("0920 444 3333") === "+639204443333", "Normalizes spaced phone to +639204443333");

  assert(formatLocalPhone("+639204443333") === "09204443333", "Converts +639204443333 to 09204443333");
  assert(formatDisplayPhone("+639204443333") === "0920 444 3333", "Formats display as '0920 444 3333'");

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. HTTP Auth API Testing against Local Dev Server
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 2: HTTP Authentication API Endpoints ---");

  const baseUrl = "http://localhost:3000";

  // Test 2.1: Domestic Mobile Login (Resident Juan Dela Cruz)
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "09204443333", password: "Password123!" }),
    });
    const data = await res.json();
    assert(res.status === 200, "Resident login returns HTTP 200");
    assert(data.user?.name === "Juan Dela Cruz", "Resident profile loaded: Juan Dela Cruz");
    assert(data.user?.role === "RESIDENT", "Resident role is RESIDENT");
    const setCookie = res.headers.get("set-cookie") || (res.headers as any).getSetCookie?.()?.join("; ") || "";
    assert(!!setCookie && setCookie.includes("bantay_session"), "Sets secure authentication session cookie (bantay_session)");
  } catch (err: any) {
    assert(false, `Resident login error: ${err.message}`);
  }

  // Test 2.2: International E.164 Login (+639204443333)
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "+639204443333", password: "Password123!" }),
    });
    const data = await res.json();
    assert(res.status === 200, "International format +639204443333 returns HTTP 200");
    assert(data.user?.name === "Juan Dela Cruz", "International format resolves to correct user");
  } catch (err: any) {
    assert(false, `International login error: ${err.message}`);
  }

  // Test 2.3: Spaced domestic mobile number ("0920 444 3333")
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "0920 444 3333", password: "Password123!" }),
    });
    const data = await res.json();
    assert(res.status === 200, "Spaced format '0920 444 3333' returns HTTP 200");
    assert(data.user?.id !== undefined, "Spaced format returns user record");
  } catch (err: any) {
    assert(false, `Spaced login error: ${err.message}`);
  }

  // Test 2.4: Barangay Staff Login (Alex Santos)
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "09193332222", password: "Password123!" }),
    });
    const data = await res.json();
    assert(res.status === 200, "Staff login returns HTTP 200");
    assert(data.user?.role === "STAFF", "Staff role verified");
  } catch (err: any) {
    assert(false, `Staff login error: ${err.message}`);
  }

  // Test 2.5: Barangay Admin Login (Roberto Tan)
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "09182221111", password: "Password123!" }),
    });
    const data = await res.json();
    assert(res.status === 200, "Admin login returns HTTP 200");
    assert(data.user?.role === "ADMIN", "Admin role verified");
  } catch (err: any) {
    assert(false, `Admin login error: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Security & Error Handling UX
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST GROUP 3: Security, Error Resilience & Anti-Enumeration ---");

  // Test 3.1: Wrong password for existing account
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "09204443333", password: "WrongPassword999!" }),
    });
    const data = await res.json();
    assert(res.status === 401, "Wrong password returns HTTP 401");
    assert(
      data.error === "Invalid credentials. Please check your mobile number and password.",
      "Returns standardized credential error"
    );
  } catch (err: any) {
    assert(false, `Wrong password test error: ${err.message}`);
  }

  // Test 3.2: Non-existent mobile number
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "09999999999", password: "Password123!" }),
    });
    const data = await res.json();
    assert(res.status === 401, "Non-existent account returns HTTP 401");
    assert(
      data.error === "Invalid credentials. Please check your mobile number and password.",
      "Account enumeration prevention: exact same error returned for non-existent user"
    );
  } catch (err: any) {
    assert(false, `Non-existent user test error: ${err.message}`);
  }

  // Test 3.3: Empty fields validation
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "", password: "" }),
    });
    assert(res.status === 400, "Empty submit returns HTTP 400 Bad Request");
  } catch (err: any) {
    assert(false, `Empty submit test error: ${err.message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n===============================================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED / ${failed} FAILED (Total: ${passed + failed})`);
  console.log("===============================================================================\n");

  if (failed === 0) {
    console.log("🏆 ALL LOGIN FLOW AND AUTHENTICATION TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("⚠️ SOME TESTS FAILED. PLEASE REVIEW.");
    process.exit(1);
  }
}

runLoginTests().catch(console.error);
