"use client"
import { AlertTriangle, CheckCircle, MapPin } from "lucide-react"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const SURFACE = "rgba(255,255,255,0.04)"
const BORDER  = "rgba(255,255,255,0.07)"

interface KmUsageProgressProps {
  kmDriven: number
  kmAllowed: number
  dailyLimit?: number
  tierBonus?: number
  className?: string
}

export function KmUsageProgress({
  kmDriven,
  kmAllowed,
  dailyLimit,
  tierBonus,
  className = "",
}: KmUsageProgressProps) {
  // ── logic unchanged ──────────────────────────────────────────
  const percentage    = (kmDriven / kmAllowed) * 100
  const isNearLimit   = percentage >= 75
  const isOverLimit   = percentage >= 100

  const getBarColor = () => {
    if (isOverLimit)  return "#EF4444"
    if (isNearLimit)  return "#F59E0B"
    return "#22C55E"
  }
  const getTextColor = () => {
    if (isOverLimit)  return "#F87171"
    if (isNearLimit)  return "#FCD34D"
    return "#4ADE80"
  }
  const getIcon = () => {
    if (isOverLimit)  return <AlertTriangle size={14} color="#F87171" />
    if (isNearLimit)  return <AlertTriangle size={14} color="#FCD34D" />
    return <CheckCircle size={14} color="#4ADE80" />
  }
  // ────────────────────────────────────────────────────────────

  return (
    <div className={className} style={{ fontFamily: FONT, color: "#fff", display: "flex", flexDirection: "column", gap: 8 }}>

      {/* header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#9CA3AF" }}>
          <MapPin size={13} />
          <span style={{ fontWeight: 600 }}>KM Usage</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {getIcon()}
          <span style={{ fontWeight: 700, color: getTextColor() }}>
            {kmDriven.toLocaleString()} / {kmAllowed.toLocaleString()} km
          </span>
        </div>
      </div>

      {/* track */}
      <div style={{ position: "relative", width: "100%", height: 7, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: getBarColor(),
          width: `${Math.min(percentage, 100)}%`,
          transition: "width 0.4s ease",
          boxShadow: `0 0 8px ${getBarColor()}80`,
        }} />
      </div>

      {/* footer row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF" }}>
        <span>{percentage.toFixed(1)}% used</span>
        {percentage < 100 ? (
          <span>{(kmAllowed - kmDriven).toLocaleString()} km remaining</span>
        ) : (
          <span style={{ color: "#F87171", fontWeight: 700 }}>
            {(kmDriven - kmAllowed).toLocaleString()} km over limit!
          </span>
        )}
      </div>

      {/* tier bonus chip */}
      {tierBonus && tierBonus > 0 && (
        <div style={{
          fontSize: 11, padding: "6px 10px", borderRadius: 8,
          background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)",
          color: "#93C5FD", fontWeight: 600,
        }}>
          ✨ Loyalty bonus: +{tierBonus} km/day included
        </div>
      )}

      {/* daily limit line */}
      {dailyLimit && (
        <div style={{ fontSize: 11, color: "#6B7280" }}>
          Daily limit: {dailyLimit.toLocaleString()} km/day
          {tierBonus ? ` (${dailyLimit - tierBonus} base + ${tierBonus} bonus)` : ""}
        </div>
      )}
    </div>
  )
}