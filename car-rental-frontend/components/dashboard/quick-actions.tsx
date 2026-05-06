import type React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { useState } from "react"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT  = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN = "#22C55E"
const G_GLOW = "rgba(34,197,94,0.25)"

interface QuickActionsProps {
  actions: {
    label: string
    href: string
    icon?: React.ReactNode
  }[]
}

function ActionBtn({ label, href, icon }: { label: string; href: string; icon?: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <button
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "9px 18px", borderRadius: 10, border: "none",
          fontFamily: FONT, fontSize: 13, fontWeight: 600,
          background: hov ? "#16A34A" : GREEN,
          color: "#fff", cursor: "pointer",
          boxShadow: hov ? `0 0 24px ${G_GLOW}` : `0 0 12px rgba(34,197,94,0.15)`,
          transform: hov ? "translateY(-1px)" : "none",
          transition: "all 0.2s",
        }}
      >
        {icon ?? <Plus size={14} />}
        {label}
      </button>
    </Link>
  )
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {actions.map((action) => (
        <ActionBtn key={action.href} label={action.label} href={action.href} icon={action.icon} />
      ))}
    </div>
  )
}