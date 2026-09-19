# TITLE DEFENSE MANUSCRIPT REVISION GUIDE
## Smart Attendance Monitoring and Management System for Osmeña Colleges–Mobo
**Bachelor of Science in Computer Science — Osmeña Colleges**  
*Target Defense Date: September 2026*  
*Authors: Amatos, Ibn Kervi J. | Espinas, Jolina Mae A. | Gracio, Dave R. | Herminado, Janessa A. | Portugal, Karla V.*

---

## Executive Summary & Purpose

This guide provides a comprehensive, section-by-section comparison between your **Title Defense Manuscript** and your **actual, implemented software codebase**. 

### Why Revise the Manuscript?
Your implemented system is **technologically far more sophisticated** than the initial manuscript describes. The manuscript currently uses basic terms like *"QR-code scanning"*, *"GPS-based verification"*, and *"notifications"*. In contrast, your working system already implements:
1. **Dynamic Rotating Cryptographic QR Codes** (expiring HMAC tokens with 300-second cache transition windows to prevent screenshot/photo sharing).
2. **Haversine Geofencing with Velocity Anti-Spoofing** ($>40\text{ m/s}$ / $144\text{ km/h}$ anomaly detection to block Fake GPS apps) and continuous **Student Presence Guardian** heartbeats.
3. **FIDO2 / WebAuthn Passwordless Biometrics** strictly compliant with the **Philippine Data Privacy Act of 2012 (RA 10173)** by retaining biometric templates exclusively on client hardware.
4. **Multi-Channel Notification Infrastructure** incorporating in-app alerts, browser Web Push, and **Philippine SMS text messages via the Semaphore API Gateway** for parents without active mobile data.
5. **Secure Multi-Factor Child Linking** requiring Student ID (`student_number`) and a 6-digit OTP confirmation.
6. **Automated Academic Attendance Warning Pipeline** tracking absence thresholds toward official drop notices.
7. **Attendance Override Audit Trails** (`AttendanceCorrection`) ensuring institutional accountability.

Updating your manuscript with these specifics will elevate your paper from a standard capstone project to an enterprise-grade defense paper, while providing bulletproof answers to tough panel questions.

---

## SECTION-BY-SECTION RECOMMENDED REVISIONS

---

### 1. Title Page & Institutional Affiliation

#### Issue Identified:
* **Manuscript Title:** `SMART ATTENDANCE MONITORING AND MANAGEMENT SYSTEM FOR OSMEÑA COLLEGES–MOBO`
* **Manuscript Line 24:** `Osmeña Colleges, City of Masbate`
* *Observation:* Osmeña Colleges' Main Campus is located in Masbate City, whereas the Mobo Campus is an extension campus in the Municipality of Mobo, Masbate.

#### Recommended Revision:
Choose one consistent designation based on your project's official scope:
* **Option A (If explicitly dedicated to Mobo Campus):**
  > **Title:** SMART ATTENDANCE MONITORING AND MANAGEMENT SYSTEM FOR OSMEÑA COLLEGES–MOBO CAMPUS  
  > **Affiliation:**  
  > *Presented to the Faculty of the Bachelor of Science in Computer Science Program*  
  > *Osmeña Colleges – Mobo Campus*  
  > *Mobo, Masbate, Philippines*
* **Option B (If serving the entire institution including branches):**
  > **Title:** SMART ATTENDANCE MONITORING AND MANAGEMENT SYSTEM FOR OSMEÑA COLLEGES  
  > *With Multi-Campus Geofencing and Branch Administration*  
  > *Osmeña Colleges, City of Masbate, Philippines*

---

### 2. Project Background & Problem Situation

#### What to Revise:
The current introduction treats QR codes and GPS as static tools. You should highlight the specific vulnerabilities of traditional QR/GPS systems and how your architecture overcomes them.

#### Suggested Revised Paragraph (Replace Lines 41–44):
> "Attendance monitoring is an essential pillar of academic management, directly impacting student performance and institutional compliance. However, conventional manual checking, paper attendance sheets, and static digital solutions remain inefficient and susceptible to attendance fraud, buddy-punching, and proxy scanning. While standard QR code attendance systems have gained adoption, they introduce a critical vulnerability: students can easily photograph a static QR code and broadcast it to off-campus peers via messaging applications such as Facebook Messenger.
> 
> To resolve these vulnerabilities, the proposed **Smart Attendance Monitoring and Management System for Osmeña Colleges–Mobo** introduces an enterprise multi-factor verification architecture. The system combines **time-bound, dynamically rotating cryptographic QR codes**, **Haversine-based GPS geofencing with anomalous velocity detection (anti-spoofing)**, and **hardware device binding**. To guarantee account integrity without violating the **Philippine Data Privacy Act of 2012 (Republic Act No. 10173)**, authentication is reinforced through **FIDO2/WebAuthn client-side biometrics**, one-time passwords (OTP), and single-use emergency recovery codes. Furthermore, the system bridges school-home communication through automated academic warnings, a two-step guardian verification wizard, and **multi-channel alerts delivered via Web Push and SMS text messages via the Semaphore Gateway**."

