import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { AiAssistantProvider } from "@/context/AiAssistantContext";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import OfflineIndicator from "@/components/OfflineIndicator";
import AiAssistantWidget from "@/components/AiAssistantWidget";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import AppInstallPrompt from "@/components/AppInstallPrompt";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "BantayBarangay - Civic Infrastructure Reporting & Tracking Platform",
  description:
    "Report road potholes, broken streetlights, electrical hazards, flooding, and clogged drainage in your barangay with live transparent tracking.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BantayBarangay",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
  },
};

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BantayBarangay" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <AiAssistantProvider>
              <ServiceWorkerRegistration />
              <OfflineIndicator />
              <AppHeader />
              <Navbar />
              <div className="app-container">
                <Sidebar />
                <main className="main-content">{children}</main>
              </div>
              <BottomNav />
              <AiAssistantWidget />
              <AppInstallPrompt />
            </AiAssistantProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
