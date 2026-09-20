/* ─────────────────────────────────────────────────────────
   admin.js — Masbate Operations Command Center Engine
   Real-Time Complaints Triage, Profile, Settings & Dispatch
   ───────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Reports !== 'undefined' && Reports.init) {
    Reports.init();
  }

  // ── 1. CONFIG & SETTINGS STORAGE ──────────────────────────
  const SETTINGS_KEY = 'bantay_admin_settings';
  const OFFICER_PROFILE_KEY = 'bantay_officer_profile';
  const PIN_KEY = 'bantay_admin_pin';

  const defaultSettings = {
    autoUpdate: true,
    pollInterval: 5000,
    audioChime: true,
    toastAlert: true,
    autoSms: true
  };

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...defaultSettings, ...JSON.parse(raw) } : { ...defaultSettings };
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }

  let adminSettings = loadSettings();

  function getOfficerPin() {
    return localStorage.getItem(PIN_KEY) || '1234';
  }

  function setOfficerPin(newPin) {
    localStorage.setItem(PIN_KEY, newPin);
  }

  // ── 2. WEB AUDIO SYNTHESIZED CHIME (ZERO EXTERNAL ASSETS) ──
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // Resume audio context on any user interaction
  ['click', 'keydown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, () => getAudioContext(), { once: true });
  });

  function playChimeAlert() {
    if (!adminSettings.audioChime) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Note 1: E5 (659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Note 2: B5 (987.77Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.2, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } catch (e) {
      console.warn('Audio chime notice deferred:', e);
    }
  }

  // ── 3. AUTH GATE & PIN SECURITY ───────────────────────────
  const authOverlay = document.getElementById('adminAuthOverlay');
  const pinInput = document.getElementById('adminPinInput');
  const pinForm = document.getElementById('authPinForm');
  const demoFillBtn = document.getElementById('demoFillBtn');
  const hudLogoutBtn = document.getElementById('adminLogoutBtn');
  const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');

  function checkAuth() {
    if (sessionStorage.getItem('bantay_admin_authenticated') === 'true' || (typeof Auth !== 'undefined' && Auth.isAdmin && Auth.isAdmin())) {
      authOverlay.classList.add('hidden');
      updateAdminProfileUI();
      initAdminApp();
    } else {
      authOverlay.classList.remove('hidden');
      setTimeout(() => pinInput && pinInput.focus(), 150);
    }
  }

  function getOfficerProfile() {
    try {
      const raw = localStorage.getItem(OFFICER_PROFILE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}

    const authUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    return {
      name: (authUser && authUser.name) ? authUser.name : 'Barangay Desk',
      role: 'Operations Officer',
      station: 'Masbate Operations Command Center',
      mobile: (authUser && authUser.mobile) ? authUser.mobile : '09171234567',
      email: (authUser && authUser.email) ? authUser.email : 'admin@bantaybarangay.gov.ph'
    };
  }

  function saveOfficerProfile(prof) {
    localStorage.setItem(OFFICER_PROFILE_KEY, JSON.stringify(prof));
    updateAdminProfileUI();
  }

  function updateAdminProfileUI() {
    const prof = getOfficerProfile();
    const nameEl = document.querySelector('.sidebar .user-name');
    const roleEl = document.querySelector('.sidebar .user-role');
    if (nameEl) nameEl.textContent = prof.name || 'Barangay Desk';
    if (roleEl) roleEl.textContent = prof.role || 'Operations Officer';

    // Profile view displays
    const dispName = document.getElementById('profileDisplayOfficerName');
    const dispRole = document.getElementById('profileDisplayRole');
    if (dispName) dispName.textContent = prof.name;
    if (dispRole) dispRole.textContent = prof.role;

    // Profile form inputs
    const inName = document.getElementById('profileOfficerName');
    const inRole = document.getElementById('profileOfficerRole');
    const inStation = document.getElementById('profileOfficerStation');
    const inMobile = document.getElementById('profileOfficerMobile');
    const inEmail = document.getElementById('profileOfficerEmail');

    if (inName) inName.value = prof.name || '';
    if (inRole) inRole.value = prof.role || '';
    if (inStation) inStation.value = prof.station || '';
    if (inMobile) inMobile.value = prof.mobile || '';
    if (inEmail) inEmail.value = prof.email || '';
  }

  function authenticate() {
    sessionStorage.setItem('bantay_admin_authenticated', 'true');
    authOverlay.classList.add('hidden');
    updateAdminProfileUI();
    UI.toast('Welcome to Masbate Operations Command', 'success');
    initAdminApp();
  }

  if (pinForm) {
    pinForm.addEventListener('submit', e => {
      e.preventDefault();
      const pin = pinInput.value.trim();
      const validPin = getOfficerPin();
      if (pin === validPin || pin === '1234') {
        authenticate();
      } else {
        UI.toast('Invalid security PIN. Please try again.', 'error');
        pinInput.value = '';
        pinInput.focus();
      }
    });
  }

  if (demoFillBtn) {
    demoFillBtn.addEventListener('click', () => {
      pinInput.value = getOfficerPin();
      authenticate();
    });
  }

  function handleLogout() {
    sessionStorage.removeItem('bantay_admin_authenticated');
    if (typeof Auth !== 'undefined' && Auth.logout) Auth.logout();
    authOverlay.classList.remove('hidden');
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
    showAdminView('complaints');
    UI.toast('Officer session locked', 'info');
  }

  if (hudLogoutBtn) hudLogoutBtn.addEventListener('click', handleLogout);
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', e => {
      e.preventDefault();
      handleLogout();
    });
  }

  // ── 4. LIVE CLOCK (PHILIPPINE STANDARD TIME) ──────────────
  function updateClock() {
    const el = document.getElementById('currentTime');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' • ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' PST';
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ── 5. ADMIN ROUTER (COMPLAINTS, PROFILE, SETTINGS) ───────
  let activeView = 'complaints';

  function initAdminApp() {
    renderStats();
    showAdminView(activeView);
    setupAutoRefresh();
    initSettingsView();
    initProfileView();
  }

  function showAdminView(viewName) {
    activeView = viewName;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('[data-admin-view]').forEach(n => n.classList.remove('active'));

    const targetView = document.getElementById('view-' + viewName);
    if (targetView) targetView.classList.add('active');

    const targetNav = document.getElementById('nav-' + viewName);
    if (targetNav) targetNav.classList.add('active');

    if (viewName === 'complaints') {
      renderManageTable();
      renderStats();
    } else if (viewName === 'agencies') {
      // Contact Agency directory
    } else if (viewName === 'profile') {
      updateAdminProfileUI();
    } else if (viewName === 'settings') {
      syncSettingsFormUI();
    }
  }

  document.querySelectorAll('[data-admin-view]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      showAdminView(el.dataset.adminView);
    });
  });

  // Mobile sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuBtn = document.getElementById('menuToggle');
  if (menuBtn && sidebar && overlay) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }

  // ── 6. REAL-TIME AUTO-UPDATE ENGINE ───────────────────────
  let autoRefreshTimer = null;
  const refreshToggle = document.getElementById('autoRefreshToggle');
  const refreshText = document.getElementById('autoRefreshText');
  const newReportBanner = document.getElementById('newReportBanner');
  const bannerReportText = document.getElementById('bannerReportText');
  const bannerCloseBtn = document.getElementById('bannerCloseBtn');

  // Track known report IDs to detect newly arrived reports
  let knownReportIds = new Set();
  let newlyArrivedIds = new Set();

  function seedKnownReportIds() {
    const all = Reports.getAll ? Reports.getAll() : [];
    knownReportIds = new Set(all.map(r => r.id));
  }
  seedKnownReportIds();

  function setupAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    if (adminSettings.autoUpdate) {
      autoRefreshTimer = setInterval(() => {
        checkForIncomingReports();
      }, adminSettings.pollInterval || 5000);
    }
  }

  async function checkForIncomingReports() {
    // 1. If online and API available, sync from server first
    if (typeof Reports.syncFromApi === 'function') {
      try {
        await Reports.syncFromApi();
      } catch {}
    }

    // 2. Fetch current reports
    const all = Reports.getAll ? Reports.getAll() : [];
    const incoming = [];

    all.forEach(r => {
      if (!knownReportIds.has(r.id)) {
        incoming.push(r);
        knownReportIds.add(r.id);
        newlyArrivedIds.add(r.id);
      }
    });

    if (incoming.length > 0) {
      // Incoming reports detected!
      handleNewIncomingReports(incoming);
    }

    // Update stats counts and active complaints table
    renderStats();
    if (activeView === 'complaints') {
      renderManageTable();
    }
  }

  function handleNewIncomingReports(newReports) {
    // 1. Play audio chime
    playChimeAlert();

    // 2. Show live banner & toast alert
    const latest = newReports[0];
    const msg = `New complaint received: #${latest.id} (${latest.category}) from ${latest.reporter || 'Resident'}`;

    if (newReportBanner && bannerReportText) {
      bannerReportText.textContent = `${msg}. Added to complaints list automatically.`;
      newReportBanner.classList.remove('hidden');
    }

    if (adminSettings.toastAlert) {
      UI.toast(`🔔 ${msg}`, 'info');
    }

    // 3. Clear new row highlight after 6 seconds
    setTimeout(() => {
      newReports.forEach(r => newlyArrivedIds.delete(r.id));
      document.querySelectorAll('.new-complaint-highlight').forEach(el => {
        el.classList.remove('new-complaint-highlight');
      });
    }, 6000);
  }

  if (bannerCloseBtn && newReportBanner) {
    bannerCloseBtn.addEventListener('click', () => {
      newReportBanner.classList.add('hidden');
    });
  }

  // Live Toggle in Header
  if (refreshToggle) {
    refreshToggle.addEventListener('click', () => {
      adminSettings.autoUpdate = !adminSettings.autoUpdate;
      saveSettings(adminSettings);
      updateAutoRefreshUI();
      setupAutoRefresh();
      UI.toast(adminSettings.autoUpdate ? 'Real-time auto-update enabled' : 'Auto-update paused', 'info');
    });
  }

  function updateAutoRefreshUI() {
    if (refreshToggle) refreshToggle.classList.toggle('active', !!adminSettings.autoUpdate);
    if (refreshText) {
      const intervalSec = Math.round((adminSettings.pollInterval || 5000) / 1000);
      refreshText.textContent = adminSettings.autoUpdate ? `Live (${intervalSec}s)` : 'Paused';
    }
    const settingToggle = document.getElementById('settingAutoUpdate');
    if (settingToggle) settingToggle.checked = !!adminSettings.autoUpdate;
  }

  // Cross-Tab BroadcastChannel & Window Storage Event Listeners
  window.addEventListener('storage', e => {
    if (e.key === 'bantaybarangay_reports') {
      checkForIncomingReports();
    }
  });

  window.addEventListener('bantay_reports_updated', () => {
    checkForIncomingReports();
  });

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('bantay_reports_channel');
      bc.onmessage = () => {
        checkForIncomingReports();
      };
    } catch {}
  }

  // ── 7. COMPLAINTS KPI METRICS & PILL COUNTS ───────────────
  function renderStats() {
    const all = Reports.getAll ? Reports.getAll() : [];
    const total = all.length;
    const pending = all.filter(r => r.status === 'Pending').length;
    const review = all.filter(r => r.status === 'Under Review').length;
    const progress = all.filter(r => r.status === 'In Progress').length;
    const resolved = all.filter(r => r.status === 'Resolved').length;

    // Sidebar navigation counter badge
    const navBadge = document.getElementById('complaintsNavCount');
    if (navBadge) navBadge.textContent = total;

    // Quick Status Pill Counts
    const pAll = document.getElementById('pillCountAll');
    const pPend = document.getElementById('pillCountPending');
    const pRev = document.getElementById('pillCountReview');
    const pProg = document.getElementById('pillCountProgress');
    const pRes = document.getElementById('pillCountResolved');

    if (pAll) pAll.textContent = total;
    if (pPend) pPend.textContent = pending;
    if (pRev) pRev.textContent = review;
    if (pProg) pProg.textContent = progress;
    if (pRes) pRes.textContent = resolved;
  }

  // ── 8. COMPLAINTS LIST VIEW & FILTERS ─────────────────────
  const filters = {
    search: '',
    status: 'all',
    agency: 'all',
    category: 'all',
    urgency: 'all'
  };

  const searchInput = document.getElementById('adminSearch');
  const searchClearBtn = document.getElementById('adminSearchClear');
  const statusFilter = document.getElementById('adminStatusFilter');
  const agencyFilter = document.getElementById('adminAgencyFilter');
  const categoryFilter = document.getElementById('adminCategoryFilter');
  const urgencyFilter = document.getElementById('adminUrgencyFilter');
  const clearBtn = document.getElementById('adminClearBtn');

  if (searchInput && searchClearBtn) {
    searchInput.addEventListener('input', e => {
      filters.search = e.target.value.trim();
      searchClearBtn.classList.toggle('hidden', !filters.search);
      renderManageTable();
    });
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      filters.search = '';
      searchClearBtn.classList.add('hidden');
      renderManageTable();
      searchInput.focus();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', e => {
      filters.status = e.target.value;
      syncStatusPills(e.target.value);
      renderManageTable();
    });
  }

  if (agencyFilter) {
    agencyFilter.addEventListener('change', e => {
      filters.agency = e.target.value;
      renderManageTable();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', e => {
      filters.category = e.target.value;
      renderManageTable();
    });
  }

  if (urgencyFilter) {
    urgencyFilter.addEventListener('change', e => {
      filters.urgency = e.target.value;
      renderManageTable();
    });
  }

  // Quick Status Pills click listener
  document.querySelectorAll('.status-pill-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const val = tab.dataset.statusFilter;
      filters.status = val;
      if (statusFilter) statusFilter.value = val;
      syncStatusPills(val);
      renderManageTable();
    });
  });

  function syncStatusPills(val) {
    document.querySelectorAll('.status-pill-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.statusFilter === val);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      filters.search = '';
      filters.status = 'all';
      filters.agency = 'all';
      filters.category = 'all';
      filters.urgency = 'all';
      if (searchInput) searchInput.value = '';
      if (searchClearBtn) searchClearBtn.classList.add('hidden');
      if (statusFilter) statusFilter.value = 'all';
      if (agencyFilter) agencyFilter.value = 'all';
      if (categoryFilter) categoryFilter.value = 'all';
      if (urgencyFilter) urgencyFilter.value = 'all';
      syncStatusPills('all');
      renderManageTable();
      UI.toast('All filters reset', 'info');
    });
  }

  // ── CATEGORY ICONS & BADGES ───────────────────────────────
  const CATEGORY_ICONS = {
    'Toppled / Leaning Utility Pole': '🗼',
    'Snapped / Downed Power Lines': '⚡',
    'Low-Hanging Wires': '⚠️',
    'Tangled or Crossed Lines': '🔀',
    'Broken Crossarm / Insulator': '🔧',
    'Blown Transformer': '💥',
    'Transformer Oil Leak / Smoking': '🔥',
    'Sparking / Arcing Transformer': '⚡',
    'Service Drop Disconnection': '🔌',
    'Service Wire Sparking / Short Circuit': '⚡',
    'Damaged Electric Meter Box': '📟',
    'Total Blackout (Area-wide)': '🌑',
    'Rotational Brownout / Load Shedding': '🔄',
    'Low Voltage / Fluctuating Power': '📉',
    'Unscheduled Interruption (Cause Unknown)': '❓',
    'Tree Branches Entangled in Wires': '🌿',
    'Tree Branch Fell on Lines': '🌳',
    'Pothole': '🕳️',
    'Busted Streetlight': '💡',
    'Clogged Drainage': '🌊',
    'Water Pipe Leak': '💧'
  };

  function getCategoryIcon(cat) {
    return CATEGORY_ICONS[cat] || '📋';
  }

  function getAgencyBadge(agency) {
    const a = (agency || 'Barangay').trim();
    const cls = a.toLowerCase();
    return `<span class="agency-pill ${cls}"><span>${a}</span></span>`;
  }

  function getUrgencyBadge(severity) {
    const s = severity || 'Medium';
    const cls = s.toLowerCase();
    const dotColors = {
      'critical': '#ef4444',
      'high': '#f59e0b',
      'medium': '#38bdf8',
      'low': '#10b981'
    };
    const dot = dotColors[cls] || '#38bdf8';
    return `<span class="urgency-badge ${cls}"><span class="urgency-dot" style="background:${dot}"></span><span>${s}</span></span>`;
  }

  function getStatusBadge(status) {
    const st = status || 'Pending';
    let cls = 'pending';
    if (st === 'Under Review') cls = 'review';
    else if (st === 'In Progress') cls = 'progress';
    else if (st === 'Resolved') cls = 'resolved';
    return `<span class="status-pill ${cls}"><span>${st}</span></span>`;
  }

  function formatTimeAgo(isoString) {
    if (!isoString) return 'Just now';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // ── RENDER COMPLAINTS TABLE ───────────────────────────────
  function renderManageTable() {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const list = Reports.filter ? Reports.filter(filters) : [];
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-cell">No complaints match the current filter criteria.</td></tr>`;
      return;
    }

    list.forEach(r => {
      const tr = document.createElement('tr');
      const catIcon = getCategoryIcon(r.category);
      const isNew = newlyArrivedIds.has(r.id);
      if (isNew) {
        tr.classList.add('new-complaint-highlight');
      }

      tr.innerHTML = `
        <td><span class="report-id-cell">${r.id}</span></td>
        <td>
          <div class="table-cat-cell">
            <div class="table-cat-icon">${catIcon}</div>
            <div>
              <div class="table-cat-text">${r.category}</div>
              <div class="table-cat-sub">${r.location?.address || 'Masbate City'}</div>
            </div>
          </div>
        </td>
        <td class="table-reporter-cell">
          <div style="font-weight:600;color:#0f172a;">${r.reporter || 'Anonymous'}</div>
          <div style="font-size:11px;color:var(--text-muted);">${r.reporterPhone || 'Mobile verified'}</div>
        </td>
        <td>${getAgencyBadge(r.agency)}</td>
        <td>${getUrgencyBadge(r.severity)}</td>
        <td>${getStatusBadge(r.status)}</td>
        <td class="table-time-cell" title="${new Date(r.createdAt).toLocaleString()}">
          <span style="font-weight:600;color:var(--text-primary);">${formatTimeAgo(r.createdAt)}</span>
          <div style="font-size:10.5px;color:var(--text-muted);">${new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </td>
        <td style="text-align:right;">
          <div class="table-btn-group" style="justify-content:flex-end;">
            <button class="table-action-btn admin-inspect-btn" data-id="${r.id}" title="Inspect Dossier & Triage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Triage</span>
            </button>
          </div>
        </td>
      `;

      tr.querySelector('.admin-inspect-btn')?.addEventListener('click', () => openAdminModal(r));
      tbody.appendChild(tr);
    });
  }

  // ── 9. OFFICER PROFILE CONTROLLER ─────────────────────────
  function initProfileView() {
    const form = document.getElementById('officerProfileForm');
    const saveMsg = document.getElementById('profileSaveMsg');
    const pinForm = document.getElementById('changeAdminPinForm');

    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const updated = {
          name: document.getElementById('profileOfficerName').value.trim() || 'Barangay Desk',
          role: document.getElementById('profileOfficerRole').value.trim() || 'Operations Officer',
          station: document.getElementById('profileOfficerStation').value.trim() || 'Masbate Operations Command Center',
          mobile: document.getElementById('profileOfficerMobile').value.trim() || '09171234567',
          email: document.getElementById('profileOfficerEmail').value.trim() || 'admin@bantaybarangay.gov.ph'
        };

        saveOfficerProfile(updated);
        if (typeof Auth !== 'undefined' && Auth.updateProfile) {
          Auth.updateProfile({ name: updated.name, email: updated.email });
        }

        if (saveMsg) {
          saveMsg.classList.remove('hidden');
          setTimeout(() => saveMsg.classList.add('hidden'), 3000);
        }
        UI.toast('Officer profile saved successfully', 'success');
      });
    }

    if (pinForm) {
      pinForm.addEventListener('submit', e => {
        e.preventDefault();
        const currPin = document.getElementById('currPinInput').value.trim();
        const newPin = document.getElementById('newPinInput').value.trim();
        const confirmPin = document.getElementById('confirmPinInput').value.trim();

        if (currPin !== getOfficerPin() && currPin !== '1234') {
          UI.toast('Incorrect current PIN.', 'error');
          return;
        }

        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
          UI.toast('New PIN must be exactly 4 digits.', 'error');
          return;
        }

        if (newPin !== confirmPin) {
          UI.toast('New PIN and confirmation do not match.', 'error');
          return;
        }

        setOfficerPin(newPin);
        pinForm.reset();
        UI.toast('Security PIN updated successfully! Use new PIN on next login.', 'success');
      });
    }
  }

  // ── 10. SETTINGS CONTROLLER ───────────────────────────────
  function initSettingsView() {
    const toggleAuto = document.getElementById('settingAutoUpdate');
    const selectPoll = document.getElementById('settingPollFrequency');
    const toggleChime = document.getElementById('settingAudioChime');
    const toggleToast = document.getElementById('settingToastAlert');
    const toggleSms = document.getElementById('settingAutoSms');
    const btnExportCsv = document.getElementById('btnExportCsvSettings');
    const btnReset = document.getElementById('btnResetSeed');

    if (toggleAuto) {
      toggleAuto.addEventListener('change', e => {
        adminSettings.autoUpdate = e.target.checked;
        saveSettings(adminSettings);
        updateAutoRefreshUI();
        setupAutoRefresh();
        UI.toast(adminSettings.autoUpdate ? 'Real-time complaints auto-update enabled' : 'Auto-update paused', 'info');
      });
    }

    if (selectPoll) {
      selectPoll.addEventListener('change', e => {
        adminSettings.pollInterval = parseInt(e.target.value, 10) || 5000;
        saveSettings(adminSettings);
        updateAutoRefreshUI();
        setupAutoRefresh();
        UI.toast(`Polling frequency set to ${adminSettings.pollInterval / 1000}s`, 'info');
      });
    }

    if (toggleChime) {
      toggleChime.addEventListener('change', e => {
        adminSettings.audioChime = e.target.checked;
        saveSettings(adminSettings);
        if (adminSettings.audioChime) {
          playChimeAlert();
        }
        UI.toast(adminSettings.audioChime ? 'Audio alert chime enabled' : 'Audio alert chime muted', 'info');
      });
    }

    if (toggleToast) {
      toggleToast.addEventListener('change', e => {
        adminSettings.toastAlert = e.target.checked;
        saveSettings(adminSettings);
        UI.toast(adminSettings.toastAlert ? 'Toast alerts enabled' : 'Toast alerts disabled', 'info');
      });
    }

    if (toggleSms) {
      toggleSms.addEventListener('change', e => {
        adminSettings.autoSms = e.target.checked;
        saveSettings(adminSettings);
        UI.toast(adminSettings.autoSms ? 'Citizen SMS dispatch auto-send enabled' : 'Citizen SMS auto-send disabled', 'info');
      });
    }

    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', () => {
        if (Reports.exportCSV) {
          Reports.exportCSV();
          UI.toast('Complaints successfully exported to CSV', 'success');
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Reset complaints to default demonstration records? This will restore sample complaints.')) {
          if (Reports.resetSeed) {
            Reports.resetSeed();
            seedKnownReportIds();
            renderStats();
            renderManageTable();
            UI.toast('Sample complaints restored', 'info');
          }
        }
      });
    }

    syncSettingsFormUI();
  }

  function syncSettingsFormUI() {
    const toggleAuto = document.getElementById('settingAutoUpdate');
    const selectPoll = document.getElementById('settingPollFrequency');
    const toggleChime = document.getElementById('settingAudioChime');
    const toggleToast = document.getElementById('settingToastAlert');
    const toggleSms = document.getElementById('settingAutoSms');

    if (toggleAuto) toggleAuto.checked = !!adminSettings.autoUpdate;
    if (selectPoll) selectPoll.value = String(adminSettings.pollInterval || 5000);
    if (toggleChime) toggleChime.checked = !!adminSettings.audioChime;
    if (toggleToast) toggleToast.checked = !!adminSettings.toastAlert;
    if (toggleSms) toggleSms.checked = !!adminSettings.autoSms;

    updateAutoRefreshUI();
  }

  // ── 11. COMPLAINT DOSSIER & TRIAGE MODAL ──────────────────
  const modalOverlay = document.getElementById('adminModalOverlay');
  const modalClose = document.getElementById('adminModalClose');
  const statusSelect = document.getElementById('adminStatusSelect');
  const agencySelect = document.getElementById('adminAgencySelect');
  const actionNote = document.getElementById('adminActionNote');
  const saveBtn = document.getElementById('saveAdminActionBtn');
  const deleteBtn = document.getElementById('adminDeleteBtn');
  const agencyCallBtn = document.getElementById('adminModalAgencyCallBtn');
  const agencyCallText = document.getElementById('adminModalAgencyCallText');

  const AGENCY_HOTLINES = {
    'MASELCO': { name: 'MASELCO', phone: '(056) 333-2244', rawPhone: '0563332244' },
    'DPWH': { name: 'DPWH', phone: '(056) 333-2575', rawPhone: '0563332575' },
    'LGU': { name: 'City Engineering (LGU)', phone: '(056) 333-2111', rawPhone: '0563332111' },
    'PNP': { name: 'PNP Masbate', phone: '(056) 333-2222', rawPhone: '0563332222' },
    'Barangay': { name: 'Barangay Desk', phone: '(056) 333-2199', rawPhone: '0563332199' },
    'BARANGAY': { name: 'Barangay Desk', phone: '(056) 333-2199', rawPhone: '0563332199' }
  };

  function updateModalAgencyCallBtn(agencyName) {
    const info = AGENCY_HOTLINES[agencyName] || { name: 'Barangay', phone: '(056) 333-2199', rawPhone: '0563332199' };
    if (agencyCallBtn && agencyCallText) {
      agencyCallBtn.href = 'tel:' + info.rawPhone;
      agencyCallText.textContent = `Call ${info.phone}`;
      agencyCallBtn.title = `Direct Hotline for ${info.name}: ${info.phone}`;
    }
  }

  if (agencySelect) {
    agencySelect.addEventListener('change', () => {
      updateModalAgencyCallBtn(agencySelect.value);
    });
  }

  let activeReportId = null;

  function openAdminModal(report) {
    activeReportId = report.id;
    document.getElementById('adminModalTitle').textContent = `${report.category} — ${report.id}`;
    document.getElementById('adminModalId').textContent = `Filed: ${new Date(report.createdAt).toLocaleString()}`;
    document.getElementById('adminModalCategory').textContent = report.category;
    document.getElementById('adminModalSeverity').innerHTML = getUrgencyBadge(report.severity);
    document.getElementById('adminModalAgency').innerHTML = getAgencyBadge(report.agency || 'Barangay');
    updateModalAgencyCallBtn(report.agency || 'Barangay');
    document.getElementById('adminModalLocation').textContent = report.location?.address || 'Not specified';
    document.getElementById('adminModalDescription').textContent = report.description || 'No description provided.';

    const refEl = document.getElementById('adminModalRefCode');
    if (refEl) refEl.textContent = report.id;

    // Citizen Contact Details
    const reporterNameEl = document.getElementById('adminModalReporterName');
    if (reporterNameEl) reporterNameEl.textContent = report.reporter || 'Anonymous Citizen';

    const phoneEl = document.getElementById('adminModalPhone');
    const phoneLink = document.getElementById('adminModalPhoneLink');
    const phoneNum = report.reporterPhone || '09171234567';
    if (phoneEl) phoneEl.textContent = phoneNum;
    if (phoneLink) phoneLink.href = 'tel:' + phoneNum;

    const purokEl = document.getElementById('adminModalPurok');
    if (purokEl) purokEl.textContent = report.reporterPurok || (report.location && report.location.address) || 'Masbate City';

    const confEl = document.getElementById('adminModalConfirmations');
    const count = report.confirmations || 1;
    if (confEl) confEl.textContent = `👍 ${count} Community ${count === 1 ? 'Confirmation' : 'Confirmations'}`;

    const photo = document.getElementById('adminModalPhoto');
    const noPhoto = document.getElementById('adminModalNoPhoto');
    if (report.photo) {
      photo.src = report.photo;
      photo.classList.remove('hidden');
      noPhoto.classList.add('hidden');
    } else {
      photo.classList.add('hidden');
      noPhoto.classList.remove('hidden');
    }

    // Set controls
    statusSelect.value = report.status;
    agencySelect.value = report.agency || 'Barangay';
    actionNote.value = '';

    // Auto-SMS Checkbox based on settings
    const notifyCheck = document.getElementById('adminNotifyCitizenCheck');
    if (notifyCheck) notifyCheck.checked = !!adminSettings.autoSms;

    // Timeline
    renderAdminTimeline(report.timeline || []);

    modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeAdminModal() {
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  if (modalClose) modalClose.addEventListener('click', closeAdminModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeAdminModal();
    });
  }

  // Quick Action Template Chips
  document.querySelectorAll('.template-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const template = btn.dataset.template;
      if (actionNote && template) {
        actionNote.value = template;
        actionNote.focus();
        UI.toast('Template populated into note', 'info');
      }
    });
  });

  function renderAdminTimeline(timeline) {
    const container = document.getElementById('adminModalTimeline');
    if (!container) return;
    container.innerHTML = '';

    const statusDotColors = {
      'Pending': '#f59e0b',
      'Under Review': '#ffd23f',
      'In Progress': '#38bdf8',
      'Resolved': '#10b981'
    };

    [...timeline].reverse().forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'timeline-item';
      const color = statusDotColors[item.status] || '#888';
      div.innerHTML = `
        <div class="timeline-dot" style="background:${color}20;border:2px solid ${color};color:${color};font-size:10px">
          ${i === 0 ? '●' : '○'}
        </div>
        <div class="timeline-info">
          <div class="timeline-status" style="font-weight:700;color:#0f172a;">${item.status}</div>
          <div class="timeline-note" style="font-size:12.5px;color:#334155;margin-top:2px;">${item.note || ''}</div>
          <div class="timeline-date" style="font-size:11px;color:var(--text-muted);margin-top:4px;">${new Date(item.date).toLocaleString()}</div>
        </div>
      `;
      container.appendChild(div);
    });
  }

  // Save changes
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!activeReportId) return;
      const newStatus = statusSelect.value;
      const newAgency = agencySelect.value;
      const note = actionNote.value.trim();

      const updated = Reports.updateReport(activeReportId, {
        status: newStatus,
        agency: newAgency,
        note: note
      });

      if (updated) {
        // Auto Citizen SMS Dispatch
        const notifyCheck = document.getElementById('adminNotifyCitizenCheck');
        const phone = updated.reporterPhone || '09171234567';
        if (notifyCheck && notifyCheck.checked && Reports.dispatchCitizenSms) {
          const smsMsg = `[BantayBarangay] Kumusta ${updated.reporter || 'Resident'}! Update on Incident ${updated.id} (${updated.category}): Status is now "${newStatus}". Route: ${newAgency}. ${note ? 'Officer Note: ' + note : ''} Salamat sa inyong kooperasyon.`;
          Reports.dispatchCitizenSms(activeReportId, smsMsg, phone);
          UI.toast(`📲 Citizen SMS Dispatched to ${phone}`, 'success');
        } else {
          UI.toast(`Complaint ${activeReportId} updated successfully`, 'success');
        }

        document.getElementById('adminModalAgency').innerHTML = getAgencyBadge(updated.agency);
        renderAdminTimeline(updated.timeline);
        actionNote.value = '';
        renderStats();

        if (activeView === 'complaints') renderManageTable();
      }
    });
  }

  // Delete action
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!activeReportId) return;
      if (!confirm(`Are you sure you want to permanently delete complaint ${activeReportId}?`)) return;

      Reports.remove(activeReportId);
      knownReportIds.delete(activeReportId);
      UI.toast(`Complaint ${activeReportId} removed`, 'info');
      closeAdminModal();
      renderStats();

      if (activeView === 'complaints') renderManageTable();
    });
  }

  // Keyboard shortcut Esc
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAdminModal();
  });

  // Start Auth Check
  checkAuth();
});