---

### 3. Statement of the Problem (SOP)

#### Issue Identified:
The current manuscript lists 10 broad questions that lack strict academic mapping to the Specific Objectives. In Philippine BSCS thesis defense conventions, there should be a clear, logical mapping between the research questions and specific objectives.

#### Recommended Revised SOP:
> Specifically, the study seeks to address the following technical and operational questions:
> 
> 1. **Authentication & Security:** How can the system implement secure, privacy-compliant user authentication using WebAuthn biometrics, multi-factor OTP verification, hardware device binding, and emergency recovery codes in adherence to Republic Act No. 10173?
> 2. **Attendance Verification & Anti-Fraud:** How can dynamic rotating QR codes, Haversine GPS geofencing, velocity-based anomaly detection, and continuous presence monitoring eliminate proxy attendance and location spoofing?
> 3. **Role-Based Portals:** How can responsive web portals be designed to support the distinct operational workflows of Administrators, Teachers, Students, and Parents/Guardians across both desktop and mobile platforms?
> 4. **Excuse & Warning Management:** How can the system automate student/parent excuse requests, teacher validation workflows, and tiered academic attendance warnings (Warning 1, Probation, Drop Notice)?
> 5. **Communication & Reporting:** How can the system deliver multi-channel alerts (in-app notifications, browser Web Push, and SMS gateway) and generate auditable attendance reports in PDF and Excel formats?

---

### 4. General & Specific Objectives

#### Issue Identified:
In the current manuscript (Lines 68–82):
* WebAuthn, OTP, and Recovery codes were categorized as sub-points under *"QR-code-based attendance mechanism"*.
* PDF/Excel exports and announcements were categorized as sub-points under *"Role-based access control"*.

#### Recommended Revised Specific Objectives (1-to-1 Mapping with SOP):

> ### General Objective
> To design, develop, and deploy a secure, web-based Smart Attendance Monitoring and Management System for Osmeña Colleges–Mobo that integrates dynamic rotating QR codes, GPS geofencing, hardware device binding, WebAuthn biometric security, multi-channel notifications, and tiered role-based management.
> 
> ### Specific Objectives
> Specifically, the system aims to:
> 
> **1. Develop an enterprise authentication and account-security module:**
> - 1.1. Integrate FIDO2/WebAuthn public-key biometrics (fingerprint/Passkey) ensuring no raw biometric data is transmitted or stored on school servers, compliant with RA 10173.
> - 1.2. Implement multi-factor OTP verification for account registration and sensitive credential modifications.
> - 1.3. Implement persistent hardware device binding using cryptographic hashing and secure session cookies to prevent account sharing.
> - 1.4. Generate cryptographically secure single-use recovery codes for emergency account restoration.
> 
> **2. Develop an anti-fraud attendance verification and recording engine:**
> - 2.1. Implement dynamic, auto-refreshing cryptographic QR codes (rolling session tokens) to eliminate screenshot duplication and proxy scanning.
> - 2.2. Implement server-side Haversine GPS geofencing with configurable classroom boundary radii ($50\text{m} - 150\text{m}$).
> - 2.3. Implement velocity anomaly detection ($>40\text{ m/s}$ / $144\text{ km/h}$) and GPS accuracy filtering to detect and reject mock location/Fake GPS applications.
> - 2.4. Implement a background continuous presence verification heartbeat ("Student Presence Guardian") during active classroom sessions.
> - 2.5. Provide manual attendance marking and status correction capabilities supported by an immutable administrative audit trail.
> 
> **3. Develop dedicated, responsive Role-Based Access Portals:**
> - 3.1. **Administrator Portal:** Manage academic years, semesters, departments, courses, sections, subjects, user accounts, audit trails, and automated database backups.
> - 3.2. **Teacher Portal:** Manage class sessions, launch dynamic QR scanners, monitor real-time presence, review excuse submissions, and export master attendance sheets.
> - 3.3. **Student Portal:** Scan attendance QR codes, verify physical presence, view attendance streaks and rates, review daily schedules, and submit excuse applications.
> - 3.4. **Parent/Guardian Portal:** Enable verified two-step child linking via Student ID and OTP, monitor child attendance metrics, track warnings, and submit excuse letters with medical attachments.
> 
> **4. Develop an automated excuse management and academic warning pipeline:**
> - 4.1. Provide a digital excuse filing workflow supporting file attachments (medical certificates, excuse slips).
> - 4.2. Enable instructor review, feedback notes, and automated attendance status overrides (`excused`).
> - 4.3. Implement automated tiered absence warnings (Warning Level 1, Warning Level 2 / Probation, Drop Alert) triggered when absences approach institutional thresholds.
> 
> **5. Implement multi-channel communications and institutional analytics:**
> - 5.1. Implement real-time notifications via in-app feeds, browser-native Web Push notifications (VAPID service workers), and Philippine SMS text messages via the Semaphore API.
> - 5.2. Generate comprehensive attendance analytics and exportable reports in standard PDF and Microsoft Excel formats.

