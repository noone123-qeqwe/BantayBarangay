/* ─────────────────────────────────────────────────────────
   reports.js — Data model & CRUD via localStorage
   ───────────────────────────────────────────────────────── */

const STORAGE_KEY = 'bantaybarangay_reports';

const Reports = (() => {
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
      status: 'Pending',
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
      status: 'In Progress',
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
      agency: 'MASELCO',
      severity: 'Critical',
      reporter: 'Pedro Reyes',
      status: 'Under Review',
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
      photo: null,
      location: { lat: 12.3700, lng: 123.6240, address: 'Airport Road, Barangay Ibingay, Masbate City' },
      agency: 'MASELCO',
      severity: 'High',
      reporter: 'Juan dela Cruz',
      status: 'Resolved',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Hazardous leaning pole reported near airport corridor', date: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
        { status: 'Under Review', note: 'Joint inspection by MASELCO and Barangay Tanod', date: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), officer: 'Engr. Bautista', agency: 'MASELCO' },
        { status: 'In Progress', note: 'Excavation and pole realignment underway', date: new Date(Date.now() - 30 * 3600 * 1000).toISOString(), agency: 'MASELCO' },
        { status: 'Resolved', note: 'Pole concrete base reinforced and guy-wires secured. Safe for traffic.', date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), officer: 'Engr. Bautista', agency: 'MASELCO' }
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
      status: 'Under Review',
      createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Unscheduled area blackout reported by 32 residents', date: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
        { status: 'Under Review', note: 'MASELCO substation operators checking Masbate Feeder circuit breaker trip', date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), agency: 'MASELCO' }
      ]
    }
  ];

  // ── LOAD / SAVE ───────────────────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      const nonElectric = ['pothole', 'drainage', 'baha', 'flood', 'crime', 'sidewalk', 'water leak', 'street light', 'streetlight'];
      const filtered = parsed.filter(r => {
        const cat = (r.category || '').toLowerCase();
        return !nonElectric.some(term => cat.includes(term));
      });
      if (filtered.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
      return filtered;
    } catch { return null; }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function init() {
    const existing = load();
    if (!existing || !existing.length || existing.some(r => {
      const c = (r.category || '').toLowerCase();
      return c.includes('pothole') || c.includes('drainage') || c.includes('streetlight') || c.includes('crime') || c.includes('water');
    })) {
      save(SEED);
    }
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
    const report = {
      id,
      category: data.category || 'Other',
      description: data.description || '',
      photo: data.photo || null,
      location: data.location || { lat: null, lng: null, address: 'Not specified' },
      agency: data.agency || 'Unknown',
      severity: data.severity || 'Medium',
      reporter: data.reporter || 'Anonymous',
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
      timeline: [
        { status: 'Pending', note: 'Report submitted by resident', date: now }
      ]
    };
    all.unshift(report);
    save(all);
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
  function filter({ search = '', status = 'all', category = 'all', agency = 'all' } = {}) {
    let results = getAll();
    if (status !== 'all') results = results.filter(r => r.status === status);
    if (category !== 'all') results = results.filter(r => r.category === category);
    if (agency !== 'all') results = results.filter(r => r.agency === agency);
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

  return { init, getAll, getById, getStats, getCategoryCounts, create, updateStatus, updateReport, updateAgency, remove, filter, exportCSV };
})();
