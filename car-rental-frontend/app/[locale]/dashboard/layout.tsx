"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import {
  LayoutDashboard, Car, Users, FileText, CreditCard,
  BarChart3, Settings, Menu, X, LogOut, UserCircle,
  ChevronDown, Wallet,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { CompanyProvider } from "@/context/CompanyContext"
import { PermissionGate, RoleDisplay } from "@/components/auth/ProtectedRoute"
import TrialBanner from "@/components/subscription/TrialBanner"
import TrialExpiredOverlay from "@/components/subscription/TrialExpiredOverlay"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "@/components/LanguageSwitcher"

/* ─── tokens ──────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const G_DIM   = "rgba(34,197,94,0.11)"
const G_GLOW  = "rgba(34,197,94,0.22)"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"
const BG      = "#080B10"
const SIDEBAR_W = 252

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const params   = useParams()
  const locale   = params.locale as string
  const { user, logout } = useAuth()
  const t    = useTranslations("nav_dashboard")
  const tTop = useTranslations("topbar")

  const navItems = [
    { label: t("dashboard"),  href: `/${locale}/dashboard`,            icon: LayoutDashboard, permissions: ["view_dashboard"] },
    { label: t("vehicles"),   href: `/${locale}/dashboard/vehicles`,   icon: Car,             permissions: ["view_vehicles"] },
    { label: t("customers"),  href: `/${locale}/dashboard/customers`,  icon: Users,           permissions: ["view_customers"] },
    { label: t("contracts"),  href: `/${locale}/dashboard/contracts`,  icon: FileText,        permissions: ["view_contracts"] },
    { label: t("payments"),   href: `/${locale}/dashboard/payments`,   icon: CreditCard,      permissions: ["view_payments"] },
    { label: t("analytics"),  href: `/${locale}/dashboard/analytics`,  icon: BarChart3,       permissions: ["view_analytics"] },
    { label: t("hr"),         href: `/${locale}/dashboard/hr`,         icon: UserCircle,      roles: ["owner","admin","manager"] },
    { label: t("attendance"), href: `/${locale}/dashboard/attendance`, icon: UserCircle,      roles: ["owner","admin","manager","receptionist"] },
    { label: t("payroll"),    href: `/${locale}/dashboard/payroll`,    icon: Wallet,          roles: ["owner","admin","accountant"] },
    { label: t("settings"),   href: `/${locale}/dashboard/settings`,   icon: Settings,        permissions: ["manage_settings"] },
  ]

  const isActive = (href: string) => {
    if (href === `/${locale}/dashboard`) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <CompanyProvider>
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: FONT, display: "flex" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
        @keyframes slideIn { from { transform:translateX(-100%); } to { transform:translateX(0); } }
        .nav-item-hover:hover { background: rgba(255,255,255,0.05) !important; color: #fff !important; }
      `}</style>

      {/* ── MOBILE OVERLAY ─────────────────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        />
      )}

      {/* ── SIDEBAR ────────────────────────────────────────── */}
      <aside style={{
        position: "fixed", top: 0, left: 0, zIndex: 50,
        width: SIDEBAR_W, height: "100vh",
        background: "rgba(10,14,20,0.98)",
        borderRight: `1px solid ${BORDER}`,
        display: "flex", flexDirection: "column",
        transform: sidebarOpen ? "translateX(0)" : undefined,
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
        className={`lg-sidebar`}
      >
        <style>{`
          .lg-sidebar { transform: translateX(-100%); }
          @media(min-width:1024px) { .lg-sidebar { transform: translateX(0) !important; } }
        `}</style>

        {/* logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <Link href={`/${locale}/dashboard`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(140deg,#22C55E,#15803D)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 18px ${G_GLOW}`, flexShrink: 0,
            }}>
              <Car size={15} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.03em", color: "#fff" }}>CarManager</span>
          </Link>
        </div>

        {/* nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map((item) => {
              const Icon    = item.icon
              const active  = isActive(item.href)
              return (
                <PermissionGate key={item.href} permissions={(item as any).permissions} roles={(item as any).roles}>
                  <li>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        display: "flex", alignItems: "center", gap: 11,
                        padding: "9px 12px", borderRadius: 10, textDecoration: "none",
                        background: active ? G_DIM : "transparent",
                        border: `1px solid ${active ? "rgba(34,197,94,0.2)" : "transparent"}`,
                        color: active ? GREEN : "#9CA3AF",
                        fontWeight: active ? 600 : 400, fontSize: 13.5,
                        transition: "all 0.18s",
                      }}
                      className={active ? "" : "nav-item-hover"}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                      {active && (
                        <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                      )}
                    </Link>
                  </li>
                </PermissionGate>
              )
            })}
          </ul>
        </nav>

        {/* user profile */}
        <div style={{ padding: "10px", borderTop: `1px solid ${BORDER}`, position: "relative" }}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, background: "transparent",
              border: `1px solid ${userMenuOpen ? BORDER : "transparent"}`,
              cursor: "pointer", transition: "all 0.18s", fontFamily: FONT,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.borderColor = BORDER }}
            onMouseLeave={e => { if (!userMenuOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent" } }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <UserCircle size={17} color={GREEN} />
            </div>
            <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.full_name}
              </p>
              <div style={{ marginTop: 2 }}>
                <RoleDisplay />
              </div>
            </div>
            <ChevronDown size={13} color="#6B7280" style={{ transform: userMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
          </button>

          {userMenuOpen && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 6px)", left: 10, right: 10,
              background: "#0E1117", border: `1px solid ${BORDER}`, borderRadius: 12,
              overflow: "hidden", boxShadow: "0 -16px 40px rgba(0,0,0,0.5)",
              animation: "fadeIn 0.15s ease",
            }}>
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, wordBreak: "break-all" }}>{user?.email}</p>
              </div>
              <button
                onClick={logout}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", background: "transparent", border: "none",
                  cursor: "pointer", color: "#F87171", fontSize: 13, fontFamily: FONT,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }} className="main-offset">
        <style>{`
          @media(min-width:1024px) { .main-offset { padding-left: ${SIDEBAR_W}px; } }
        `}</style>

        {/* topbar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "rgba(8,11,16,0.9)", backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", height: 58,
        }}>
          {/* mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}
            className="lg-hide"
          >
            <style>{`@media(min-width:1024px) { .lg-hide { display: none !important; } }`}</style>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* page title — mobile only */}
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0, letterSpacing: "-0.02em" }} className="lg-hide">
            {navItems.find((item) => isActive(item.href))?.label || t("dashboard")}
          </h2>

          {/* right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
            <div style={{ display: "none" }} className="lg-flex">
              <style>{`@media(min-width:1024px) { .lg-flex { display: flex !important; align-items: center; gap: 8px; } }`}</style>
              <span style={{ fontSize: 12, color: "#9CA3AF", fontFamily: FONT }}>{tTop("loggedInAs")}</span>
              <RoleDisplay />
            </div>

            {/* subtle divider */}
            <div style={{ width: 1, height: 20, background: BORDER }} className="lg-flex" />

            <LanguageSwitcher />
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px 24px" }}>
          <TrialBanner />
          <TrialExpiredOverlay>
            {children}
          </TrialExpiredOverlay>
        </main>
      </div>
    </div>
    </CompanyProvider>
  )
}