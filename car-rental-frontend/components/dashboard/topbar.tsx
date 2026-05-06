"use client"
import { Bell, Menu, Search, User, Settings, ChevronDown, LogOut } from "lucide-react"
import { LogoutButton } from "@/components/LogoutButton"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "@/components/LanguageSwitcher"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

interface DashboardTopbarProps {
  onMenuClick: () => void
}

export function DashboardTopbar({ onMenuClick }: DashboardTopbarProps) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("topbar")

  // ── logic unchanged ──────────────────────────────────────────
  const [userName,  setUserName]  = useState("User")
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setUserName(user.full_name || user.email || "User")
        setUserEmail(user.email || "")
      } catch (e) {
        console.error("Failed to parse user from localStorage")
      }
    }
  }, [])
  // ────────────────────────────────────────────────────────────

  const [searchFocus,   setSearchFocus]   = useState(false)
  const [dropdownOpen,  setDropdownOpen]  = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <header style={{
      height: 58, borderBottom: `1px solid ${BORDER}`,
      background: "rgba(8,11,16,0.9)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px", fontFamily: FONT, color: "#fff",
      position: "sticky", top: 0, zIndex: 30, flexShrink: 0,
    }}>

      {/* ── left: hamburger + search ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        {/* mobile menu button */}
        <button
          onClick={onMenuClick}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#9CA3AF", padding: 6, borderRadius: 8, display: "flex",
            transition: "color 0.15s",
          }}
          className="md-hide"
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}
        >
          <style>{`@media(min-width:768px){ .md-hide{ display:none!important; } }`}</style>
          <Menu size={18} />
        </button>

        {/* search bar — desktop only */}
        <div style={{ position: "relative", maxWidth: 320, flex: 1, display: "none" }} className="md-search">
          <style>{`@media(min-width:768px){ .md-search{ display:block!important; } }`}</style>
          <Search size={13} color="#6B7280" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            type="search"
            placeholder={t("search")}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            style={{
              width: "100%", padding: "8px 12px 8px 34px",
              background: searchFocus ? "rgba(255,255,255,0.07)" : SURFACE,
              border: `1px solid ${searchFocus ? "rgba(34,197,94,0.4)" : BORDER}`,
              borderRadius: 10, color: "#fff", fontFamily: FONT, fontSize: 13,
              outline: "none", transition: "all 0.2s",
            }}
          />
        </div>
      </div>

      {/* ── right: lang + bell + user ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LanguageSwitcher />

        {/* bell */}
        <button style={{
          position: "relative", background: "none", border: "none",
          cursor: "pointer", color: "#9CA3AF", padding: 7, borderRadius: 9,
          display: "flex", transition: "all 0.15s",
          background: "transparent",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.color = "#fff" }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9CA3AF" }}
        >
          <Bell size={16} />
          {/* red dot */}
          <span style={{
            position: "absolute", top: 6, right: 6,
            width: 7, height: 7, borderRadius: "50%",
            background: "#EF4444", border: "1.5px solid #080B10",
          }} />
        </button>

        {/* user dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 10px", borderRadius: 10, border: `1px solid ${dropdownOpen ? BORDER : "transparent"}`,
              background: dropdownOpen ? SURFACE : "transparent",
              cursor: "pointer", transition: "all 0.18s", fontFamily: FONT,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.borderColor = BORDER }}
            onMouseLeave={e => { if (!dropdownOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent" } }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <User size={14} color={GREEN} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName}
            </span>
            <ChevronDown size={12} color="#6B7280" style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 220, background: "#0E1117",
              border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden",
              boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
              animation: "tb-fade 0.15s ease",
            }}>
              <style>{`@keyframes tb-fade { from{ opacity:0; transform:translateY(4px) } to{ opacity:1; transform:none } }`}</style>

              {/* user info */}
              <div style={{ padding: "12px 14px", borderBottom: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{userName}</p>
                <p style={{ fontSize: 11, color: "#6B7280", wordBreak: "break-all" }}>{userEmail}</p>
              </div>

              {/* menu items */}
              {[
                { icon: Settings, label: t("profileSettings"), onClick: () => { router.push(`/${locale}/dashboard/settings`); setDropdownOpen(false) } },
                { icon: User,     label: t("companySettings"), onClick: () => { router.push(`/${locale}/dashboard/settings?tab=company`); setDropdownOpen(false) } },
              ].map(({ icon: Icon, label, onClick }) => (
                <DropItem key={label} icon={<Icon size={13} />} label={label} onClick={onClick} />
              ))}

              <div style={{ borderTop: `1px solid ${BORDER}`, padding: "6px 8px" }}>
                {/* LogoutButton logic is unchanged — we just restyle the wrapper area */}
                <LogoutButton
                  variant="ghost"
                  size="sm"
                  showIcon={true}
                  showConfirm={true}
                  className="w-full justify-start h-8"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

/* ── dropdown item helper ──────────────────────────────────────── */
function DropItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 9,
        padding: "9px 14px", background: hov ? "rgba(255,255,255,0.05)" : "transparent",
        border: "none", cursor: "pointer", color: hov ? "#fff" : "#9CA3AF",
        fontSize: 13, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        transition: "all 0.15s", textAlign: "left",
      }}
    >
      {icon}
      {label}
    </button>
  )
}