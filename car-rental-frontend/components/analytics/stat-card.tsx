// components/analytics/stat-card.tsx
import { LucideIcon } from 'lucide-react'

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif"
const SURFACE = 'rgba(255,255,255,0.04)'
const BORDER  = '1px solid rgba(255,255,255,0.07)'
const GREEN   = '#22C55E'
const MUTED   = 'rgba(255,255,255,0.4)'
const TEXT    = '#FFFFFF'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon?: LucideIcon
  iconColor?: string
  subtitle?: string
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  subtitle,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  // Map Tailwind colour class hints to actual hex values for inline use
  const resolveIconColor = (cls?: string) => {
    if (!cls) return GREEN
    if (cls.includes('green'))  return GREEN
    if (cls.includes('blue'))   return '#60A5FA'
    if (cls.includes('purple')) return '#A855F7'
    if (cls.includes('orange')) return '#F97316'
    if (cls.includes('red'))    return '#EF4444'
    return GREEN
  }

  return (
    <div style={{
      background: SURFACE,
      border: BORDER,
      borderRadius: 12,
      padding: 24,
      fontFamily: FONT,
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${GREEN}55`
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 16px ${GREEN}22`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: MUTED, margin: 0 }}>{title}</p>
        {Icon && <Icon style={{ width: 18, height: 18, color: resolveIconColor(iconColor) }} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontSize: 28, fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.1 }}>{value}</p>

        {change !== undefined && (
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: isPositive ? GREEN : isNegative ? '#EF4444' : MUTED }}>
            {isPositive ? '↑' : isNegative ? '↓' : ''} {Math.abs(change).toFixed(1)}%
            {subtitle && <span style={{ color: MUTED, marginLeft: 4 }}>{subtitle}</span>}
          </p>
        )}

        {!change && subtitle && (
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>{subtitle}</p>
        )}
      </div>
    </div>
  )
}