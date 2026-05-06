import type React from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const GREEN   = "#22C55E"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

interface KPICardProps {
  label: string
  value: string | number
  suffix?: string
  trend?: number
  icon?: React.ReactNode
  className?: string
}

export function KPICard({ label, value, suffix, trend, icon, className }: KPICardProps) {
  const isPositive = trend ? trend > 0 : false

  return (
    <div
      className={className}
      style={{
        padding: "20px 22px", borderRadius: 14,
        background: SURFACE, border: `1px solid ${BORDER}`,
        fontFamily: FONT, color: "#fff",
        transition: "border-color 0.2s, transform 0.2s",
        cursor: "default",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(34,197,94,0.28)"
        e.currentTarget.style.transform = "translateY(-1px)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = BORDER
        e.currentTarget.style.transform = "none"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 8, letterSpacing: "0.03em", textTransform: "uppercase" }}>
            {label}
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, color: "#fff" }}>
              {value}
            </span>
            {suffix && (
              <span style={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>{suffix}</span>
            )}
          </div>
        </div>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: GREEN, flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 12, fontWeight: 600,
          color: isPositive ? GREEN : "#F87171",
          padding: "3px 8px", borderRadius: 6,
          background: isPositive ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)",
        }}>
          {isPositive
            ? <ArrowUp size={12} />
            : <ArrowDown size={12} />}
          <span>{Math.abs(trend)}% from last month</span>
        </div>
      )}
    </div>
  )
}