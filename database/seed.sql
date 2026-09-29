-- ==========================================================
-- BANTAYBARANGAY SEED DATA (Electrical & Power Infrastructure)
-- ==========================================================

-- 1. SEED AGENCIES (MASBATE PROVINCE)
INSERT OR IGNORE INTO agencies (id, name, jurisdiction, hotline, email) VALUES
('MASELCO', 'Masbate Electric Cooperative (MASELCO)', 'Power distribution lines, transformers, electric posts, and grid maintenance across Masbate Province', '(056) 333-2244', 'helpdesk@maselco.com.ph'),
('BARANGAY', 'Barangay Centro Operations & Electrical Safety', 'Hazard perimeter cordoning, fallen tree branch clearing on lines, purok safety patrols', '(056) 333-2199', 'brgy.centro.masbate@gov.ph'),
('LGU', 'City Engineering & Public Works - Masbate City', 'Public facility electrical connections and municipal infrastructure support', '(056) 333-2111', 'engineering@masbatecity.gov.ph'),
('DPWH', 'DPWH Masbate 1st District Engineering Office', 'National road right-of-way clearances and utility line coordination', '(056) 333-2575', 'dpwh.masbate1st@gov.ph'),
('PNP', 'Philippine National Police - Masbate City Police Station', 'Public safety assistance and hazard perimeter security during major line repairs', '(056) 333-2222', 'pnp.masbatecity@pnp.gov.ph');

-- 2. SEED CATEGORIES (ELECTRICAL INFRASTRUCTURE & POWER GRID)
INSERT OR IGNORE INTO categories (id, name, icon, default_agency, description) VALUES
('line_pole', 'Line & Pole Issues (Distribution Infrastructure)', '🗼', 'MASELCO', 'Toppled or leaning utility poles, downed power lines, low-hanging cables, and broken crossarms.'),
('transformer', 'Transformer & Substation Issues', '💥', 'MASELCO', 'Blown transformers, overheated smoking units, oil leaks, and arcing electrical equipment.'),
('service_drop', 'Service Drop & Meter Issues (House Connection)', '🔌', 'MASELCO', 'Torn service drops, burnt meter bases, sparking weatherheads, and residential connection failures.'),
('outage', 'Outage Types & Grid Status', '⚡', 'MASELCO', 'Area-wide total blackouts, rotational brownouts, severe voltage fluctuations, and unscheduled power loss.'),
('vegetation_hazard', 'Vegetation & Environmental Electrical Hazards', '🌳', 'MASELCO', 'Tree branches entangled in high-voltage lines and fallen tree limbs snapping wires.'),
('electric', 'General Electrical Hazard / Broken Wire', '⚡', 'MASELCO', 'Exposed live cables, sparking posts, electrocution risks, and leaning power infrastructure.');

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

