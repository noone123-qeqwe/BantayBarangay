# BantayBarangay Mobile App Guide

BantayBarangay is engineered with a **dual-tier mobile application architecture**:
1. **Tier 1: Progressive Web App (PWA)** — Installable on any smartphone (Android or iOS) directly from the browser without an app store account.
2. **Tier 2: Capacitor Native Mobile Packaging** — Ready to compile into a native Android APK or Google Play Store bundle.

---

## 1. Instant Smartphone Installation (PWA)

### For Android Users (Chrome / Edge / Samsung Internet)
1. Open `http://<your-host>:3000` (or your live domain) in Chrome or Edge.
2. An **"Install BantayBarangay App"** banner will automatically appear at the bottom of the screen.
3. Tap **"Install App"**.
4. Confirm the installation prompt.
5. The **BantayBarangay** app icon will appear on your home screen and app drawer. Tapping it opens the app in **standalone full-screen mode** with no browser address bar or navigation buttons.

### For iPhone & iPad Users (Safari)
1. Open the website in **Safari**.
2. Tap the **Share** button (box with an upward arrow `⎋`) at the bottom of the screen.
3. Scroll down and tap **"Add to Home Screen"** (`⊞`).
4. Tap **Add** in the top-right corner.
5. The app will launch like a native iOS application, complete with safe-area notch adaptation and custom splash styling.

### For Desktop Users (Chrome / Edge / Brave)
1. In the browser address bar, click the **Install** icon (computer monitor with a downward arrow).
2. Click **Install**.
3. BantayBarangay runs in its own dedicated, standalone desktop window.

---

## 2. App-Specific Features

* **Standalone App Bar (`AppHeader.tsx`)**:
  - Displays back navigation, active screen title, and live online/offline network indicator dot.
  - Quick-dial emergency hotline shortcut to Pasig Emergency Dispatch: `(02) 8643-1111`.
* **Offline Reporting Outbox (`offlineQueue.ts`)**:
  - If you encounter a problem in an area with poor signal or an outage, you can still fill out and submit your report.
  - The report is securely saved to your local device **Offline Outbox**.
  - As soon as your internet connectivity is restored, the service worker and background sync automatically submit the report and notify you with your official Reference Number!
* **Safe Area & Ergonomics**:
  - Form inputs are sized at 16px to prevent iOS Safari auto-zoom.
  - Rubber-band overscroll bouncing is contained.
  - Safe area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) ensure notch and home-indicator protection.
* **App Shortcuts**:
  - Long-press the home screen app icon to quickly jump to:
    - 🚨 *Report an Issue*
    - 🗺️ *Community Map*
    - 📋 *My Reports*
    - 🔔 *Alerts*

---

## 3. Native Android APK Generation (Capacitor)

If you want to compile BantayBarangay into an installable Android APK (`.apk`) or Play Store bundle (`.aab`):

### Prerequisites
- Node.js 18+
- Android Studio with Android SDK 34+
- Java JDK 17+

### Build Steps

1. **Install Capacitor dependencies** (if not already installed):
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```

2. **Initialize & Sync Android Project**:
   ```bash
   npx cap add android
   npx cap sync android
   ```

3. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

4. **Build APK in Android Studio**:
   - In Android Studio, go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
   - The generated debug APK will be located at:
     `android/app/build/outputs/apk/debug/app-debug.apk`

5. **Direct Command Line Build (Alternative)**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

The resulting `.apk` can be transferred and installed on any Android smartphone directly.
