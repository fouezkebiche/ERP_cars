"use client"
import { Award, Star, Crown, Zap } from "lucide-react"

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif"

interface CustomerTierBadgeProps {
  tier: 'NEW' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  tierName?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/* ── tier config — same logic, new colours tuned for dark bg ── */
const TIER_CONFIG = {
  NEW: {
    bg: "rgba(107,114,128,0.18)",
    border: "rgba(107,114,128,0.35)",
    color: "#D1D5DB",
    icon: Award,
    label: "New",
  },
  BRONZE: {
    bg: "rgba(194,120,60,0.18)",
    border: "rgba(194,120,60,0.4)",
    color: "#FCA97A",
    icon: Award,
    label: "Bronze",
  },
  SILVER: {
    bg: "rgba(156,163,175,0.18)",
    border: "rgba(156,163,175,0.35)",
    color: "#E5E7EB",
    icon: Star,
    label: "Silver",
  },
  GOLD: {
    bg: "rgba(234,179,8,0.18)",
    border: "rgba(234,179,8,0.4)",
    color: "#FDE047",
    icon: Crown,
    label: "Gold",
  },
  PLATINUM: {
    bg: "rgba(168,85,247,0.18)",
    border: "rgba(168,85,247,0.4)",
    color: "#D8B4FE",
    icon: Zap,
    label: "Platinum",
  },
}

const SIZE_STYLES = {
  sm: { fontSize: 10, padding: "2px 8px", iconSize: 10, gap: 4 },
  md: { fontSize: 12, padding: "4px 10px", iconSize: 12, gap: 5 },
  lg: { fontSize: 13, padding: "5px 13px", iconSize: 13, gap: 6 },
}

export function CustomerTierBadge({
  tier,
  tierName,
  showIcon = true,
  size = 'md',
}: CustomerTierBadgeProps) {
  // logic unchanged — fallback to NEW if tier unrecognised
  const config = TIER_CONFIG[tier] || TIER_CONFIG.NEW
  const Icon   = config.icon
  const sz     = SIZE_STYLES[size]

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: sz.gap,
      padding: sz.padding, borderRadius: 6,
      background: config.bg, border: `1px solid ${config.border}`,
      color: config.color,
      fontSize: sz.fontSize, fontWeight: 700,
      fontFamily: FONT, letterSpacing: "0.02em",
      whiteSpace: "nowrap",
    }}>
      {showIcon && <Icon size={sz.iconSize} />}
      {tierName || config.label}
    </span>
  )
}