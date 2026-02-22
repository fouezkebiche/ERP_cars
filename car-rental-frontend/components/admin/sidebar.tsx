"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Building2, Users, BarChart2, Settings,
  ChevronLeft, ChevronRight, Shield, Zap,Car ,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/companies", icon: Building2, label: "Companies" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/admin/reports",    icon: Car, label: "Trending Vehicles" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
]

interface Props {
  open: boolean
  onToggle: () => void
}

export function AdminSidebar({ open, onToggle }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className="relative flex flex-col transition-all duration-300 shrink-0"
      style={{
        width: open ? 240 : 64,
        background: "linear-gradient(180deg, #0d0d14 0%, #0a0a0f 100%)",
        borderRight: "1px solid rgba(129,140,248,0.12)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 overflow-hidden"
        style={{ borderBottom: "1px solid rgba(129,140,248,0.08)" }}
      >
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #c084fc, #818cf8)" }}
        >
          <Shield size={16} className="text-white" />
        </div>
        {open && (
          <div className="overflow-hidden whitespace-nowrap">
            <p className="text-white font-bold text-sm leading-tight tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>
              CarManager
            </p>
            <p className="text-xs" style={{ color: "rgba(129,140,248,0.6)", fontFamily: "monospace" }}>
              Platform Admin
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-150 group relative overflow-hidden"
              style={{
                background: active ? "rgba(129,140,248,0.12)" : "transparent",
                borderLeft: active ? "2px solid #c084fc" : "2px solid transparent",
                marginLeft: 0,
              }}
            >
              {/* Glow on active */}
              {active && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 0% 50%, rgba(192,132,252,0.08) 0%, transparent 70%)" }}
                />
              )}
              <Icon
                size={18}
                className="shrink-0 transition-colors"
                style={{ color: active ? "#c084fc" : "rgba(255,255,255,0.45)" }}
              />
              {open && (
                <span
                  className="text-sm font-medium whitespace-nowrap transition-colors"
                  style={{
                    color: active ? "#e2e8f0" : "rgba(255,255,255,0.45)",
                    fontFamily: "monospace",
                    letterSpacing: "0.02em",
                  }}
                >
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-3 pb-4 pt-3"
        style={{ borderTop: "1px solid rgba(129,140,248,0.08)" }}
      >
        {open && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-md mb-3"
            style={{ background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.15)" }}
          >
            <Zap size={14} style={{ color: "#c084fc" }} />
            <span className="text-xs font-semibold" style={{ color: "#c084fc", fontFamily: "monospace" }}>
              SUPER ADMIN
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center rounded-md h-8 transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          title={open ? "Collapse" : "Expand"}
        >
          {open ? (
            <ChevronLeft size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
          ) : (
            <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
          )}
        </button>
      </div>
    </aside>
  )
}