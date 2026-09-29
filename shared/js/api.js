/* ─────────────────────────────────────────────────────────
   api.js — Frontend API client connecting to SQLite backend
   ───────────────────────────────────────────────────────── */

const API = (() => {
  // Use current origin if served via HTTP, or localhost:3000 if opened via file://
  const BASE_URL = window.location.protocol.startsWith('http') 
    ? window.location.origin 
    : 'http://localhost:3000';

  let serverAvailable = null;
  const AUTH_TOKEN_KEY = 'bb_api_session_token';

  function getAuthToken() {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  }

  function setAuthToken(token) {
    if (token) sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  function clearAuthToken() {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  }

  let lastServerCheck = 0;
  async function checkServer() {
    const now = Date.now();
    if (serverAvailable !== null && (now - lastServerCheck < (serverAvailable ? 15000 : 3000))) {
      return serverAvailable;
    }
    lastServerCheck = now;
    try {
      const res = await fetch(`${BASE_URL}/api/health`, { method: 'GET', signal: AbortSignal.timeout(1500) });
      serverAvailable = res.ok;
    } catch {
      serverAvailable = false;
    }
    return serverAvailable;
  }

  async function request(endpoint, options = {}) {
    try {
      const token = getAuthToken();
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        },
        ...options
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn(`API request to ${endpoint} failed:`, err.message);
      return { success: false, error: err.message };
    }
  }

  return {
    isServerAvailable: checkServer,
    setAuthToken,
    clearAuthToken,

    // Statistics & Lookups
    getStats: () => request('/api/stats'),
    getLookups: () => request('/api/lookups'),

    // Reports
    getReports: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.agency && filters.agency !== 'all') params.append('agency', filters.agency);
      if (filters.purok && filters.purok !== 'all') params.append('purok', filters.purok);
      if (filters.reporter_id) params.append('reporter_id', filters.reporter_id);
      if (filters.reporter_mobile) params.append('reporter_mobile', filters.reporter_mobile);
      if (filters.search) params.append('search', filters.search);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/api/reports${query}`);
    },

    getExportReportsUrl: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.agency && filters.agency !== 'all') params.append('agency', filters.agency);
      if (filters.purok && filters.purok !== 'all') params.append('purok', filters.purok);
      if (filters.search) params.append('search', filters.search);
      if (filters.format) params.append('format', filters.format);
      const query = params.toString() ? `?${params.toString()}` : '';
      return `${BASE_URL}/api/reports/export${query}`;
    },

    getReportById: (id) => request(`/api/reports/${id}`),

    createReport: (data) => request('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    updateReportStatus: (id, updateData) => request(`/api/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    }),

    deleteReport: (id) => request(`/api/reports/${id}`, {
      method: 'DELETE'
    }),

    // Advisories
    getAdvisories: (all = false) => request(`/api/advisories${all ? '?all=true' : ''}`),
    createAdvisory: (data) => request('/api/advisories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    deleteAdvisory: (id) => request(`/api/advisories/${id}`, {
      method: 'DELETE'
    }),

    // Diagnostics
    getDiagnostics: () => request('/api/diagnostics'),

    // Auth & OTP
    sendOtp: (mobile, purpose = 'registration') => request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile, purpose })
    }),

    verifyOtp: (mobile, otpCode, purpose = 'registration') => request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile, otp_code: otpCode, purpose })
    }),

    register: (userData) => request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

    login: (mobile, password = '') => request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ mobile, password })
    }).then(result => {
      if (result.success && result.token) setAuthToken(result.token);
      return result;
    }),

    getMe: () => request('/api/auth/me'),

    updateProfile: (profileData) => request('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    }),

    resetPassword: (mobile, otpCode, newPassword) => request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ mobile, otp_code: otpCode, new_password: newPassword })
    }),

    uploadPhoto: (imageData, filename = '') => request('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ image: imageData, filename })
    }),

    logout: () => request('/api/auth/logout', {
      method: 'POST'
    }).then(res => {
      clearAuthToken();
      return res;
    })
  };
})();
