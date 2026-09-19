-- ==========================================================
-- BANTAYBARANGAY DATABASE SCHEMA (SQLite 3 / ANSI SQL)
-- Barangay Infrastructure & Incident Reporting System
-- ==========================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------
-- 1. AGENCIES (Dispatch Authorities)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS agencies (
    id TEXT PRIMARY KEY,                       -- e.g. 'DPWH', 'LGU', 'MASELCO', 'BARANGAY'
    name TEXT NOT NULL,                        -- Official agency name
    jurisdiction TEXT NOT NULL,                -- Scope of responsibility
    hotline TEXT,                              -- Emergency contact number
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------
-- 2. CATEGORIES (Infrastructure Issue Types)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,                       -- e.g. 'pothole', 'electric', 'drainage', 'streetlight'
    name TEXT NOT NULL,                        -- Human readable title
    icon TEXT NOT NULL,                        -- Icon or emoji
    default_agency TEXT,                       -- References agencies(id)
    description TEXT,
    FOREIGN KEY (default_agency) REFERENCES agencies(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- ----------------------------------------------------------
-- 3. PUROKS (Barangay Zones / Subdivisions)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS puroks (
    id TEXT PRIMARY KEY,                       -- e.g. 'Purok 1', 'Purok 2'
    name TEXT NOT NULL,
    description TEXT
);

-- ----------------------------------------------------------
-- 4. USERS (Residents, Barangay Admins, & Responders)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT UNIQUE NOT NULL,               -- Philippine format: 09XXXXXXXXX (11 digits)
    email TEXT,
    purok TEXT DEFAULT 'Purok 1',
    role TEXT NOT NULL DEFAULT 'resident' CHECK(role IN ('resident', 'admin', 'responder')),
    password_hash TEXT NOT NULL,
    phone_verified INTEGER NOT NULL DEFAULT 0, -- 0 = unverified, 1 = verified
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purok) REFERENCES puroks(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- ----------------------------------------------------------
-- 5. VERIFICATION OTPS (SMS OTP Verification System)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS verification_otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mobile TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'registration' CHECK(purpose IN ('registration', 'login', 'reset_password')),
    expires_at DATETIME NOT NULL,
    is_verified INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------
-- 6. REPORTS (Barangay Infrastructure Incident Reports)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,                       -- Tracking Code, e.g. 'BB-001', 'BB-002'
    category_id TEXT NOT NULL,                 -- References categories(id)
    description TEXT NOT NULL,
    photo_url TEXT,
    latitude REAL,
    longitude REAL,
    address TEXT NOT NULL,
    purok TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'under_review', 'in_progress', 'resolved', 'dismissed')),
    agency_id TEXT,                            -- Assigned agency
    reporter_id INTEGER,                       -- Optional registered user link
    reporter_name TEXT NOT NULL,
    reporter_mobile TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- ----------------------------------------------------------
-- 7. REPORT TIMELINE (Audit Log & Status History)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT NOT NULL,
    officer_name TEXT NOT NULL DEFAULT 'Barangay Admin',
    agency TEXT NOT NULL DEFAULT 'Barangay Quick Response',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category_id);
CREATE INDEX IF NOT EXISTS idx_reports_purok ON reports(purok);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_report ON report_timeline(report_id);
CREATE INDEX IF NOT EXISTS idx_otp_mobile ON verification_otps(mobile, is_verified);
