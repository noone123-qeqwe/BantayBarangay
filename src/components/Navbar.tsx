"use client";

import React, { useState, useEffect } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  ShieldAlert,
  Bell,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  MapPin,
  FileText,
  Settings,
  Menu,
  X,
  User,
  ExternalLink,
  PhoneCall,
  Maximize,
  Minimize,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Failed to fetch notification count", err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 20000);
    return () => clearInterval(interval);
  }, [user]);

  // Close mobile drawer when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isStaff = user && ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(user.role);
  const isAdmin = user && ["ADMIN", "SUPER_ADMIN"].includes(user.role);
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(pathname);

  if (pathname === "/") {
    return null;
  }

  return (
    <header
      className={`site-header ${isAuthPage ? "login-header" : ""}`}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backgroundColor: "var(--bg-glass)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--border-subtle)",
        height: "var(--header-height)",
        display: "flex",
        alignItems: "center",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {/* Top Vibrant Civic Gradient Strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(90deg, #2563eb 0%, #06b6d4 50%, #10b981 100%)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 16px",
        }}
      >
        {/* Brand Logo & Name */}
        <NextLink
          href={user ? "/dashboard" : "/"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <img
            src="/logo.png"
            alt="BantayBarangay Official Logo"
            width={36}
            height={36}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
              flexShrink: 0,
              objectFit: "contain",
            }}
          />

          <div>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.25rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
                lineHeight: 1.1,
              }}
            >
              Bantay<span style={{ color: "var(--primary)" }}>Barangay</span>
            </div>
          </div>
        </NextLink>

        {/* Desktop Capsule Navigation */}
        <nav
          style={{
            display: "none",
            alignItems: "center",
            gap: "10px",
          }}
          className="desktop-nav"
        >
          {user ? (
            <>
              <div className="nav-capsule">
                <NextLink
                  href="/dashboard"
                  className={`nav-pill ${pathname === "/dashboard" ? "active" : ""}`}
                >
                  <LayoutDashboard size={15} />
                  <span>Dashboard</span>
                </NextLink>

                <NextLink
                  href="/reports"
                  className={`nav-pill ${pathname === "/reports" ? "active" : ""}`}
                >
                  <FileText size={15} />
                  <span>{isStaff ? "Report Queue" : "My Reports"}</span>
                </NextLink>

                <NextLink
                  href="/map"
                  className={`nav-pill ${pathname === "/map" ? "active" : ""}`}
                >
                  <MapPin size={15} />
                  <span>Community Map</span>
                </NextLink>

                {isAdmin && (
                  <NextLink
                    href="/admin"
                    className={`nav-pill ${pathname.startsWith("/admin") ? "active" : ""}`}
                  >
                    <Settings size={15} />
                    <span>Admin Console</span>
                  </NextLink>
                )}
              </div>

              <NextLink
                href="/reports/new"
                className="nav-cta"
              >
                <PlusCircle size={15} />
                <span>+ Report Issue</span>
              </NextLink>
            </>
          ) : !isAuthPage ? (
            <>
              <div className="nav-capsule">
                <NextLink
                  href="/#how-it-works"
                  className={`nav-pill ${pathname === "/" ? "active" : ""}`}
                >
                  How It Works
                </NextLink>
                <NextLink
                  href="/map"
                  className={`nav-pill ${pathname === "/map" ? "active" : ""}`}
                >
                  <MapPin size={15} />
                  <span>Community Map</span>
                </NextLink>
              </div>
            </>
          ) : null}
        </nav>

        {/* Desktop User Right Section */}
        <div className="desktop-header-right" style={{ display: "none", alignItems: "center", gap: "10px" }}>
          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="btn-icon btn-secondary"
            title={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
            aria-label={isFullscreen ? "Exit Full Screen" : "Enter Full Screen"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid var(--border-subtle)",
              color: isFullscreen ? "var(--primary)" : "var(--text-secondary)",
              cursor: "pointer",
              width: "36px",
              height: "36px",
            }}
          >
            {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>

          {user ? (
            <>
              {/* Notification Bell with Badge */}
              <NextLink
                href="/notifications"
                className="btn-icon btn-secondary"
                aria-label="View notifications"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      backgroundColor: "var(--priority-critical)",
                      color: "#ffffff",
                      fontSize: "0.688rem",
                      fontWeight: 800,
                      minWidth: "18px",
                      height: "18px",
                      borderRadius: "9999px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      border: "2px solid var(--bg-surface)",
                      boxShadow: "0 2px 6px rgba(220, 38, 38, 0.4)",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </NextLink>

              {/* User Profile Pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 12px 4px 6px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid var(--border-subtle)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <img
                  src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                  alt={user.name}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: "1.5px solid #ffffff",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.813rem", fontWeight: 700, lineHeight: 1.1 }}>
                    {user.name.split(" ")[0]}
                  </span>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 800,
                      color: isStaff ? "var(--primary)" : "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  style={{
                    marginLeft: "4px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "50%",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--priority-critical)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : isAuthPage ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <a
                href="tel:0286431111"
                title="Call Emergency Hotline"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#fca5a5",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
                  transition: "all 0.15s ease",
                }}
              >
                <PhoneCall size={12} style={{ color: "#ef4444" }} />
                <span>Hotline</span>
              </a>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <NextLink
                href="/login"
                className={`nav-pill ${pathname === "/login" ? "active-outline" : ""}`}
                style={{
                  border: "1px solid var(--border-medium)",
                  backgroundColor: pathname === "/login" ? "var(--primary-light)" : "transparent",
                  color: pathname === "/login" ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.813rem",
                  padding: "6px 14px",
                }}
              >
                Login
              </NextLink>
              <NextLink
                href="/register"
                className="nav-cta"
                style={{
                  padding: "6px 16px",
                  fontSize: "0.813rem",
                  fontWeight: 700,
                }}
              >
                Register
              </NextLink>
            </div>
          )}

        </div>

        {/* Mobile Header Actions */}
        <div className="mobile-header-actions" style={{ display: "none", alignItems: "center", gap: "8px" }}>
          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid var(--border-subtle)",
              color: isFullscreen ? "var(--primary)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>
          {/* Emergency Hotline is accessible on mobile */}
          <a
            href="tel:0286431111"
            title="Call Emergency Hotline"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 10px",
              borderRadius: "9999px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.45)",
              color: "#fca5a5",
              fontSize: "0.72rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.2)",
            }}
          >
            <PhoneCall size={11} style={{ color: "#ef4444" }} />
            <span>Hotline</span>
          </a>

          {user ? (
            <>
              {/* Mobile Notification Bell */}
              <NextLink
                href="/notifications"
                aria-label="View notifications"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  textDecoration: "none",
                }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      backgroundColor: "var(--priority-critical)",
                      color: "#ffffff",
                      fontSize: "0.625rem",
                      fontWeight: 800,
                      minWidth: "16px",
                      height: "16px",
                      borderRadius: "9999px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 3px",
                      border: "1.5px solid var(--bg-surface)",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </NextLink>

              {/* Citizen Avatar */}
              <NextLink
                href="/profile"
                aria-label="Profile and Settings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "2px solid rgba(56, 189, 248, 0.5)",
                  overflow: "hidden",
                  backgroundColor: "var(--bg-subtle)",
                }}
              >
                <img
                  src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                  alt={user.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </NextLink>
            </>
          ) : !isAuthPage ? (
            <div style={{ display: "flex", gap: "6px" }}>
              <NextLink
                href="/login"
                className="btn btn-sm btn-primary"
                style={{ borderRadius: "9999px", padding: "5px 12px", fontSize: "0.75rem", fontWeight: 700 }}
              >
                Sign In
              </NextLink>
            </div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 960px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-header-right {
            display: flex !important;
          }
        }
        @media (max-width: 959px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-header-right {
            display: none !important;
          }
          .mobile-header-actions {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