---

### 5. Proposed System Description

#### What to Add:
Expand the description of the four core user roles to reflect the rich user interfaces and workflows built into your application:

1. **Administrator Portal:**
   * Central dashboard managing academic terms (Academic Year & Semester switcher).
   * User management with role segregation (`admin`, `teacher`, `student`, `parent`).
   * Curricular structure: Departments (CCS, CBA, CAS, CED, CCJE), Courses, Sections, Subjects, and Room Geofence coordinates.
   * Security & compliance: Audit trails of attendance corrections, account lockouts, and automated database backup generation/restoration.
2. **Teacher / Instructor Portal:**
   * Live class session controller with dynamic QR code projection.
   * Real-time roster monitor showing students Present, Late, Absent, or Unreliable GPS.
   * Excuse review center with single-click approve/reject and teacher notes.
   * Class schedule timetable and grade-sheet report generator (Excel/PDF).
3. **Student Portal:**
   * Mobile-first responsive scanner with camera permissions and GPS telemetry.
   * Continuous Presence Guardian widget maintaining session heartbeat.
   * Personal analytics dashboard: Attendance rate %, streak counter (🔥), and subject schedules.
   * Account security center: WebAuthn biometric enrollment, device binding status, and recovery codes.
4. **Parent / Guardian Portal:**
   * Multi-student switcher tabs for parents with multiple enrolled children.
   * 2-Step child linking wizard requiring Student ID and OTP authorization.
   * Attendance KPI cards: Rate %, Present, Late, Absent, and Pending Excuses.
   * Academic warning notice feed with direct "Submit Excuse" shortcut buttons.
   * One-click downloadable student attendance PDF reports.

---

### 6. Scope and Delimitation (Inclusions & Delimitations)

#### Expand the Scope Section (Lines 98–140) to include:
* **Attendance Security Scope:**
  * Dynamic rolling QR codes with 300-second cryptographic validity and token cache grace period.
  * Haversine formula calculation for server-side distance validation against campus coordinates.
  * Velocity-based teleportation check ($>40\text{ m/s}$) to block simulated GPS software.
  * Background presence heartbeat monitoring during scheduled class duration.
  * Teacher/Admin attendance correction audit log (`AttendanceCorrection`).
* **Authentication Scope:**
  * FIDO2 / WebAuthn passwordless biometric authentication (Windows Hello, Touch ID, Android Biometrics).
  * Hardware device binding using client fingerprinting and persistent HTTP-only tokens.
  * Two-factor OTP verification for registration and child linking.
  * 10 single-use cryptographically hashed emergency recovery codes.
* **Communication Scope:**
  * Multi-channel delivery: In-app notification center, VAPID Web Push (Service Worker API), and Philippine SMS via Semaphore API.
  * Automated academic warnings (Warning 1, Probation, Drop Notice) based on accumulated unexcused absences.
* **Reporting Scope:**
  * Exportable reports formatted for PDF and Microsoft Excel (CSV/XLSX).

#### Refine the Limitations / Delimitations Section (Lines 140–151):
* **Network Requirement:** Attendance recording, live token rotation, and GPS coordinates verification require an active internet connection on the student's mobile device or campus Wi-Fi.
* **GPS Signal Quality:** Geolocation accuracy relies on client device hardware and line-of-sight to GPS satellites; indoor structures with extreme signal degradation are mitigated using accuracy thresholds ($>150\text{m}$) to avoid false absence marking.
* **Biometric Hardware Compatibility:** WebAuthn biometrics requires devices and web browsers supporting the FIDO2 Web Authentication API. Devices lacking biometric hardware automatically utilize password and OTP authentication.
* **Data Privacy Compliance (RA 10173):** In compliance with national data privacy standards, the system does not store or process raw fingerprint images, facial templates, or biometric files on the server; biometrics remain sealed within the user's platform authenticator.
* **Functional Boundaries:** The system focuses strictly on classroom attendance, presence verification, schedule monitoring, and excuse processing; it does not handle student grading, tuition billing, or school fee collection.