-- 5. SEED INITIAL REPORTS (100% ELECTRICAL INCIDENTS IN MASBATE)
INSERT OR IGNORE INTO reports (id, category_id, description, photo_url, latitude, longitude, address, purok, severity, status, agency_id, reporter_id, reporter_name, reporter_mobile, created_at, updated_at) VALUES
(
    'BB-001',
    'transformer',
    'Loud explosion followed by smoke from pole-mounted transformer unit near Masbate City Hall. Localized blackout affecting surrounding commercial stores.',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    12.3713,
    123.6306,
    'Quezon St. near Masbate City Hall, Brgy. Centro, Masbate City',
    'Purok 1',
    'urgent',
    'pending',
    'MASELCO',
    2,
    'Juan dela Cruz',
    '09171234567',
    '2026-09-15 08:30:00',
    '2026-09-16 11:20:00'
),
(
    'BB-002',
    'line_pole',
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
    'vegetation_hazard',
    'Heavy balete tree branch snapped and is resting directly on the primary distribution lines along Tara Street near Tugbo River spillway. Arcing seen during wind gusts.',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    12.3650,
    123.6290,
    'Tara St. near Tugbo River spillway, Masbate City',
    'Purok 3',
    'high',
    'in_progress',
    'MASELCO',
    2,
    'Juan dela Cruz',
    '09171234567',
    '2026-09-12 10:00:00',
    '2026-09-14 16:30:00'
),
(
    'BB-004',
    'line_pole',
    'Utility pole tilted at 40 degrees following soil erosion along Airport Road near Brgy. Ibingay. Successfully restabilized and guy-wires retensioned.',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    12.3700,
    123.6240,
    'Airport Road, Barangay Ibingay, Masbate City',
    'Purok 5',
    'high',
    'resolved',
    'MASELCO',
    3,
    'Maria Santos',
    '09281234567',
    '2026-09-17 06:45:00',
    '2026-09-17 14:00:00'
),
(
    'BB-005',
    'outage',
    'Complete unscheduled power outage across the public market district and surrounding residential puroks without scheduled advisory.',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    12.3725,
    123.6318,
    'Public Market Perimeter, Quezon Street, Masbate City',
    'Purok 1',
    'high',
    'under_review',
    'MASELCO',
    2,
    'Elena Mendoza',
    '09189876543',
    '2026-09-17 08:30:00',
    '2026-09-17 09:15:00'
);

-- 6. SEED REPORT TIMELINES
INSERT OR IGNORE INTO report_timeline (report_id, status, note, officer_name, agency, created_at) VALUES
-- BB-001 Timeline
('BB-001', 'pending', 'Transformer explosion reported by citizen via BantayBarangay. Forwarded to MASELCO Emergency Dispatch.', 'Resident Juan dela Cruz', 'Barangay Portal', '2026-09-15 08:30:00'),
('BB-001', 'under_review', 'MASELCO substation dispatched technical crew to isolate the blown transformer and prevent feeder tripping.', 'Officer Renato Bautista', 'MASELCO Dispatch', '2026-09-15 11:00:00'),

-- BB-002 Timeline
('BB-002', 'pending', 'Emergency report filed for hazardous leaning electric post.', 'Resident Maria Santos', 'Barangay Portal', '2026-09-16 07:15:00'),
('BB-002', 'under_review', 'Barangay Tanod deployed yellow caution tape to cordon off the danger zone. MASELCO bucket truck en route.', 'Officer Renato Bautista', 'Barangay Quick Response', '2026-09-16 09:45:00'),

-- BB-003 Timeline
('BB-003', 'pending', 'Fallen tree branch resting on primary lines reported by residents.', 'Resident Juan dela Cruz', 'Barangay Portal', '2026-09-12 10:00:00'),
('BB-003', 'in_progress', 'Joint MASELCO line crew and Barangay chainsaw team pruning branch safely after power isolation.', 'Engr. Almario', 'MASELCO', '2026-09-13 09:00:00'),

-- BB-004 Timeline
('BB-004', 'pending', 'Hazardous leaning pole reported near airport corridor.', 'Resident Maria Santos', 'Barangay Portal', '2026-09-17 06:45:00'),
('BB-004', 'in_progress', 'Excavation and pole realignment underway with concrete reinforcement.', 'Engr. Bautista', 'MASELCO', '2026-09-17 09:30:00'),
('BB-004', 'resolved', 'Pole concrete base reinforced and guy-wires secured. Power lines re-tensioned and declared safe.', 'Engr. Bautista', 'MASELCO', '2026-09-17 14:00:00'),

-- BB-005 Timeline
('BB-005', 'pending', 'Unscheduled area-wide blackout reported by public market residents.', 'Resident Elena Mendoza', 'Barangay Portal', '2026-09-17 08:30:00'),
('BB-005', 'under_review', 'MASELCO substation operators checking Masbate Feeder circuit breaker trip.', 'Officer Renato Bautista', 'MASELCO', '2026-09-17 09:15:00');
