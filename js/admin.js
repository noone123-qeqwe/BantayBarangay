/* ─────────────────────────────────────────────────────────
   admin.js — Barangay Operations & Command Center Logic
   ───────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  Reports.init();

  // ── AUTH GATE ───────────────────────────────────────────
  const authOverlay = document.getElementById('adminAuthOverlay');
  const pinInput = document.getElementById('adminPinInput');
  const pinForm = document.getElementById('authPinForm');
  const demoFillBtn = document.getElementById('demoFillBtn');
  const logoutBtn = document.getElementById('adminLogoutBtn');

  function checkAuth() {
    if (sessionStorage.getItem('bantay_admin_authenticated') === 'true' || (window.Auth && Auth.isAdmin())) {
      authOverlay.classList.add('hidden');
      updateAdminProfile();
      initAdminApp();
    } else {
      authOverlay.classList.remove('hidden');
      setTimeout(() => pinInput && pinInput.focus(), 100);
    }
  }

  function updateAdminProfile() {
    if (window.Auth && Auth.getCurrentUser()) {
      const u = Auth.getCurrentUser();
      const nameEl = document.querySelector('.sidebar .user-name');
      const roleEl = document.querySelector('.sidebar .user-role');
      if (nameEl) nameEl.textContent = u.name;
      if (roleEl) roleEl.textContent = u.role === 'admin' ? 'Operations Officer' : (u.purok || 'Staff');
    }
  }

  function authenticate() {
    sessionStorage.setItem('bantay_admin_authenticated', 'true');
    authOverlay.classList.add('hidden');
    updateAdminProfile();
    UI.toast('Welcome to Barangay Operations Command', 'success');
    initAdminApp();
  }

  pinForm.addEventListener('submit', e => {
    e.preventDefault();
    const pin = pinInput.value.trim();
    if (pin === '1234' || pin.length >= 4) {
      authenticate();
    } else {
      UI.toast('Invalid PIN. Use demo PIN 1234.', 'error');
      pinInput.value = '';
      pinInput.focus();
    }
  });

  demoFillBtn.addEventListener('click', () => {
    pinInput.value = '1234';
    authenticate();
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('bantay_admin_authenticated');
    if (window.Auth) Auth.logout();
    authOverlay.classList.remove('hidden');
    pinInput.value = '';
    UI.toast('Admin session locked', 'info');
  });

  // ── LIVE CLOCK ──────────────────────────────────────────
  function updateClock() {
    const el = document.getElementById('currentTime');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ── ADMIN APP STATE & ROUTER ────────────────────────────
  let activeView = 'manage';

  function initAdminApp() {
    renderStats();
    showAdminView(activeView);
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
    } else if (viewName === 'dispatch') {
      renderDispatchBoard();
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
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }

  // ── STATS RENDERER ──────────────────────────────────────
  function renderStats() {
    const s = Reports.getStats();
    animateValue('dStatTotal', s.total);
    animateValue('dStatPending', s.pending);
    animateValue('dStatReview', s.review);
    animateValue('dStatProgress', s.progress);
    animateValue('dStatResolved', s.resolved);
  }

  function animateValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // ── MANAGE VIEW & FILTERS ───────────────────────────────
  const filters = {
    search: '',
    status: 'all',
    agency: 'all',
    category: 'all'
  };

  const searchInput = document.getElementById('adminSearch');
  const statusFilter = document.getElementById('adminStatusFilter');
  const agencyFilter = document.getElementById('adminAgencyFilter');
  const categoryFilter = document.getElementById('adminCategoryFilter');
  const clearBtn = document.getElementById('adminClearBtn');

  if (searchInput) searchInput.addEventListener('input', e => { filters.search = e.target.value; renderManageTable(); });
  if (statusFilter) statusFilter.addEventListener('change', e => { filters.status = e.target.value; renderManageTable(); });
  if (agencyFilter) agencyFilter.addEventListener('change', e => { filters.agency = e.target.value; renderManageTable(); });
  if (categoryFilter) categoryFilter.addEventListener('change', e => { filters.category = e.target.value; renderManageTable(); });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      filters.search = '';
      filters.status = 'all';
      filters.agency = 'all';
      filters.category = 'all';
      if (searchInput) searchInput.value = '';
      if (statusFilter) statusFilter.value = 'all';
      if (agencyFilter) agencyFilter.value = 'all';
      if (categoryFilter) categoryFilter.value = 'all';
      renderManageTable();
    });
  }

  function renderManageTable() {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const list = Reports.filter(filters);
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-cell">No reports match the current filters.</td></tr>`;
      return;
    }

    list.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:monospace;font-weight:700;color:var(--teal-400)">${r.id}</td>
        <td><strong>${r.category}</strong></td>
        <td style="color:var(--text-secondary);font-size:13px">${r.reporter || 'Anonymous'}</td>
        <td>
          <span style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)">
            ${r.agency || 'Unassigned'}
          </span>
        </td>
        <td>${UI.severityBadge(r.severity)}</td>
        <td>${UI.statusBadge(r.status)}</td>
        <td style="font-size:12px;color:var(--text-muted)">${new Date(r.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-ghost btn-sm admin-inspect-btn" data-id="${r.id}" style="padding:4px 10px;font-size:12px">
            Triage & Act →
          </button>
        </td>
      `;
      tr.querySelector('.admin-inspect-btn').addEventListener('click', () => openAdminModal(r));
      tbody.appendChild(tr);
    });
  }

  // ── AGENCY DISPATCH BOARD ───────────────────────────────
  function renderDispatchBoard() {
    const reports = Reports.getAll();
    const columns = {
      Barangay: document.getElementById('col-barangay'),
      LGU: document.getElementById('col-lgu'),
      DPWH: document.getElementById('col-dpwh'),
      MASELCO: document.getElementById('col-maselco')
    };

    const counts = {
      Barangay: document.getElementById('count-barangay'),
      LGU: document.getElementById('count-lgu'),
      DPWH: document.getElementById('count-dpwh'),
      MASELCO: document.getElementById('count-maselco')
    };

    Object.values(columns).forEach(c => { if (c) c.innerHTML = ''; });

    const agencyReports = { Barangay: [], LGU: [], DPWH: [], MASELCO: [] };

    reports.forEach(r => {
      const key = r.agency || 'Barangay';
      if (agencyReports[key]) {
        agencyReports[key].push(r);
      } else {
        agencyReports['Barangay'].push(r);
      }
    });

    Object.keys(agencyReports).forEach(agency => {
      const colEl = columns[agency];
      const countEl = counts[agency];
      const items = agencyReports[agency];

      if (countEl) countEl.textContent = items.length;

      if (!colEl) return;
      if (!items.length) {
        colEl.innerHTML = `<div style="text-align:center;padding:32px 12px;font-size:12px;color:var(--text-muted)">No active tickets assigned</div>`;
        return;
      }

      items.forEach(r => {
        const card = document.createElement('div');
        card.className = 'agency-item-card';
        card.innerHTML = `
          <div class="title">${r.category} <span style="font-family:monospace;font-size:11px;color:var(--teal-400)">(${r.id})</span></div>
          <div class="loc">📍 ${r.location?.address || 'No exact address'}</div>
          <div class="meta">
            ${UI.statusBadge(r.status)}
            ${UI.severityBadge(r.severity)}
          </div>
        `;
        card.addEventListener('click', () => openAdminModal(r));
        colEl.appendChild(card);
      });
    });
  }



  // ── ADMIN MODAL & ACTIONS ───────────────────────────────
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
    document.getElementById('adminModalId').textContent = `Reported: ${new Date(report.createdAt).toLocaleString()}`;
    document.getElementById('adminModalCategory').textContent = report.category;
    document.getElementById('adminModalSeverity').innerHTML = UI.severityBadge(report.severity);
    document.getElementById('adminModalAgency').textContent = report.agency || 'Barangay';
    document.getElementById('adminModalReporter').textContent = report.reporter || 'Anonymous';
    document.getElementById('adminModalLocation').textContent = report.location?.address || 'Not specified';
    document.getElementById('adminModalDescription').textContent = report.description || 'No description provided.';

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

  function renderAdminTimeline(timeline) {
    const container = document.getElementById('adminModalTimeline');
    if (!container) return;
    container.innerHTML = '';

    const statusDotColors = {
      'Pending': '#f4a261', 'Under Review': '#ffd23f',
      'In Progress': '#1b9aaa', 'Resolved': '#06d6a0'
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
          <div class="timeline-status">${item.status}</div>
          <div class="timeline-note">${item.note || ''}</div>
          <div class="timeline-date">${new Date(item.date).toLocaleString()}</div>
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
        UI.toast(`Report ${activeReportId} updated successfully`, 'success');
        document.getElementById('adminModalAgency').textContent = updated.agency;
        renderAdminTimeline(updated.timeline);
        actionNote.value = '';
        renderStats();

        if (activeView === 'manage') renderManageTable();
        if (activeView === 'dispatch') renderDispatchBoard();
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
      if (activeView === 'dispatch') renderDispatchBoard();
    });
  }

  // ── CSV EXPORT ──────────────────────────────────────────
  const exportBtn = document.getElementById('exportCsvBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      Reports.exportCSV();
      UI.toast('Reports exported to CSV', 'success');
    });
  }

  // Keyboard shortcut Esc
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAdminModal();
  });

  // Start Auth Check
  checkAuth();
});
