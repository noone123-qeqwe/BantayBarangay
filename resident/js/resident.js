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

  // GEOLOCATE BUTTON
  document.getElementById('geolocateBtn')?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      UI.toast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    UI.toast('Detecting GPS coordinates…', 'info');
    navigator.geolocation.getCurrentPosition(
      pos => {
        selectedLocation.lat = pos.coords.latitude;
        selectedLocation.lng = pos.coords.longitude;
        selectedLocation.hasGps = true;
        UI.toast(`GPS detected (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`, 'success');
        const addrInput = document.getElementById('reportAddressInput');
        if (addrInput) {
          const gpsStr = `GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
          if (!addrInput.value.trim()) {
            addrInput.value = gpsStr;
          } else if (!addrInput.value.includes('GPS:')) {
            addrInput.value = `${addrInput.value.trim()} (${gpsStr})`;
          }
          selectedLocation.address = addrInput.value;
          document.getElementById('err-address')?.classList.add('hidden');
        }
        saveDraft();
        renderPossibleReports();
      },
      () => {
        UI.toast('Could not retrieve GPS location. Please enter your address manually.', 'info');
      },
      { timeout: 8000 }
    );
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

    // Filter out dismissed advisories in current session
    let dismissed = [];
    try {
      dismissed = JSON.parse(sessionStorage.getItem('bantay_dismissed_advisories') || '[]');
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
          const list = JSON.parse(sessionStorage.getItem('bantay_dismissed_advisories') || '[]');
          list.push(id);
          sessionStorage.setItem('bantay_dismissed_advisories', JSON.stringify(list));
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
