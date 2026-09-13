# BantayBarangay 🛡️

### Community Infrastructure Reporting, Tracking & Response Platform
*Barangay San Antonio, Pasig City, Metro Manila*

BantayBarangay is a production-ready, mobile-first civic reporting platform designed to eliminate delayed reporting and slow responses to municipal infrastructure problems.

---

## 🌟 Key Features

1. **Guided 5-Step Reporting Wizard**:
   - Step 1: Category Selection (Pothole, Streetlight, Snapped Wire, Broken Post, Drainage, Flooding, etc.)
   - Step 2: Issue Details & Emergency Safety Concern Flag
   - Step 3: Photo Evidence Capture (Camera & Gallery upload with client-side compression and privacy notice)
   - Step 4: Interactive GPS Map Pin with duplicate report detection
   - Step 5: Review & Idempotent Submission generating human-readable reference `BB-2026-XXXXXX`
2. **Role-Based Access Control (RBAC)**:
   - **Resident**: Report issues, capture GPS location, track status timeline, receive notifications, verify resolution (`Yes, It's Fixed` vs `No, Reopen`).
   - **Barangay Staff**: Review incoming reports, set priority, assign responding agencies, post public updates vs internal staff notes, upload completion proof photos.
   - **Barangay Administrator**: Manage users, dynamic categories, civic agencies, announcements, and inspect append-only audit logs.
   - **Super Admin**: System configuration, security, and global audit oversight.
3. **Transparent Status Progression**:
   - `Submitted ➔ Received ➔ Under Review ➔ Assigned ➔ In Progress ➔ On Hold ➔ Resolved ➔ Closed / Reopened`
   - Strict separation of public progress updates and private internal staff notes.
4. **Resident Resolution Verification**:
   - When marked `Resolved`, resident is notified to verify:
     - `Yes, It's Fixed` ➔ Transitions case to `Closed` (with celebration animation).
     - `No, Problem Remains` ➔ Requires explanation and reopens report to `Reopened` status.
5. **Interactive Maps & Geospatial Intelligence**:
   - Leaflet + OpenStreetMap integration with reverse geocoding via Nominatim.
   - Proximity duplicate check (150m radius).
   - Hotspot clustering for repeated infrastructure failures.
6. **Production Health Check & PWA**:
   - Health endpoint: `/api/health`
   - Web App Manifest & Service Worker for installability and offline support.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database & Seed Initial Data
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Pre-Seeded Evaluation Accounts

All accounts share the password: `Password123!`

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Resident** | `juan@resident.ph` | `Password123!` | Reporting wizard, personal reports, resolution verification |
| **Barangay Staff** | `staff@bantay.ph` | `Password123!` | Operational dashboard, advance status, assign agency, post updates |
| **Barangay Admin** | `admin@bantay.ph` | `Password123!` | User management, category/agency CRUD, audit logs, announcements |
| **Super Admin** | `superadmin@bantay.ph` | `Password123!` | System settings, user role assignment, audit trail |

*(Quick one-click login buttons are also available on the `/login` page for fast testing).*

---

## 🧪 Automated Testing

Run the end-to-end integration test suite:
```bash
npx tsx test-e2e.ts
npx tsx test-alternative.ts
```

---

## 🔒 Security Highlights
- **HTTP-only JWT Cookies**: Prevents XSS token leakage.
- **Strict IDOR Protection**: Residents can only modify/verify their own reports; private staff notes are filtered on the server before client dispatch.
- **Secure File Uploads**: MIME validation (JPEG, PNG, WebP), 5MB size limit, UUID filenames, and safe public static serving.
- **Append-Only Audit Logs**: Records actor, action, previous state, new state, and timestamps for all administrative actions.
