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

  async function checkServer() {
    if (serverAvailable !== null) return serverAvailable;
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
      if (filters.purok && filters.purok !== 'all') params.append('purok', filters.purok);
      if (filters.search) params.append('search', filters.search);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/api/reports${query}`);
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
    })
  };
})();
