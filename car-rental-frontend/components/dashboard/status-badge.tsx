// components/dashboard/StatusBadge.tsx

/* ─── tokens ─────────────────────────────────────────────────── */
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif"

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

/* ── all colours tuned for a dark background ─────────────────── */
const STATUS_CONFIG: Record<string, { bg: string; border: string; color: string; label: string }> = {
  available:   { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)",   color: "#4ADE80", label: "Available" },
  rented:      { bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)",  color: "#93C5FD", label: "Rented" },
  maintenance: { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  color: "#FCD34D", label: "Maintenance" },
  active:      { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)",   color: "#4ADE80", label: "Active" },
  completed:   { bg: "rgba(156,163,175,0.12)", border: "rgba(156,163,175,0.25)",color: "#D1D5DB", label: "Completed" },
  cancelled:   { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   color: "#F87171", label: "Cancelled" },
  pending:     { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  color: "#FCD34D", label: "Pending" },
  paid:        { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.3)",   color: "#4ADE80", label: "Paid" },
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  // ── logic unchanged ──────────────────────────────────────────
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]

  if (!config) {
    console.warn(`Unknown status "${status}" in StatusBadge - using default`)
    return (
      <span
        className={className}
        style={{
          display: "inline-flex", alignItems: "center",
          padding: "3px 10px", borderRadius: 99,
          fontSize: 11, fontWeight: 700, fontFamily: FONT,
          background: "rgba(107,114,128,0.15)",
          border: "1px solid rgba(107,114,128,0.28)",
          color: "#9CA3AF",
          whiteSpace: "nowrap",
        }}
      >
        {label || status}
      </span>
    )
  }

  return (
    <span
      className={className}
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "3px 10px", borderRadius: 99,
        fontSize: 11, fontWeight: 700, fontFamily: FONT,
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        whiteSpace: "nowrap",
      }}
    >
      {label || config.label}
    </span>
  )
}