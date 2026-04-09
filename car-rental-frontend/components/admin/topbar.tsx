"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Menu, RefreshCw, Bell, LogOut } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

interface Props {
  onMenuClick: () => void
}

export function AdminTopbar({ onMenuClick }: Props) {
  const t = useTranslations("admin")
  const pathname = usePathname()
  const { logout } = useAuth()

  const PAGE_META: Record<string, { title: string; subtitle: string }> = {
    "/admin": { title: t("platformOverview"), subtitle: t("platformOverviewSubtitle") },
    "/admin/companies": { title: t("companies"), subtitle: t("companiesSubtitle") },
    "/admin/users": { title: t("users"), subtitle: t("usersSubtitle") },
    "/admin/analytics": { title: t("analytics"), subtitle: t("analyticsSubtitle") },
    "/admin/settings": { title: t("settings"), subtitle: t("settingsSubtitle") },
  }

  const meta = PAGE_META[pathname] || { title: "Admin", subtitle: "" }

  return (
    <header
      className="flex items-center justify-between px-6 py-3 shrink-0"
      style={{
        height: 60,
        background: "#0d0d14",
        borderBottom: "1px solid rgba(129,140,248,0.1)",
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-md transition-colors hover:bg-white/5"
        >
          <Menu size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
        </button>
        <div>
          <h1 className="text-white font-bold text-base leading-tight" style={{ fontFamily: "monospace", letterSpacing: "0.02em" }}>
            {meta.title}
          </h1>
          {meta.subtitle && (
            <p className="text-xs leading-tight" style={{ color: "rgba(129,140,248,0.6)", fontFamily: "monospace" }}>
              {meta.subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => window.location.reload()}
          className="p-1.5 rounded-md transition-colors hover:bg-white/5"
          title={t("refresh")}
        >
          <RefreshCw size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
        
        <button
          onClick={logout}
          className="p-1.5 rounded-md transition-colors hover:bg-white/5"
          title="Logout"
        >
          <LogOut size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
        
      </div>
    </header>
  )
}