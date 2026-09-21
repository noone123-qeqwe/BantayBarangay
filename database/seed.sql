-- ==========================================================
-- BANTAYBARANGAY SEED DATA (Realistic Philippine Civic Data)
-- ==========================================================

-- 1. SEED AGENCIES (MASBATE PROVINCE)
INSERT OR IGNORE INTO agencies (id, name, jurisdiction, hotline, email) VALUES
('DPWH', 'DPWH Masbate 1st District Engineering Office', 'National roads, bridges, and flood control across Masbate Island', '(056) 333-2575', 'dpwh.masbate1st@gov.ph'),
('LGU', 'City Engineering & Public Works - Masbate City', 'City & barangay roads, municipal drainage, sidewalks, public market', '(056) 333-2111', 'engineering@masbatecity.gov.ph'),
('MASELCO', 'Masbate Electric Cooperative (MASELCO)', 'Power distribution lines, transformers, electric posts across Masbate Province', '(056) 333-2244', 'helpdesk@maselco.com.ph'),
('PNP', 'Philippine National Police - Masbate City Police Station', 'Peace and order, crime reporting, public safety operations across Masbate', '(056) 333-2222', 'pnp.masbatecity@pnp.gov.ph'),
('BARANGAY', 'Barangay Centro Operations & Quick Response', 'Barangay pathway clearing, canal desilting, local streetlights, purok safety, tanod patrols', '(056) 333-2199', 'brgy.centro.masbate@gov.ph');

-- 2. SEED CATEGORIES
INSERT OR IGNORE INTO categories (id, name, icon, default_agency, description) VALUES
('pothole', 'Pothole / Lubak sa Kalsada', '🕳️', 'DPWH', 'Damage to asphalt or concrete road surfaces causing vehicle hazard.'),
('electric', 'Broken Electric Post / Wire', '⚡', 'MASELCO', 'Leaning posts, exposed cables, spark hazards, or fallen power lines.'),
('drainage', 'Clogged Drainage / Baha', '🌊', 'BARANGAY', 'Blocked storm drains, canals with trash causing localized flooding.'),
('streetlight', 'Busted Streetlight / Madilim', '💡', 'BARANGAY', 'Non-functioning streetlamps creating security risks at night.'),
('crime', 'Crime & Public Safety / Krimen at Kapayapaan', '🚨', 'BARANGAY', 'Theft, harassment, public disturbance, suspicious activity, or safety hazards.'),
('sidewalk', 'Damaged Sidewalk / Bangketa', '🚶', 'LGU', 'Cracked pavement, missing manhole covers, or blocked pedestrian walks.'),
('water', 'Water Pipe Leak / Tagas ng Tubig', '🚰', 'LGU', 'Burst water district pipes or continuous water spillage.');

-- 3. SEED PUROKS (MASBATE CITY & PROVINCE)
INSERT OR IGNORE INTO puroks (id, name, description) VALUES
('Purok 1, Brgy. Espinosa', 'Purok 1, Brgy. Espinosa, Masbate City', 'Barangay Espinosa coastal and residential sector'),
('Purok 2, Brgy. Espinosa', 'Purok 2, Brgy. Espinosa, Masbate City', 'Barangay Espinosa central residential corridor'),
('Purok 1', 'Purok 1 (Centro)', 'City proper, Plaza Titong, Masbate City Hall, and commercial perimeter'),
('Purok 2', 'Purok 2 (Riverside)', 'Residential zone along Tugbo River and coastal lowlands'),
('Purok 3', 'Purok 3 (Ilaya)', 'Upland residential zone and secondary road access'),
('Purok 4', 'Purok 4 (Mabini)', 'Quezon Street and MNCHS school corridor'),
('Purok 5', 'Purok 5 (Highway)', 'National highway corridor connecting to Mobo and Milagros');

-- 4. SEED INITIAL USERS
INSERT OR IGNORE INTO users (id, name, mobile, email, purok, role, password_hash, phone_verified, created_at) VALUES
(1, 'Officer Renato Bautista', '09205550199', 'admin@gmail.com', 'Purok 1', 'admin', 'pbkdf2_admin_hash_demo', 1, '2026-09-10 08:00:00'),
(2, 'Juan dela Cruz', '09171234567', 'juan.delacruz@gmail.com', 'Purok 1', 'resident', 'pbkdf2_juan_hash_demo', 1, '2026-09-11 09:30:00'),
(3, 'Maria Santos', '09281234567', 'maria.santos@yahoo.com', 'Purok 2', 'resident', 'pbkdf2_maria_hash_demo', 1, '2026-09-12 14:15:00');