---

## 7. Anticipated Defense Questions & Recommended Answers

Below are the most common questions panel members ask during Title/Capstone Defenses, along with your exact, bulletproof technical answers based on your codebase:

---

### Question 1: *"What stops a student from taking a photo of the QR code and texting it to a friend at home?"*
> **Your Answer:**  
> *"Our system uses **Dynamic Rotating Cryptographic QR Codes** generated by `QrSessionService`. The QR token is not static—it automatically expires and rotates every 5 minutes. More importantly, scanning the QR code is only Step 1 of a multi-tier verification process: Step 2 performs server-side **GPS Geofencing** using the Haversine formula to confirm the scanner is physically within the classroom radius ($50\text{m}$), and Step 3 verifies **Hardware Device Binding** to confirm the scan originates from the student's registered smartphone. Even if an off-campus student receives a picture of the QR code, the transaction will fail geolocation and device checks."*

---

### Question 2: *"What if a student uses a 'Fake GPS' or 'Mock Location' app to simulate being in class?"*
> **Your Answer:**  
> *"Our server performs two layers of GPS validation in `QrAttendanceController`:  
> First, it checks **GPS accuracy metadata**; low-accuracy or simulated spoofed coordinates are flagged.  
> Second, it executes **Velocity Anomaly Detection**: if a student's recorded location leaps over 200 meters within a few seconds (exceeding $40\text{ m/s}$ or $144\text{ km/h}$), the system recognizes an impossible physical movement, flags the transaction for GPS spoofing, and logs a warning for the instructor."*

---

### Question 3: *"Are you storing students' fingerprints in your database? How does this comply with the Data Privacy Act (RA 10173)?"*
> **Your Answer:**  
> *"No raw fingerprint images or biometric templates are ever sent to our servers or stored in our database. We implemented the **FIDO2 / WebAuthn standard** (`WebauthnService`). Biometric verification happens entirely on the user's local device hardware (via Touch ID, Windows Hello, or Android Fingerprint). The device only exchanges an asymmetric public key and cryptographic signature with our server. This ensures 100% compliance with the **Philippine Data Privacy Act of 2012 (RA 10173)**."*

---

### Question 4: *"What if a parent in a rural area does not have a smartphone or active mobile data to check the web portal?"*
> **Your Answer:**  
> *"To ensure accessibility for all families regardless of internet access, our system integrates the **Semaphore SMS Gateway API** (`SemaphoreService`). When a student incurs an unexcused absence or emergency notification, the system automatically sends a direct SMS text message to the parent's registered Philippine mobile phone number (`09...`)."*

---

### Question 5: *"Can any parent create an account and snoop on another student's attendance?"*
> **Your Answer:**  
> *"No. Our Parent Portal enforces a **Two-Step Child Linking Wizard** (`link-child.blade.php`). A parent must know the student's unique institutional Student ID and must verify the link using a **time-sensitive 6-digit OTP code** delivered directly to the student's registered contact information before any academic records can be accessed."*

---

### Question 6: *"What happens if a student forgets their phone, or their phone battery dies?"*
> **Your Answer:**  
> *"The instructor's portal provides an authorized **Manual Attendance Override** feature. When an instructor manually marks a student present or excused, the system records the transaction in the `AttendanceCorrection` audit log, tracking the teacher's ID, previous status, updated status, timestamp, and justification note for administrative transparency."*

---

## Summary Checklist for your Google Doc

- [ ] **Title & Affiliation:** Standardize whether the manuscript specifies *Osmeña Colleges – Mobo Campus* or *Osmeña Colleges*.
- [ ] **Background:** Replace generic descriptions with *Dynamic Rotating QR Codes*, *GPS Geofencing*, and *WebAuthn Biometrics*.
- [ ] **Statement of the Problem:** Reorganize into the 5 coherent research questions outlined above.
- [ ] **Specific Objectives:** Align 1-to-1 with the Statement of the Problem.
- [ ] **Scope:** Add *Dynamic QR Token Rotation*, *Velocity Anti-Spoofing*, *Presence Guardian*, *SMS Gateway*, *2-Step Parent OTP Linking*, and *Academic Warnings*.
- [ ] **Delimitations:** Add note explicitly confirming compliance with RA 10173 (client-side biometrics).
