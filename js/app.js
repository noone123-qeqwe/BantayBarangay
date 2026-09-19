/* ─────────────────────────────────────────────────────────
   app.js — SPA router, view logic, form wizard
   ───────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // ── BOOTSTRAP ───────────────────────────────────────────
  Reports.init();

  // ── VIEW ROUTER ──────────────────────────────────────────
  function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const view = document.getElementById('view-' + name);
    if (view) view.classList.add('active');
    const navEl = document.getElementById('nav-' + name);
    if (navEl) navEl.classList.add('active');

    // Lazy-init maps and render on view switch
    switch (name) {
      case 'home':
        MapManager.initHeroMap();
        MapManager.refreshHeroMarkers();
        renderHomeRecent();
        UI.updateStats();
        break;
      case 'report':
        resetForm();
        setTimeout(() => MapManager.initReportMap(onPinDropped), 150);
        break;
      case 'myreports':
        renderMyReports();
        break;
    }

    // Close mobile sidebar
    closeSidebar();
    MapManager.invalidateAll();
  }

  // ── NAV ITEMS ────────────────────────────────────────────
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      showView(el.dataset.view);
    });
  });

  // ── MOBILE SIDEBAR ────────────────────────────────────────
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuBtn = document.getElementById('menuToggle');

  menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay.addEventListener('click', closeSidebar);

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  // ════ HOME VIEW ═══════════════════════════════════════════
  document.getElementById('heroReportBtn').addEventListener('click', () => showView('report'));
  document.getElementById('heroViewBtn').addEventListener('click', () => showView('myreports'));

  function renderHomeRecent() {
    const container = document.getElementById('homeRecentList');
    container.innerHTML = '';
    const reports = Reports.getAll().slice(0, 5);
    if (!reports.length) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
          <p>No reports yet. Be the first to report an issue!</p>
          <button class="btn btn-primary btn-sm" data-view="report">Report Now</button>
        </div>`;
      container.querySelectorAll('[data-view]').forEach(el => {
        el.addEventListener('click', () => showView(el.dataset.view));
      });
      return;
    }
    reports.forEach(r => UI.renderReportCard(r, container, openDetail));
  }

  // ════ REPORT FORM WIZARD ══════════════════════════════════
  let currentStep = 1;
  const TOTAL_STEPS = 4;

  function goToStep(step) {
    document.querySelectorAll('.form-step-content').forEach(el => el.classList.remove('active'));
    document.getElementById('step' + step).classList.add('active');

    document.querySelectorAll('.form-step').forEach((el, idx) => {
      el.classList.remove('active', 'done');
      const s = idx + 1;
      if (s < step) el.classList.add('done');
      else if (s === step) el.classList.add('active');
    });

    document.querySelectorAll('.step-divider').forEach((el, idx) => {
      el.classList.toggle('done', idx + 1 < step);
    });

    // Build summary on step 4
    if (step === 4) buildSummary();

    currentStep = step;
  }

  function resetForm() {
    currentStep = 1;
    document.getElementById('reportForm').reset();
    if (typeof MapManager !== 'undefined') MapManager.resetPin();
    document.getElementById('locationText').textContent = 'No location selected yet';
    document.getElementById('photoPreview').classList.add('hidden');
    document.getElementById('uploadPlaceholder').classList.remove('hidden');
    document.getElementById('previewImg').src = '';
    document.getElementById('charCount').textContent = '0';
    document.querySelectorAll('.field-error').forEach(e => e.classList.add('hidden'));
    document.querySelectorAll('.cat-option input').forEach(r => r.checked = false);
    document.querySelectorAll('.cat-option .cat-option-inner').forEach(el => {
      el.style.borderColor = ''; el.style.background = ''; el.style.color = '';
    });

    // Auto-fill logged-in citizen name if available
    const user = Auth.getCurrentUser();
    const reporterInput = document.getElementById('reporterName');
    if (reporterInput) {
      reporterInput.value = user ? user.name : '';
    }

    goToStep(1);
  }

  // STEP NAVIGATION
  document.getElementById('step1Next').addEventListener('click', () => {
    const cat = document.querySelector('input[name="category"]:checked');
    if (!cat) { document.getElementById('err-category').classList.remove('hidden'); return; }
    document.getElementById('err-category').classList.add('hidden');
    goToStep(2);
  });

  document.getElementById('step2Back').addEventListener('click', () => goToStep(1));
  document.getElementById('step2Next').addEventListener('click', () => {
    const desc = document.getElementById('description').value.trim();
    if (!desc) { document.getElementById('err-description').classList.remove('hidden'); return; }
    document.getElementById('err-description').classList.add('hidden');
    goToStep(3);
  });

  document.getElementById('step3Back').addEventListener('click', () => goToStep(2));
  document.getElementById('step3Next').addEventListener('click', () => {
    if (!MapManager.getSelectedLocation()) {
      document.getElementById('err-location').classList.remove('hidden');
      return;
    }
    document.getElementById('err-location').classList.add('hidden');
    goToStep(4);
  });

  document.getElementById('step4Back').addEventListener('click', () => goToStep(3));

  // CHARACTER COUNTER
  document.getElementById('description').addEventListener('input', function () {
    document.getElementById('charCount').textContent = this.value.length;
  });

  // PIN DROP CALLBACK
  function onPinDropped(loc) {
    document.getElementById('locationText').textContent = loc.address;
    document.getElementById('err-location').classList.add('hidden');
  }

  // GEOLOCATE BUTTON
  document.getElementById('geolocateBtn').addEventListener('click', () => {
    UI.toast('Getting your location…', 'info');
    MapManager.geolocate(onPinDropped);
  });

  // PHOTO UPLOAD
  const photoInput = document.getElementById('photoInput');
  const photoDropzone = document.getElementById('photoDropzone');
  const previewImg = document.getElementById('previewImg');
  const photoPreview = document.getElementById('photoPreview');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');

  document.getElementById('browsePhotoBtn').addEventListener('click', () => photoInput.click());
  photoInput.addEventListener('change', () => {
    if (photoInput.files[0]) handlePhoto(photoInput.files[0]);
  });

  photoDropzone.addEventListener('dragover', e => {
    e.preventDefault();
    photoDropzone.classList.add('drag-over');
  });
  photoDropzone.addEventListener('dragleave', () => photoDropzone.classList.remove('drag-over'));
  photoDropzone.addEventListener('drop', e => {
    e.preventDefault();
    photoDropzone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handlePhoto(e.dataTransfer.files[0]);
  });

  document.getElementById('removePhotoBtn').addEventListener('click', () => {
    previewImg.src = '';
    photoInput.value = '';
    photoPreview.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
  });

  function handlePhoto(file) {
    if (!file.type.startsWith('image/')) { UI.toast('Please select an image file.', 'error'); return; }
    if (file.size > 10 * 1024 * 1024) { UI.toast('File too large. Max 10MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      photoPreview.classList.remove('hidden');
      uploadPlaceholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }

  // BUILD SUMMARY
  function buildSummary() {
    const cat = (document.querySelector('input[name="category"]:checked') || {}).value || '—';
    const agency = document.getElementById('agencySelect').value || '—';
    const desc = document.getElementById('description').value.trim();
    const severity = (document.querySelector('input[name="severity"]:checked') || {}).value || 'Medium';
    const reporter = document.getElementById('reporterName').value.trim() || 'Anonymous';
    const loc = typeof MapManager !== 'undefined' ? MapManager.getSelectedLocation() : { address: 'Masbate City' };

    const grid = document.getElementById('summaryContent');
    grid.innerHTML = `
      <div class="summary-item"><label>Category</label><span>${cat}</span></div>
      <div class="summary-item"><label>Agency</label><span>${agency}</span></div>
      <div class="summary-item"><label>Severity</label><span>${severity}</span></div>
      <div class="summary-item"><label>Reporter</label><span>${reporter}</span></div>
      <div class="summary-item" style="grid-column:1/-1"><label>Location</label><span>${loc ? loc.address : 'Not specified'}</span></div>
      <div class="summary-item" style="grid-column:1/-1"><label>Description</label><span>${desc || '—'}</span></div>
    `;
  }

  // FORM SUBMIT
  document.getElementById('reportForm').addEventListener('submit', e => {
    e.preventDefault();
    const cat = (document.querySelector('input[name="category"]:checked') || {}).value;
    const agency = document.getElementById('agencySelect').value;
    const desc = document.getElementById('description').value.trim();
    const severity = (document.querySelector('input[name="severity"]:checked') || {}).value || 'Medium';
    const reporter = document.getElementById('reporterName').value.trim() || 'Anonymous';
    const loc = typeof MapManager !== 'undefined' ? MapManager.getSelectedLocation() : { address: 'Masbate City' };
    const photo = previewImg.src.startsWith('data:') ? previewImg.src : null;
    const currentUser = Auth.getCurrentUser();

    if (!cat || !desc) { UI.toast('Please complete all required fields.', 'error'); return; }

    const report = Reports.create({
      category: cat,
      agency,
      description: desc,
      severity,
      reporter,
      userId: currentUser ? currentUser.id : null,
      location: loc,
      photo
    });

    resetForm();
    UI.showSuccess();
    UI.updateStats();

    UI.toast(`Report ${report.id} submitted successfully!`, 'success');
  });

  // ════ MY REPORTS VIEW ══════════════════════════════════════
  let myReportFilters = { search: '', status: 'all', category: 'all' };

  function renderMyReports() {
    const container = document.getElementById('myReportsList');
    container.innerHTML = '';
    let results = Reports.filter(myReportFilters);

    // Filter by Scope (All vs My Reports)
    const scopeEl = document.getElementById('myreportScopeFilter');
    const scope = scopeEl ? scopeEl.value : 'all';

    if (scope === 'mine') {
      const user = Auth.getCurrentUser();
      if (!user) {
        container.innerHTML = `
          <div class="empty-state col-span-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <p>Please sign in to view your submitted reports.</p>
            <button class="btn btn-primary btn-sm" id="emptyStateLoginBtn">Sign In / Register</button>
          </div>`;
        document.getElementById('emptyStateLoginBtn')?.addEventListener('click', () => openAuthModal('login'));
        return;
      }
      results = results.filter(r => r.userId === user.id || (r.reporter && r.reporter.toLowerCase() === user.name.toLowerCase()));
    }

    if (!results.length) {
      container.innerHTML = `
        <div class="empty-state col-span-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
          <p>No reports found.</p>
          <button class="btn btn-primary btn-sm" data-view="report">Report an Issue</button>
        </div>`;
      container.querySelectorAll('[data-view]').forEach(el => {
        el.addEventListener('click', () => showView(el.dataset.view));
      });
      return;
    }
    results.forEach(r => UI.renderGridCard(r, container, openDetail));
  }

  document.getElementById('myreportSearch').addEventListener('input', function () {
    myReportFilters.search = this.value;
    renderMyReports();
  });
  document.getElementById('myreportFilter').addEventListener('change', function () {
    myReportFilters.status = this.value;
    renderMyReports();
  });
  document.getElementById('myreportCatFilter').addEventListener('change', function () {
    myReportFilters.category = this.value;
    renderMyReports();
  });
  const scopeSelect = document.getElementById('myreportScopeFilter');
  if (scopeSelect) {
    scopeSelect.addEventListener('change', renderMyReports);
  }

  // ════ DETAIL MODAL (RESIDENT / PUBLIC VIEW) ───────────────
  function openDetail(report) {
    UI.openModal(report);
  }

  // Close modal
  document.getElementById('modalClose').addEventListener('click', UI.closeModal);
  document.getElementById('detailModalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('detailModalOverlay')) UI.closeModal();
  });

  // Keyboard: close modal on Esc
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      UI.closeModal();
      UI.hideSuccess();
      closeAuthModal();
    }
  });

  // ════ SUCCESS OVERLAY ══════════════════════════════════════
  document.getElementById('successViewReports').addEventListener('click', () => {
    UI.hideSuccess();
    showView('myreports');
  });
  document.getElementById('successNewReport').addEventListener('click', () => {
    UI.hideSuccess();
    showView('report');
  });

  // ── HOME CATEGORY CARDS ───────────────────────────────────
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.cat;
      showView('myreports');
      document.getElementById('myreportCatFilter').value = cat;
      myReportFilters.category = cat;
      renderMyReports();
    });
  });

  // ════ AUTH INTEGRATION & MODAL CONTROLS ════════════════════
  function renderUserSidebar() {
    const container = document.getElementById('sidebarUserBlock');
    if (!container) return;
    const user = Auth.getCurrentUser();
    const heroBtn = document.getElementById('heroAuthBtn');
    const heroBtnText = document.getElementById('heroAuthBtnText');

    if (user) {
      const parts = (user.name || 'Resident').split(' ');
      const initials = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();

      container.innerHTML = `
        <div class="sidebar-user-chip">
          <div class="sidebar-user-avatar">${initials}</div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">${user.name}</span>
            <span class="sidebar-user-role">${user.purok || 'Resident'}</span>
          </div>
          <button class="sidebar-logout-btn" id="sidebarLogoutBtn" title="Sign Out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      `;

      document.getElementById('sidebarLogoutBtn')?.addEventListener('click', () => {
        Auth.logout();
        UI.toast('Signed out successfully.', 'info');
      });

      if (heroBtnText) heroBtnText.textContent = `Hi, ${user.name.split(' ')[0]}`;
      if (heroBtn) {
        heroBtn.onclick = () => {
          UI.toast(`Logged in as ${user.name} (${user.purok || 'Resident'})`, 'info');
        };
      }
    } else {
      container.innerHTML = `
        <div class="sidebar-user-chip" style="opacity:0.85">
          <div class="sidebar-user-avatar" style="background:rgba(255,255,255,0.08);color:var(--text-muted)">👤</div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">Guest Citizen</span>
            <span class="sidebar-user-role">Public Access</span>
          </div>
        </div>
        <button class="sidebar-signin-btn" id="sidebarSignInBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Sign In / Register
        </button>
      `;

      document.getElementById('sidebarSignInBtn')?.addEventListener('click', () => openAuthModal('login'));

      if (heroBtnText) heroBtnText.textContent = 'Sign In / Register';
      if (heroBtn) {
        heroBtn.onclick = () => openAuthModal('login');
      }
    }
  }

  // ── MODAL TAB SWITCHER (LOG IN vs CREATE ACCOUNT) ────────
  const modalTabLogin = document.getElementById('modalTabLogin');
  const modalTabRegister = document.getElementById('modalTabRegister');
  const modalPhoneStepView = document.getElementById('modalPhoneStepView');
  const modalOtpStepView = document.getElementById('modalOtpStepView');
  const modalRegisterStepView = document.getElementById('modalRegisterStepView');
  const modalRegisterOtpStepView = document.getElementById('modalRegisterOtpStepView');

  let modalCountdownInterval = null;

  function setModalTab(tab) {
    stopModalCountdown();
    if (tab === 'register') {
      modalTabRegister?.classList.add('active');
      modalTabLogin?.classList.remove('active');
      modalRegisterStepView?.classList.remove('hidden');
      modalRegisterOtpStepView?.classList.add('hidden');
      modalPhoneStepView?.classList.add('hidden');
      modalOtpStepView?.classList.add('hidden');
      setTimeout(() => document.getElementById('mregPhone')?.focus(), 100);
    } else {
      modalTabLogin?.classList.add('active');
      modalTabRegister?.classList.remove('active');
      modalPhoneStepView?.classList.remove('hidden');
      modalOtpStepView?.classList.add('hidden');
      modalRegisterStepView?.classList.add('hidden');
      modalRegisterOtpStepView?.classList.add('hidden');
      setTimeout(() => document.getElementById('modalPhInput')?.focus(), 100);
    }
  }

  modalTabLogin?.addEventListener('click', () => setModalTab('login'));
  modalTabRegister?.addEventListener('click', () => setModalTab('register'));

  function openAuthModal(defaultTab = 'login') {
    const overlay = document.getElementById('authModalOverlay');
    if (!overlay) return;

    setModalTab(defaultTab);

    // Reset Login Input
    const input = document.getElementById('modalPhInput');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input'));
    }
    document.getElementById('modalPhErrorBanner')?.classList.add('hidden');
    document.getElementById('mregErrorBanner')?.classList.add('hidden');

    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeAuthModal() {
    stopModalCountdown();
    const overlay = document.getElementById('authModalOverlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  document.getElementById('authModalClose')?.addEventListener('click', closeAuthModal);
  document.getElementById('authModalOverlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('authModalOverlay')) closeAuthModal();
  });

  // Modal Phone Input Listeners
  const modalPhoneInput = document.getElementById('modalPhInput');
  const modalInputBox = document.getElementById('modalPhInputBox');
  const modalDigitCount = document.getElementById('modalDigitCount');
  const modalErrorBanner = document.getElementById('modalPhErrorBanner');
  const modalErrorMessage = document.getElementById('modalPhErrorMessage');
  let modalPhoneValidation = null;

  if (modalPhoneInput) {
    modalPhoneInput.addEventListener('input', () => {
      modalErrorBanner?.classList.add('hidden');
      modalInputBox?.classList.remove('input-invalid');
      const raw = modalPhoneInput.value;
      const res = Auth.validatePhilippineMobile(raw);

      const digits = raw.replace(/\D/g, '');
      if (modalDigitCount) {
        modalDigitCount.textContent = digits.length > 0 ? `${digits.length} digits` : '';
      }
    });
  }

  // Modal Demo Buttons
  document.querySelectorAll('.modal-ph-demo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (modalPhoneInput) {
        modalPhoneInput.value = btn.dataset.phone;
        modalPhoneInput.dispatchEvent(new Event('input'));
        modalPhoneInput.focus();
      }
    });
  });

  // Modal Phone Login Form Submit
  const modalPhoneForm = document.getElementById('modalPhoneLoginForm');
  if (modalPhoneForm) {
    modalPhoneForm.addEventListener('submit', e => {
      e.preventDefault();
      const val = modalPhoneInput.value;
      const validation = Auth.validatePhilippineMobile(val);

      if (!validation.isValid) {
        if (modalErrorMessage) modalErrorMessage.textContent = validation.error;
        if (modalErrorBanner) modalErrorBanner.classList.remove('hidden');
        if (modalInputBox) modalInputBox.classList.add('input-invalid');
        modalPhoneInput.focus();
        return;
      }

      modalPhoneValidation = validation;
      if (modalErrorBanner) modalErrorBanner.classList.add('hidden');
      if (modalInputBox) modalInputBox.classList.remove('input-invalid');

      // Show OTP Step
      document.getElementById('modalPhoneStepView')?.classList.add('hidden');
      const otpView = document.getElementById('modalOtpStepView');
      if (otpView) otpView.classList.remove('hidden');
      const targetPhone = document.getElementById('modalOtpTargetPhone');
      if (targetPhone) targetPhone.textContent = validation.intlFormatted;

      const mBoxes = document.querySelectorAll('.modal-otp-box');
      mBoxes.forEach(b => b.value = '');
      document.getElementById('modalOtpErrorBanner')?.classList.add('hidden');
      setTimeout(() => mBoxes[0]?.focus(), 150);

      UI.toast(`SMS code sent to ${validation.intlFormatted}. Use demo code: 1234`, 'info');
    });
  }

  // Modal OTP Boxes Input
  const modalOtpBoxes = document.querySelectorAll('.modal-otp-box');
  modalOtpBoxes.forEach((box, idx) => {
    box.addEventListener('input', e => {
      document.getElementById('modalOtpErrorBanner')?.classList.add('hidden');
      box.value = box.value.replace(/\D/g, '');
      if (box.value && idx < modalOtpBoxes.length - 1) {
        modalOtpBoxes[idx + 1].focus();
      }
    });
    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !box.value && idx > 0) {
        modalOtpBoxes[idx - 1].focus();
      }
    });
  });

  // Modal Auto-fill OTP
  document.getElementById('modalAutoFillOtpBtn')?.addEventListener('click', () => {
    const code = ['1', '2', '3', '4'];
    modalOtpBoxes.forEach((b, i) => b.value = code[i]);
    document.getElementById('modalOtpForm')?.dispatchEvent(new Event('submit'));
  });

  // Modal OTP Form Submit
  document.getElementById('modalOtpForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const entered = Array.from(modalOtpBoxes).map(b => b.value).join('');
    const otpErr = document.getElementById('modalOtpErrorBanner');

    if (entered !== '1234' && entered.length !== 4) {
      if (otpErr) otpErr.classList.remove('hidden');
      return;
    }

    const res = Auth.loginWithPhone(modalPhoneValidation.raw);
    if (res.success) {
      UI.toast(`Welcome, ${res.user.name}!`, 'success');
      closeAuthModal();
      if (res.user.role === 'admin') {
        setTimeout(() => { window.location.href = 'admin.html'; }, 600);
      }
    } else {
      if (otpErr) {
        otpErr.querySelector('span').textContent = res.error;
        otpErr.classList.remove('hidden');
      }
    }
  });

  // Back to phone input button (Login)
  document.getElementById('modalBtnEditPhone')?.addEventListener('click', () => {
    document.getElementById('modalOtpStepView')?.classList.add('hidden');
    document.getElementById('modalPhoneStepView')?.classList.remove('hidden');
    modalPhoneInput?.focus();
  });

  // ── IN-MODAL CREATE ACCOUNT LOGIC & OTP ───────────────────
  const mregName = document.getElementById('mregName');
  const mregPhone = document.getElementById('mregPhone');
  const mregDigitCount = document.getElementById('mregDigitCount');
  const mregPurok = document.getElementById('mregPurok');
  const mregPass = document.getElementById('mregPass');
  const mregConfirmPass = document.getElementById('mregConfirmPass');
  const mregErrorBanner = document.getElementById('mregErrorBanner');
  const mregErrorMessage = document.getElementById('mregErrorMessage');
  const mregPassMatchBadge = document.getElementById('mregPassMatchBadge');
  const modalRegisterForm = document.getElementById('modalRegisterForm');

  const mregOtpBoxes = [
    document.getElementById('mrotp1'),
    document.getElementById('mrotp2'),
    document.getElementById('mrotp3'),
    document.getElementById('mrotp4')
  ];

  // Live Phone Validation in Modal
  mregPhone?.addEventListener('input', () => {
    mregErrorBanner?.classList.add('hidden');
    const raw = mregPhone.value;
    const res = Auth.validatePhilippineMobile(raw);
    const digits = raw.replace(/\D/g, '');
    if (mregDigitCount) mregDigitCount.textContent = digits.length > 0 ? `${digits.length} digits` : '';
  });

  // Live Password Match in Modal
  function checkModalPassMatch() {
    if (!mregConfirmPass || !mregPassMatchBadge) return;
    if (!mregConfirmPass.value) {
      mregPassMatchBadge.textContent = '';
      return;
    }
    if (mregPass.value === mregConfirmPass.value) {
      mregPassMatchBadge.textContent = 'Match ✓';
      mregPassMatchBadge.className = 'field-status-badge match-ok';
    } else {
      mregPassMatchBadge.textContent = 'Mismatch ✕';
      mregPassMatchBadge.className = 'field-status-badge match-error';
    }
  }
  mregPass?.addEventListener('input', checkModalPassMatch);
  mregConfirmPass?.addEventListener('input', checkModalPassMatch);

  // Password Toggles in Modal
  document.getElementById('mbtnTogglePass')?.addEventListener('click', () => {
    if (!mregPass) return;
    mregPass.type = mregPass.type === 'password' ? 'text' : 'password';
  });
  document.getElementById('mbtnToggleConfirmPass')?.addEventListener('click', () => {
    if (!mregConfirmPass) return;
    mregConfirmPass.type = mregConfirmPass.type === 'password' ? 'text' : 'password';
  });

  // Quick Demo Fill in Modal
  document.getElementById('modalQuickFillReg')?.addEventListener('click', () => {
    if (mregPhone) {
      mregPhone.value = '0918 222 3333';
      mregPhone.dispatchEvent(new Event('input'));
    }
    if (mregPass) mregPass.value = 'resident123';
    if (mregConfirmPass) {
      mregConfirmPass.value = 'resident123';
      checkModalPassMatch();
    }
    mregErrorBanner?.classList.add('hidden');
  });

  // Modal Register Form Submit
  modalRegisterForm?.addEventListener('submit', e => {
    e.preventDefault();
    mregErrorBanner?.classList.add('hidden');

    const name = mregName?.value.trim();
    const phone = mregPhone?.value.trim();
    const purok = mregPurok?.value;
    const pass = mregPass?.value;
    const confirm = mregConfirmPass?.value;

    const stageRes = Auth.stageRegistration({
      name,
      mobile: phone,
      purok,
      password: pass,
      confirmPassword: confirm
    });

    if (!stageRes.success) {
      if (mregErrorMessage) mregErrorMessage.textContent = stageRes.error;
      if (mregErrorBanner) mregErrorBanner.classList.remove('hidden');
      return;
    }

    // Advance to Modal Register OTP View
    modalRegisterStepView?.classList.add('hidden');
    modalRegisterOtpStepView?.classList.remove('hidden');

    const targetPhone = document.getElementById('mregOtpTargetPhone');
    if (targetPhone) targetPhone.textContent = stageRes.pending.phoneData.intlFormatted;
    const simCode = document.getElementById('mregSimCode');
    if (simCode) simCode.textContent = stageRes.pending.code;

    mregOtpBoxes.forEach(b => { if (b) b.value = ''; });
    document.getElementById('mregOtpErrorBanner')?.classList.add('hidden');
    setTimeout(() => mregOtpBoxes[0]?.focus(), 150);

    startModalCountdown(60);
    UI.toast(`SMS code sent to ${stageRes.pending.phoneData.intlFormatted}. Use demo code: 1234`, 'info');
  });

  // Modal Countdown Timer
  function startModalCountdown(sec) {
    stopModalCountdown();
    let left = sec;
    const label = document.getElementById('mregCountdownLabel');
    const clock = document.getElementById('mregTimerClock');
    const secSpan = document.getElementById('mregTimerSeconds');
    const resendBtn = document.getElementById('mbtnResendOtp');

    label?.classList.remove('hidden');
    clock?.classList.remove('hidden');
    resendBtn?.classList.add('hidden');
    if (secSpan) secSpan.textContent = `00:${String(left).padStart(2, '0')}`;

    modalCountdownInterval = setInterval(() => {
      left--;
      if (left <= 0) {
        stopModalCountdown();
        label?.classList.add('hidden');
        clock?.classList.add('hidden');
        resendBtn?.classList.remove('hidden');
      } else {
        if (secSpan) secSpan.textContent = `00:${String(left).padStart(2, '0')}`;
      }
    }, 1000);
  }

  function stopModalCountdown() {
    if (modalCountdownInterval) {
      clearInterval(modalCountdownInterval);
      modalCountdownInterval = null;
    }
  }

  // Modal Resend Registration OTP
  document.getElementById('mbtnResendOtp')?.addEventListener('click', () => {
    const res = Auth.resendRegistrationOtp();
    if (!res.success) {
      const err = document.getElementById('mregOtpErrorBanner');
      if (err) {
        err.querySelector('span').textContent = res.error;
        err.classList.remove('hidden');
      }
      return;
    }

    document.getElementById('mregOtpErrorBanner')?.classList.add('hidden');
    const simCode = document.getElementById('mregSimCode');
    if (simCode) simCode.textContent = res.code;
    mregOtpBoxes.forEach(b => { if (b) b.value = ''; });
    mregOtpBoxes[0]?.focus();
    startModalCountdown(60);
    UI.toast(`New SMS code sent! Demo code: ${res.code}`, 'info');
  });

  // Modal Registration OTP Boxes Navigation
  mregOtpBoxes.forEach((box, idx) => {
    if (!box) return;
    box.addEventListener('input', e => {
      document.getElementById('mregOtpErrorBanner')?.classList.add('hidden');
      box.value = box.value.replace(/\D/g, '');
      if (box.value && idx < mregOtpBoxes.length - 1) {
        mregOtpBoxes[idx + 1]?.focus();
      }
    });
    box.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !box.value && idx > 0) {
        mregOtpBoxes[idx - 1]?.focus();
      }
    });
  });

  // Modal Auto-fill Demo Code
  document.getElementById('mregAutoFillOtpBtn')?.addEventListener('click', () => {
    ['1', '2', '3', '4'].forEach((n, i) => { if (mregOtpBoxes[i]) mregOtpBoxes[i].value = n; });
    document.getElementById('modalRegisterOtpForm')?.dispatchEvent(new Event('submit'));
  });

  // Modal Register OTP Submit
  document.getElementById('modalRegisterOtpForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const entered = mregOtpBoxes.map(b => b.value).join('');
    const errBanner = document.getElementById('mregOtpErrorBanner');
    const errMsg = document.getElementById('mregOtpErrorMessage');

    if (entered.length < 4) {
      if (errMsg) errMsg.textContent = 'Please enter the complete 4-digit code.';
      if (errBanner) errBanner.classList.remove('hidden');
      return;
    }

    const verifyRes = Auth.verifyRegistrationOtp(entered);
    if (!verifyRes.success) {
      if (errMsg) errMsg.textContent = verifyRes.error;
      if (errBanner) errBanner.classList.remove('hidden');
      mregOtpBoxes.forEach(b => { if (b) b.value = ''; });
      mregOtpBoxes[0]?.focus();
      return;
    }

    stopModalCountdown();
    UI.toast(`Account verified! Welcome to BantayBarangay, ${verifyRes.user.name}.`, 'success');
    closeAuthModal();
  });

  // Modal Change Number / Back button
  document.getElementById('mbtnBackToRegForm')?.addEventListener('click', () => {
    stopModalCountdown();
    modalRegisterOtpStepView?.classList.add('hidden');
    modalRegisterStepView?.classList.remove('hidden');
    mregPhone?.focus();
  });

  // Listen for global auth changes (login/logout)
  Auth.onAuthChange(() => {
    renderUserSidebar();
    const user = Auth.getCurrentUser();
    const reporterInput = document.getElementById('reporterName');
    if (reporterInput) {
      reporterInput.value = user ? user.name : '';
    }
    renderMyReports();
  });

  // ── BOOT ──────────────────────────────────────────────────
  renderUserSidebar();
  showView('home');
});
