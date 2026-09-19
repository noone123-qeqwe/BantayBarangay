/* ─────────────────────────────────────────────────────────
   auth.js — User Accounts & Authentication Engine
   ───────────────────────────────────────────────────────── */

const Auth = (() => {
  const USERS_STORAGE_KEY = 'bantay_users';
  const SESSION_STORAGE_KEY = 'bantay_current_user';

  // ── PRE-SEEDED RESIDENTS & OFFICIALS ──────────────────────
  const SEED_USERS = [
    {
      id: 'usr-001',
      name: 'Juan dela Cruz',
      email: 'juan@gmail.com',
      mobile: '09171234567',
      purok: 'Purok 1, Brgy. Espinosa, Masbate City',
      role: 'resident',
      password: 'resident123',
      createdAt: '2026-09-01T08:00:00.000Z'
    },
    {
      id: 'usr-002',
      name: 'Maria Santos',
      email: 'maria@gmail.com',
      mobile: '09189876543',
      purok: 'Purok 2, Brgy. Espinosa, Masbate City',
      role: 'resident',
      password: 'resident123',
      createdAt: '2026-09-05T09:30:00.000Z'
    },
    {
      id: 'usr-admin-001',
      name: 'Officer Renato Bautista',
      email: 'admin@barangay.gov.ph',
      mobile: '09205550199',
      purok: 'Barangay Hall',
      role: 'admin',
      password: 'admin123',
      createdAt: '2026-08-15T00:00:00.000Z'
    }
  ];

  function init() {
    try {
      const existing = localStorage.getItem(USERS_STORAGE_KEY);
      if (!existing) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEED_USERS));
      }
    } catch (e) {
      console.error('Auth initialization error:', e);
    }
  }

  function getUsers() {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return getCurrentUser() !== null;
  }

  function isAdmin() {
    const u = getCurrentUser();
    return u && u.role === 'admin';
  }

  function register({ name, email, mobile, purok, password }) {
    init();
    const users = getUsers();

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanMobile = (mobile || '').replace(/\D/g, '');
    const cleanName = (name || '').trim();

    if (!cleanName) return { success: false, error: 'Full name is required.' };
    if (!cleanEmail && !cleanMobile) return { success: false, error: 'Provide at least an email or mobile number.' };
    if (!password || password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };

    // Check email uniqueness
    if (cleanEmail && users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'This email is already registered. Please log in.' };
    }

    // Check mobile uniqueness if provided
    if (cleanMobile && users.some(u => (u.mobile || '').replace(/\D/g, '') === cleanMobile)) {
      return { success: false, error: 'This mobile number is already registered.' };
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      name: cleanName,
      email: cleanEmail,
      mobile: mobile ? mobile.trim() : '',
      purok: purok || 'Purok 1, Brgy. Espinosa, Masbate City',
      // Privileged accounts are provisioned separately by the barangay.
      role: 'resident',
      password: password,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Auto-login newly created user
    loginUserSession(newUser);

    return { success: true, user: sanitizeUser(newUser) };
  }

  // ── PHILIPPINE MOBILE PHONE VALIDATION ───────────────────
  function validatePhilippineMobile(input) {
    if (!input || !input.trim()) {
      return {
        isValid: false,
        error: 'Please enter your Philippine mobile phone number.'
      };
    }

    const raw = input.trim();
    // Strip spaces, dashes, parentheses, dots
    let cleaned = raw.replace(/[\s\-\(\)\.]/g, '');

    // Normalize +63 or 63 prefix
    if (cleaned.startsWith('+63')) {
      cleaned = cleaned.substring(3);
      if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('63') && cleaned.length >= 12) {
      cleaned = cleaned.substring(2);
      if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // A valid PH mobile number must have 10 digits starting with 9 (9XXXXXXXXX)
    const phPattern = /^9\d{9}$/;
    if (!phPattern.test(cleaned)) {
      if (cleaned.length > 0 && !cleaned.startsWith('9')) {
        return {
          isValid: false,
          error: 'Philippine mobile numbers must start with 09 or +63 9 (e.g. 0917 123 4567).'
        };
      }
      if (cleaned.length < 10) {
        return {
          isValid: false,
          error: `Incomplete mobile number (${cleaned.length + 1}/11 digits). Format must be 09XXXXXXXXX or +63 9XXXXXXXXX.`
        };
      }
      if (cleaned.length > 10) {
        return {
          isValid: false,
          error: 'Phone number has too many digits. Valid Philippine mobile numbers have 11 digits.'
        };
      }
      return {
        isValid: false,
        error: 'Invalid Philippine mobile number format. Use 09XXXXXXXXX or +63 9XXXXXXXXX.'
      };
    }

    const normalized = '0' + cleaned; // 09171234567
    const intlFormatted = '+63 ' + cleaned.substring(0, 3) + ' ' + cleaned.substring(3, 6) + ' ' + cleaned.substring(6);
    const localFormatted = normalized.substring(0, 4) + ' ' + normalized.substring(4, 7) + ' ' + normalized.substring(7);

    // Optional telecom network detector (helpful UX touch in PH)
    let network = 'Philippine Mobile';
    const prefix3 = cleaned.substring(0, 3);
    if (/^(917|927|937|945|955|956|965|966|975|976|977|978|995|997)/.test(prefix3)) {
      network = 'Globe / TM';
    } else if (/^(908|918|919|920|921|928|929|939|947|948|949|961|963|968|970|981|989|998|999)/.test(prefix3)) {
      network = 'Smart / TNT';
    } else if (/^(991|992|993|994)/.test(prefix3)) {
      network = 'DITO';
    }

    return {
      isValid: true,
      raw,
      cleaned,
      normalized,
      intlFormatted,
      localFormatted,
      network
    };
  }

  // ── PHONE & PASSWORD LOGIN ────────────────────────────────
  function login(phoneInput, password) {
    init();
    if (!phoneInput || !phoneInput.trim()) {
      return { success: false, error: 'Please enter your Philippine mobile phone number.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    const val = validatePhilippineMobile(phoneInput);
    if (!val.isValid) {
      return { success: false, error: val.error };
    }

    const users = getUsers();
    const digits = val.cleaned;

    let user = users.find(u => {
      const uDigits = (u.mobile || '').replace(/\D/g, '');
      return uDigits.endsWith(digits);
    });

    if (!user) {
      return {
        success: false,
        error: `No account registered with ${val.localFormatted}. Please click "Create Account" below.`,
        notFound: true
      };
    }

    // Verify password (defaults to 'resident123' or 'admin123' for seed users if not explicitly customized)
    const expectedPassword = user.password || (user.role === 'admin' ? 'admin123' : 'resident123');
    if (password !== expectedPassword) {
      return {
        success: false,
        error: 'Incorrect password. Please try again or use SMS Code.'
      };
    }

    loginUserSession(user);
    // Keep the optional SQLite API in sync with the browser session. The UI can
    // still run offline, while server-backed admin updates require this token.
    if (typeof API !== 'undefined') {
      API.login(phoneInput, password).catch(() => {});
    }
    return {
      success: true,
      user: sanitizeUser(user),
      phoneData: val
    };
  }

  // ── PHONE-ONLY LOGIN & REGISTRATION ───────────────────────
  function loginWithPhone(phoneInput, profileData = {}) {
    init();
    const val = validatePhilippineMobile(phoneInput);
    if (!val.isValid) {
      return { success: false, error: val.error };
    }

    const users = getUsers();
    const digits = val.cleaned; // 10 digits without leading 0

    // Find user by normalized mobile
    let user = users.find(u => {
      const uDigits = (u.mobile || '').replace(/\D/g, '');
      return uDigits.endsWith(digits);
    });

    if (user) {
      // Existing user: log in immediately
      loginUserSession(user);
      return {
        success: true,
        user: sanitizeUser(user),
        isExisting: true,
        phoneData: val
      };
    } else {
      // New resident: auto-create account using their mobile number
      const newName = (profileData.name || '').trim() || `Resident (${val.localFormatted.substring(0, 9)}…)`;
      const newPurok = profileData.purok || 'Purok 1, Brgy. Espinosa, Masbate City';
      const newUser = {
        id: 'usr-' + Date.now(),
        name: newName,
        email: '',
        mobile: val.normalized,
        purok: newPurok,
        role: 'resident',
        password: 'resident123',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      saveUsers(users);
      loginUserSession(newUser);

      return {
        success: true,
        user: sanitizeUser(newUser),
        isExisting: false,
        isNew: true,
        phoneData: val
      };
    }
  }

  // ── PHONE-NUMBER-BASED CREATE ACCOUNT WITH OTP LIFECYCLE ──
  let pendingRegistration = null;
  const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes expiry (matches server)
  const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown

  /** Generate a cryptographically random 6-digit OTP code */
  function generateOtpCode() {
    if (window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      return String(100000 + (arr[0] % 900000));
    }
    return String(100000 + Math.floor(Math.random() * 900000));
  }

  /**
   * Send OTP via the server API (which dispatches real SMS via TextBee.dev).
   * Returns { success, demo_otp? } — demo_otp is only present when SMS is disabled.
   */
  async function sendOtpViaServer(mobile, purpose = 'registration') {
    if (typeof API !== 'undefined') {
      try {
        const serverUp = await API.isServerAvailable();
        if (serverUp) {
          const result = await API.sendOtp(mobile, purpose);
          return result;
        }
      } catch (e) {
        console.warn('Server OTP request failed, using client-side fallback:', e);
      }
    }
    return { success: false, offline: true };
  }

  function stageRegistration({ name, mobile, purok, password, confirmPassword }) {
    init();
    const cleanName = (name || '').trim() || 'Resident';

    if (!mobile || !mobile.trim()) {
      return { success: false, error: 'Please enter your Philippine mobile phone number.' };
    }

    const phoneVal = validatePhilippineMobile(mobile);
    if (!phoneVal.isValid) {
      return { success: false, error: phoneVal.error };
    }

    // Check duplicate phone number in existing users
    const users = getUsers();
    const existingUser = users.find(u => {
      const uDigits = (u.mobile || '').replace(/\D/g, '');
      return uDigits.endsWith(phoneVal.cleaned);
    });

    if (existingUser) {
      return {
        success: false,
        error: `The mobile number ${phoneVal.localFormatted} is already registered. Please log in instead.`,
        isDuplicate: true
      };
    }

    if (!password) {
      return { success: false, error: 'Please create a password (minimum 6 characters).' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match. Please re-enter your confirm password.' };
    }

    const now = Date.now();
    const otpCode = generateOtpCode();
    pendingRegistration = {
      name: cleanName,
      mobile: phoneVal.normalized,
      phoneData: phoneVal,
      purok: purok || 'Purok 1, Brgy. Espinosa, Masbate City',
      password: password,
      role: 'resident',
      code: otpCode,
      createdAt: now,
      expiresAt: now + OTP_EXPIRY_MS,
      canResendAt: now + OTP_RESEND_COOLDOWN_MS
    };

    return {
      success: true,
      pending: {
        name: pendingRegistration.name,
        phoneData: phoneVal,
        purok: pendingRegistration.purok,
        expiresAt: pendingRegistration.expiresAt,
        canResendAt: pendingRegistration.canResendAt,
        code: pendingRegistration.code
      }
    };
  }

  function getPendingRegistration() {
    return pendingRegistration;
  }

  function cancelRegistration() {
    pendingRegistration = null;
    return { success: true };
  }

  function verifyRegistrationOtp(code) {
    if (!pendingRegistration) {
      return {
        success: false,
        error: 'No registration in progress. Please fill out the registration form first.'
      };
    }

    const now = Date.now();
    if (now > pendingRegistration.expiresAt) {
      return {
        success: false,
        error: 'The verification code has expired. Please tap "Resend Code" to receive a new one.',
        isExpired: true
      };
    }

    const cleanEntered = (code || '').trim();
    if (cleanEntered !== pendingRegistration.code) {
      return {
        success: false,
        error: 'Incorrect verification code. Please check your SMS and try again.'
      };
    }

    // SUCCESS: Account creation ONLY completes after phone number is verified!
    const users = getUsers();
    const newUser = {
      id: 'usr-' + Date.now(),
      name: pendingRegistration.name,
      email: '',
      mobile: pendingRegistration.mobile,
      purok: pendingRegistration.purok,
      role: pendingRegistration.role || 'resident',
      password: pendingRegistration.password,
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      phoneVerified: true
    };

    users.push(newUser);
    saveUsers(users);

    // Establish authenticated session
    loginUserSession(newUser);

    // Clear pending registration
    const savedUser = sanitizeUser(newUser);
    pendingRegistration = null;

    return {
      success: true,
      user: savedUser
    };
  }

  function resendRegistrationOtp() {
    if (!pendingRegistration) {
      return {
        success: false,
        error: 'No registration in progress.'
      };
    }

    const now = Date.now();
    if (now < pendingRegistration.canResendAt) {
      const waitSec = Math.ceil((pendingRegistration.canResendAt - now) / 1000);
      return {
        success: false,
        error: `Please wait ${waitSec} second${waitSec > 1 ? 's' : ''} before requesting another code.`,
        cooldownRemaining: waitSec
      };
    }

    // Refresh expiry and cooldown
    pendingRegistration.expiresAt = now + OTP_EXPIRY_MS;
    pendingRegistration.canResendAt = now + OTP_RESEND_COOLDOWN_MS;

    return {
      success: true,
      code: pendingRegistration.code,
      phoneData: pendingRegistration.phoneData,
      expiresAt: pendingRegistration.expiresAt,
      canResendAt: pendingRegistration.canResendAt
    };
  }

  function loginUserSession(user) {
    const safeUser = sanitizeUser(user);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUser));

    // If admin, also unlock admin session
    if (user.role === 'admin') {
      sessionStorage.setItem('bantay_admin_authenticated', 'true');
    }

    notifyAuthChange(safeUser);
  }

  function logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    if (typeof API !== 'undefined') API.clearAuthToken();
    notifyAuthChange(null);
    return { success: true };
  }

  function sanitizeUser(user) {
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  }

  function notifyAuthChange(user) {
    window.dispatchEvent(new CustomEvent('authChange', { detail: { user } }));
  }

  function onAuthChange(callback) {
    window.addEventListener('authChange', e => callback(e.detail.user));
  }

  // ── PROFILE & SETTINGS MANAGEMENT ────────────────────────
  const DEFAULT_SETTINGS = {
    smsEmergencyAlerts: true,
    smsStatusUpdates: true,
    soundEffects: true,
    highContrastMap: false,
    autoLocateOnOpen: false
  };

  function updateProfile({ name, email, purok }) {
    init();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'No active user session.' };
    }

    const cleanName = (typeof name !== 'undefined' && name.trim()) ? name.trim() : (currentUser.name || 'Resident');

    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex === -1) {
      return { success: false, error: 'User account not found in database.' };
    }

    // Update in stored users array
    users[userIndex].name = cleanName;
    if (typeof email !== 'undefined') users[userIndex].email = (email || '').trim().toLowerCase();
    if (typeof purok !== 'undefined') users[userIndex].purok = (purok || '').trim();

    saveUsers(users);

    // Update session
    const updatedUser = {
      ...currentUser,
      name: cleanName,
      email: typeof email !== 'undefined' ? (email || '').trim().toLowerCase() : currentUser.email,
      purok: typeof purok !== 'undefined' ? (purok || '').trim() : (currentUser.purok || '')
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
    notifyAuthChange(updatedUser);

    return {
      success: true,
      user: updatedUser
    };
  }

  function changePassword(currentPassword, newPassword) {
    init();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'No active user session.' };
    }

    if (!currentPassword) {
      return { success: false, error: 'Please enter your current password.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    const users = getUsers();
    const user = users.find(u => u.id === currentUser.id);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    const expected = user.password || (user.role === 'admin' ? 'admin123' : 'resident123');
    if (currentPassword !== expected) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    user.password = newPassword;
    saveUsers(users);

    return {
      success: true,
      message: 'Password updated successfully.'
    };
  }

  function changePhoneNumber(newMobileRaw, password) {
    init();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'No active user session.' };
    }

    const cleanRaw = (newMobileRaw || '').trim();
    if (!cleanRaw) {
      return { success: false, error: 'Please enter your new Philippine mobile number.' };
    }

    const val = validatePhilippineMobile(cleanRaw);
    if (!val.isValid) {
      return { success: false, error: val.error || 'Please enter a valid 11-digit Philippine mobile number (09XXXXXXXXX).' };
    }

    if (!password) {
      return { success: false, error: 'Please enter your current password to authorize this change.' };
    }

    const users = getUsers();
    const user = users.find(u => u.id === currentUser.id);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    const expected = user.password || (user.role === 'admin' ? 'admin123' : 'resident123');
    if (password !== expected) {
      return { success: false, error: 'Current password confirmation is incorrect.' };
    }

    const currentNorm = (user.mobile || '').replace(/\D/g, '');
    const newNorm = val.normalized.replace(/\D/g, '');
    if (currentNorm === newNorm) {
      return { success: false, error: 'New mobile number is the same as your current registered number.' };
    }

    const duplicate = users.find(u => u.id !== currentUser.id && (u.mobile || '').replace(/\D/g, '') === newNorm);
    if (duplicate) {
      return { success: false, error: `Mobile number ${val.standard} is already registered to another user.` };
    }

    // Update in users database
    user.mobile = val.normalized;
    saveUsers(users);

    // Update active session
    const updatedUser = {
      ...currentUser,
      mobile: val.normalized
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
    notifyAuthChange(updatedUser);

    return {
      success: true,
      message: `Mobile number successfully changed to ${val.standard}.`,
      user: sanitizeUser(updatedUser),
      formatted: val.standard,
      intlFormatted: val.intlFormatted
    };
  }

  function getSettings() {
    const user = getCurrentUser();
    const key = user ? `bantay_settings_${user.id}` : 'bantay_settings_guest';
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function updateSettings(newSettings) {
    const user = getCurrentUser();
    const key = user ? `bantay_settings_${user.id}` : 'bantay_settings_guest';
    const current = getSettings();
    const merged = { ...current, ...newSettings };
    try {
      localStorage.setItem(key, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('settingsChange', { detail: { settings: merged } }));
      return { success: true, settings: merged };
    } catch (e) {
      return { success: false, error: 'Failed to save settings.' };
    }
  }

  // Auto-init on script load
  init();

  return {
    init,
    getUsers,
    getCurrentUser,
    isLoggedIn,
    isAdmin,
    validatePhilippineMobile,
    login,
    loginWithPhone,
    stageRegistration,
    getPendingRegistration,
    cancelRegistration,
    verifyRegistrationOtp,
    resendRegistrationOtp,
    sendOtpViaServer,
    register,
    updateProfile,
    changePassword,
    changePhoneNumber,
    getSettings,
    updateSettings,
    logout,
    onAuthChange
  };
})();