-- 5. SEED INITIAL REPORTS (MASBATE PROVINCE LOCATIONS)
INSERT OR IGNORE INTO reports (id, category_id, description, photo_url, latitude, longitude, address, purok, severity, status, agency_id, reporter_id, reporter_name, reporter_mobile, created_at, updated_at) VALUES
(
    'BB-001',
    'pothole',
    'Deep dangerous pothole right in front of Quezon Street near Masbate City Hall. Tricycles frequently swerve into oncoming traffic.',
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    12.3713,
    123.6306,
    'Quezon St. near Masbate City Hall, Brgy. Centro, Masbate City',
    'Purok 1',
    'high',
    'in_progress',
    'DPWH',
    2,
    'Juan dela Cruz',
    '09171234567',
    '2026-09-15 08:30:00',
    '2026-09-16 11:20:00'
),
(
    'BB-002',
    'electric',
    'Old wooden electric post leaning precariously at 45-degree angle towards house roof near Masbate Port after strong winds. Dangling secondary line.',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    12.3745,
    123.6335,
    'Zurbito St., near Masbate Port (Bapor Area), Masbate City',
    'Purok 2',
    'urgent',
    'under_review',
    'MASELCO',
    3,
    'Maria Santos',
    '09281234567',
    '2026-09-16 07:15:00',
    '2026-09-16 09:45:00'
),
(
    'BB-003',
    'drainage',
    'Canal completely blocked with plastic bottles and silt near Tugbo River spillway. Water overflowing onto pedestrian pathway creating foul odor.',
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    12.3650,
    123.6290,
    'Tara St. near Tugbo River spillway, Masbate City',
    'Purok 3',
    'medium',
    'resolved',
    'BARANGAY',
    2,
    'Juan dela Cruz',
    '09171234567',
    '2026-09-12 10:00:00',
    '2026-09-14 16:30:00'
),
(
    'BB-004',
    'streetlight',
    'Three consecutive LED streetlights have been dark for two weeks on Airport Road, leaving the route unsafe for commuters walking home from the terminal.',
    'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80',
    12.3700,
    123.6240,
    'Airport Road, Barangay Ibingay, Masbate City',
    'Purok 5',
    'low',
    'pending',
    'BARANGAY',
    3,
    'Maria Santos',
    '09281234567',
    '2026-09-17 06:45:00',
    '2026-09-17 06:45:00'
),
(
    'BB-005',
    'crime',
    'Suspicious group loitering and attempted motorcycle theft reported near commercial perimeter. Barangay Tanod patrol requested during evening market hours.',
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=80',
    12.3725,
    123.6318,
    'Public Market Perimeter, Quezon Street, Masbate City',
    'Purok 1',
    'high',
    'under_review',
    'BARANGAY',
    2,
    'Elena Mendoza',
    '09189876543',
    '2026-09-17 08:30:00',
    '2026-09-17 09:15:00'
);

-- 6. SEED REPORT TIMELINES
INSERT OR IGNORE INTO report_timeline (report_id, status, note, officer_name, agency, created_at) VALUES
-- BB-001 Timeline
('BB-001', 'pending', 'Report submitted by resident via BantayBarangay Mobile with photo and GPS location.', 'Resident Juan dela Cruz', 'Barangay Portal', '2026-09-15 08:30:00'),
('BB-001', 'under_review', 'Barangay Desk validated road classification: Mabini St. is under DPWH 1st District jurisdiction. Endorsement letter sent.', 'Officer Renato Bautista', 'Barangay Quick Response', '2026-09-15 11:00:00'),
('BB-001', 'in_progress', 'DPWH Road Maintenance Crew dispatched with cold-mix asphalt and safety warning markers.', 'Engr. D. Tolentino', 'DPWH', '2026-09-16 11:20:00'),

-- BB-002 Timeline
('BB-002', 'pending', 'Emergency report filed for hazardous leaning electric post.', 'Resident Maria Santos', 'Barangay Portal', '2026-09-16 07:15:00'),
('BB-002', 'under_review', 'Barangay Tanod deployed yellow caution tape to cordon off the immediate danger zone. Forwarded to MASELCO 24/7 Hotline.', 'Officer Renato Bautista', 'Barangay Quick Response', '2026-09-16 09:45:00'),

-- BB-003 Timeline
('BB-003', 'pending', 'Drainage clogging reported by Purok 3 residents.', 'Resident Juan dela Cruz', 'Barangay Portal', '2026-09-12 10:00:00'),
('BB-003', 'in_progress', 'Barangay Clean-Up Brigade scheduled declogging operations with vacuum pump.', 'Barangay Desk', 'Barangay Quick Response', '2026-09-13 09:00:00'),
('BB-003', 'resolved', 'Canal de-silted, 18 sacks of debris collected and properly hauled. Water flow fully restored.', 'Officer Renato Bautista', 'Barangay Quick Response', '2026-09-14 16:30:00'),

-- BB-004 Timeline
('BB-004', 'pending', 'Streetlight outage logged in queue for maintenance inspection.', 'Resident Maria Santos', 'Barangay Portal', '2026-09-17 06:45:00'),

-- BB-005 Timeline
('BB-005', 'pending', 'Public safety incident report submitted by resident Elena Mendoza.', 'Resident Elena Mendoza', 'Barangay Portal', '2026-09-17 08:30:00'),
('BB-005', 'under_review', 'Endorsed to Barangay Tanod Commander and Masbate City Police Substation for increased nighttime roving.', 'Officer Renato Bautista', 'Barangay Quick Response', '2026-09-17 09:15:00');
