/**
 * BantayBarangay - Masbate Geographic Locations Dataset & Cascading Selector Engine
 * Provides complete hierarchical data: Municipality -> Barangay -> Purok / Zone
 * for Masbate City and all 20 Municipalities of Masbate Province.
 */

(function () {
  'use strict';

  const MASBATE_LOCATIONS = {
    'Masbate City': [
      'Espinosa',
      'Centro (Poblacion)',
      'Ibingay',
      'Tugbo',
      'Nursery',
      'Bagumbayan',
      'Kalipay',
      'Pating',
      'Anas',
      'Asid',
      'Bantigue',
      'Bapi',
      'Batuhan',
      'Bayombon',
      'Biyong',
      'Bolo',
      'Cagay',
      'Cawayan Exterior',
      'Cawayan Interior',
      'Igang',
      'J.T. Fernandez',
      'Kinamaligan',
      'Maingaran',
      'Malinta',
      'Mapiña',
      'Maynganyane',
      'Pawa',
      'Sinalongan',
      'Titong',
      'Ubongan Dacu',
      'Usab'
    ],
    'Aroroy': [
      'Poblacion', 'Amutag', 'Balawing', 'Bato', 'Cabangcalan', 'Calumpang', 'Concepcion',
      'Dayhagan', 'Don Pablo Dela Rosa', 'Jaboyoan', 'Lanang', 'Luy-a', 'Macabug',
      'Malilico', 'Manamoc', 'Maracanan', 'Mataba', 'Matinghe', 'Nabangig', 'Pawa',
      'Pinanaan', 'San Agustin', 'San Isidro', 'Sawang', 'Syndicate', 'Talisay', 'Tinago'
    ],
    'Baleno': [
      'Poblacion', 'Baao', 'Ban-ao', 'Batuila', 'Cagara', 'Canjunday', 'Docol',
      'Eastern Capsay', 'Gagara', 'Gangao', 'Lagta', 'Lahong Proper', 'Lipata',
      'Madiclum', 'Obongon Diot', 'Polot', 'Potingbato', 'Sog-ong', 'Tinapian'
    ],
    'Balud': [
      'Poblacion (Pulanduta)', 'Baybay', 'Bongcanaway', 'Calubian', 'Cantil', 'Casili',
      'Dao', 'Danao', 'Guinbanwahan', 'Ilug', 'Mapili', 'Mapitogo', 'Panguiranan',
      'Panubigan', 'Quinayangan', 'San Andres', 'San Pedro', 'Sampungan', 'Ubo', 'Victory'
    ],
    'Batuan': [
      'Poblacion', 'Burgos', 'Canvañez', 'Costa Rica', 'Danao', 'Gibraltar',
      'Mabuhay', 'Matabao', 'Nasandig', 'Patitinan', 'Rizal', 'San Fernando', 'Sawang'
    ],
    'Cataingan': [
      'Poblacion', 'Abaca', 'Aguada', 'Badiang', 'Bagumbayan', 'Cadulang', 'Camoboan',
      'Chimenea', 'Concepcion', 'Curvada', 'Domorog', 'Gahit', 'Libtong', 'Liong',
      'Madamba', 'Malobago', 'Matayum', 'Minap-in', 'Nadawisan', 'Pawican', 'Pitogo',
      'Quezon', 'San Isidro', 'San Jose', 'San Pedro', 'San Roque', 'Santa Teresita',
      'Santo Niño', 'Tagbo', 'Tudlo'
    ],
    'Cawayan': [
      'Poblacion', 'Begia', 'Cabungahan', 'Calapayan', 'Dalipe', 'Divisoria', 'Guiom',
      'Itbalbay', 'Libertad', 'Liki', 'Macape', 'Mactan', 'Madbad', 'Mahayahay',
      'Maihao', 'Malbug', 'Naro', 'Paloc', 'Peña Island', 'Pin-as', 'Punta Batsan',
      'Recodo', 'San Jose', 'San Vicente', 'Taberna', 'Talisay', 'Tuburan', 'Villa'
    ],
    'Claveria': [
      'Poblacion', 'Albasan', 'Boca Engaño', 'Buyo', 'Calpi', 'Canomay', 'Cawayan',
      'Mabiton', 'Mabuhay', 'Manapao', 'Nabasagan', 'Nonoc', 'Osmeña', 'Pasig',
      'Peñafrancia', 'San Isidro', 'San Ramon', 'San Roque', 'Taguilid'
    ],
    'Dimasalang': [
      'Poblacion', 'Balantacan', 'Balocawe', 'Buracan', 'Cabitungan', 'Cabrera',
      'Cadulan', 'Calabad', 'Canumay', 'Divisoria', 'Gaid', 'Gregoria', 'Khu-lumbang',
      'Magcaraguit', 'Mambog', 'San Antonio', 'San Jose', 'San Marcos', 'Suba'
    ],
    'Esperanza': [
      'Poblacion', 'Agoho', 'Alimango', 'Baras', 'Domorog', 'Guadalupe', 'Iligan',
      'Labao', 'Libertad', 'Magsaysay', 'Masbaranon', 'Potingbato', 'San Roque',
      'Sorosimbajan', 'Tawad', 'Villa'
    ],
    'Mandaon': [
      'Poblacion', 'Alas', 'Ayugan', 'Batohan', 'Bugtong', 'Buri', 'Cabitan',
      'Cagmasoso', 'Canbalo', 'Centro', 'Dayhagan', 'Guincaptan', 'Lantangan',
      'Looc', 'Maolingon', 'Nailaban', 'Naninigan', 'Pinamangcaan', 'Polo',
      'San Juan', 'San Pablo', 'Tagpu'
    ],
    'Milagros': [
      'Poblacion', 'Bacolod', 'Bangad', 'Bara', 'Bonbon', 'Calasuche', 'Capaculan',
      'Cayabon', 'Jamorawon', 'Magsalangi', 'Matagbac', 'Matanglad', 'Matiporon',
      'Moises R. Espinosa', 'Narangasan', 'Pamangpangon', 'Paraiso', 'San Antonio',
      'San Carlos', 'San Gabriel', 'San Isidro', 'San Jose', 'Tagbon', 'Tawad',
      'Tigbao', 'Tinaclipan'
    ],
    'Mobo': [
      'Poblacion', 'Baang', 'Bagacay', 'Balatucan', 'Barero', 'Dacu', 'Fabrica',
      'Guinturilan', 'Holjogon', 'Lalaguna', 'Lomocloc', 'Luyong Catungan',
      'Mabuhay', 'Mandali', 'Marintoc', 'Nasunduan', 'Pinamarbuhan', 'Polot',
      'Sagasa', 'Sambulawan', 'San Gabriel', 'San Pedro', 'Sawang', 'Tabuc',
      'Tugawe', 'Tugbo'
    ],
    'Monreal': [
      'Poblacion', 'Cantorna', 'Fuentebella', 'Guinhadap', 'Macarthur', 'Maglambong',
      'Morocborocan', 'Real', 'Rizal', 'San Bernardo', 'San Isidro', 'San Jose',
      'Santo Niño', 'Togoron'
    ],
    'Palanas': [
      'Poblacion', 'Antipolo', 'Banco', 'Biga-a', 'Bontod', 'Binuangan', 'Bueno',
      'Calumpang', 'Cevicos', 'Cruz', 'Jose A. Abenir', 'Malibas', 'Maravilla',
      'Matugnao', 'Miabas', 'Nabangig', 'Nipa', 'Parina', 'Piña', 'San Antonio',
      'San Carlos', 'San Isidro', 'Santa Cruz'
    ],
    'Pio V. Corpuz': [
      'Poblacion', 'Alegria', 'Buenasuerte', 'Bugang', 'Bugtong', 'Bunducan',
      'Cabangrayan', 'Calangaman', 'Casabangan', 'Guindawahan', 'Labigan',
      'Lampuyang', 'Mabuhay', 'Salvacion', 'Tanque', 'Tubigan', 'Tubog'
    ],
    'Placer': [
      'Poblacion', 'Aguada', 'Ban-ao', 'Burabod', 'Cabangcalan', 'Calipay',
      'Camocaban', 'Daraga', 'Guin-luthangan', 'Katipunan', 'Mahayahay',
      'Manlut-od', 'Matagangtang', 'Nabangig', 'Nagarao', 'Puro', 'Quidolog',
      'San Isidro', 'Santa Cruz', 'Taboc', 'Tan-awan'
    ],
    'San Fernando': [
      'Poblacion', 'Altavista', 'Benitinan', 'Bahi', 'Buenavista', 'Buenos Aires',
      'Buyo', 'Cañabao', 'Daplian', 'Lahu', 'Magsasami', 'Minio', 'Progreso',
      'Resurreccion', 'Salvacion', 'San Antonio', 'San Jose', 'San Martin',
      'San Pedro', 'Silangan', 'Talisay', 'Valparaiso'
    ],
    'San Jacinto': [
      'Poblacion', 'Almiñe', 'Bagacay', 'Bagahanglad', 'Bartolabac', 'Burgos',
      'Cabacungan', 'Calapayan', 'Capitan', 'Danao', 'Dorongan', 'Jagna-an',
      'Luna', 'Mabini', 'Macabug', 'Monreal', 'Piña', 'Roosevelt', 'San Agustin',
      'San Bartolome', 'San Isidro', 'San Jose', 'San Roque', 'Santa Cruz',
      'Santo Niño', 'Washington'
    ],
    'San Pascual': [
      'Poblacion', 'Boca Chica', 'Bolod', 'Busing', 'Cueva', 'Curiw-riw',
      'Dancalan', 'Halabangbaybay', 'Ingalan', 'Laurente', 'Mabini', 'Mabuhay',
      'Madre Librada', 'Malaking Ilog', 'Nazareno', 'Pinamitinan', 'Quintina',
      'San Antonio', 'San Pedro', 'San Rafael', 'Santa Cruz', 'Terraplin'
    ],
    'Uson': [
      'Poblacion', 'Arado', 'Badling', 'Bonifacio', 'Buenavista', 'Campalanas',
      'Dapdap', 'Del Carmen', 'Del Rosario', 'Libertad', 'Magsaysay', 'Marcella',
      'Morocborocan', 'Paguihaman', 'Panicinal', 'Quezon', 'San Isidro',
      'San Jose', 'San Mateo', 'San Ramon', 'San Vicente', 'Santo Cristo',
      'Sawang', 'Simawa'
    ]
  };

  /**
   * Helper function to determine number of puroks for a given barangay.
   */
  function getPurokCount(municipality, barangay) {
    if (municipality === 'Masbate City') {
      if (barangay === 'Espinosa') return 7;
      if (['Centro (Poblacion)', 'Ibingay', 'Tugbo', 'Nursery', 'Bagumbayan'].includes(barangay)) return 5;
      if (['Kalipay', 'Pating'].includes(barangay)) return 3;
      return 5;
    }
    return 7;
  }

  /**
   * Builds the formatted address string matching existing convention:
   * e.g. "Purok 1, Brgy. Espinosa, Masbate City"
   * or "Purok 1, Poblacion, Aroroy, Masbate"
   */
  function formatPurokAddress(purok, barangay, municipality) {
    if (!municipality) municipality = 'Masbate City';
    if (!barangay) barangay = 'Espinosa';
    if (!purok) purok = 'Purok 1';

    if (municipality === 'Masbate City') {
      const bLabel = barangay.startsWith('Brgy.') ? barangay : `Brgy. ${barangay}`;
      return `${purok}, ${bLabel}, Masbate City`;
    } else {
      const bLabel = barangay.toLowerCase().includes('poblacion') ? barangay : `Brgy. ${barangay}`;
      return `${purok}, ${bLabel}, ${municipality}, Masbate`;
    }
  }

  /**
   * Parses an address string into { municipality, barangay, purok }
   */
  function parsePurokAddress(addressStr) {
    if (!addressStr || typeof addressStr !== 'string') {
      return { municipality: 'Masbate City', barangay: 'Espinosa', purok: 'Purok 1' };
    }

    const lower = addressStr.toLowerCase();

    // 1. Match Municipality
    let matchedMuni = 'Masbate City';
    for (const m of Object.keys(MASBATE_LOCATIONS)) {
      if (lower.includes(m.toLowerCase())) {
        matchedMuni = m;
        break;
      }
    }

    // 2. Match Barangay
    const brgys = MASBATE_LOCATIONS[matchedMuni] || [];
    let matchedBrgy = brgys[0] || 'Espinosa';
    for (const b of brgys) {
      const bClean = b.replace(/\s*\([^)]*\)/, '').trim().toLowerCase();
      if (lower.includes(bClean)) {
        matchedBrgy = b;
        break;
      }
    }

    // 3. Match Purok
    let matchedPurok = 'Purok 1';
    const pMatch = addressStr.match(/Purok\s*(\d+)/i);
    if (pMatch) {
      matchedPurok = `Purok ${pMatch[1]}`;
    }

    return { municipality: matchedMuni, barangay: matchedBrgy, purok: matchedPurok };
  }

  /**
   * Initializes a connected cascading dropdown set:
   * Select Municipality -> Select Barangay -> Select Purok
   * Synchronizes with a master hidden input or select element.
   */
  function initCascadingLocation({
    municipalityId,
    barangayId,
    purokId,
    masterId,
    previewId,
    defaultVal = 'Purok 1, Brgy. Espinosa, Masbate City'
  }) {
    const mMuni = document.getElementById(municipalityId);
    const mBrgy = document.getElementById(barangayId);
    const mPurok = document.getElementById(purokId);
    const mMaster = document.getElementById(masterId);
    const mPreview = previewId ? document.getElementById(previewId) : null;

    if (!mMuni || !mBrgy || !mPurok) return null;

    // Populate Municipalities
    mMuni.innerHTML = Object.keys(MASBATE_LOCATIONS).map(m => `
      <option value="${m}">${m === 'Masbate City' ? '🏛️ Masbate City (Capital)' : m}</option>
    `).join('');

    function populateBarangays(selectedMuni, preserveBarangay = null) {
      const list = MASBATE_LOCATIONS[selectedMuni] || [];
      mBrgy.innerHTML = list.map(b => `<option value="${b}">${b}</option>`).join('');
      if (preserveBarangay && list.includes(preserveBarangay)) {
        mBrgy.value = preserveBarangay;
      } else {
        mBrgy.value = list[0] || '';
      }
      populatePuroks(selectedMuni, mBrgy.value);
    }

    function populatePuroks(selectedMuni, selectedBrgy, preservePurok = null) {
      const count = getPurokCount(selectedMuni, selectedBrgy);
      const puroks = [];
      for (let i = 1; i <= count; i++) {
        puroks.push(`Purok ${i}`);
      }
      mPurok.innerHTML = puroks.map(p => `<option value="${p}">${p}</option>`).join('');
      if (preservePurok && puroks.includes(preservePurok)) {
        mPurok.value = preservePurok;
      } else {
        mPurok.value = puroks[0] || 'Purok 1';
      }
      syncToMaster();
    }

    function syncToMaster() {
      const formatted = formatPurokAddress(mPurok.value, mBrgy.value, mMuni.value);
      if (mMaster) {
        mMaster.value = formatted;
        mMaster.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (mPreview) {
        mPreview.textContent = formatted;
      }
    }

    // Event listeners
    mMuni.addEventListener('change', () => {
      populateBarangays(mMuni.value);
    });

    mBrgy.addEventListener('change', () => {
      populatePuroks(mMuni.value, mBrgy.value);
    });

    mPurok.addEventListener('change', () => {
      syncToMaster();
    });

    // Function to set entire cascading from a formatted string
    function setFromString(str) {
      const parsed = parsePurokAddress(str || defaultVal);
      if (Object.keys(MASBATE_LOCATIONS).includes(parsed.municipality)) {
        mMuni.value = parsed.municipality;
      } else {
        mMuni.value = 'Masbate City';
      }
      populateBarangays(mMuni.value, parsed.barangay);
      populatePuroks(mMuni.value, mBrgy.value, parsed.purok);
    }

    // Initialize with default or current master value
    const initialVal = (mMaster && mMaster.value) ? mMaster.value : defaultVal;
    setFromString(initialVal);

    // Intercept programmatic setting on master element
    if (mMaster) {
      try {
        Object.defineProperty(mMaster, 'setCascadingValue', {
          value: setFromString,
          writable: true,
          configurable: true
        });
      } catch (e) {
        // Continue if redefine error
      }
    }

    return {
      setFromString,
      getFormatted: () => formatPurokAddress(mPurok.value, mBrgy.value, mMuni.value)
    };
  }

  // ── GEOGRAPHIC COORDINATE REFERENCE DATA (MASBATE) ───────────
  const MUNICIPALITY_COORDINATES = {
    'Masbate City': { lat: 12.3713, lng: 123.6306 },
    'Mobo': { lat: 12.3275, lng: 123.6667 },
    'Aroroy': { lat: 12.5119, lng: 123.4022 },
    'Baleno': { lat: 12.4333, lng: 123.4833 },
    'Balud': { lat: 12.0333, lng: 123.1833 },
    'Batuan': { lat: 12.4167, lng: 123.7833 },
    'Cataingan': { lat: 11.9986, lng: 123.9961 },
    'Cawayan': { lat: 11.9333, lng: 123.7667 },
    'Claveria': { lat: 12.9000, lng: 123.2333 },
    'Dimasalang': { lat: 12.1833, lng: 123.8333 },
    'Esperanza': { lat: 11.7500, lng: 124.0333 },
    'Mandaon': { lat: 12.2333, lng: 123.2833 },
    'Milagros': { lat: 12.2186, lng: 123.5094 },
    'Monreal': { lat: 12.6500, lng: 123.6667 },
    'Palanas': { lat: 12.1000, lng: 123.9000 },
    'Pio V. Corpuz': { lat: 11.8833, lng: 124.0500 },
    'Placer': { lat: 11.9056, lng: 123.9167 },
    'San Fernando': { lat: 12.4833, lng: 123.7500 },
    'San Jacinto': { lat: 12.5667, lng: 123.7333 },
    'San Pascual': { lat: 13.1333, lng: 122.9833 },
    'Uson': { lat: 12.2167, lng: 123.7833 }
  };

  const MASBATE_CITY_BARANGAY_COORDS = {
    'Centro (Poblacion)': { lat: 12.3713, lng: 123.6306 },
    'Espinosa': { lat: 12.3734, lng: 123.6268 },
    'Nursery': { lat: 12.3650, lng: 123.6315 },
    'Tugbo': { lat: 12.3556, lng: 123.6231 },
    'Ibingay': { lat: 12.3688, lng: 123.6288 },
    'Bagumbayan': { lat: 12.3770, lng: 123.6320 },
    'Kalipay': { lat: 12.3742, lng: 123.6351 },
    'Pating': { lat: 12.3725, lng: 123.6285 },
    'Bantigue': { lat: 12.3920, lng: 123.6120 },
    'Anas': { lat: 12.3522, lng: 123.6389 },
    'Asid': { lat: 12.3245, lng: 123.6111 },
    'Bapi': { lat: 12.3811, lng: 123.6042 },
    'Batuhan': { lat: 12.3615, lng: 123.5930 },
    'Bayombon': { lat: 12.3950, lng: 123.5870 },
    'Biyong': { lat: 12.3380, lng: 123.6420 },
    'Bolo': { lat: 12.3450, lng: 123.5780 },
    'Cagay': { lat: 12.3680, lng: 123.5650 },
    'Cawayan Exterior': { lat: 12.3880, lng: 123.5720 },
    'Cawayan Interior': { lat: 12.3790, lng: 123.5600 },
    'Igang': { lat: 12.3850, lng: 123.5510 },
    'J.T. Fernandez': { lat: 12.3670, lng: 123.6220 },
    'Kinamaligan': { lat: 12.3480, lng: 123.6150 },
    'Maingaran': { lat: 12.3200, lng: 123.5850 },
    'Malinta': { lat: 12.3580, lng: 123.6080 },
    'Mapiña': { lat: 12.3330, lng: 123.5920 },
    'Maynganyane': { lat: 12.3150, lng: 123.6250 },
    'Pawa': { lat: 12.4020, lng: 123.6010 },
    'Sinalongan': { lat: 12.3390, lng: 123.5670 },
    'Titong': { lat: 12.3730, lng: 123.6310 },
    'Ubongan Dacu': { lat: 12.4120, lng: 123.5890 },
    'Usab': { lat: 12.3620, lng: 123.6400 }
  };

  function calcDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function getCoordinates(municipality = 'Masbate City', barangay = '') {
    if (municipality === 'Masbate City' && MASBATE_CITY_BARANGAY_COORDS[barangay]) {
      return { ...MASBATE_CITY_BARANGAY_COORDS[barangay] };
    }
    if (MUNICIPALITY_COORDINATES[municipality]) {
      return { ...MUNICIPALITY_COORDINATES[municipality] };
    }
    return { lat: 12.3713, lng: 123.6306 };
  }

  function findNearestLocation(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    let nearest = null;
    let minDistance = Infinity;

    // Check all barangays in Masbate City first
    for (const [brgy, coords] of Object.entries(MASBATE_CITY_BARANGAY_COORDS)) {
      const d = calcDistanceKm(lat, lng, coords.lat, coords.lng);
      if (d < minDistance) {
        minDistance = d;
        nearest = {
          municipality: 'Masbate City',
          barangay: brgy,
          purok: 'Purok 1',
          distanceKm: d,
          formatted: formatPurokAddress('Purok 1', brgy, 'Masbate City')
        };
      }
    }

    // Check all municipalities
    for (const [muni, coords] of Object.entries(MUNICIPALITY_COORDINATES)) {
      const d = calcDistanceKm(lat, lng, coords.lat, coords.lng);
      if (d < minDistance) {
        minDistance = d;
        nearest = {
          municipality: muni,
          barangay: 'Poblacion',
          purok: 'Purok 1',
          distanceKm: d,
          formatted: formatPurokAddress('Purok 1', 'Poblacion', muni)
        };
      }
    }

    return nearest;
  }

  // Export globally
  const exportObj = {
    DATA: MASBATE_LOCATIONS,
    COORDINATES: MUNICIPALITY_COORDINATES,
    BARANGAY_COORDINATES: MASBATE_CITY_BARANGAY_COORDS,
    MASBATE_COORDINATES: {
      'Masbate City': {
        ...MASBATE_CITY_BARANGAY_COORDS,
        'default': { lat: 12.3713, lng: 123.6306 }
      },
      ...MUNICIPALITY_COORDINATES
    },
    getPurokCount,
    formatPurokAddress,
    parsePurokAddress,
    initCascadingLocation,
    getCoordinates,
    findNearestLocation,
    isWithinMasbate: function(lat, lng) {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
      return lat >= 11.70 && lat <= 13.25 && lng >= 122.85 && lng <= 124.20;
    },
    calcDistanceKm
  };

  if (typeof window !== 'undefined') {
    window.MasbateLocations = exportObj;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportObj;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.MasbateLocations = exportObj;
  }
})();


