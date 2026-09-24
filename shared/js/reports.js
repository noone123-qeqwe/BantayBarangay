/* ─────────────────────────────────────────────────────────
   reports.js — Data model & CRUD via localStorage
   ───────────────────────────────────────────────────────── */

const STORAGE_KEY = 'bantaybarangay_reports';
const PENDING_SYNC_KEY = 'bantaybarangay_pending_report_sync';

const Reports = (() => {
  let pendingSyncPromise = null;
  function getPendingSync() {
    try { return JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]'); } catch { return []; }
  }

  function savePendingSync(reports) {
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(reports));
  }

  function queueForSync(report) {
    const pending = getPendingSync().filter(item => item.id !== report.id);
    pending.push(report);
    savePendingSync(pending);
  }

  function apiPayload(report) {
    const catMap = {
      'Toppled / Leaning Utility Pole': 'electric', 'Snapped / Downed Power Lines': 'electric',
      'Low-Hanging Wires': 'electric', 'Tangled or Crossed Lines': 'electric',
      'Broken Crossarm / Insulator': 'electric', 'Blown Transformer': 'electric',
      'Transformer Oil Leak / Smoking': 'electric', 'Sparking / Arcing Transformer': 'electric',
      'Service Drop Disconnection': 'electric', 'Service Wire Sparking / Short Circuit': 'electric',
      'Damaged Electric Meter Box': 'electric', 'Total Blackout (Area-wide)': 'electric',
      'Rotational Brownout / Load Shedding': 'electric', 'Low Voltage / Fluctuating Power': 'electric',
      'Unscheduled Interruption (Cause Unknown)': 'electric', 'Tree Branches Entangled in Wires': 'electric',
      'Tree Branch Fell on Lines': 'electric', 'Broken Electric Post': 'electric', 'Pothole': 'pothole',
      'Clogged Drainage': 'drainage', 'Busted Streetlight': 'streetlight'
    };
    return {
      id: report.id,
      category_id: catMap[report.category] || 'electric',
      description: report.description,
      photo_url: report.photo,
      latitude: report.location?.lat || 14.5995,
      longitude: report.location?.lng || 120.9842,
      address: report.location?.address || 'Barangay',
      purok: 'Purok 1',
      severity: (report.severity || 'medium').toLowerCase(),
      reporter_name: report.reporter || 'Resident',
      reporter_mobile: report.reporterPhone || '09171234567'
    };
  }

  async function flushPendingReports() {
    if (pendingSyncPromise) return pendingSyncPromise;
    pendingSyncPromise = (async () => {
      if (typeof API === 'undefined' || !(await API.isServerAvailable())) return 0;
      const pending = getPendingSync();
      const stillPending = [];
      let synced = 0;
      for (const report of pending) {
        try {
          const result = await API.createReport(apiPayload(report));
          if (result?.success) synced += 1;
          else stillPending.push(report);
        } catch { stillPending.push(report); }
      }
      savePendingSync(stillPending);
      return synced;
    })();
    try {
      return await pendingSyncPromise;
    } finally {
      pendingSyncPromise = null;
    }
  }
  // ── SEED DATA ─────────────────────────────────────────────
  const SEED = [
    {
      id: 'BB-001',
      category: 'Blown Transformer',
      description: 'Loud explosion followed by smoke from pole-mounted transformer unit near Masbate City Hall. Localized blackout affecting surrounding commercial stores.',
      photo: null,
      location: { lat: 12.3713, lng: 123.6306, address: 'Quezon St. near Masbate City Hall, Brgy. Centro, Masbate City' },
      agency: 'MASELCO',
      severity: 'Critical',
      reporter: 'Juan dela Cruz',
      reporterPhone: '09171234567',
      reporterPurok: 'Purok 1, Brgy. Espinosa, Masbate City',
      userId: 'usr-001',
      status: 'Pending',
      confirmations: 14,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Report submitted by citizen via BantayBarangay', date: new Date(Date.now() - 2 * 3600 * 1000).toISOString() }
      ]
    },
    {
      id: 'BB-002',
      category: 'Snapped / Downed Power Lines',
      description: 'Live power cable snapped during heavy squall wind and is dangling dangerously across Zurbito Street near the port passenger terminal.',
      photo: null,
      location: { lat: 12.3745, lng: 123.6335, address: 'Zurbito St., near Masbate Port (Bapor Area), Masbate City' },
      agency: 'MASELCO',
      severity: 'Critical',
      reporter: 'Maria Santos',
      reporterPhone: '09189876543',
      reporterPurok: 'Purok 2, Brgy. Espinosa, Masbate City',
      userId: 'usr-002',
      status: 'In Progress',
      confirmations: 9,
      createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Report filed by resident. Severe electrocution hazard.', date: new Date(Date.now() - 6 * 3600 * 1000).toISOString() },
        { status: 'Under Review', note: 'Forwarded to MASELCO emergency dispatch and Barangay Tanod for perimeter cordoning', date: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), officer: 'Renato Bautista', agency: 'Barangay' },
        { status: 'In Progress', note: 'MASELCO bucket truck crew on-site. Power isolated; splicing cable.', date: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), officer: 'Engr. D. Almario', agency: 'MASELCO' }
      ]
    },
    {
      id: 'BB-003',
      category: 'Tree Branch Fell on Lines',
      description: 'Heavy balete tree branch snapped and is resting directly on the primary lines along Tara Street near Tugbo River spillway. Arcing seen during gusts.',
      photo: null,
      location: { lat: 12.3650, lng: 123.6290, address: 'Tara St. near Tugbo River spillway, Masbate City' },
      agency: 'Barangay',
      severity: 'Critical',
      reporter: 'Pedro Reyes',
      reporterPhone: '09195551234',
      reporterPurok: 'Purok 3, Brgy. Tugbo, Masbate City',
      status: 'Under Review',
      confirmations: 18,
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Reported by resident. High risk of line snapping.', date: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
        { status: 'Under Review', note: 'Barangay chainsaw crew requested; awaiting line grounding by MASELCO', date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), officer: 'Tanod Commander Vargas', agency: 'Barangay' }
      ]
    },
    {
      id: 'BB-004',
      category: 'Toppled / Leaning Utility Pole',
      description: 'Utility pole tilted at 40 degrees following soil erosion along Airport Road near Brgy. Ibingay. Successfully restabilized and guy-wires retensioned.',
      photo: 'images/sample-pothole-before.jpg',
      resolutionPhoto: 'images/sample-pothole-after.jpg',
      location: { lat: 12.3700, lng: 123.6240, address: 'Airport Road, Barangay Ibingay, Masbate City' },
      agency: 'DPWH',
      severity: 'High',
      reporter: 'Juan dela Cruz',
      reporterPhone: '09171234567',
      reporterPurok: 'Purok 1, Brgy. Espinosa, Masbate City',
      userId: 'usr-001',
      status: 'Resolved',
      confirmations: 15,
      resolvedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Hazardous leaning pole reported near airport corridor', date: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
        { status: 'Under Review', note: 'Joint inspection by DPWH Masbate 1st DEO and MASELCO', date: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), officer: 'Engr. Bautista', agency: 'DPWH' },
        { status: 'In Progress', note: 'Excavation and pole realignment underway', date: new Date(Date.now() - 30 * 3600 * 1000).toISOString(), agency: 'MASELCO' },
        { status: 'Resolved', note: 'Pole concrete base reinforced and guy-wires secured. Safe for traffic.', date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), officer: 'Engr. Bautista', agency: 'DPWH' }
      ]
    },
    {
      id: 'BB-005',
      category: 'Total Blackout (Area-wide)',
      description: 'Complete power outage across the public market district and surrounding residential puroks without scheduled advisory.',
      photo: null,
      location: { lat: 12.3725, lng: 123.6310, address: 'Public Market Perimeter, Purok 5 Market Zone, Masbate City' },
      agency: 'MASELCO',
      severity: 'High',
      reporter: 'Elena Mendoza',
      reporterPhone: '09208889911',
      reporterPurok: 'Purok 5, Brgy. Centro, Masbate City',
      status: 'Under Review',
      confirmations: 32,
      createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Unscheduled area blackout reported by 32 residents', date: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
        { status: 'Under Review', note: 'MASELCO substation operators checking Masbate Feeder 3 circuit breaker trip', date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), agency: 'MASELCO' }
      ]
    },
    {
      id: 'BB-006',
      category: 'Low-Hanging Wires',
      description: 'Secondary line sagging under 2.8 meters over tricycle thoroughfare on Nursery Street. Tricycle roofs hitting line.',
      photo: null,
      location: { lat: 12.3680, lng: 123.6280, address: 'Nursery St., Brgy. Nursery, Masbate City' },
      agency: 'MASELCO',
      severity: 'High',
      reporter: 'Carlos Lim',
      reporterPhone: '09172223344',
      reporterPurok: 'Purok 2, Brgy. Nursery, Masbate City',
      status: 'Pending',
      confirmations: 7,
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Reported by local transport group', date: new Date(Date.now() - 4 * 3600 * 1000).toISOString() }
      ]
    },
    {
      id: 'BB-007',
      category: 'Damaged Electric Meter Box',
      description: 'Commercial cluster meter box cracked with sparking main breaker switches during rain.',
      photo: null,
      location: { lat: 12.3730, lng: 123.6350, address: 'Rosero St., Brgy. Bapor, Masbate City' },
      agency: 'MASELCO',
      severity: 'High',
      reporter: 'Ana Gomez',
      reporterPhone: '09187776655',
      reporterPurok: 'Purok 4, Brgy. Bapor, Masbate City',
      status: 'Pending',
      confirmations: 5,
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Meter cluster sparking reported by building manager', date: new Date(Date.now() - 5 * 3600 * 1000).toISOString() }
      ]
    }
  ];

  // ── LOAD / SAVE ───────────────────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    try {
      window.dispatchEvent(new CustomEvent('bantay_reports_updated', { detail: { reports: data } }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('bantay_reports_channel');
        bc.postMessage({ type: 'REPORTS_UPDATED', count: data.length });
        bc.close();
      }
    } catch (e) {}
  }

  function resetSeed() {
    save(SEED);
    return SEED;
  }

  async function syncFromApi() {
    if (typeof API === 'undefined') return;
    try {
      const online = await API.isServerAvailable();
      if (!online) return;
      const res = await API.getReports();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const existing = load() || [];
        const mapped = res.data.map(r => ({
          id: r.id,
          category: r.category_name || r.category_id,
          description: r.description,
          photo: r.photo_url,
          location: { lat: r.latitude, lng: r.longitude, address: r.address },
          agency: r.agency_name || r.agency_id || 'Barangay',
          severity: r.severity ? r.severity.charAt(0).toUpperCase() + r.severity.slice(1) : 'Medium',
          reporter: r.reporter_name,
          status: r.status === 'in_progress' ? 'In Progress' : (r.status === 'under_review' ? 'Under Review' : (r.status.charAt(0).toUpperCase() + r.status.slice(1))),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          timeline: (r.timeline || []).map(t => ({
            status: t.status === 'in_progress' ? 'In Progress' : (t.status === 'under_review' ? 'Under Review' : (t.status.charAt(0).toUpperCase() + t.status.slice(1))),
            note: t.note,
            date: t.created_at,
            officer: t.officer_name,
            agency: t.agency
          }))
        }));
        // Keep reports still waiting in the local outbox; a slow initial API load
        // must never erase a report that was saved while offline.
        const remoteIds = new Set(mapped.map(report => report.id));
        const merged = [...mapped, ...existing.filter(report => !remoteIds.has(report.id))];
        const existingRaw = localStorage.getItem(STORAGE_KEY) || '[]';
        if (JSON.stringify(merged) !== existingRaw) {
          save(merged);
        }
      }
    } catch (e) {
      console.warn('API sync deferred, using local cached data.');
    }
  }

  function init() {
    const existing = load();
    if (!existing || !existing.length || existing.some(r => {
      const c = (r.category || '').toLowerCase();
      return c.includes('pothole') || c.includes('drainage') || c.includes('streetlight');
    })) {
      save(SEED);
    }
    syncFromApi();
    flushPendingReports();
    getAdvisories();
  }

  // ── GETTERS ───────────────────────────────────────────────
  function getAll() {
    return load() || [];
  }

  function getById(id) {
    return getAll().find(r => r.id === id) || null;
  }

  function getStats() {
    const all = getAll();
    return {
      total: all.length,
      pending: all.filter(r => r.status === 'Pending').length,
      review: all.filter(r => r.status === 'Under Review').length,
      progress: all.filter(r => r.status === 'In Progress').length,
      resolved: all.filter(r => r.status === 'Resolved').length,
    };
  }

  function getCategoryCounts() {
    const all = getAll();
    const counts = {};
    all.forEach(r => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return counts;
  }

  // ── CREATE ────────────────────────────────────────────────
  function create(data) {
    const all = getAll();
    const id = 'BB-' + String(all.length + 1).padStart(3, '0');
    const now = new Date().toISOString();
    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    const phone = data.reporterPhone || (currentUser && currentUser.mobile) || '09171234567';
    const purok = data.reporterPurok || (currentUser && currentUser.purok) || (data.location && data.location.address) || 'Masbate City';

    const report = {
      id,
      category: data.category || 'Other',
      description: data.description || '',
      photo: data.photo || null,
      location: data.location || { lat: 12.3713, lng: 123.6304, address: 'Not specified' },
      agency: data.agency || 'MASELCO',
      severity: data.severity || 'Medium',
      reporter: data.reporter || (currentUser ? currentUser.name : 'Anonymous'),
      reporterPhone: phone,
      reporterPurok: purok,
      userId: data.userId || (currentUser ? currentUser.id : null),
      confirmations: 1,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
      timeline: [
        { status: 'Pending', note: 'Report submitted by resident', date: now }
      ]
    };
    all.unshift(report);
    save(all);

    // Persist first; a successful sync removes this item from the lightweight outbox.
    queueForSync(report);
    flushPendingReports();

    return report;
  }

  // ── UPDATE STATUS ─────────────────────────────────────────
  function updateStatus(id, status, note = '') {
    const all = getAll();
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    all[idx].status = status;
    all[idx].updatedAt = now;
    all[idx].timeline.push({ status, note: note || `Status updated to "${status}"`, date: now });
    save(all);
    return all[idx];
  }

  // ── UPDATE DETAILS (STATUS / AGENCY / NOTE) ───────────────
  function updateReport(id, { status, agency, note = '' } = {}) {
    const all = getAll();
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    let changes = [];

    if (status && status !== all[idx].status) {
      changes.push(`Status changed to "${status}"`);
      all[idx].status = status;
    }
    if (agency && agency !== all[idx].agency) {
      changes.push(`Assigned agency changed to ${agency}`);
      all[idx].agency = agency;
    }

    all[idx].updatedAt = now;
    const timelineEntry = {
      status: all[idx].status,
      note: note || (changes.length ? changes.join('; ') : 'Report updated'),
      date: now
    };
    all[idx].timeline.push(timelineEntry);
    save(all);

    // Forward to SQLite database if API server is online
    if (typeof API !== 'undefined') {
      API.isServerAvailable().then(online => {
        if (!online) return;
        const statusMap = {
          'Pending': 'pending',
          'Under Review': 'under_review',
          'In Progress': 'in_progress',
          'Resolved': 'resolved',
          'Dismissed': 'dismissed'
        };
        const agencyMap = {
          'DPWH': 'DPWH',
          'LGU Engineering': 'LGU',
          'LGU': 'LGU',
          'MASELCO': 'MASELCO',
          'Barangay': 'BARANGAY',
          'Barangay Maintenance': 'BARANGAY'
        };
        API.updateReportStatus(id, {
          status: statusMap[all[idx].status] || all[idx].status.toLowerCase(),
          agency_id: agencyMap[agency] || agency || undefined,
          note: note || (changes.length ? changes.join('; ') : 'Report updated'),
          officer_name: 'Barangay Desk',
          agency: agency || 'Barangay Quick Response'
        }).catch(err => console.warn('SQLite API update deferred:', err));
      });
    }

    return all[idx];
  }

  function updateAgency(id, agency, note = '') {
    return updateReport(id, { agency, note });
  }

  // ── DELETE ────────────────────────────────────────────────
  function remove(id) {
    const all = getAll().filter(r => r.id !== id);
    save(all);
  }

  // ── FILTER ────────────────────────────────────────────────
  function filter({ search = '', status = 'all', category = 'all', agency = 'all', urgency = 'all' } = {}) {
    let results = getAll();
    if (status !== 'all') results = results.filter(r => r.status === status);
    if (category !== 'all') results = results.filter(r => r.category === category);
    if (agency !== 'all') results = results.filter(r => r.agency === agency);
    if (urgency !== 'all') results = results.filter(r => (r.severity || '').toLowerCase() === urgency.toLowerCase());
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.reporter.toLowerCase().includes(q) ||
        (r.location.address || '').toLowerCase().includes(q)
      );
    }
    return results;
  }

  // ── EXPORT CSV ────────────────────────────────────────────
  function exportCSV() {
    const reports = getAll();
    const headers = ['ID', 'Category', 'Status', 'Severity', 'Agency', 'Reporter', 'Address', 'Latitude', 'Longitude', 'Created At', 'Description'];
    const rows = reports.map(r => [
      `"${r.id}"`,
      `"${r.category.replace(/"/g, '""')}"`,
      `"${r.status}"`,
      `"${r.severity}"`,
      `"${(r.agency || '').replace(/"/g, '""')}"`,
      `"${(r.reporter || '').replace(/"/g, '""')}"`,
      `"${(r.location?.address || '').replace(/"/g, '""')}"`,
      r.location?.lat ?? '',
      r.location?.lng ?? '',
      `"${r.createdAt}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BantayBarangay_Reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ── CONFIRM INCIDENT (UPVOTE / ME TOO) ────────────────────
  function confirm(id) {
    const all = getAll();
    const rep = all.find(r => r.id === id);
    if (!rep) return 0;
    rep.confirmations = (rep.confirmations || 0) + 1;
    save(all);
    return rep.confirmations;
  }

  function confirmOnce(id, residentId = 'anonymous') {
    const key = `bantay_report_confirmations_${residentId}`;
    let supported;
    try { supported = JSON.parse(localStorage.getItem(key) || '[]'); } catch { supported = []; }
    if (supported.includes(id)) return { confirmed: false, total: getById(id)?.confirmations || 0 };
    const total = confirm(id);
    supported.push(id);
    localStorage.setItem(key, JSON.stringify(supported));
    return { confirmed: true, total };
  }

  // ── CITIZEN ADVISORIES (POWER / WEATHER / SAFETY) ─────────
  const ADVISORIES_KEY = 'bantay_citizen_advisories';
  const DEFAULT_ADVISORIES = [];

  function getAdvisories() {
    try {
      const raw = localStorage.getItem(ADVISORIES_KEY);
      if (!raw) {
        localStorage.setItem(ADVISORIES_KEY, JSON.stringify(DEFAULT_ADVISORIES));
        return DEFAULT_ADVISORIES;
      }
      let list = JSON.parse(raw);
      if (Array.isArray(list)) {
        // Strip legacy demo advisories (MASELCO maintenance and Typhoon alert)
        const cleaned = list.filter(a => a && a.id !== 'ADV-001' && a.id !== 'ADV-002');
        if (cleaned.length !== list.length) {
          localStorage.setItem(ADVISORIES_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
      return DEFAULT_ADVISORIES;
    } catch {
      return DEFAULT_ADVISORIES;
    }
  }

  function addAdvisory(data) {
    const list = getAdvisories();
    const id = 'ADV-' + String(list.length + 1).padStart(3, '0');
    const newAdv = {
      id,
      title: data.title || 'Barangay Advisory',
      category: data.category || 'Public Safety',
      severity: data.severity || 'Medium',
      areas: data.areas || 'All Puroks',
      message: data.message || '',
      author: data.author || 'Admin Operations Desk',
      createdAt: new Date().toISOString(),
      active: true
    };
    list.unshift(newAdv);
    localStorage.setItem(ADVISORIES_KEY, JSON.stringify(list));
    return newAdv;
  }

  function deleteAdvisory(id) {
    let list = getAdvisories();
    list = list.filter(a => a.id !== id);
    localStorage.setItem(ADVISORIES_KEY, JSON.stringify(list));
    return list;
  }

  // ── CITIZEN SMS DISPATCH LOGS ──────────────────────────────
  const SMS_LOG_KEY = 'bantay_sms_dispatch_logs';
  function getSmsLogs() {
    try {
      return JSON.parse(localStorage.getItem(SMS_LOG_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function dispatchCitizenSms(reportId, message, recipientPhone) {
    const logs = getSmsLogs();
    const entry = {
      id: 'SMS-' + Date.now().toString(36).toUpperCase(),
      reportId,
      recipientPhone: recipientPhone || '09171234567',
      message,
      status: 'SENT',
      timestamp: new Date().toISOString(),
      gateway: 'Smart/Globe SMS Gateway Simulation'
    };
    logs.unshift(entry);
    if (logs.length > 50) logs.pop();
    localStorage.setItem(SMS_LOG_KEY, JSON.stringify(logs));
    return entry;
  }

  return {
    init,
    getAll,
    getById,
    getStats,
    getCategoryCounts,
    create,
    updateStatus,
    updateReport,
    updateAgency,
    remove,
    filter,
    exportCSV,
    confirm,
    confirmOnce,
    flushPendingReports,
    syncFromApi,
    resetSeed,
    getAdvisories,
    addAdvisory,
    deleteAdvisory,
    dispatchCitizenSms,
    getSmsLogs
  };
})();
