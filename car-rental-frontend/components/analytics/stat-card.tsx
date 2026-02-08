// components/analytics/stat-card.tsx
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  iconColor = 'text-primary',
  subtitle,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && <Icon className={cn('h-5 w-5', iconColor)} />}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold">{value}</p>
        {change !== undefined && (
          <p
            className={cn(
              'text-sm font-medium',
              isPositive && 'text-green-600',
              isNegative && 'text-red-600'
            )}
          >
            {isPositive ? '↑' : isNegative ? '↓' : ''} {Math.abs(change).toFixed(1)}%
            {subtitle && <span className="text-muted-foreground ml-1">{subtitle}</span>}
          </p>
        )}
        {!change && subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  )
}