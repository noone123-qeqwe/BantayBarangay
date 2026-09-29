/* ─────────────────────────────────────────────────────────
   resident.js — SPA router, view logic, form wizard
   ───────────────────────────────────────────────────────── */

function initApp() {
  // ── AUTH GATE: Login / Create Account MUST come before Dashboard ──
  if (typeof Auth !== 'undefined' && !Auth.isLoggedIn()) {
    window.location.replace('auth.html');
    return;
  }

  // ── UNIVERSAL FAIL-SAFE LOGOUT HANDLER ─────────────────────
  function handleLogout(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    try {
      if (typeof Auth !== 'undefined' && Auth.logout) {
        Auth.logout();
      }
    } catch (err) {
      console.warn('Auth.logout error:', err);
    }
    try {
      localStorage.removeItem('bantay_current_user');
      sessionStorage.clear();
    } catch (err) {}
    window.location.href = 'auth.html?logout=true';
  }

  // ── USER PROFILE HELPER ────────────────────────────────────
  function renderUserProfile() {
    if (typeof Auth === 'undefined') return;
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Auto-fill reporter name if empty
    const reporterInput = document.getElementById('reporterName');
    if (reporterInput && !reporterInput.value.trim()) {
      reporterInput.value = user.name || '';
    }

    // Update mobile top avatar letter
    const mobAvatarLetter = document.getElementById('mobileAvatarLetter');
    if (mobAvatarLetter) {
      mobAvatarLetter.textContent = (user.name && user.name.trim()) ? user.name.trim().charAt(0).toUpperCase() : '👤';
    }
  }

  // ── VIEW ROUTER ──────────────────────────────────────────
  function showView(name) {
    const isSettings = (name === 'profile' || name === 'settings');
    const targetId = isSettings ? 'view-profile' : 'view-report';
    const targetNav = isSettings ? 'nav-profile' : 'nav-report';

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const view = document.getElementById(targetId);
    if (view) view.classList.add('active');
    const navEl = document.getElementById(targetNav);
    if (navEl) navEl.classList.add('active');

    // Sync mobile bottom navigation tabs
    const mobReport = document.getElementById('mob-nav-report');
    const mobProfile = document.getElementById('mob-nav-profile');
    if (isSettings) {
      mobProfile?.classList.add('active');
      mobReport?.classList.remove('active');
    } else {
      mobReport?.classList.add('active');
      mobProfile?.classList.remove('active');
    }

    if (isSettings) {
      renderProfileView();
    }

    // Close mobile sidebar if open
    closeSidebar();

    // Scroll content to top
    const mainContent = document.getElementById('mainContent');
    if (mainContent && typeof mainContent.scrollTo === 'function') mainContent.scrollTo(0, 0);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }
  }

  // Expose globally for ChatAssistant action links and inline clicks
  function selectCategory(catName) {
    showView('report');
    const catSelect = document.getElementById('categorySelect');
    if (catSelect) {
      let found = false;
      for (const opt of catSelect.options) {
        if (opt.value === catName || opt.value.toLowerCase().includes(catName.toLowerCase()) || catName.toLowerCase().includes(opt.value.toLowerCase())) {
          catSelect.value = opt.value;
          found = true;
          break;
        }
      }
      if (!found) catSelect.value = catName;
      catSelect.dispatchEvent(new Event('change'));
    }
  }

  window.BantayResident = {
    showView,
    selectCategory,
    logout: handleLogout
  };

  // ── DIRECT & GENERAL NAVIGATION BINDINGS ──────────────────
  document.getElementById('nav-report')?.addEventListener('click', e => {
    e.preventDefault();
    showView('report');
  });

  document.getElementById('nav-profile')?.addEventListener('click', e => {
    e.preventDefault();
    showView('profile');
  });

  document.getElementById('sidebarLogoutBtn')?.addEventListener('click', handleLogout);

  // Mobile Bottom Navigation Bindings
  document.getElementById('mob-nav-report')?.addEventListener('click', e => {
    e.preventDefault();
    showView('report');
  });

  document.getElementById('mob-nav-profile')?.addEventListener('click', e => {
    e.preventDefault();
    showView('profile');
  });

  document.getElementById('mob-nav-logout')?.addEventListener('click', handleLogout);

  document.getElementById('mobileAvatarBtn')?.addEventListener('click', e => {
    e.preventDefault();
    showView('profile');
  });

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

  menuBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('open');
  });
  overlay?.addEventListener('click', closeSidebar);

  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('open');
  }

  // ════ REPORT FORM STATE & RESET ═══════════════════════════
  let selectedLocation = { address: '', purok: '', lat: 12.3713, lng: 123.6304, hasGps: false };
  const DRAFT_KEY_PREFIX = 'bantay_report_draft_';

  function draftKey() {
    const user = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    return `${DRAFT_KEY_PREFIX}${user?.id || user?.mobile || 'device'}`;
  }

  function normalizeLocation(value) {
    return (value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function locationTokens(value) {
    const ignored = new Set(['purok', 'brgy', 'barangay', 'city', 'municipality', 'masbate', 'street', 'road', 'near', 'gps']);
    return new Set(normalizeLocation(value).split(' ').filter(token => token.length >= 4 && !ignored.has(token) && !/^\d+$/.test(token)));
  }

  function reportCategoryKey(category) {
    const electricalIssueTypes = new Set([
      'Toppled / Leaning Utility Pole', 'Snapped / Downed Power Lines', 'Low-Hanging Wires',
      'Tangled or Crossed Lines', 'Broken Crossarm / Insulator', 'Blown Transformer',
      'Transformer Oil Leak / Smoking', 'Sparking / Arcing Transformer', 'Service Drop Disconnection',
      'Service Wire Sparking / Short Circuit', 'Damaged Electric Meter Box', 'Total Blackout (Area-wide)',
      'Rotational Brownout / Load Shedding', 'Low Voltage / Fluctuating Power',
      'Unscheduled Interruption (Cause Unknown)', 'Tree Branches Entangled in Wires', 'Tree Branch Fell on Lines',
      'Broken Electric Post / Wire'
    ]);
    return electricalIssueTypes.has(category) ? 'electric' : (category || '').toLowerCase();
  }

  function distanceInKm(aLat, aLng, bLat, bLng) {
    const rad = deg => deg * Math.PI / 180;
    const dLat = rad(bLat - aLat), dLng = rad(bLng - aLng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function hasMatchingLocation(report, address) {
    const reportLocation = report.location || {};
    if (selectedLocation.hasGps && Number.isFinite(reportLocation.lat) && Number.isFinite(reportLocation.lng)) {
      return distanceInKm(selectedLocation.lat, selectedLocation.lng, reportLocation.lat, reportLocation.lng) <= 0.75;
    }
    const typed = locationTokens(address);
    const existing = locationTokens(reportLocation.address);
    const common = [...typed].filter(token => existing.has(token));
    return common.length >= 2 || common.some(token => token.length >= 7);
  }

  function relativeDate(value) {
    const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3600000));
    return hours < 1 ? 'just now' : hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
  }

  function renderPossibleReports() {
    const panel = document.getElementById('nearbyReports');
    const list = document.getElementById('nearbyReportsList');
    const category = document.getElementById('categorySelect')?.value || '';
    const address = document.getElementById('reportAddressInput')?.value.trim() || '';
    if (!panel || !list || !category || (!selectedLocation.hasGps && address.length < 5) || typeof Reports === 'undefined') {
      panel?.classList.add('hidden');
      return;
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const matches = Reports.getAll().filter(report => {
      const status = (report.status || '').toLowerCase();
      return reportCategoryKey(report.category) === reportCategoryKey(category) && !['resolved', 'dismissed'].includes(status) &&
        new Date(report.createdAt).getTime() >= thirtyDaysAgo && hasMatchingLocation(report, address);
    }).slice(0, 3);

    list.replaceChildren();
    if (!matches.length) {
      panel.classList.add('hidden');
      return;
    }
    matches.forEach(report => {
      const card = document.createElement('article');
      card.className = 'nearby-report-card';
      const details = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = `${report.id} · ${report.category}`;
      const meta = document.createElement('div');
      meta.className = 'nearby-report-meta';
      meta.textContent = `${report.status || 'Pending'} · ${relativeDate(report.createdAt)} · ${report.location?.address || 'Location recorded'}`;
      details.append(title, meta);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'support-report-btn';
      button.textContent = `Support (${report.confirmations || 0})`;
      button.setAttribute('aria-label', `Support existing report ${report.id}`);
      button.addEventListener('click', () => {
        const user = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
        const outcome = Reports.confirmOnce(report.id, user?.id || user?.mobile || 'device');
        if (outcome.confirmed) {
          button.disabled = true;
          button.textContent = `Supported (${outcome.total})`;
          UI.toast(`You are supporting report ${report.id}. Thank you.`, 'success');
        } else {
          button.disabled = true;
          button.textContent = `Already supported (${outcome.total})`;
          UI.toast('You have already supported this report.', 'info');
        }
      });
      card.append(details, button);
      list.append(card);
    });
    panel.classList.remove('hidden');
  }

  function saveDraft() {
    const category = document.getElementById('categorySelect')?.value || '';
    const address = document.getElementById('reportAddressInput')?.value.trim() || '';
    const description = document.getElementById('description')?.value || '';
    const reporter = document.getElementById('reporterName')?.value || '';
    const status = document.getElementById('draftStatus');
    if (!category && !address && !description) {
      localStorage.removeItem(draftKey());
      if (status) status.textContent = 'Drafts are saved on this device while you type.';
      return;
    }
    localStorage.setItem(draftKey(), JSON.stringify({ category, address, description, reporter, location: selectedLocation }));
    if (status) status.textContent = navigator.onLine ? 'Draft saved on this device.' : 'Offline: draft saved on this device.';
  }

  function restoreDraft() {
    let draft;
    try { draft = JSON.parse(localStorage.getItem(draftKey()) || 'null'); } catch { draft = null; }
    if (!draft) return;
    const category = document.getElementById('categorySelect');
    if (category && draft.category) {
      category.value = draft.category;
      category.dispatchEvent(new Event('change'));
    }
    if (draft.address) document.getElementById('reportAddressInput').value = draft.address;
    if (draft.description) document.getElementById('description').value = draft.description;
    if (draft.reporter) document.getElementById('reporterName').value = draft.reporter;
    if (draft.location) selectedLocation = { ...selectedLocation, ...draft.location };
    const count = document.getElementById('charCount');
    if (count) count.textContent = (draft.description || '').length;
    document.getElementById('draftStatus').textContent = 'An unfinished draft was restored from this device.';
    renderPossibleReports();
  }

  function syncCustomPickerUI(selectedValue) {
    const trigger = document.getElementById('customCatTrigger');
    const triggerTitle = document.getElementById('catTriggerTitle');
    const triggerSub = document.getElementById('catTriggerSub');
    const triggerIcon = document.getElementById('catTriggerIcon');
    const triggerUrgency = document.getElementById('catTriggerUrgency');
    const items = document.querySelectorAll('.custom-cat-item');

    items.forEach(item => {
      if (selectedValue && item.dataset.value === selectedValue) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    if (!selectedValue) {
      if (triggerTitle) triggerTitle.textContent = 'Select category & issue type…';
      if (triggerSub) triggerSub.textContent = 'Choose from 17 specific electrical, line, transformer, and outage issue types';
      if (triggerIcon) triggerIcon.textContent = '⚡';
      if (triggerUrgency) {
        triggerUrgency.classList.add('hidden');
        triggerUrgency.textContent = '';
      }
      if (trigger) trigger.classList.remove('has-selection');
      return;
    }

    const matchedItem = document.querySelector(`.custom-cat-item[data-value="${selectedValue}"]`);
    const catSelectEl = document.getElementById('categorySelect');
    const opt = catSelectEl ? (catSelectEl.querySelector(`option[value="${selectedValue}"]`) || catSelectEl.selectedOptions[0]) : null;

    const group = matchedItem?.dataset.group || opt?.getAttribute('data-group') || 'Category A';
    const desc = matchedItem?.dataset.desc || opt?.getAttribute('data-desc') || '';
    const sev = matchedItem?.dataset.sev || opt?.getAttribute('data-sev') || 'Medium';

    let icon = '⚡';
    if (group.includes('Line & Pole') || group.includes('Category A')) icon = '🗼';
    else if (group.includes('Transformer') || group.includes('Category B')) icon = '⚡';
    else if (group.includes('Service Drop') || group.includes('Category C')) icon = '🔌';
    else if (group.includes('Outage') || group.includes('Category D')) icon = '💡';
    else if (group.includes('Vegetation') || group.includes('Category E')) icon = '🌳';

    if (triggerTitle) triggerTitle.textContent = selectedValue;
    if (triggerSub) triggerSub.textContent = desc;
    if (triggerIcon) triggerIcon.textContent = icon;
    if (triggerUrgency) {
      triggerUrgency.textContent = `${sev} Urgency`;
      triggerUrgency.className = `cat-trigger-urgency-badge urgency-${sev.toLowerCase()}`;
      triggerUrgency.classList.remove('hidden');
    }
    if (trigger) trigger.classList.add('has-selection');
  }

  function resetForm() {
    document.getElementById('reportForm')?.reset();
    selectedLocation = { address: '', purok: '', lat: 12.3713, lng: 123.6304, hasGps: false };
    localStorage.removeItem(draftKey());
    document.getElementById('nearbyReports')?.classList.add('hidden');
    document.getElementById('gpsAccuracyBadge')?.classList.add('hidden');
    const repAddrInput = document.getElementById('reportAddressInput');
    if (repAddrInput) repAddrInput.value = '';
    document.getElementById('err-address')?.classList.add('hidden');
    document.getElementById('err-category')?.classList.add('hidden');
    document.getElementById('err-description')?.classList.add('hidden');
    const charCount = document.getElementById('charCount');
    if (charCount) charCount.textContent = '0';
    document.querySelectorAll('.field-error').forEach(e => e.classList.add('hidden'));
    const catSelect = document.getElementById('categorySelect');
    if (catSelect) catSelect.value = '';
    syncCustomPickerUI('');
    const issueCard = document.getElementById('issuePreviewCard');
    if (issueCard) issueCard.classList.add('hidden');
    const sevInput = document.getElementById('reportSeverityInput');
    if (sevInput) sevInput.value = 'Medium';

    // Auto-fill logged-in citizen name if available
    const user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
    const reporterInput = document.getElementById('reporterName');
    if (reporterInput) {
      reporterInput.value = user ? user.name : '';
    }
  }

  // ── CATEGORY DROPDOWN CHANGE & PREVIEW CARD ───────────────
  const catSelectEl = document.getElementById('categorySelect');
  const issuePreviewCard = document.getElementById('issuePreviewCard');
  const previewGroup = document.getElementById('issuePreviewGroup');
  const previewSevBadge = document.getElementById('issuePreviewSevBadge');
  const previewIcon = document.getElementById('issuePreviewIcon');
  const previewTitle = document.getElementById('issuePreviewTitle');
  const previewDesc = document.getElementById('issuePreviewDesc');
  const agencySelect = document.getElementById('agencySelect');

  if (catSelectEl) {
    catSelectEl.addEventListener('change', () => {
      document.getElementById('err-category')?.classList.add('hidden');
      const val = catSelectEl.value;
      syncCustomPickerUI(val);

      if (!val) {
        if (issuePreviewCard) issuePreviewCard.classList.add('hidden');
        return;
      }

      const opt = catSelectEl.querySelector(`option[value="${val}"]`) || catSelectEl.selectedOptions[0];
      const group = opt?.getAttribute('data-group') || 'Electrical Infrastructure';
      const desc = opt?.getAttribute('data-desc') || '';
      const sev = opt?.getAttribute('data-sev') || 'Medium';
      const title = val;

      // Relevant Icon for infrastructure category
      let icon = '⚡';
      if (group.includes('Line & Pole') || group.includes('Category A')) icon = '🗼';
      else if (group.includes('Transformer') || group.includes('Category B')) icon = '⚡';
      else if (group.includes('Service Drop') || group.includes('Category C')) icon = '🔌';
      else if (group.includes('Outage') || group.includes('Category D')) icon = '💡';
      else if (group.includes('Vegetation') || group.includes('Category E')) icon = '🌳';

      if (previewGroup) previewGroup.textContent = group;
      if (previewTitle) previewTitle.textContent = title;
      if (previewDesc) previewDesc.textContent = desc;
      if (previewIcon) previewIcon.textContent = icon;

      if (previewSevBadge) {
        previewSevBadge.textContent = `${sev} Urgency`;
        previewSevBadge.className = `issue-preview-urgency urgency-${sev.toLowerCase()}`;
      }

      // Automatically route to MASELCO (Masbate Electric Cooperative)
      if (agencySelect) {
        agencySelect.value = 'MASELCO';
      }

      // Automatically record severity from recommended urgency
      const sevInput = document.getElementById('reportSeverityInput');
      if (sevInput) sevInput.value = sev;
      const sevRadio = document.querySelector(`input[name="severity"][value="${sev}"]`);
      if (sevRadio) sevRadio.checked = true;

      if (issuePreviewCard) {
        issuePreviewCard.classList.remove('hidden');
      }
      saveDraft();
      renderPossibleReports();
    });
  }

  // ── CUSTOM CATEGORY PICKER COMPONENT CONTROLLER ───────────
  function initCustomCategoryPicker() {
    const picker = document.getElementById('customCatPicker');
    const trigger = document.getElementById('customCatTrigger');
    const popover = document.getElementById('customCatPopover');
    const searchInput = document.getElementById('catSearchInput');
    const searchClear = document.getElementById('catSearchClear');
    const filterPills = document.querySelectorAll('#catFilterPills .cat-pill-btn');
    const items = document.querySelectorAll('.custom-cat-item');
    const groupHeaders = document.querySelectorAll('.cat-group-header-label');
    const noResultsMsg = document.getElementById('catNoResultsMsg');
    const searchQueryText = document.getElementById('catSearchQueryText');

    if (!picker || !trigger || !popover) return;

    let currentGroupFilter = 'all';
    let currentSearchTerm = '';

    function openPopover() {
      popover.classList.remove('hidden');
      trigger.setAttribute('aria-expanded', 'true');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 60);
      }
    }

    function closePopover() {
      popover.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
    }

    function togglePopover() {
      if (popover.classList.contains('hidden')) {
        openPopover();
      } else {
        closePopover();
      }
    }

    // Toggle popover on trigger click
    trigger.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      togglePopover();
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!picker.contains(e.target) && !popover.classList.contains('hidden')) {
        closePopover();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !popover.classList.contains('hidden')) {
        closePopover();
      }
    });

    // Filter logic
    function applyFilters() {
      let visibleCount = 0;
      const visibleGroups = new Set();

      items.forEach(item => {
        const itemVal = (item.dataset.value || '').toLowerCase();
        const itemDesc = (item.dataset.desc || '').toLowerCase();
        const itemGroup = item.dataset.group || '';
        const itemSev = (item.dataset.sev || '').toLowerCase();

        // Check group filter
        const matchesGroup = (currentGroupFilter === 'all') || (itemGroup.includes(currentGroupFilter));

        // Check search filter
        const matchesSearch = !currentSearchTerm || 
          itemVal.includes(currentSearchTerm) || 
          itemDesc.includes(currentSearchTerm) || 
          itemGroup.toLowerCase().includes(currentSearchTerm) ||
          itemSev.includes(currentSearchTerm);

        if (matchesGroup && matchesSearch) {
          item.classList.remove('hidden');
          visibleCount++;
          visibleGroups.add(itemGroup);
        } else {
          item.classList.add('hidden');
        }
      });

      // Filter group headers
      groupHeaders.forEach(header => {
        const headerGroup = header.dataset.group || '';
        if (currentGroupFilter !== 'all') {
          header.classList.toggle('hidden', headerGroup !== currentGroupFilter || !visibleGroups.has(headerGroup));
        } else {
          header.classList.toggle('hidden', !visibleGroups.has(headerGroup));
        }
      });

      // Show/hide no results message
      if (noResultsMsg) {
        if (visibleCount === 0) {
          noResultsMsg.classList.remove('hidden');
          if (searchQueryText) searchQueryText.textContent = currentSearchTerm || currentGroupFilter;
        } else {
          noResultsMsg.classList.add('hidden');
        }
      }
    }

    // Live search input
    searchInput?.addEventListener('input', () => {
      currentSearchTerm = searchInput.value.trim().toLowerCase();
      if (currentSearchTerm) {
        searchClear?.classList.remove('hidden');
      } else {
        searchClear?.classList.add('hidden');
      }
      applyFilters();
    });

    // Clear search button
    searchClear?.addEventListener('click', e => {
      e.stopPropagation();
      if (searchInput) searchInput.value = '';
      currentSearchTerm = '';
      searchClear.classList.add('hidden');
      applyFilters();
      searchInput?.focus();
    });

    // Filter pills
    filterPills.forEach(pill => {
      pill.addEventListener('click', e => {
        e.stopPropagation();
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentGroupFilter = pill.dataset.filter || 'all';
        applyFilters();
      });
    });

    // Selecting an item
    items.forEach(item => {
      function chooseItem() {
        const val = item.dataset.value;
        if (catSelectEl) {
          catSelectEl.value = val;
          catSelectEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
        closePopover();
      }

      item.addEventListener('click', e => {
        e.stopPropagation();
        chooseItem();
      });

      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          chooseItem();
        }
      });
    });
  }

  // ── QUICK CATEGORY SHORTCUT PILLS ────────────────────────────
  const quickPills = document.querySelectorAll('.quick-cat-pill');
  quickPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const issueName = pill.dataset.issue;
      if (!issueName) return;

      const catSelectEl = document.getElementById('categorySelect');
      if (catSelectEl) {
        catSelectEl.value = issueName;
        catSelectEl.dispatchEvent(new Event('change'));
      }

      quickPills.forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });

  // Sync quick pills when category changes externally
  document.getElementById('categorySelect')?.addEventListener('change', e => {
    const currentVal = e.target.value;
    quickPills.forEach(p => {
      p.classList.toggle('selected', p.dataset.issue === currentVal);
    });
  });

  // ── PHOTO EVIDENCE UPLOADER CONTROLLER ────────────────────────
  const photoDropzone = document.getElementById('photoDropzone');
  const reportPhotoInput = document.getElementById('reportPhotoInput');
  const photoDropEmpty = document.getElementById('photoDropEmpty');
  const photoPreviewWrap = document.getElementById('photoPreviewWrap');
  const photoPreviewImg = document.getElementById('photoPreviewImg');
  const photoFilename = document.getElementById('photoFilename');
  const btnRemovePhoto = document.getElementById('btnRemovePhoto');

  let currentPhotoDataUrl = null;

  function handlePhotoFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      if (typeof UI !== 'undefined' && UI.toast) {
        UI.toast('Please select an image file (JPG, PNG, WebP).', 'error');
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      currentPhotoDataUrl = ev.target.result;
      if (photoPreviewImg) photoPreviewImg.src = currentPhotoDataUrl;
      if (photoFilename) photoFilename.textContent = file.name;
      photoDropEmpty?.classList.add('hidden');
      photoPreviewWrap?.classList.remove('hidden');
      if (typeof UI !== 'undefined' && UI.toast) {
        UI.toast('Evidence photo attached to incident report.', 'success');
      }
    };
    reader.readAsDataURL(file);
  }

  if (photoDropzone && reportPhotoInput) {
    photoDropzone.addEventListener('click', (e) => {
      if (e.target === btnRemovePhoto || btnRemovePhoto?.contains(e.target)) return;
      reportPhotoInput.click();
    });

    photoDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      photoDropzone.classList.add('drag-over');
    });

    photoDropzone.addEventListener('dragleave', () => {
      photoDropzone.classList.remove('drag-over');
    });

    photoDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      photoDropzone.classList.remove('drag-over');
      const files = e.dataTransfer?.files;
      if (files && files[0]) {
        handlePhotoFile(files[0]);
      }
    });

    reportPhotoInput.addEventListener('change', () => {
      if (reportPhotoInput.files && reportPhotoInput.files[0]) {
        handlePhotoFile(reportPhotoInput.files[0]);
      }
    });

    btnRemovePhoto?.addEventListener('click', (e) => {
      e.stopPropagation();
      currentPhotoDataUrl = null;
      if (reportPhotoInput) reportPhotoInput.value = '';
      if (photoPreviewImg) photoPreviewImg.src = '';
      photoPreviewWrap?.classList.add('hidden');
      photoDropEmpty?.classList.remove('hidden');
    });
  }

  // Live input handler for Step 1 Address input
  const reportAddressInput = document.getElementById('reportAddressInput');
  if (reportAddressInput) {
    reportAddressInput.addEventListener('input', () => {
      document.getElementById('err-address')?.classList.add('hidden');
      selectedLocation.address = reportAddressInput.value.trim();
      saveDraft();
      renderPossibleReports();
    });
  }

  // CHARACTER COUNTER
  document.getElementById('description')?.addEventListener('input', function () {
    const counter = document.getElementById('charCount');
    if (counter) counter.textContent = this.value.length;
    saveDraft();
  });

  document.getElementById('reporterName')?.addEventListener('input', saveDraft);

  // ── ACCURATE REVERSE GEOCODING HELPER WITH IN-MEMORY CACHE ──
  const geocodeMemoryCache = new Map();

  async function reverseGeocode(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'Masbate Province';
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (geocodeMemoryCache.has(cacheKey)) {
      return geocodeMemoryCache.get(cacheKey);
    }

    // 1. Try Nominatim OpenStreetMap API with 2.5s network abort
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' }
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const road = addr.road || addr.pedestrian || addr.street || addr.residential || '';
          const brgy = addr.village || addr.suburb || addr.neighbourhood || addr.quarter || addr.hamlet || '';
          const muni = addr.city || addr.town || addr.municipality || 'Masbate City';
          const parts = [];
          if (road) parts.push(road);
          if (brgy) {
            const bLabel = brgy.toLowerCase().startsWith('brgy') ? brgy : `Brgy. ${brgy}`;
            parts.push(bLabel);
          }
          if (muni) parts.push(muni);
          if (parts.length >= 2) {
            const resolved = parts.join(', ');
            geocodeMemoryCache.set(cacheKey, resolved);
            return resolved;
          }
          if (data.display_name) {
            const resolved = data.display_name.split(',').slice(0, 3).join(', ').trim();
            geocodeMemoryCache.set(cacheKey, resolved);
            return resolved;
          }
        }
      }
    } catch (e) {
      // Offline, network timeout, or weak connectivity - instant fallback to local Masbate coordinate database
    }

    // 2. Offline / Local fallback using Masbate Locations reference coordinates
    if (typeof MasbateLocations !== 'undefined' && MasbateLocations.findNearestLocation) {
      const nearest = MasbateLocations.findNearestLocation(lat, lng);
      if (nearest && nearest.formatted) {
        geocodeMemoryCache.set(cacheKey, nearest.formatted);
        return nearest.formatted;
      }
    }

    return 'Masbate Province';
  }

  // ── UPDATE ACCURACY BADGE UI ──────────────────────────────────
  function updateGpsBadge(acc, sampleCount = 0, isFallback = false) {
    const badge = document.getElementById('gpsAccuracyBadge');
    if (!badge) return;
    badge.classList.remove('hidden', 'acc-ultra', 'acc-high', 'acc-medium', 'acc-coarse');
    let level = 'acc-high';
    let icon = '🎯';
    const sampleSuffix = sampleCount > 1 ? ` (${sampleCount} GNSS fixes)` : '';
    let text = `Precision GPS: ±${acc}m${sampleSuffix}`;

    if (acc <= 6) {
      level = 'acc-ultra';
      icon = '🎯';
      text = `Ultra-Precision GNSS: ±${acc}m (Multi-Satellite Lock)${sampleSuffix}`;
    } else if (acc <= 15) {
      level = 'acc-high';
      icon = '🛰️';
      text = `High Precision GPS: ±${acc}m (Satellite Lock)${sampleSuffix}`;
    } else if (acc <= 35) {
      level = 'acc-medium';
      icon = '📍';
      text = isFallback
        ? `Cell/Wi-Fi Assisted: ±${acc}m (Low Satellite Signal)${sampleSuffix}`
        : `Good Accuracy: ±${acc}m${sampleSuffix}`;
    } else {
      level = 'acc-coarse';
      icon = '📡';
      text = isFallback
        ? `Low GPS Signal: ±${acc}m (Cellular/Network Fallback)`
        : `Low Satellite Signal: ±${acc}m (Indoors/Obstructed)`;
    }

    badge.classList.add(level);
    badge.innerHTML = `<span class="gps-accuracy-icon">${icon}</span> <span>${text}</span>`;
  }

  // ── LOW-SIGNAL INTERACTIVE ASSISTANCE WIDGET ─────────────────
  function renderLowSignalAssist(acc, isFallback = false) {
    const assistEl = document.getElementById('gpsLowSignalAssist');
    if (!assistEl) return;

    if (acc <= 20 && !isFallback) {
      assistEl.classList.add('hidden');
      return;
    }

    assistEl.classList.remove('hidden');

    const isIndoorOrWeak = acc > 35 || isFallback;
    const title = isIndoorOrWeak
      ? `📡 Low GPS Signal Area Detected (±${acc}m)`
      : `📍 Moderate Accuracy (±${acc}m)`;
    const desc = isIndoorOrWeak
      ? 'Weak satellite reception detected (often caused by tin roofing, dense foliage, or indoor shielding). For accurate dispatch, use our High-Resolution Aerial Map to drop the pin on your exact roof/pole, or snap to your barangay center.'
      : 'Location is acquired, but you can micro-adjust on the aerial satellite map for pole or meter-level precision.';

    assistEl.innerHTML = `
      <div class="gps-low-signal-header">
        <span class="gps-low-signal-icon">📡</span>
        <div class="gps-low-signal-content">
          <div class="gps-low-signal-title">${title}</div>
          <div class="gps-low-signal-desc">${desc}</div>
        </div>
      </div>
      <div class="gps-low-signal-actions">
        <button type="button" class="btn-assist-action btn-assist-pinpoint" id="btnLowSignalPinpoint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
          Fine-Tune on Map (±1.5m)
        </button>
        <button type="button" class="btn-assist-action btn-assist-snap" id="btnLowSignalSnap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Snap to Barangay
        </button>
        <button type="button" class="btn-assist-action btn-assist-retry" id="btnLowSignalRetry">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Retry Outdoors
        </button>
      </div>
    `;

    document.getElementById('btnLowSignalPinpoint')?.addEventListener('click', () => {
      openPinpointMap();
    });

    document.getElementById('btnLowSignalSnap')?.addEventListener('click', () => {
      snapToKnownBarangay();
    });

    document.getElementById('btnLowSignalRetry')?.addEventListener('click', () => {
      UI.toast('Step outdoors or near a window for direct sky view.', 'info');
      runHighAccuracyGps();
    });
  }

  function hideLowSignalAssist() {
    const assistEl = document.getElementById('gpsLowSignalAssist');
    if (assistEl) assistEl.classList.add('hidden');
  }

  function snapToKnownBarangay() {
    // Check if user has chosen a barangay in dropdown or has registered profile
    let muni = 'Masbate City';
    let brgy = 'Centro (Poblacion)';
    let purok = 'Purok 1';

    const mMuni = document.getElementById('pickerMunicipality');
    const mBrgy = document.getElementById('pickerBarangay');
    const mPurok = document.getElementById('pickerPurok');

    if (mMuni && mMuni.value) muni = mMuni.value;
    if (mBrgy && mBrgy.value) brgy = mBrgy.value;
    if (mPurok && mPurok.value) purok = mPurok.value;

    if (currentUser && currentUser.purok) {
      if (typeof MasbateLocations !== 'undefined' && MasbateLocations.parsePurokAddress) {
        const parsed = MasbateLocations.parsePurokAddress(currentUser.purok);
        if (parsed.municipality) muni = parsed.municipality;
        if (parsed.barangay) brgy = parsed.barangay;
        if (parsed.purok) purok = parsed.purok;
      }
    }

    if (typeof MasbateLocations !== 'undefined' && MasbateLocations.getCoordinates) {
      const coords = MasbateLocations.getCoordinates(muni, brgy);
      selectedLocation.lat = coords.lat;
      selectedLocation.lng = coords.lng;
      selectedLocation.accuracy = 15;
      selectedLocation.hasGps = true;
      selectedLocation.purok = purok;

      const formatted = MasbateLocations.formatPurokAddress ? MasbateLocations.formatPurokAddress(purok, brgy, muni) : `Brgy. ${brgy}, ${muni}`;
      const gpsDetail = `(GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}, ±15m)`;
      const finalAddr = `${formatted} ${gpsDetail}`;

      const addrInput = document.getElementById('reportAddressInput');
      if (addrInput) {
        addrInput.value = finalAddr;
        selectedLocation.address = finalAddr;
        document.getElementById('err-address')?.classList.add('hidden');
      }

      updateGpsBadge(15);
      hideLowSignalAssist();
      syncMapMarker(coords.lat, coords.lng, finalAddr);
      saveDraft();
      renderPossibleReports();
      UI.toast(`Location anchored to ${brgy}, ${muni} (±15m). Tap "Pinpoint on Map" if you wish to adjust to exact pole/house.`, 'success');
    } else {
      openSelectBarangay();
    }
  }

  // ── 2D RECURSIVE KALMAN FILTER FOR JITTER & MULTIPATH DAMPENING ──
  class KalmanGpsFilter2D {
    constructor(driftRate = 2.0) {
      this.variance = -1; // uninitialized
      this.lat = 0;
      this.lng = 0;
      this.accuracy = 999;
      this.lastTime = 0;
      this.driftRate = driftRate;
    }

    reset() {
      this.variance = -1;
      this.lat = 0;
      this.lng = 0;
      this.accuracy = 999;
      this.lastTime = 0;
    }

    update(lat, lng, accuracy, timestampMs) {
      const acc = Math.max(1, accuracy);
      const r = acc * acc; // Measurement variance
      const now = timestampMs || Date.now();

      if (this.variance < 0) {
        this.lat = lat;
        this.lng = lng;
        this.variance = r;
        this.accuracy = Math.round(acc);
        this.lastTime = now;
        return {
          lat: parseFloat(this.lat.toFixed(6)),
          lng: parseFloat(this.lng.toFixed(6)),
          accuracy: this.accuracy
        };
      }

      const dt = Math.max(0.05, Math.min((now - this.lastTime) / 1000, 20));
      this.lastTime = now;

      // Process noise: spatial variance grows slowly over time
      this.variance += this.driftRate * dt;

      // Kalman gain
      const K = this.variance / (this.variance + r);

      // State update
      this.lat += K * (lat - this.lat);
      this.lng += K * (lng - this.lng);

      // Covariance update
      this.variance = Math.max(1, (1 - K) * this.variance);
      this.accuracy = Math.max(2, Math.round(Math.sqrt(this.variance)));

      return {
        lat: parseFloat(this.lat.toFixed(6)),
        lng: parseFloat(this.lng.toFixed(6)),
        accuracy: this.accuracy
      };
    }
  }

  // ── HIGH-PRECISION MULTI-SAMPLE GNSS ENGINE ───────────────────
  let activeGpsWatchId = null;
  let activeGpsTimeoutTimer = null;
  let activeGpsEarlyExitTimer = null;
  let activeGpsFallbackTimer = null;
  let isGpsAcquiring = false;
  const activeKalmanFilter = new KalmanGpsFilter2D(2.0);

  /**
   * Computes the Inverse-Variance Weighted Centroid & Standard Error of GPS fixes.
   * Fused with 2D Kalman Filter state for noise-free stability.
   * @param {GeolocationPosition[]} fixes
   * @param {KalmanGpsFilter2D} kalman
   */
  function computeOptimalGpsEstimate(fixes, kalman) {
    if (!fixes || fixes.length === 0) {
      if (kalman && kalman.variance > 0) {
        return {
          lat: parseFloat(kalman.lat.toFixed(6)),
          lng: parseFloat(kalman.lng.toFixed(6)),
          accuracy: kalman.accuracy,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          sampleCount: 1
        };
      }
      return null;
    }

    if (fixes.length === 1) {
      return {
        lat: parseFloat(fixes[0].coords.latitude.toFixed(6)),
        lng: parseFloat(fixes[0].coords.longitude.toFixed(6)),
        accuracy: Math.round(fixes[0].coords.accuracy),
        altitude: fixes[0].coords.altitude ? Math.round(fixes[0].coords.altitude) : null,
        altitudeAccuracy: fixes[0].coords.altitudeAccuracy ? Math.round(fixes[0].coords.altitudeAccuracy) : null,
        heading: fixes[0].coords.heading || null,
        speed: fixes[0].coords.speed || null,
        sampleCount: 1
      };
    }

    // 1. Sort ascending by accuracy (tightest fixes first)
    const sorted = [...fixes].sort((a, b) => a.coords.accuracy - b.coords.accuracy);
    const bestAcc = sorted[0].coords.accuracy;

    // 2. Outlier rejection:
    // Once tight fixes are present, filter out fixes > 2.5x worse or > 60m
    const maxAllowedAcc = bestAcc <= 15 ? Math.max(bestAcc * 2.2, 25) : Math.max(bestAcc * 2.5, 90);
    let validFixes = sorted.filter(f => f.coords.accuracy <= maxAllowedAcc);
    if (validFixes.length === 0) validFixes = [sorted[0]];

    // 3. Inverse-Variance Weighting (WLS Maximum Likelihood Estimation):
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;

    for (const f of validFixes) {
      const acc = Math.max(f.coords.accuracy, 1);
      const w = 1 / (acc * acc);
      totalWeight += w;
      weightedLat += f.coords.latitude * w;
      weightedLng += f.coords.longitude * w;
    }

    let estLat = weightedLat / totalWeight;
    let estLng = weightedLng / totalWeight;

    // 4. Blend with Kalman state if available to eliminate multipath flutter
    if (kalman && kalman.variance > 0) {
      estLat = (estLat * 0.6) + (kalman.lat * 0.4);
      estLng = (estLng * 0.6) + (kalman.lng * 0.4);
    }

    // Filter spatial outliers: discard any sample that is > 45m from computed centroid
    const filteredSpatial = validFixes.filter(f => {
      const dKm = distanceInKm(f.coords.latitude, f.coords.longitude, estLat, estLng);
      return (dKm * 1000) <= 45;
    });

    let finalLat = estLat;
    let finalLng = estLng;
    let finalSampleCount = validFixes.length;

    if (filteredSpatial.length >= 2 && filteredSpatial.length < validFixes.length) {
      let refinedWeight = 0;
      let refinedLat = 0;
      let refinedLng = 0;
      for (const f of filteredSpatial) {
        const acc = Math.max(f.coords.accuracy, 1);
        const w = 1 / (acc * acc);
        refinedWeight += w;
        refinedLat += f.coords.latitude * w;
        refinedLng += f.coords.longitude * w;
      }
      finalLat = refinedLat / refinedWeight;
      finalLng = refinedLng / refinedWeight;
      finalSampleCount = filteredSpatial.length;
    }

    // Standard error of weighted mean = 1 / sqrt(totalWeight)
    const se = Math.round(1 / Math.sqrt(totalWeight));
    const refinedAcc = Math.max(2, Math.min(Math.round(bestAcc), Math.max(se, Math.round(bestAcc * 0.8))));

    const bestSample = validFixes[0];

    return {
      lat: parseFloat(finalLat.toFixed(6)),
      lng: parseFloat(finalLng.toFixed(6)),
      accuracy: refinedAcc,
      altitude: bestSample.coords.altitude ? Math.round(bestSample.coords.altitude) : null,
      altitudeAccuracy: bestSample.coords.altitudeAccuracy ? Math.round(bestSample.coords.altitudeAccuracy) : null,
      heading: bestSample.coords.heading || null,
      speed: bestSample.coords.speed || null,
      sampleCount: finalSampleCount
    };
  }

  function runHighAccuracyGps() {
    if (!navigator.geolocation) {
      UI.toast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    const btn = document.getElementById('geolocateBtn');
    const addrInput = document.getElementById('reportAddressInput');
    const origBtnHtml = btn ? btn.innerHTML : '';

    let collectedFixes = [];
    let bestFix = null;
    let consecutiveTightFixes = 0;
    let hasNetworkFallbackFired = false;
    let isFallbackFixActive = false;

    activeKalmanFilter.reset();

    function cleanGpsWatch() {
      if (activeGpsWatchId !== null) {
        navigator.geolocation.clearWatch(activeGpsWatchId);
        activeGpsWatchId = null;
      }
      if (activeGpsTimeoutTimer !== null) {
        clearTimeout(activeGpsTimeoutTimer);
        activeGpsTimeoutTimer = null;
      }
      if (activeGpsEarlyExitTimer !== null) {
        clearTimeout(activeGpsEarlyExitTimer);
        activeGpsEarlyExitTimer = null;
      }
      if (activeGpsFallbackTimer !== null) {
        clearTimeout(activeGpsFallbackTimer);
        activeGpsFallbackTimer = null;
      }
      isGpsAcquiring = false;
    }

    // If already acquiring and user clicks again, instantly finalize with current best estimate
    if (isGpsAcquiring && collectedFixes.length > 0) {
      finalizeFix();
      return;
    }

    cleanGpsWatch();
    isGpsAcquiring = true;

    if (btn) {
      btn.classList.add('loading');
      btn.innerHTML = `<span class="spinner-border" style="width:13px;height:13px;display:inline-block;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin .75s linear infinite;margin-right:6px"></span> Acquiring GNSS Satellites…`;
    }
    UI.toast('Connecting to GNSS satellites… Low-signal Kalman smoothing enabled.', 'info');

    function finalizeFix() {
      cleanGpsWatch();
      const estimate = computeOptimalGpsEstimate(collectedFixes, activeKalmanFilter);
      if (!estimate) {
        if (btn) {
          btn.classList.remove('loading');
          btn.innerHTML = origBtnHtml || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg> Auto-Detect High-Accuracy GPS`;
        }
        UI.toast('GPS signal unavailable indoors or shielded. Opening Barangay Selector...', 'warning');
        openSelectBarangay();
        return;
      }

      selectedLocation.lat = estimate.lat;
      selectedLocation.lng = estimate.lng;
      selectedLocation.accuracy = estimate.accuracy;
      selectedLocation.altitude = estimate.altitude;
      selectedLocation.altitudeAccuracy = estimate.altitudeAccuracy;
      selectedLocation.heading = estimate.heading;
      selectedLocation.speed = estimate.speed;
      selectedLocation.hasGps = true;

      updateGpsBadge(estimate.accuracy, estimate.sampleCount, isFallbackFixActive);
      renderLowSignalAssist(estimate.accuracy, isFallbackFixActive);

      if (btn) {
        btn.classList.remove('loading');
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg> Re-detect GPS (±${estimate.accuracy}m)`;
      }

      // Check for cell-tower gross displacement (>12km from Masbate if user has known municipality)
      let alertDisplacement = false;
      if (typeof MasbateLocations !== 'undefined' && MasbateLocations.isWithinMasbate) {
        if (!MasbateLocations.isWithinMasbate(estimate.lat, estimate.lng)) {
          alertDisplacement = true;
        }
      }

      const toastType = estimate.accuracy <= 10 ? 'success' : estimate.accuracy <= 25 ? 'info' : 'warning';
      if (alertDisplacement) {
        UI.toast(`Cell-tower placed you outside Masbate bounds. Please tap "Snap to Barangay" or "Pinpoint on Map".`, 'warning');
      } else {
        const msg = estimate.accuracy <= 20
          ? `GNSS Lock Established (±${estimate.accuracy}m precision across ${estimate.sampleCount} fixes)`
          : `Low GPS Signal Area: Stabilized at ±${estimate.accuracy}m. You can fine-tune on map.`;
        UI.toast(msg, toastType);
      }

      reverseGeocode(estimate.lat, estimate.lng).then(resolvedAddr => {
        const gpsDetail = `(GPS: ${estimate.lat.toFixed(6)}, ${estimate.lng.toFixed(6)}, ±${estimate.accuracy}m)`;
        const finalAddr = resolvedAddr ? `${resolvedAddr} ${gpsDetail}` : `Masbate Incident Location ${gpsDetail}`;
        if (addrInput) {
          addrInput.value = finalAddr;
          selectedLocation.address = finalAddr;
          document.getElementById('err-address')?.classList.add('hidden');
        }
        saveDraft();
        renderPossibleReports();
        syncMapMarker(estimate.lat, estimate.lng, finalAddr);
      });
    }

    function onFixReceived(pos, isFallback = false) {
      if (!pos || !pos.coords) return;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = Math.round(pos.coords.accuracy || 40);

      // Validate bounds within the Philippines (lat 4.5 - 21.5, lng 116.5 - 127.5)
      if (lat < 4.5 || lat > 21.5 || lng < 116.5 || lng > 127.5) return;

      if (isFallback) {
        isFallbackFixActive = true;
      } else {
        // High accuracy fix received: clear fallback state
        isFallbackFixActive = false;
      }

      // Filter multipath teleportation anomaly (>60m jump with impossible speed >35m/s)
      if (collectedFixes.length > 0) {
        const last = collectedFixes[collectedFixes.length - 1];
        const distM = distanceInKm(last.coords.latitude, last.coords.longitude, lat, lng) * 1000;
        const timeDiffSec = Math.max((pos.timestamp - last.timestamp) / 1000, 0.1);
        if (distM > 60 && (distM / timeDiffSec) > 35 && acc > 20) {
          console.warn('[GPS] Discarding multipath jump spike:', distM, 'm');
          return;
        }
      }

      // Update 2D Kalman filter
      const kalmanEst = activeKalmanFilter.update(lat, lng, acc, pos.timestamp);

      collectedFixes.push(pos);
      if (!bestFix || acc < bestFix.coords.accuracy) {
        bestFix = pos;
      }

      const currentEstimate = computeOptimalGpsEstimate(collectedFixes, activeKalmanFilter);
      if (currentEstimate) {
        updateGpsBadge(currentEstimate.accuracy, currentEstimate.sampleCount, isFallbackFixActive);
        renderLowSignalAssist(currentEstimate.accuracy, isFallbackFixActive);

        if (btn) {
          const actionText = currentEstimate.accuracy > 25 ? 'Stabilizing Low Signal' : 'Lock Fix';
          btn.innerHTML = `<span class="spinner-border" style="width:12px;height:12px;display:inline-block;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin .75s linear infinite;margin-right:6px"></span> ${actionText}: ±${currentEstimate.accuracy}m [Tap to finish]`;
        }

        // Fast-path lock: Ultra precision <= 5m with at least 2 samples
        if (currentEstimate.accuracy <= 5) {
          consecutiveTightFixes++;
          if (consecutiveTightFixes >= 2) {
            finalizeFix();
            return;
          }
        }

        // Convergence check: >= 4 samples with accuracy <= 14m
        if (collectedFixes.length >= 4 && currentEstimate.accuracy <= 14) {
          if (!activeGpsEarlyExitTimer) {
            activeGpsEarlyExitTimer = setTimeout(() => {
              if (isGpsAcquiring) finalizeFix();
            }, 1200);
          }
        }
      }
    }

    function triggerNetworkFallback() {
      if (hasNetworkFallbackFired) return;
      hasNetworkFallbackFired = true;
      try {
        navigator.geolocation.getCurrentPosition(
          pos => onFixReceived(pos, true),
          err => console.warn('[GPS Network Fallback] warning:', err.message),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      } catch (_) {}
    }

    // 1. High-accuracy watch to acquire satellite locks
    try {
      activeGpsWatchId = navigator.geolocation.watchPosition(
        pos => onFixReceived(pos, false),
        err => {
          console.warn('[GPS] GNSS watch notice:', err.message);
          // If GNSS has immediate error (e.g. indoors/POSITION_UNAVAILABLE), trigger network fallback immediately
          triggerNetworkFallback();
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    } catch (e) {
      console.warn('[GPS] watchPosition failed:', e);
      triggerNetworkFallback();
    }

    // 2. Fast concurrent cell/Wi-Fi fallback timer (fires after 3.5s if satellites are delayed)
    activeGpsFallbackTimer = setTimeout(() => {
      if (collectedFixes.length === 0) {
        triggerNetworkFallback();
      }
    }, 3500);

    // 3. Hardware kick-start via concurrent high-accuracy single shot
    try {
      navigator.geolocation.getCurrentPosition(
        pos => onFixReceived(pos, false),
        err => console.warn('[GPS] Initial poll warning:', err.message),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } catch (_) {}

    // 4. Master settling timeout: finalize with optimal centroid after 12 seconds
    activeGpsTimeoutTimer = setTimeout(() => {
      if (isGpsAcquiring) {
        finalizeFix();
      }
    }, 12000);
  }

  // GEOLOCATE BUTTON LISTENER
  document.getElementById('geolocateBtn')?.addEventListener('click', runHighAccuracyGps);


  // ── PINPOINT ON MAP MODAL & CONTROLLER ────────────────────────
  let pinpointMap = null;
  let pinpointMarker = null;
  let pinpointCircle = null;
  let pinpointCurrentLat = 12.3713;
  let pinpointCurrentLng = 123.6306;
  let pinpointCurrentAddr = '';
  let streetTileLayer = null;
  let satTileLayer = null;
  let currentTileLayerName = 'street';

  // High-precision SVG teardrop needle marker with ground crosshair
  function getPrecisionPinIcon() {
    if (typeof L === 'undefined') return null;
    return L.divIcon({
      className: 'map-precision-pin-div',
      html: `
        <div class="map-precision-pin-wrap" id="mapPrecisionPinGraphic">
          <div class="map-pin-crosshair-target"></div>
          <svg class="map-precision-pin-svg" viewBox="0 0 36 44" width="36" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.38"/>
              </filter>
              <linearGradient id="pinGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ef4444"/>
                <stop offset="100%" stop-color="#b91c1c"/>
              </linearGradient>
            </defs>
            <path d="M18 43.5 C18 43.5 34 26 34 16 C34 7.16 26.84 0 18 0 C9.16 0 2 7.16 2 16 C2 26 18 43.5 18 43.5Z" fill="url(#pinGrad)" filter="url(#pinShadow)" stroke="#ffffff" stroke-width="1.6"/>
            <circle cx="18" cy="16" r="6.5" fill="#ffffff"/>
            <circle cx="18" cy="16" r="3.2" fill="#ef4444"/>
          </svg>
        </div>
      `,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
      popupAnchor: [0, -44]
    });
  }

  function openPinpointMap() {
    const overlay = document.getElementById('pinpointMapModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');

    const lat = selectedLocation.lat || 12.3713;
    const lng = selectedLocation.lng || 123.6306;
    pinpointCurrentLat = parseFloat(lat.toFixed(6));
    pinpointCurrentLng = parseFloat(lng.toFixed(6));

    const isLowSignal = (selectedLocation.accuracy && selectedLocation.accuracy > 25);
    if (isLowSignal) {
      currentTileLayerName = 'satellite';
    }

    setTimeout(() => {
      initOrUpdatePinpointMap(pinpointCurrentLat, pinpointCurrentLng);
      if (isLowSignal) {
        setMapTileLayer('satellite');
        let banner = document.getElementById('mapLowSignalNotice');
        if (!banner) {
          const mapContainer = document.getElementById('pinpointMapContainer');
          if (mapContainer && mapContainer.parentNode) {
            banner = document.createElement('div');
            banner.id = 'mapLowSignalNotice';
            banner.className = 'map-low-signal-banner';
            banner.innerHTML = `<span class="pulse-dot"></span><span>Low GPS Signal Mode: High-Resolution Satellite View active. Drag the red marker directly over your house or pole.</span>`;
            mapContainer.parentNode.insertBefore(banner, mapContainer);
          }
        } else {
          banner.classList.remove('hidden');
        }
      } else {
        document.getElementById('mapLowSignalNotice')?.classList.add('hidden');
      }
    }, 150);
  }

  function closePinpointMap() {
    document.getElementById('pinpointMapModalOverlay')?.classList.add('hidden');
    document.getElementById('mapLowSignalNotice')?.classList.add('hidden');
  }

  function setMapTileLayer(type) {
    if (!pinpointMap) return;
    currentTileLayerName = type;
    if (type === 'satellite') {
      if (streetTileLayer && pinpointMap.hasLayer(streetTileLayer)) pinpointMap.removeLayer(streetTileLayer);
      if (satTileLayer && !pinpointMap.hasLayer(satTileLayer)) satTileLayer.addTo(pinpointMap);
    } else {
      if (satTileLayer && pinpointMap.hasLayer(satTileLayer)) pinpointMap.removeLayer(satTileLayer);
      if (streetTileLayer && !pinpointMap.hasLayer(streetTileLayer)) streetTileLayer.addTo(pinpointMap);
    }

    document.querySelectorAll('#btnLayerStreet').forEach(b => {
      if (type === 'street') b.classList.add('active');
      else b.classList.remove('active');
    });
    document.querySelectorAll('#btnLayerSatellite').forEach(b => {
      if (type === 'satellite') b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  function nudgePin(deltaLat, deltaLng) {
    if (!pinpointMarker || !pinpointMap) return;
    const current = pinpointMarker.getLatLng();
    const newLat = parseFloat((current.lat + deltaLat).toFixed(6));
    const newLng = parseFloat((current.lng + deltaLng).toFixed(6));
    pinpointMarker.setLatLng([newLat, newLng]);
    if (pinpointCircle) pinpointCircle.setLatLng([newLat, newLng]);

    // Keep pin comfortably inside map viewport
    const bounds = pinpointMap.getBounds();
    if (!bounds.pad(-0.15).contains([newLat, newLng])) {
      pinpointMap.panTo([newLat, newLng], { animate: true, duration: 0.2 });
    }
    onPinMoved(newLat, newLng, true);
  }

  function initOrUpdatePinpointMap(lat, lng) {
    const container = document.getElementById('pinpointMapContainer');
    if (!container) return;

    if (typeof L === 'undefined') {
      container.innerHTML = `<div style="padding:40px;text-align:center;color:#94a3b8;font-size:13px;">Leaflet map is offline. You can manually enter your address or select your Barangay using "Select Barangay & Purok".</div>`;
      return;
    }

    const isCoarse = (selectedLocation.accuracy && selectedLocation.accuracy > 25);
    const circleRadius = isCoarse ? Math.min(selectedLocation.accuracy, 120) : Math.min(selectedLocation.accuracy || 12, 25);
    const circleColor = isCoarse ? '#f59e0b' : '#0284c7';
    const circleFill = isCoarse ? '#fbbf24' : '#38bdf8';
    const circleDash = isCoarse ? '6, 8' : null;

    if (!pinpointMap) {
      // High-resolution default zoom 18 for street/pole level accuracy
      pinpointMap = L.map('pinpointMapContainer', {
        center: [lat, lng],
        zoom: 18,
        maxZoom: 20,
        zoomControl: true
      });

      streetTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 20
      });

      satTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 20
      });

      if (currentTileLayerName === 'satellite') {
        satTileLayer.addTo(pinpointMap);
      } else {
        streetTileLayer.addTo(pinpointMap);
      }

      pinpointMarker = L.marker([lat, lng], {
        draggable: true,
        icon: getPrecisionPinIcon()
      }).addTo(pinpointMap);

      pinpointCircle = L.circle([lat, lng], {
        radius: circleRadius,
        color: circleColor,
        fillColor: circleFill,
        fillOpacity: 0.16,
        dashArray: circleDash,
        weight: 1.6
      }).addTo(pinpointMap);

      pinpointMarker.on('dragstart', function () {
        const el = document.getElementById('mapPrecisionPinGraphic');
        if (el) el.classList.add('dragging');
      });

      pinpointMarker.on('dragend', function (e) {
        const el = document.getElementById('mapPrecisionPinGraphic');
        if (el) el.classList.remove('dragging');
        const pos = e.target.getLatLng();
        onPinMoved(pos.lat, pos.lng);
      });

      pinpointMap.on('click', function (e) {
        pinpointMarker.setLatLng(e.latlng);
        onPinMoved(e.latlng.lat, e.latlng.lng);
      });
    } else {
      pinpointMap.invalidateSize();
      pinpointMap.setView([lat, lng], 18);
      if (pinpointMarker) pinpointMarker.setLatLng([lat, lng]);
      if (pinpointCircle) {
        pinpointCircle.setLatLng([lat, lng]);
        pinpointCircle.setRadius(circleRadius);
        pinpointCircle.setStyle({
          color: circleColor,
          fillColor: circleFill,
          dashArray: circleDash
        });
      }
    }

    onPinMoved(lat, lng);
  }

  function onPinMoved(lat, lng, isNudged = false) {
    pinpointCurrentLat = parseFloat(lat.toFixed(6));
    pinpointCurrentLng = parseFloat(lng.toFixed(6));
    if (pinpointCircle) pinpointCircle.setLatLng([pinpointCurrentLat, pinpointCurrentLng]);

    const coordsDisplay = document.getElementById('mapCoordsPreview');
    if (coordsDisplay) {
      coordsDisplay.textContent = `Lat: ${pinpointCurrentLat.toFixed(6)}, Lng: ${pinpointCurrentLng.toFixed(6)}`;
    }

    const badgeText = document.getElementById('mapPrecisionText');
    if (badgeText) {
      if (isNudged) {
        badgeText.textContent = 'Micro-Nudged (±1.5m)';
      } else if (selectedLocation.accuracy && selectedLocation.accuracy <= 10) {
        badgeText.textContent = `High Precision (±${selectedLocation.accuracy}m)`;
      } else {
        badgeText.textContent = 'Pinpoint Precision (±1.5m)';
      }
    }

    const addrDisplay = document.getElementById('mapAddressPreview');
    if (addrDisplay) addrDisplay.textContent = 'Resolving exact address…';

    reverseGeocode(pinpointCurrentLat, pinpointCurrentLng).then(addr => {
      pinpointCurrentAddr = addr;
      if (addrDisplay) {
        addrDisplay.textContent = addr || `Masbate Location (${pinpointCurrentLat.toFixed(5)}, ${pinpointCurrentLng.toFixed(5)})`;
      }
    });
  }

  function syncMapMarker(lat, lng, addr) {
    if (pinpointMap && pinpointMarker) {
      pinpointMarker.setLatLng([lat, lng]);
      pinpointMap.setView([lat, lng], 18);
      if (pinpointCircle) {
        pinpointCircle.setLatLng([lat, lng]);
        pinpointCircle.setRadius(Math.min(selectedLocation.accuracy || 15, 25));
      }
    }
  }

  // QUICK JUMP IN PINPOINT MAP
  document.querySelectorAll('.quick-jump-chips [data-jump]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const jumpKey = btn.dataset.jump;
      let targetCoords = { lat: 12.371300, lng: 123.630600 };
      if (typeof MasbateLocations !== 'undefined') {
        if (jumpKey === 'Masbate City Hall') targetCoords = { lat: 12.371300, lng: 123.630600 };
        else if (jumpKey === 'Espinosa') targetCoords = MasbateLocations.getCoordinates('Masbate City', 'Espinosa');
        else if (jumpKey === 'Nursery') targetCoords = MasbateLocations.getCoordinates('Masbate City', 'Nursery');
        else if (jumpKey === 'Tugbo') targetCoords = MasbateLocations.getCoordinates('Masbate City', 'Tugbo');
        else if (jumpKey === 'Airport') targetCoords = MasbateLocations.getCoordinates('Masbate City', 'Ibingay');
        else if (jumpKey === 'Mobo') targetCoords = MasbateLocations.getCoordinates('Mobo', 'Poblacion');
      }
      if (pinpointMap) {
        pinpointMap.setView([targetCoords.lat, targetCoords.lng], 18);
        if (pinpointMarker) pinpointMarker.setLatLng([targetCoords.lat, targetCoords.lng]);
        onPinMoved(targetCoords.lat, targetCoords.lng);
      }
    });
  });

  // MAP CONTROLS & MICRO-NUDGE LISTENERS
  document.getElementById('pinpointMapBtn')?.addEventListener('click', openPinpointMap);
  document.getElementById('btnClosePinpointMap')?.addEventListener('click', closePinpointMap);
  document.getElementById('btnCancelPinpointMap')?.addEventListener('click', closePinpointMap);
  document.getElementById('pinpointMapModalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'pinpointMapModalOverlay') closePinpointMap();
  });

  // Tile layer switchers
  document.querySelectorAll('#btnLayerStreet').forEach(btn => {
    btn.addEventListener('click', () => setMapTileLayer('street'));
  });
  document.querySelectorAll('#btnLayerSatellite').forEach(btn => {
    btn.addEventListener('click', () => setMapTileLayer('satellite'));
  });

  // Micro-nudge D-pad buttons (1.5m increments = ~0.000015 deg)
  document.querySelectorAll('#btnNudgeUp').forEach(btn => {
    btn.addEventListener('click', () => nudgePin(0.000015, 0));
  });
  document.querySelectorAll('#btnNudgeDown').forEach(btn => {
    btn.addEventListener('click', () => nudgePin(-0.000015, 0));
  });
  document.querySelectorAll('#btnNudgeLeft').forEach(btn => {
    btn.addEventListener('click', () => nudgePin(0, -0.000015));
  });
  document.querySelectorAll('#btnNudgeRight').forEach(btn => {
    btn.addEventListener('click', () => nudgePin(0, 0.000015));
  });

  // Keyboard navigation when map modal is open (Arrow keys for 1.5m nudge)
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('pinpointMapModalOverlay');
    if (!modal || modal.classList.contains('hidden')) return;
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      nudgePin(0.000015, 0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nudgePin(-0.000015, 0);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nudgePin(0, -0.000015);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nudgePin(0, 0.000015);
    }
  });

  document.getElementById('btnMapLocateMe')?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      UI.toast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    const locateBtn = document.getElementById('btnMapLocateMe');
    const origHtml = locateBtn ? locateBtn.innerHTML : '';
    if (locateBtn) {
      locateBtn.disabled = true;
      locateBtn.innerHTML = `<span class="spinner-border" style="width:12px;height:12px;display:inline-block;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin .75s linear infinite"></span> Acquiring…`;
    }
    UI.toast('Locking high-accuracy GPS on map… Hold still for satellite fix.', 'info');

    let mapWatchId = null;
    let bestAcc = 9999;
    const locateTimer = setTimeout(() => {
      if (mapWatchId !== null) navigator.geolocation.clearWatch(mapWatchId);
      if (locateBtn) {
        locateBtn.disabled = false;
        locateBtn.innerHTML = origHtml;
      }
    }, 10000);

    try {
      mapWatchId = navigator.geolocation.watchPosition(
        pos => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const acc = Math.round(pos.coords.accuracy || 10);

          if (acc <= bestAcc || acc <= 15) {
            bestAcc = acc;
            if (pinpointMap) {
              pinpointMap.setView([lat, lng], Math.max(pinpointMap.getZoom(), 18));
              if (pinpointMarker) pinpointMarker.setLatLng([lat, lng]);
              if (pinpointCircle) {
                pinpointCircle.setLatLng([lat, lng]);
                pinpointCircle.setRadius(acc);
                pinpointCircle.setStyle({
                  color: acc <= 8 ? '#10b981' : acc <= 25 ? '#38bdf8' : '#f59e0b',
                  fillColor: acc <= 8 ? '#10b981' : acc <= 25 ? '#38bdf8' : '#f59e0b',
                  fillOpacity: 0.16
                });
              }
              onPinMoved(lat, lng);
            }
            if (acc <= 6) {
              clearTimeout(locateTimer);
              if (mapWatchId !== null) navigator.geolocation.clearWatch(mapWatchId);
              if (locateBtn) {
                locateBtn.disabled = false;
                locateBtn.innerHTML = origHtml;
              }
            }
          }
        },
        err => console.warn('[Map GPS] watch warning:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (e) {
      if (locateBtn) {
        locateBtn.disabled = false;
        locateBtn.innerHTML = origHtml;
      }
    }
  });

  document.getElementById('btnApplyPinpointMap')?.addEventListener('click', () => {
    selectedLocation.lat = parseFloat(pinpointCurrentLat.toFixed(6));
    selectedLocation.lng = parseFloat(pinpointCurrentLng.toFixed(6));
    selectedLocation.hasGps = true;
    selectedLocation.accuracy = 2; // High-precision verified pin on aerial imagery with micro-nudging

    updateGpsBadge(2);
    hideLowSignalAssist();
    document.getElementById('mapLowSignalNotice')?.classList.add('hidden');

    const gpsStr = `(GPS: ${pinpointCurrentLat.toFixed(6)}, ${pinpointCurrentLng.toFixed(6)})`;
    const finalAddress = pinpointCurrentAddr ? `${pinpointCurrentAddr} ${gpsStr}` : `Masbate Location ${gpsStr}`;

    const addrInput = document.getElementById('reportAddressInput');
    if (addrInput) {
      addrInput.value = finalAddress;
      selectedLocation.address = finalAddress;
      document.getElementById('err-address')?.classList.add('hidden');
    }

    saveDraft();
    renderPossibleReports();
    closePinpointMap();
    UI.toast('Precision location pinned successfully!', 'success');
  });

  // ── SELECT BARANGAY & PUROK MODAL & CONTROLLER ───────────────
  function openSelectBarangay() {
    const overlay = document.getElementById('selectBarangayModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    initPickerDropdowns();
  }

  function closeSelectBarangay() {
    document.getElementById('selectBarangayModalOverlay')?.classList.add('hidden');
  }

  function initPickerDropdowns() {
    const mMuni = document.getElementById('pickerMunicipality');
    const mBrgy = document.getElementById('pickerBarangay');
    const mPurok = document.getElementById('pickerPurok');
    const mPreview = document.getElementById('pickerPreviewText');
    const mStreet = document.getElementById('pickerStreetDetail');

    if (!mMuni || !mBrgy || !mPurok || typeof MasbateLocations === 'undefined') return;

    // Populate Municipalities
    if (mMuni.options.length === 0) {
      Object.keys(MasbateLocations.DATA).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        mMuni.appendChild(opt);
      });
      mMuni.value = 'Masbate City';
    }

    function populateBrgy() {
      const muni = mMuni.value;
      const brgys = MasbateLocations.DATA[muni] || [];
      mBrgy.innerHTML = '';
      brgys.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b.startsWith('Brgy.') ? b : `Brgy. ${b}`;
        mBrgy.appendChild(opt);
      });
      populatePurok();
    }

    function populatePurok() {
      const muni = mMuni.value;
      const brgy = mBrgy.value;
      const count = MasbateLocations.getPurokCount(muni, brgy);
      mPurok.innerHTML = '';
      for (let i = 1; i <= count; i++) {
        const opt = document.createElement('option');
        opt.value = `Purok ${i}`;
        opt.textContent = `Purok ${i}`;
        mPurok.appendChild(opt);
      }
      updatePreview();
    }

    function updatePreview() {
      if (!mPreview) return;
      const muni = mMuni.value;
      const brgy = mBrgy.value;
      const purok = mPurok.value;
      const street = (mStreet && mStreet.value.trim()) ? `${mStreet.value.trim()}, ` : '';
      mPreview.textContent = `${street}${MasbateLocations.formatPurokAddress(purok, brgy, muni)}`;
    }

    mMuni.onchange = populateBrgy;
    mBrgy.onchange = populatePurok;
    mPurok.onchange = updatePreview;
    if (mStreet) mStreet.oninput = updatePreview;

    if (mBrgy.options.length === 0) {
      populateBrgy();
    } else {
      updatePreview();
    }
  }

  document.getElementById('selectBarangayBtn')?.addEventListener('click', openSelectBarangay);
  document.getElementById('btnCloseSelectBarangay')?.addEventListener('click', closeSelectBarangay);
  document.getElementById('btnCancelSelectBarangay')?.addEventListener('click', closeSelectBarangay);
  document.getElementById('selectBarangayModalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'selectBarangayModalOverlay') closeSelectBarangay();
  });

  document.getElementById('btnApplySelectBarangay')?.addEventListener('click', () => {
    const mMuni = document.getElementById('pickerMunicipality');
    const mBrgy = document.getElementById('pickerBarangay');
    const mPurok = document.getElementById('pickerPurok');
    const mStreet = document.getElementById('pickerStreetDetail');

    if (!mMuni || !mBrgy || !mPurok || typeof MasbateLocations === 'undefined') {
      closeSelectBarangay();
      return;
    }

    const muni = mMuni.value;
    const brgy = mBrgy.value;
    const purok = mPurok.value;
    const street = (mStreet && mStreet.value.trim()) ? `${mStreet.value.trim()}, ` : '';
    const formatted = `${street}${MasbateLocations.formatPurokAddress(purok, brgy, muni)}`;

    // Set coordinates to known barangay center
    const coords = MasbateLocations.getCoordinates(muni, brgy);
    selectedLocation.lat = coords.lat;
    selectedLocation.lng = coords.lng;
    selectedLocation.purok = purok;
    selectedLocation.address = formatted;
    selectedLocation.hasGps = true;
    selectedLocation.accuracy = 15;

    updateGpsBadge(15);
    hideLowSignalAssist();

    const addrInput = document.getElementById('reportAddressInput');
    if (addrInput) {
      addrInput.value = formatted;
      document.getElementById('err-address')?.classList.add('hidden');
    }

    saveDraft();
    renderPossibleReports();
    syncMapMarker(coords.lat, coords.lng, formatted);
    closeSelectBarangay();
    UI.toast(`Location set to ${brgy}, ${muni}`, 'success');
  });

  // FORM SUBMIT
  document.getElementById('reportForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const catSelect = document.getElementById('categorySelect');
    const cat = (catSelect && catSelect.value) ? catSelect.value : '';
    const agency = document.getElementById('agencySelect')?.value || 'MASELCO';
    const desc = document.getElementById('description')?.value.trim() || '';
    const severity = document.getElementById('reportSeverityInput')?.value || (document.querySelector('input[name="severity"]:checked') || {}).value || 'Medium';
    const reporter = document.getElementById('reporterName')?.value.trim() || 'Anonymous';
    const addr = document.getElementById('reportAddressInput')?.value.trim() || selectedLocation.address || '';
    const currentUser = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;

    let hasError = false;
    if (!cat) {
      document.getElementById('err-category')?.classList.remove('hidden');
      if (!hasError) catSelect?.focus();
      hasError = true;
    } else {
      document.getElementById('err-category')?.classList.add('hidden');
    }

    if (!addr) {
      document.getElementById('err-address')?.classList.remove('hidden');
      if (!hasError) document.getElementById('reportAddressInput')?.focus();
      hasError = true;
    } else {
      document.getElementById('err-address')?.classList.add('hidden');
    }

    if (!desc) {
      document.getElementById('err-description')?.classList.remove('hidden');
      if (!hasError) document.getElementById('description')?.focus();
      hasError = true;
    } else {
      document.getElementById('err-description')?.classList.add('hidden');
    }

    if (hasError) {
      UI.toast('Please fill in all required fields.', 'error');
      return;
    }

    selectedLocation.address = addr;

    const report = Reports.create({
      category: cat,
      agency,
      description: desc,
      severity,
      reporter,
      userId: currentUser ? currentUser.id : null,
      location: {
        address: addr,
        purok: addr,
        lat: selectedLocation.lat || 12.3713,
        lng: selectedLocation.lng || 123.6304
      }
    });

    // Notify other tabs and windows (especially admin portal) about the new report
    try {
      // Dispatch custom event for same-window listeners
      window.dispatchEvent(new CustomEvent('bantay_report_submitted', { detail: { report } }));
      
      // Use BroadcastChannel for cross-tab communication
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('bantay_reports_channel');
          bc.postMessage({ type: 'report_submitted', report: report.id, timestamp: Date.now() });
          bc.close();
        } catch (e) {}
      }
    } catch (e) {}

    resetForm();
    UI.showSuccess();

    UI.toast(`Report #${report.id} submitted successfully!`, 'success');
  });

  // ════ SUCCESS OVERLAY ══════════════════════════════════════
  document.getElementById('successNewReport')?.addEventListener('click', () => {
    UI.hideSuccess();
    showView('report');
    resetForm();
  });
  document.getElementById('successGoSettings')?.addEventListener('click', () => {
    UI.hideSuccess();
    showView('profile');
  });

  // Keyboard: close modal / overlay on Esc
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      UI.hideSuccess();
      closeAuthModal();
      closePinpointMap();
      closeSelectBarangay();
    }
  });

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
    window.location.href = `auth.html${defaultTab === 'register' ? '?mode=register' : ''}`;
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

      UI.toast(`SMS verification code sent to ${validation.intlFormatted}. Check your phone's SMS inbox.`, 'info');
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
        setTimeout(() => { window.location.href = '../admin/index.html'; }, 600);
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
    UI.toast(`SMS verification code sent to ${stageRes.pending.phoneData.intlFormatted}. Check your phone's SMS inbox.`, 'info');
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

  // ═══════════════════════════════════════════════════════════
  // PROFILE & SETTINGS CONTROLLER
  // ═══════════════════════════════════════════════════════════
  function renderProfileView() {
    if (typeof Auth === 'undefined') return;
    const user = Auth.getCurrentUser();
    if (!user) return;

    const initials = (user.name || 'Resident')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('') || 'R';

    const avatarLarge = document.getElementById('profileAvatarLarge');
    if (avatarLarge) avatarLarge.textContent = '👤';

    const nameEl = document.getElementById('profileDisplayName');
    if (nameEl) nameEl.textContent = user.mobile ? `Resident (${user.mobile})` : 'Resident Account';

    const roleEl = document.getElementById('profileRoleBadge');
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Barangay Official' : 'Citizen Account';

    const phoneValEl = document.getElementById('profilePhoneVal');
    const currPhoneDisp = document.getElementById('currentPhoneDisplay');
    if (user.mobile) {
      const phVal = Auth.validatePhilippineMobile(user.mobile);
      if (phoneValEl) phoneValEl.textContent = `🇵🇭 ${phVal.intlFormatted || user.mobile}`;
      if (currPhoneDisp) currPhoneDisp.value = phVal.isValid ? `${phVal.standard} (${phVal.intlFormatted})` : user.mobile;
    } else {
      if (phoneValEl) phoneValEl.textContent = 'Not Provided';
      if (currPhoneDisp) currPhoneDisp.value = 'Not Provided';
    }

    const purokEl = document.getElementById('profilePurokBadge');
    if (purokEl) purokEl.remove();

    const userIdEl = document.getElementById('profileUserId');
    if (userIdEl) userIdEl.textContent = user.id || 'usr-001';

    const memberSinceEl = document.getElementById('profileMemberSince');
    if (memberSinceEl) {
      if (user.createdAt) {
        try {
          const d = new Date(user.createdAt);
          memberSinceEl.textContent = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } catch {
          memberSinceEl.textContent = 'September 2026';
        }
      } else {
        memberSinceEl.textContent = 'September 2026';
      }
    }

    // Compute User Report Statistics
    try {
      const allReports = Reports.getAll() || [];
      const userDigits = (user.mobile || '').replace(/\D/g, '');
      const userReports = allReports.filter(r => {
        const rDigits = (r.reporter_mobile || '').replace(/\D/g, '');
        return (userDigits && rDigits && (rDigits.endsWith(userDigits) || userDigits.endsWith(rDigits)));
      });

      const totalCount = userReports.length;
      const resolvedCount = userReports.filter(r => (r.status || '').toLowerCase() === 'resolved').length;
      const activeCount = totalCount - resolvedCount;

      const pstatTotal = document.getElementById('pstatTotal');
      const pstatResolved = document.getElementById('pstatResolved');
      const pstatActive = document.getElementById('pstatActive');

      if (pstatTotal) pstatTotal.textContent = totalCount;
      if (pstatResolved) pstatResolved.textContent = resolvedCount;
      if (pstatActive) pstatActive.textContent = activeCount;
    } catch (e) {
      console.warn('Could not calculate user report stats:', e);
    }

    // Pre-fill Edit Form (Email only)
    const editEmail = document.getElementById('editEmail');
    if (editEmail) editEmail.value = user.email || '';

    // Load Settings / Toggles
    const settings = Auth.getSettings();
    const prefEmergency = document.getElementById('prefSmsEmergency');
    if (prefEmergency) prefEmergency.checked = settings.smsEmergencyAlerts !== false;

    const prefStatus = document.getElementById('prefSmsStatus');
    if (prefStatus) prefStatus.checked = settings.smsStatusUpdates !== false;

    const prefSound = document.getElementById('prefSoundEffects');
    if (prefSound) prefSound.checked = settings.soundEffects !== false;

    const prefContrast = document.getElementById('prefHighContrastMap');
    if (prefContrast) prefContrast.checked = !!settings.highContrastMap;
  }

  // Edit Account Form Submit (Email / Preferences)
  const editProfileForm = document.getElementById('editProfileForm');
  const errEditProfile = document.getElementById('err-edit-profile');

  editProfileForm?.addEventListener('submit', e => {
    e.preventDefault();
    const emailInput = document.getElementById('editEmail');
    const emailVal = emailInput ? emailInput.value.trim() : '';

    if (errEditProfile) errEditProfile.classList.add('hidden');

    const res = Auth.updateProfile({ email: emailVal });
    if (res.success) {
      UI.toast('Account details updated successfully!', 'success');
      renderUserProfile();
      renderProfileView();
    } else {
      if (errEditProfile) {
        errEditProfile.textContent = res.error || 'Failed to update account details.';
        errEditProfile.classList.remove('hidden');
      }
    }
  });

  // Change Password Form Submit
  const changePasswordForm = document.getElementById('changePasswordForm');
  const errChangePass = document.getElementById('err-change-pass');
  const succChangePass = document.getElementById('succ-change-pass');

  changePasswordForm?.addEventListener('submit', e => {
    e.preventDefault();
    const curr = document.getElementById('currPassword');
    const next = document.getElementById('newPassword');
    const confirm = document.getElementById('confirmNewPassword');

    const currVal = curr ? curr.value : '';
    const nextVal = next ? next.value : '';
    const confirmVal = confirm ? confirm.value : '';

    if (errChangePass) errChangePass.classList.add('hidden');
    if (succChangePass) succChangePass.classList.add('hidden');

    if (!currVal) {
      if (errChangePass) {
        errChangePass.textContent = 'Please enter your current password.';
        errChangePass.classList.remove('hidden');
      }
      curr?.focus();
      return;
    }

    if (!nextVal || nextVal.length < 6) {
      if (errChangePass) {
        errChangePass.textContent = 'New password must be at least 6 characters long.';
        errChangePass.classList.remove('hidden');
      }
      next?.focus();
      return;
    }

    if (nextVal !== confirmVal) {
      if (errChangePass) {
        errChangePass.textContent = 'New passwords do not match. Please re-enter.';
        errChangePass.classList.remove('hidden');
      }
      confirm?.focus();
      return;
    }

    const res = Auth.changePassword(currVal, nextVal);
    if (res.success) {
      if (succChangePass) {
        succChangePass.textContent = 'Password updated successfully! Use your new password on next login.';
        succChangePass.classList.remove('hidden');
      }
      changePasswordForm.reset();
      UI.toast('Password updated successfully!', 'success');
    } else {
      if (errChangePass) {
        errChangePass.textContent = res.error || 'Incorrect current password.';
        errChangePass.classList.remove('hidden');
      }
    }
  });

  // Toggle Visibility buttons for Change Password & Change Phone
  [
    { btnId: 'btnToggleCurrPass', inputId: 'currPassword' },
    { btnId: 'btnToggleNewPass', inputId: 'newPassword' },
    { btnId: 'btnToggleConfirmPass', inputId: 'confirmNewPassword' },
    { btnId: 'btnToggleConfirmPhonePass', inputId: 'confirmPhonePassword' }
  ].forEach(({ btnId, inputId }) => {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (btn && input) {
      btn.addEventListener('click', () => {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.innerHTML = isPass
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      });
    }
  });

  // Jump button to Change Phone card
  document.getElementById('btnJumpChangePhone')?.addEventListener('click', () => {
    const card = document.getElementById('changePhoneCard');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const newPhoneInput = document.getElementById('newPhoneInput');
      setTimeout(() => newPhoneInput?.focus(), 350);
    }
  });

  // Real-time input handling for Change Phone Number
  const newPhoneInput = document.getElementById('newPhoneInput');
  const newPhoneBox = document.getElementById('newPhoneBox');
  const newPhoneDigitCount = document.getElementById('newPhoneDigitCount');
  const errChangePhone = document.getElementById('err-change-phone');
  const succChangePhone = document.getElementById('succ-change-phone');

  newPhoneInput?.addEventListener('input', () => {
    if (errChangePhone) errChangePhone.classList.add('hidden');
    if (succChangePhone) succChangePhone.classList.add('hidden');
    const raw = newPhoneInput.value;
    const digits = raw.replace(/\D/g, '');
    if (newPhoneDigitCount) {
      newPhoneDigitCount.textContent = digits.length > 0 ? `${digits.length} digits` : '';
    }
    const val = Auth.validatePhilippineMobile(raw);
    if (newPhoneBox) {
      if (val.isValid) {
        newPhoneBox.classList.remove('input-invalid');
        newPhoneBox.classList.add('input-valid');
      } else if (digits.length >= 10) {
        newPhoneBox.classList.add('input-invalid');
        newPhoneBox.classList.remove('input-valid');
      } else {
        newPhoneBox.classList.remove('input-invalid', 'input-valid');
      }
    }
  });

  // Change Phone Number Form Submit
  const changePhoneForm = document.getElementById('changePhoneForm');
  const confirmPhonePassword = document.getElementById('confirmPhonePassword');

  changePhoneForm?.addEventListener('submit', e => {
    e.preventDefault();
    if (errChangePhone) errChangePhone.classList.add('hidden');
    if (succChangePhone) succChangePhone.classList.add('hidden');

    const newPhoneVal = newPhoneInput ? newPhoneInput.value.trim() : '';
    const passVal = confirmPhonePassword ? confirmPhonePassword.value : '';

    if (!newPhoneVal) {
      if (errChangePhone) {
        errChangePhone.textContent = 'Please enter your new Philippine mobile number.';
        errChangePhone.classList.remove('hidden');
      }
      newPhoneInput?.focus();
      return;
    }

    if (!passVal) {
      if (errChangePhone) {
        errChangePhone.textContent = 'Please enter your current password to authorize this phone number change.';
        errChangePhone.classList.remove('hidden');
      }
      confirmPhonePassword?.focus();
      return;
    }

    const res = Auth.changePhoneNumber(newPhoneVal, passVal);
    if (res.success) {
      if (succChangePhone) {
        succChangePhone.textContent = `Mobile number changed successfully to ${res.formatted}! You can now use this number for future logins and SMS alerts.`;
        succChangePhone.classList.remove('hidden');
      }
      changePhoneForm.reset();
      if (newPhoneBox) newPhoneBox.classList.remove('input-valid', 'input-invalid');
      if (newPhoneDigitCount) newPhoneDigitCount.textContent = '';
      UI.toast('Mobile number updated successfully!', 'success');
      renderUserProfile();
      renderProfileView();
    } else {
      if (errChangePhone) {
        errChangePhone.textContent = res.error || 'Failed to update mobile number.';
        errChangePhone.classList.remove('hidden');
      }
    }
  });

  // Settings Switches Change Listeners
  ['prefSmsEmergency', 'prefSmsStatus', 'prefSoundEffects', 'prefHighContrastMap'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        const newSettings = {
          smsEmergencyAlerts: !!document.getElementById('prefSmsEmergency')?.checked,
          smsStatusUpdates: !!document.getElementById('prefSmsStatus')?.checked,
          soundEffects: !!document.getElementById('prefSoundEffects')?.checked,
          highContrastMap: !!document.getElementById('prefHighContrastMap')?.checked
        };
        Auth.updateSettings(newSettings);
        UI.toast('Preferences saved.', 'info');
      });
    }
  });

  // Listen for global auth changes (login/logout/update)
  if (typeof Auth !== 'undefined' && Auth.onAuthChange) {
    Auth.onAuthChange(() => {
      renderUserProfile();
      const user = Auth.getCurrentUser();
      const reporterInput = document.getElementById('reporterName');
      if (reporterInput) {
        reporterInput.value = user ? user.name : '';
      }
    });
  }

  // ── PWA & OFFLINE CONTROLLER ─────────────────────────────
  function initPWA() {
    // A. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
      navigator.serviceWorker.register('sw.js')
        .then(reg => {
          console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  if (typeof UI !== 'undefined') UI.toast('BantayBarangay updated in the background.', 'info');
                }
              });
            }
          });
        })
        .catch(err => {
          console.warn('[PWA] ServiceWorker registration skipped/failed:', err);
        });
    }

    // B. Install Prompt Handling
    let deferredPrompt = null;
    const pwaBanner = document.getElementById('pwaInstallBanner');
    const pwaInstallBtn = document.getElementById('pwaInstallBtn');
    const pwaDismissBtn = document.getElementById('pwaDismissBtn');
    const btnSettingsInstallPwa = document.getElementById('btnSettingsInstallPwa');
    const pwaModeBadge = document.getElementById('pwaModeBadge');

    const isStandalone = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || 
                         (typeof navigator !== 'undefined' && navigator.standalone === true);
    
    if (isStandalone) {
      if (pwaModeBadge) {
        pwaModeBadge.textContent = 'Installed (PWA)';
        pwaModeBadge.classList.add('installed');
      }
      if (btnSettingsInstallPwa) {
        btnSettingsInstallPwa.innerHTML = '<span>✓ App Installed</span>';
        btnSettingsInstallPwa.disabled = true;
        btnSettingsInstallPwa.style.opacity = '0.6';
        btnSettingsInstallPwa.style.cursor = 'default';
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        deferredPrompt = e;
        window.deferredPwaPrompt = e;

        if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('bantay_pwa_banner_dismissed') && !isStandalone) {
          pwaBanner?.classList.remove('hidden');
        }
        if (btnSettingsInstallPwa && !isStandalone) {
          btnSettingsInstallPwa.style.display = 'flex';
        }
      });

      function triggerInstallFlow() {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult && choiceResult.outcome === 'accepted') {
              if (typeof UI !== 'undefined') UI.toast('Installing BantayBarangay to home screen…', 'success');
            }
            deferredPrompt = null;
            window.deferredPwaPrompt = null;
            pwaBanner?.classList.add('hidden');
          });
        } else {
          if (typeof UI !== 'undefined') UI.toast('To install: tap browser menu (⋮ or Share) and select "Add to Home screen".', 'info');
        }
      }

      pwaInstallBtn?.addEventListener('click', triggerInstallFlow);
      btnSettingsInstallPwa?.addEventListener('click', triggerInstallFlow);

      pwaDismissBtn?.addEventListener('click', () => {
        pwaBanner?.classList.add('hidden');
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('bantay_pwa_banner_dismissed', 'true');
      });

      window.addEventListener('appinstalled', () => {
        pwaBanner?.classList.add('hidden');
        if (pwaModeBadge) {
          pwaModeBadge.textContent = 'Installed (PWA)';
          pwaModeBadge.classList.add('installed');
        }
        if (typeof UI !== 'undefined') UI.toast('🎉 BantayBarangay installed successfully!', 'success');
      });

      // C. Network Status (Offline detection & sync)
      const offlineStrip = document.getElementById('offlineIndicatorStrip');
      const mobileLivePills = document.querySelectorAll('.mobile-live-pill, .mobile-status-pill');

      function updateNetworkStatus() {
        const isOnline = (typeof navigator !== 'undefined' && 'onLine' in navigator) ? navigator.onLine : true;
        if (!isOnline) {
          offlineStrip?.classList.remove('hidden');
          mobileLivePills.forEach(pill => {
            pill.innerHTML = '<span class="offline-dot"></span><span>Offline</span>';
            pill.style.background = 'rgba(245, 158, 11, 0.15)';
            pill.style.borderColor = 'rgba(245, 158, 11, 0.35)';
            pill.style.color = '#fbbf24';
          });
        } else {
          offlineStrip?.classList.add('hidden');
          mobileLivePills.forEach(pill => {
            pill.innerHTML = '<span class="mobile-live-dot mobile-status-dot"></span><span>Online</span>';
            pill.style.background = '';
            pill.style.borderColor = '';
            pill.style.color = '';
          });
          if (typeof Reports !== 'undefined' && Reports.flushPendingReports) {
            Reports.flushPendingReports().then(count => {
              if (count && typeof UI !== 'undefined') UI.toast(`${count} saved report${count === 1 ? '' : 's'} sent.`, 'success');
            });
          }
        }
      }

      window.addEventListener('online', () => {
        updateNetworkStatus();
        if (typeof UI !== 'undefined') UI.toast('📡 Connection restored. You are back online.', 'success');
      });

      window.addEventListener('offline', () => {
        updateNetworkStatus();
        if (typeof UI !== 'undefined') UI.toast('⚠️ Connection lost. Operating in Offline PWA mode.', 'warning');
      });

      updateNetworkStatus();

      // D. Update Cache button
      document.getElementById('btnRefreshCache')?.addEventListener('click', () => {
        if (typeof window !== 'undefined' && 'caches' in window) {
          caches.delete('bantay-pwa-v1.0.0').then(() => {
            if (typeof UI !== 'undefined') UI.toast('PWA Cache purged. Reloading app…', 'success');
            setTimeout(() => window.location.reload(), 600);
          });
        } else {
          window.location.reload();
        }
      });
    }
  }

  // ── CITIZEN EMERGENCY & POWER ADVISORIES (FROM ADMIN) ──────
  function renderEmergencyAdvisories() {
    const container = document.getElementById('residentEmergencyAdvisory');
    if (!container) return;

    if (typeof Reports === 'undefined' || !Reports.getAdvisories) {
      container.innerHTML = '';
      return;
    }

    const advisories = Reports.getAdvisories().filter(a => a.active !== false);
    if (!advisories || advisories.length === 0) {
      container.innerHTML = '';
      return;
    }

    // Filter out dismissed advisories (stored persistently so they never reappear after opening)
    let dismissed = [];
    try {
      const local = JSON.parse(localStorage.getItem('bantay_dismissed_advisories') || '[]');
      const session = JSON.parse(sessionStorage.getItem('bantay_dismissed_advisories') || '[]');
      dismissed = Array.from(new Set([...local, ...session]));
    } catch {}

    const visible = advisories.filter(a => !dismissed.includes(a.id));
    if (visible.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = visible.slice(0, 2).map(adv => {
      const isCritical = (adv.severity || '').toLowerCase() === 'critical';
      const isHigh = (adv.severity || '').toLowerCase() === 'high';
      const sevClass = isCritical ? 'severity-critical' : isHigh ? 'severity-high' : '';
      const icon = isCritical ? '🚨' : isHigh ? '⚠️' : '⚡';

      return `
        <div class="resident-emergency-banner ${sevClass}" data-adv-id="${adv.id}">
          <div class="adv-banner-icon">${icon}</div>
          <div class="adv-banner-body">
            <div class="adv-banner-header">
              <div class="adv-banner-title">${adv.title}</div>
              <button type="button" class="adv-banner-dismiss" data-adv-dismiss="${adv.id}" title="Dismiss announcement">✕</button>
            </div>
            <div class="adv-banner-msg">${adv.message}</div>
            <div class="adv-banner-meta">
              <span>📍 <strong>Coverage:</strong> ${adv.areas}</span>
              <span>🏢 ${adv.author || 'Masbate Operations Desk'}</span>
              <span>🕒 ${new Date(adv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Wire dismiss buttons
    container.querySelectorAll('[data-adv-dismiss]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.advDismiss;
        try {
          const list = JSON.parse(localStorage.getItem('bantay_dismissed_advisories') || '[]');
          if (!list.includes(id)) list.push(id);
          localStorage.setItem('bantay_dismissed_advisories', JSON.stringify(list));
        } catch {}
        renderEmergencyAdvisories();
      });
    });
  }

  // ── BOOT SEQUENCE ─────────────────────────────────────────
  if (typeof Reports !== 'undefined' && Reports.init) {
    Reports.init();
  }
  renderUserProfile();
  initCustomCategoryPicker();
  restoreDraft();
  initPWA();
  renderEmergencyAdvisories();
  setInterval(renderEmergencyAdvisories, 15000);
  showView('report');
}

// ── BOOTSTRAP: RUN IMMEDIATELY IF ALREADY LOADED OR ON DOMContentLoaded ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
