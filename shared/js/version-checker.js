/* ─────────────────────────────────────────────────────────────
   version-checker.js — Automatic Version & Update Manager
   BantayBarangay Infrastructure & Civic Portal (Province of Masbate)
   ───────────────────────────────────────────────────────────── */

const BantayVersion = (() => {
  const CLIENT_VERSION = '2.0.0';
  const CLIENT_DISPLAY_VERSION = 'v2.0';
  const CHECK_INTERVAL_MS = 45000; // Check every 45 seconds
  let updatePromptShown = false;
  let activeRegistration = null;

  function semverCompare(v1, v2) {
    const p1 = (v1 || '0.0.0').replace(/^v/, '').split('.').map(Number);
    const p2 = (v2 || '0.0.0').replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  /**
   * Check for an update from the server API
   */
  async function checkForUpdate() {
    try {
      const res = await fetch(`/api/version?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.version) return;

      const isNewer = semverCompare(data.version, CLIENT_VERSION) > 0;
      const isDifferent = data.version !== CLIENT_VERSION;

      if (isNewer || isDifferent) {
        showUpdatePrompt(data);
      }
    } catch (err) {
      // Offline or network error — silent ignore
    }
  }

  /**
   * Display the 'Update Now' pop-up / modal
   */
  function showUpdatePrompt(data = {}) {
    const version = data.version || '2.0.0';
    const displayVersion = data.displayVersion || (version.startsWith('v') ? version : 'v' + version);
    const sessionKey = `bb_update_dismissed_${version}`;

    if (sessionStorage.getItem(sessionKey)) return;
    if (document.getElementById('bantayUpdatePopup')) return;

    updatePromptShown = true;

    const overlay = document.createElement('div');
    overlay.id = 'bantayUpdatePopup';
    overlay.className = 'update-popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'updatePopupTitle');

    overlay.innerHTML = `
      <div class="update-popup-card">
        <div class="update-popup-glow"></div>
        <div class="update-popup-badge">
          <span class="update-popup-pulse"></span>
          <span>🚀 Update Available</span>
        </div>

        <div class="update-popup-header">
          <div class="update-popup-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="22" height="22">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </div>
          <div class="update-popup-titles">
            <h3 id="updatePopupTitle" class="update-popup-title">New Version Released: ${displayVersion}</h3>
            <p class="update-popup-sub">A newer version of BantayBarangay is ready to install.</p>
          </div>
        </div>

        <div class="update-popup-body">
          ${data.releaseName ? `<div class="update-release-tag">${data.releaseName}</div>` : ''}
          <p class="update-popup-desc">Update now to access the latest civic reporting features, real-time status updates, and mobile performance fixes.</p>
        </div>

        <div class="update-popup-actions">
          <button type="button" class="btn-update-now" id="btnApplyUpdateNow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="16" height="16">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
            </svg>
            <span id="btnApplyUpdateText">Update Now (${displayVersion})</span>
          </button>
          <button type="button" class="btn-update-later" id="btnDismissUpdatePrompt">
            Later
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Trigger animate-in
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    // Handle "Update Now"
    document.getElementById('btnApplyUpdateNow')?.addEventListener('click', async () => {
      const btnText = document.getElementById('btnApplyUpdateText');
      if (btnText) btnText.textContent = 'Updating...';

      // 1. Tell waiting service worker to skipWaiting
      if (activeRegistration && activeRegistration.waiting) {
        activeRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // 2. Clear browser cache storage
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        } catch (e) {
          console.warn('[Update] Cache clear error:', e);
        }
      }

      // 3. Clear version session dismissal
      sessionStorage.removeItem(sessionKey);

      // 4. Force reload from network with cache-bust
      setTimeout(() => {
        const cleanUrl = window.location.href.split('#')[0].split('?')[0];
        window.location.href = `${cleanUrl}?v=${Date.now()}${window.location.hash || ''}`;
      }, 350);
    });

    // Handle "Later"
    document.getElementById('btnDismissUpdatePrompt')?.addEventListener('click', () => {
      sessionStorage.setItem(sessionKey, 'true');
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
    });
  }

  /**
   * Service Worker lifecycle integration
   */
  function initServiceWorkerUpdates() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      activeRegistration = reg;

      // If a worker is already waiting in background
      if (reg.waiting) {
        checkForUpdate();
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version installed in background!
            checkForUpdate();
          }
        });
      });
    }).catch(err => {
      console.warn('[Update] SW check error:', err);
    });

    // Also listen for controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[Update] Controller changed to new version.');
    });
  }

  // ── AUTO-INITIALIZATION ────────────────────────────────────
  function init() {
    // 1. Initial check after 3 seconds (let page settle first)
    setTimeout(() => {
      checkForUpdate();
      initServiceWorkerUpdates();
    }, 3000);

    // 2. Recurring polling check every 45s
    setInterval(checkForUpdate, CHECK_INTERVAL_MS);

    // 3. Check when user returns to tab / app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    });

    window.addEventListener('focus', checkForUpdate);

    // 4. Test trigger via URL parameter (e.g. ?testUpdate=true or #testUpdate)
    if (window.location.search.includes('testUpdate=true') || window.location.hash.includes('testUpdate')) {
      setTimeout(() => {
        showUpdatePrompt({
          version: '2.1.0',
          displayVersion: 'v2.1',
          releaseName: 'Version 2.1 (Masbate Incident Triage Update)'
        });
      }, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    getVersion: () => CLIENT_VERSION,
    getDisplayVersion: () => CLIENT_DISPLAY_VERSION,
    checkForUpdate,
    showUpdatePrompt
  };
})();
