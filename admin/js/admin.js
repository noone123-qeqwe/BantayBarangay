/* ─────────────────────────────────────────────────────────
   admin.js — Masbate Operations Command Center Engine
   Real-time Incident Triage, Agency Dispatch & Grid Telemetry
   ───────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Reports !== 'undefined' && Reports.init) {
    Reports.init();
  }

  // ── 1. AUTH GATE & PIN SECURITY ───────────────────────────
  const authOverlay = document.getElementById('adminAuthOverlay');
  const pinInput = document.getElementById('adminPinInput');
  const pinForm = document.getElementById('authPinForm');
  const demoFillBtn = document.getElementById('demoFillBtn');
  const logoutBtn = document.getElementById('adminLogoutBtn');

  function checkAuth() {
    if (sessionStorage.getItem('bantay_admin_authenticated') === 'true' || (typeof Auth !== 'undefined' && Auth.isAdmin && Auth.isAdmin())) {
      authOverlay.classList.add('hidden');
      updateAdminProfile();
      initAdminApp();
    } else {
      authOverlay.classList.remove('hidden');
      setTimeout(() => pinInput && pinInput.focus(), 150);
    }
  }

  function updateAdminProfile() {
    if (typeof Auth !== 'undefined' && Auth.getCurrentUser) {
      const u = Auth.getCurrentUser();
      if (!u) return;
      const nameEl = document.querySelector('.sidebar .user-name');
      const roleEl = document.querySelector('.sidebar .user-role');
      if (nameEl) nameEl.textContent = u.name || 'Barangay Desk';
      if (roleEl) {
        roleEl.textContent = u.role === 'admin'
          ? 'Operations Officer'
          : ('Duty Desk • ' + (u.purok ? u.purok.split('-')[0].trim() : 'Masbate'));
      }
    }
  }

  function authenticate() {
    sessionStorage.setItem('bantay_admin_authenticated', 'true');
    authOverlay.classList.add('hidden');
    updateAdminProfile();
    UI.toast('Welcome to Masbate Operations Command', 'success');
    initAdminApp();
  }

  if (pinForm) {
    pinForm.addEventListener('submit', e => {
      e.preventDefault();
      const pin = pinInput.value.trim();
      if (pin === '1234' || pin.length >= 4) {
        authenticate();
      } else {
        UI.toast('Invalid PIN. Use officer demo PIN 1234.', 'error');
        pinInput.value = '';
        pinInput.focus();
      }
    });
  }

  if (demoFillBtn) {
    demoFillBtn.addEventListener('click', () => {
      pinInput.value = '1234';
      authenticate();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('bantay_admin_authenticated');
      if (typeof Auth !== 'undefined' && Auth.logout) Auth.logout();
      authOverlay.classList.remove('hidden');
      pinInput.value = '';
      UI.toast('Officer session locked', 'info');
    });
  }

  // ── 2. LIVE CLOCK (PHILIPPINE STANDARD TIME) ──────────────
  function updateClock() {
    const el = document.getElementById('currentTime');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' • ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' PST';
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ── 3. ADMIN APP STATE & ROUTER ───────────────────────────
  let activeView = 'manage';

  function initAdminApp() {
    renderStats();
    showAdminView(activeView);
    setupAutoRefresh();
  }

  function showAdminView(viewName) {
    activeView = viewName;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('[data-admin-view]').forEach(n => n.classList.remove('active'));

    const targetView = document.getElementById('view-' + viewName);
    if (targetView) targetView.classList.add('active');

    const targetNav = document.getElementById('nav-' + viewName);
    if (targetNav) targetNav.classList.add('active');

    if (viewName === 'manage') {
      renderManageTable();
    } else if (viewName === 'analytics') {
      renderAnalytics();
    } else if (viewName === 'advisories') {
      renderAdvisoriesView();
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

  // ── 4. AUTO-REFRESH LIVE ENGINE ───────────────────────────
  let autoRefreshTimer = null;
  let isAutoRefresh = true;
  const refreshToggle = document.getElementById('autoRefreshToggle');
  const refreshText = document.getElementById('autoRefreshText');

  function setupAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    if (isAutoRefresh) {
      autoRefreshTimer = setInterval(() => {
        renderStats();
        if (activeView === 'manage') renderManageTable();
        else if (activeView === 'dispatch') renderDispatchBoard();
        else if (activeView === 'analytics') renderAnalytics();
      }, 10000);
    }
  }

  if (refreshToggle) {
    refreshToggle.addEventListener('click', () => {
      isAutoRefresh = !isAutoRefresh;
      refreshToggle.classList.toggle('active', isAutoRefresh);
      if (refreshText) refreshText.textContent = isAutoRefresh ? 'Live (10s)' : 'Paused';
      setupAutoRefresh();
      UI.toast(isAutoRefresh ? 'Live auto-refresh enabled (10s)' : 'Auto-refresh paused', 'info');
    });
  }

  // ── 5. EXECUTIVE KPI METRICS RENDERER ─────────────────────
  function renderStats() {
    const all = Reports.getAll ? Reports.getAll() : [];
    const total = all.length;
    const critical = all.filter(r => (r.severity || '').toLowerCase() === 'critical').length;
    const pending = all.filter(r => r.status === 'Pending').length;
    const review = all.filter(r => r.status === 'Under Review').length;
    const progress = all.filter(r => r.status === 'In Progress').length;
    const resolved = all.filter(r => r.status === 'Resolved').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    animateValue('dStatTotal', total);
    animateValue('dStatCritical', critical);
    animateValue('dStatPending', pending);
    animateValue('dStatProgress', progress);
    animateValue('dStatResolved', resolved);

    const rateBadge = document.getElementById('dStatRateBadge');
    if (rateBadge) rateBadge.textContent = `${rate}% Rate`;

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

  function animateValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // ── 6. MANAGE VIEW & ADVANCED FILTERS ─────────────────────
  const filters = {
    search: '',
    status: 'all',
    agency: 'all',
    category: 'all'
  };

  const searchInput = document.getElementById('adminSearch');
  const searchClearBtn = document.getElementById('adminSearchClear');
  const statusFilter = document.getElementById('adminStatusFilter');
  const agencyFilter = document.getElementById('adminAgencyFilter');
  const categoryFilter = document.getElementById('adminCategoryFilter');
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
      if (searchInput) searchInput.value = '';
      if (searchClearBtn) searchClearBtn.classList.add('hidden');
      if (statusFilter) statusFilter.value = 'all';
      if (agencyFilter) agencyFilter.value = 'all';
      if (categoryFilter) categoryFilter.value = 'all';
      syncStatusPills('all');
      renderManageTable();
      UI.toast('All filters cleared', 'info');
    });
  }

  // ── CATEGORY ICONS MAP ────────────────────────────────────
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
    return CATEGORY_ICONS[cat] || '⚡';
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

  // ── 7. TABLE RENDERING ────────────────────────────────────
  function renderManageTable() {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const list = Reports.filter(filters);
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-cell">No incident reports match the current filter criteria.</td></tr>`;
      return;
    }

    list.forEach(r => {
      const tr = document.createElement('tr');
      const catIcon = getCategoryIcon(r.category);

      tr.innerHTML = `
        <td><span class="report-id-cell">${r.id}</span></td>
        <td>
          <div class="table-cat-cell">
            <div class="table-cat-icon">${catIcon}</div>
            <div>
              <div class="table-cat-text">${r.category}</div>
              <div class="table-cat-sub">${r.location?.address || 'Masbate'}</div>
            </div>
          </div>
        </td>
        <td class="table-reporter-cell">${r.reporter || 'Anonymous'}</td>
        <td>${getAgencyBadge(r.agency)}</td>
        <td>${getUrgencyBadge(r.severity)}</td>
        <td>${getStatusBadge(r.status)}</td>
        <td class="table-time-cell">
          ${new Date(r.createdAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})} • ${new Date(r.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
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



  // ── 9. GRID & HOTSPOT ANALYTICS ───────────────────────────
  function renderAnalytics() {
    const reports = Reports.getAll();
    const muniList = document.getElementById('analyticsMuniList');
    const catList = document.getElementById('analyticsCategoryList');
    if (!muniList || !catList) return;

    // 1. Municipalities
    const muniCounts = {};
    const knownMunis = ['Masbate City', 'Aroroy', 'Baleno', 'Mobo', 'Milagros', 'Mandaon', 'Dimasalang', 'Cawayan', 'Placer', 'Uson', 'Esperanza', 'Palanas', 'Cataingan'];
    
    reports.forEach(r => {
      const addr = (r.location?.address || '').toLowerCase();
      let matched = 'Masbate City';
      for (const m of knownMunis) {
        if (addr.includes(m.toLowerCase())) {
          matched = m;
          break;
        }
      }
      muniCounts[matched] = (muniCounts[matched] || 0) + 1;
    });

    const sortedMunis = Object.entries(muniCounts).sort((a, b) => b[1] - a[1]);
    const maxMuni = sortedMunis.length ? sortedMunis[0][1] : 1;

    muniList.innerHTML = sortedMunis.map(([muni, count]) => {
      const pct = Math.round((count / maxMuni) * 100);
      const totalPct = Math.round((count / (reports.length || 1)) * 100);
      return `
        <div class="analytics-bar-item">
          <div class="analytics-bar-meta">
            <span>📍 ${muni}</span>
            <span><strong>${count}</strong> (${totalPct}%)</span>
          </div>
          <div class="analytics-track">
            <div class="analytics-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('') || '<div style="color:var(--text-muted);font-size:12px;">No incident data available.</div>';

    // 2. Categories
    const catGroupCounts = {
      'Line & Pole Issues': 0,
      'Transformer Issues': 0,
      'Service Drop & Meter': 0,
      'Grid & Outage Interruption': 0,
      'Vegetation & Environment': 0,
      'Other Civic Hazards': 0
    };

    reports.forEach(r => {
      const c = r.category || '';
      if (c.includes('Pole') || c.includes('Line') || c.includes('Wire') || c.includes('Crossarm')) {
        if (c.includes('Tree') || c.includes('Branch')) catGroupCounts['Vegetation & Environment']++;
        else catGroupCounts['Line & Pole Issues']++;
      } else if (c.includes('Transformer')) {
        catGroupCounts['Transformer Issues']++;
      } else if (c.includes('Service') || c.includes('Meter')) {
        catGroupCounts['Service Drop & Meter']++;
      } else if (c.includes('Blackout') || c.includes('Outage') || c.includes('Brownout') || c.includes('Voltage') || c.includes('Interruption')) {
        catGroupCounts['Grid & Outage Interruption']++;
      } else if (c.includes('Tree') || c.includes('Vegetation')) {
        catGroupCounts['Vegetation & Environment']++;
      } else {
        catGroupCounts['Other Civic Hazards']++;
      }
    });

    const sortedCats = Object.entries(catGroupCounts).filter(([_, cnt]) => cnt > 0).sort((a, b) => b[1] - a[1]);
    const maxCat = sortedCats.length ? sortedCats[0][1] : 1;

    catList.innerHTML = sortedCats.map(([group, count]) => {
      const pct = Math.round((count / maxCat) * 100);
      const fillClass = group.includes('Transformer') ? 'fill-critical' : (group.includes('Line') ? 'fill-amber' : 'fill-emerald');
      return `
        <div class="analytics-bar-item">
          <div class="analytics-bar-meta">
            <span>⚡ ${group}</span>
            <span><strong>${count}</strong> reports</span>
          </div>
          <div class="analytics-track">
            <div class="analytics-fill ${fillClass}" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('') || '<div style="color:var(--text-muted);font-size:12px;">No category data available.</div>';
  }

  // ── 10. INCIDENT COMMAND DOSSIER MODAL ────────────────────
  const modalOverlay = document.getElementById('adminModalOverlay');
  const modalClose = document.getElementById('adminModalClose');
  const statusSelect = document.getElementById('adminStatusSelect');
  const agencySelect = document.getElementById('adminAgencySelect');
  const actionNote = document.getElementById('adminActionNote');
  const saveBtn = document.getElementById('saveAdminActionBtn');
  const deleteBtn = document.getElementById('adminDeleteBtn');

  let activeReportId = null;

  function openAdminModal(report) {
    activeReportId = report.id;
    document.getElementById('adminModalTitle').textContent = `${report.category} — ${report.id}`;
    document.getElementById('adminModalId').textContent = `Filed: ${new Date(report.createdAt).toLocaleString()}`;
    document.getElementById('adminModalCategory').textContent = report.category;
    document.getElementById('adminModalSeverity').innerHTML = getUrgencyBadge(report.severity);
    document.getElementById('adminModalAgency').innerHTML = getAgencyBadge(report.agency || 'Barangay');
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
          <div class="timeline-status" style="font-weight:700;color:#fff;">${item.status}</div>
          <div class="timeline-note" style="font-size:12.5px;color:#e2e8f0;margin-top:2px;">${item.note || ''}</div>
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
          UI.toast(`Report ${activeReportId} updated successfully`, 'success');
        }

        document.getElementById('adminModalAgency').innerHTML = getAgencyBadge(updated.agency);
        renderAdminTimeline(updated.timeline);
        actionNote.value = '';
        renderStats();

        if (activeView === 'manage') renderManageTable();
        else if (activeView === 'analytics') renderAnalytics();
        else if (activeView === 'advisories') renderAdvisoriesView();
      }
    });
  }

  // Delete action
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!activeReportId) return;
      if (!confirm(`Are you sure you want to permanently delete report ${activeReportId}?`)) return;

      Reports.remove(activeReportId);
      UI.toast(`Report ${activeReportId} removed`, 'info');
      closeAdminModal();
      renderStats();

      if (activeView === 'manage') renderManageTable();
      else if (activeView === 'analytics') renderAnalytics();
      else if (activeView === 'advisories') renderAdvisoriesView();
    });
  }

  // ── 11. CITIZEN ADVISORIES & SMS BROADCAST DISPATCH ─────────
  const advForm = document.getElementById('advisoryBroadcastForm');
  const advListContainer = document.getElementById('activeAdvisoriesList');
  const smsLogsContainer = document.getElementById('smsLogsList');
  const advCountPill = document.getElementById('activeAdvisoryCount');

  function renderAdvisoriesView() {
    if (!Reports.getAdvisories) return;
    const advisories = Reports.getAdvisories();
    if (advCountPill) advCountPill.textContent = advisories.length;

    if (advListContainer) {
      if (advisories.length === 0) {
        advListContainer.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:16px 0;text-align:center;">No active broadcasts. Use the form on the left to publish an advisory.</div>';
      } else {
        advListContainer.innerHTML = advisories.map(adv => {
          const sevClass = (adv.severity || '').toLowerCase() === 'critical' ? 'severity-high' :
                           (adv.severity || '').toLowerCase() === 'high' ? 'severity-high' : 'severity-medium';
          const sevBadgeColor = adv.severity === 'Critical' ? '#fb7185' : adv.severity === 'High' ? '#f59e0b' : '#38bdf8';

          return `
            <div class="advisory-item-card ${sevClass}">
              <div class="advisory-header-row">
                <span style="font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;background:${sevBadgeColor}20;color:${sevBadgeColor};border:1px solid ${sevBadgeColor}40">
                  ${adv.severity || 'Medium'} Urgency • ${adv.category}
                </span>
                <button type="button" class="btn btn-ghost btn-sm btn-revoke-adv" data-adv-id="${adv.id}" style="color:#fb7185;border:1px solid rgba(244,63,94,0.3);font-size:11px;padding:2px 8px;">
                  Revoke
                </button>
              </div>
              <div class="advisory-title-text">${adv.title}</div>
              <div style="font-size:11.5px;color:#7dd3fc;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
                <span>📍 Coverage:</span>
                <span style="color:#e2e8f0;font-weight:600;">${adv.areas}</span>
              </div>
              <div class="advisory-msg-text">${adv.message}</div>
              <div class="advisory-footer-meta">
                <span>By ${adv.author || 'Operations Desk'}</span>
                <span>${new Date(adv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${new Date(adv.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          `;
        }).join('');

        // Wire revoke buttons
        advListContainer.querySelectorAll('.btn-revoke-adv').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.advId;
            if (confirm(`Revoke broadcast "${id}" from citizen dashboards?`)) {
              Reports.deleteAdvisory(id);
              UI.toast(`Broadcast ${id} revoked`, 'info');
              renderAdvisoriesView();
            }
          });
        });
      }
    }

    // Render SMS logs
    if (smsLogsContainer && Reports.getSmsLogs) {
      const logs = Reports.getSmsLogs();
      if (logs.length === 0) {
        smsLogsContainer.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:12px 0;text-align:center;">No SMS notifications dispatched yet. Update reports to trigger SMS alerts.</div>';
      } else {
        smsLogsContainer.innerHTML = logs.slice(0, 10).map(log => `
          <div class="sms-log-item">
            <div class="sms-log-icon">📲</div>
            <div class="sms-log-content">
              <div class="sms-log-top">
                <span class="sms-recipient">${log.recipientPhone} (${log.reportId})</span>
                <span class="sms-time">${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div class="sms-msg">${log.message}</div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // Handle Advisory Form submit
  if (advForm) {
    advForm.addEventListener('submit', e => {
      e.preventDefault();
      const title = document.getElementById('advTitle').value.trim();
      const category = document.getElementById('advCategory').value;
      const severity = document.getElementById('advSeverity').value;
      const areas = document.getElementById('advAreas').value.trim();
      const message = document.getElementById('advMessage').value.trim();

      if (!title || !areas || !message) {
        UI.toast('Please fill in all advisory fields', 'error');
        return;
      }

      let author = 'Masbate Operations Desk';
      if (typeof Auth !== 'undefined' && Auth.getCurrentUser) {
        const u = Auth.getCurrentUser();
        if (u) author = u.name;
      }

      Reports.addAdvisory({
        title,
        category,
        severity,
        areas,
        message,
        author
      });

      UI.toast('📢 Advisory broadcasted to public resident portal!', 'success');
      advForm.reset();
      renderAdvisoriesView();
    });
  }

  // ── 12. CSV EXPORT ────────────────────────────────────────
  const exportBtn = document.getElementById('exportCsvBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      Reports.exportCSV();
      UI.toast('Reports successfully exported to CSV', 'success');
    });
  }

  // Keyboard shortcut Esc
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAdminModal();
  });

  // Start Auth Check
  checkAuth();
});

