/* ─────────────────────────────────────────────────────────
   ui.js — UI utilities: toast, modal, report cards, tables
   ───────────────────────────────────────────────────────── */

const UI = (() => {

  // ── TOAST ─────────────────────────────────────────────────
  function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    el.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(el);
    el.addEventListener('click', () => removeToast(el));
    setTimeout(() => removeToast(el), 4000);
  }

  function removeToast(el) {
    el.classList.add('hiding');
    setTimeout(() => el.remove(), 300);
  }

  // ── STATUS BADGE ──────────────────────────────────────────
  function statusBadge(status) {
    const cls = {
      'Pending':      'status-pending',
      'Under Review': 'status-review',
      'In Progress':  'status-progress',
      'Resolved':     'status-resolved'
    }[status] || 'status-pending';
    return `<span class="status-badge ${cls}">${status}</span>`;
  }

  // ── SEVERITY BADGE ────────────────────────────────────────
  function severityBadge(sev) {
    const cls = {
      'Low': 'sev-low', 'Medium': 'sev-medium', 'High': 'sev-high', 'Critical': 'sev-critical'
    }[sev] || 'sev-medium';
    return `<span class="sev-badge ${cls}">${sev || 'Medium'}</span>`;
  }

  // ── CATEGORY ICON ─────────────────────────────────────────
  function categoryIcon(category) {
    const cat = category || '';
    
    // Category E: Vegetation Hazards
    if (cat.includes('Tree') || cat.includes('Vegetation') || cat.includes('Branch')) {
      return { svg: '<path d="M12 2L7 10h3v4H7l5 8 5-8h-3v-4h3L12 2z"/>', color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)' };
    }
    // Category B: Transformer & Substation
    if (cat.includes('Transformer') || cat.includes('Substation') || cat.includes('Arcing') || cat.includes('Oil Leak')) {
      return { svg: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };
    }
    // Category D: Outage & Grid Status
    if (cat.includes('Blackout') || cat.includes('Brownout') || cat.includes('Voltage') || cat.includes('Interruption') || cat.includes('Outage')) {
      return { svg: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.14)' };
    }
    // Category C: Service Drop & Meter
    if (cat.includes('Service Drop') || cat.includes('Meter') || cat.includes('Service Wire')) {
      return { svg: '<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.14)' };
    }
    // Category A: Line & Pole Issues (Distribution)
    if (cat.includes('Pole') || cat.includes('Line') || cat.includes('Wire') || cat.includes('Crossarm') || cat.includes('Insulator')) {
      return { svg: '<line x1="12" y1="2" x2="12" y2="22"/><line x1="5" y1="6" x2="19" y2="6"/><line x1="7" y1="10" x2="17" y2="10"/><path d="M5 6l7 8 7-8"/>', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    }
    
    // Legacy fallbacks
    const icons = {
      'Pothole': { svg: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>', color: '#f4a261', bg: 'rgba(244,162,97,0.12)' },
      'Broken Electric Post': { svg: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>', color: '#ffd23f', bg: 'rgba(255,210,63,0.1)' },
      'Clogged Drainage': { svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', color: '#1b9aaa', bg: 'rgba(27,154,170,0.12)' },
      'Busted Streetlight': { svg: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>', color: '#b46eff', bg: 'rgba(180,110,255,0.1)' },
      'Crime / Public Safety': { svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="3"/>', color: '#ef476f', bg: 'rgba(239,71,111,0.12)' },
      'Other': { svg: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' }
    };
    const d = icons[category] || icons['Other'];
    return { ...d };
  }

  // ── FORMAT DATE ───────────────────────────────────────────
  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    return `${days}d ago`;
  }

  // ── REPORT CARD (LIST STYLE) ──────────────────────────────
  function renderReportCard(report, container, onClick) {
    const ico = categoryIcon(report.category);
    const card = document.createElement('div');
    card.className = 'report-card';
    card.dataset.id = report.id;
    card.innerHTML = `
      <div class="report-card-icon" style="background:${ico.bg}">
        <svg viewBox="0 0 24 24" fill="none" stroke="${ico.color}" stroke-width="2">${ico.svg}</svg>
      </div>
      <div class="report-card-body">
        <div class="report-card-title">${report.category} — ${report.id}</div>
        <div class="report-card-meta">
          <span>📍 ${truncate(report.location?.address || 'Unknown location', 40)}</span>
          <span>👤 ${report.reporter || 'Anonymous'}</span>
          <span>🕐 ${timeAgo(report.createdAt)}</span>
          <span>${report.agency || '—'}</span>
        </div>
      </div>
      <div class="report-card-status">${statusBadge(report.status)}</div>
    `;
    card.addEventListener('click', () => onClick && onClick(report));
    container.appendChild(card);
  }

  // ── REPORTS GRID CARD ─────────────────────────────────────
  function renderGridCard(report, container, onClick) {
    const ico = categoryIcon(report.category);
    const card = document.createElement('div');
    card.className = 'report-card glass-card';
    card.dataset.id = report.id;
    card.style.cssText = 'display:flex;flex-direction:column;gap:14px;padding:20px;cursor:pointer;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);border-radius:14px;';
    card.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:40px;height:40px;border-radius:10px;background:${ico.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg viewBox="0 0 24 24" fill="none" stroke="${ico.color}" stroke-width="2" width="20" height="20">${ico.svg}</svg>
          </div>
          <div>
            <div style="font-size:14px;font-weight:700">${report.category}</div>
            <div style="font-size:11px;color:rgba(232,244,248,0.4);font-family:monospace">${report.id}</div>
          </div>
        </div>
        ${statusBadge(report.status)}
      </div>
      <div style="font-size:13px;color:rgba(232,244,248,0.65);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
        ${report.description || 'No description provided'}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:auto">
        ${severityBadge(report.severity)}
        <span style="font-size:11px;color:rgba(232,244,248,0.4);background:rgba(255,255,255,0.04);padding:3px 8px;border-radius:99px;border:1px solid rgba(255,255,255,0.08)">${report.agency || '—'}</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;margin-top:0">
        <span style="font-size:12px;color:rgba(232,244,248,0.4)">📍 ${truncate(report.location?.address || 'Location not set', 30)}</span>
        <span style="font-size:11px;color:rgba(232,244,248,0.35)">${timeAgo(report.createdAt)}</span>
      </div>
    `;
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-3px)';
      card.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)';
      card.style.borderColor = 'rgba(27,154,170,0.2)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
      card.style.borderColor = '';
    });
    card.addEventListener('click', () => onClick && onClick(report));
    container.appendChild(card);
  }

  // ── DASHBOARD TABLE ROW ───────────────────────────────────
  function renderTableRow(report, tbody, onView, onDelete) {
    const tr = document.createElement('tr');
    tr.dataset.id = report.id;
    tr.innerHTML = `
      <td class="report-id-cell">${report.id}</td>
      <td style="font-weight:500">${report.category}</td>
      <td style="color:rgba(232,244,248,0.65)">${report.reporter || 'Anonymous'}</td>
      <td><span style="font-size:12px;padding:3px 8px;border-radius:99px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08)">${report.agency || '—'}</span></td>
      <td>${severityBadge(report.severity)}</td>
      <td>${statusBadge(report.status)}</td>
      <td style="color:rgba(232,244,248,0.5);font-size:12px">${formatDate(report.createdAt)}</td>
      <td>
        <div class="table-actions">
          <button class="table-btn view-btn" data-id="${report.id}">View</button>
          <button class="table-btn danger del-btn" data-id="${report.id}">Delete</button>
        </div>
      </td>
    `;
    tr.querySelector('.view-btn').addEventListener('click', (e) => { e.stopPropagation(); onView && onView(report); });
    tr.querySelector('.del-btn').addEventListener('click', (e) => { e.stopPropagation(); onDelete && onDelete(report.id); });
    tbody.appendChild(tr);
  }

  // ── MODAL ─────────────────────────────────────────────────
  function openModal(report) {
    const overlay = document.getElementById('detailModalOverlay');
    document.getElementById('modalTitle').textContent = `${report.category} — ${report.id}`;
    document.getElementById('modalId').textContent = `Reported on ${formatDate(report.createdAt)} • Last updated ${timeAgo(report.updatedAt)}`;
    document.getElementById('modalCategory').textContent = report.category;
    document.getElementById('modalAgency').textContent = report.agency || '—';
    document.getElementById('modalSeverity').innerHTML = severityBadge(report.severity);
    document.getElementById('modalReporter').textContent = report.reporter || 'Anonymous';
    document.getElementById('modalLocation').textContent = report.location?.address || 'Not specified';
    document.getElementById('modalDescription').textContent = report.description || 'No description provided.';

    const photo = document.getElementById('modalPhoto');
    const noPhoto = document.getElementById('modalNoPhoto');
    if (report.photo) {
      photo.src = report.photo;
      photo.classList.remove('hidden');
      noPhoto.classList.add('hidden');
    } else {
      photo.classList.add('hidden');
      noPhoto.classList.remove('hidden');
    }

    // Status and Agency selects (Admin view if present)
    const statusSel = document.getElementById('modalStatusSelect');
    if (statusSel) statusSel.value = report.status;
    const noteInput = document.getElementById('modalStatusNote');
    if (noteInput) noteInput.value = '';
    const agencySel = document.getElementById('modalAgencySelect');
    if (agencySel) agencySel.value = report.agency || 'Barangay';

    // Timeline
    renderTimeline(report.timeline || []);

    overlay.classList.remove('hidden');
    overlay.dataset.reportId = report.id;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('detailModalOverlay').classList.add('hidden');
    document.body.style.overflow = '';
  }

  function renderTimeline(timeline) {
    const container = document.getElementById('modalTimeline');
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
          <div class="timeline-date">${formatDate(item.date)} • ${timeAgo(item.date)}</div>
        </div>
      `;
      container.appendChild(div);
    });
  }

  // ── SUCCESS OVERLAY ───────────────────────────────────────
  function showSuccess() {
    document.getElementById('successOverlay').classList.remove('hidden');
  }
  function hideSuccess() {
    document.getElementById('successOverlay').classList.add('hidden');
  }

  // ── STATS UPDATE ──────────────────────────────────────────
  function updateStats() {
    const s = Reports.getStats();
    animateCount('statTotal', s.total);
    animateCount('statPending', s.pending);
    animateCount('statProgress', s.progress);
    animateCount('statResolved', s.resolved);
    animateCount('dStatTotal', s.total);
    animateCount('dStatPending', s.pending);
    animateCount('dStatReview', s.review);
    animateCount('dStatProgress', s.progress);
    animateCount('dStatResolved', s.resolved);

    // Resolution rate calculation
    const rate = s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0;
    const rateFill = document.getElementById('statResolutionFill');
    const rateText = document.getElementById('statResolutionRate');
    if (rateFill) rateFill.style.width = `${rate}%`;
    if (rateText) rateText.textContent = `${rate}% Resolution Rate`;

    // Map preview badges
    const bPending = document.getElementById('mapBadgePending');
    const bProgress = document.getElementById('mapBadgeProgress');
    const bResolved = document.getElementById('mapBadgeResolved');
    if (bPending) bPending.textContent = `${s.pending} Pending`;
    if (bProgress) bProgress.textContent = `${s.progress} In Progress`;
    if (bResolved) bResolved.textContent = `${s.resolved} Resolved`;

    const cats = Reports.getCategoryCounts();
    setCount('cc-pothole', cats['Pothole'] || 0);
    setCount('cc-electric', cats['Broken Electric Post'] || 0);
    setCount('cc-drainage', cats['Clogged Drainage'] || 0);
    setCount('cc-streetlight', cats['Busted Streetlight'] || 0);
    setCount('cc-crime', cats['Crime / Public Safety'] || 0);
    setCount('cc-other', cats['Other'] || 0);
  }

  function animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    if (start === target) return;
    const step = (target - start) / 20;
    let cur = start;
    const timer = setInterval(() => {
      cur += step;
      if ((step > 0 && cur >= target) || (step < 0 && cur <= target)) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = Math.round(cur);
      }
    }, 30);
  }

  function setCount(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = `${val} report${val !== 1 ? 's' : ''}`;
  }

  // ── HELPER ────────────────────────────────────────────────
  function truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
  }

  return {
    toast, statusBadge, severityBadge, categoryIcon,
    formatDate, timeAgo, truncate,
    renderReportCard, renderGridCard, renderTableRow,
    openModal, closeModal, renderTimeline,
    showSuccess, hideSuccess, updateStats
  };
})();
