/* ─────────────────────────────────────────────────────────
   reports.js — Data model & CRUD via localStorage
   ───────────────────────────────────────────────────────── */

const STORAGE_KEY = 'bantaybarangay_reports';

const Reports = (() => {
  // ── SEED DATA ─────────────────────────────────────────────
  const SEED = [
    {
      id: 'BB-001',
      category: 'Pothole',
      description: 'Large pothole on the main road near the barangay hall entrance. Approximately 40cm wide and 15cm deep. Several motorcycles have already lost balance here.',
      photo: null,
      location: { lat: 14.5995, lng: 120.9842, address: 'Barangay Hall Entrance, Main Road' },
      agency: 'DPWH',
      severity: 'High',
      reporter: 'Juan dela Cruz',
      status: 'In Progress',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Report submitted by resident', date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
        { status: 'Under Review', note: 'DPWH notified and scheduled inspection', date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
        { status: 'In Progress', note: 'Road crew dispatched. Work expected to be done by Friday.', date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() }
      ]
    },
    {
      id: 'BB-002',
      category: 'Busted Streetlight',
      description: 'Three consecutive streetlights on Rizal Street have been out for two weeks. Very dark at night — residents are afraid to walk there.',
      photo: null,
      location: { lat: 14.6005, lng: 120.9825, address: 'Rizal Street, near Sari-Sari Store' },
      agency: 'MASELCO',
      severity: 'Medium',
      reporter: 'Maria Santos',
      status: 'Under Review',
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Report submitted', date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
        { status: 'Under Review', note: 'MASELCO team reviewing work order', date: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString() }
      ]
    },
    {
      id: 'BB-003',
      category: 'Clogged Drainage',
      description: 'Drainage along Mabini Street is completely blocked with garbage and silt. Flooding occurs every rainfall. Water reaches knee-level on the sidewalk.',
      photo: null,
      location: { lat: 14.5982, lng: 120.9860, address: 'Mabini Street, near elementary school' },
      agency: 'Barangay',
      severity: 'Critical',
      reporter: 'Pedro Reyes',
      status: 'Pending',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Report submitted. Urgent due to school proximity.', date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() }
      ]
    },
    {
      id: 'BB-004',
      category: 'Broken Electric Post',
      description: 'Electric post leaning dangerously over the road after a truck hit it. Wires are sagging and sparking at night.',
      photo: null,
      location: { lat: 14.5970, lng: 120.9850, address: 'Junction of Bonifacio and Luna St.' },
      agency: 'MASELCO',
      severity: 'Critical',
      reporter: 'Anonymous',
      status: 'Resolved',
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Reported as emergency', date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
        { status: 'Under Review', note: 'MASELCO emergency team contacted', date: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString() },
        { status: 'In Progress', note: 'Post being replaced', date: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString() },
        { status: 'Resolved', note: 'New electric post installed. Area safe.', date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString() }
      ]
    },
    {
      id: 'BB-005',
      category: 'Crime / Public Safety',
      description: 'Report of repeated motorcycle helmet theft and suspicious individuals loitering late at night near the public market perimeter.',
      photo: null,
      location: { lat: 12.3725, lng: 123.6310, address: 'Public Market Perimeter, Purok 5 Market Zone, Masbate City' },
      agency: 'Barangay',
      severity: 'Medium',
      reporter: 'Elena Mendoza',
      status: 'Under Review',
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      timeline: [
        { status: 'Pending', note: 'Incident report filed by resident', date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
        { status: 'Under Review', note: 'Forwarded to Barangay Tanod & PNP Masbate for night patrol schedule', date: new Date(Date.now() - 12 * 3600 * 1000).toISOString() }
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
  }

  function init() {
    if (!load()) save(SEED);
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
