"use client"

import { usePathname } from "next/navigation"
import { Menu, RefreshCw, Bell } from "lucide-react"

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/admin": { title: "Platform Overview", subtitle: "Monitor all companies & platform health" },
  "/admin/companies": { title: "Companies", subtitle: "Manage tenant companies and subscriptions" },
  "/admin/users": { title: "Users", subtitle: "All users across the platform" },
  "/admin/analytics": { title: "Analytics", subtitle: "Platform growth & revenue insights" },
  "/admin/settings": { title: "Settings", subtitle: "Platform configuration" },
}

interface Props {
  onMenuClick: () => void
}

export function AdminTopbar({ onMenuClick }: Props) {
  const pathname = usePathname()
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
          title="Refresh"
        >
          <RefreshCw size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
        <button className="relative p-1.5 rounded-md transition-colors hover:bg-white/5">
          <Bell size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: "#c084fc" }}
          />
        </button>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ml-2"
          style={{ background: "linear-gradient(135deg, #c084fc, #818cf8)", color: "white", fontFamily: "monospace" }}
        >
          SA
        </div>
      </div>
    </header>
  )
}