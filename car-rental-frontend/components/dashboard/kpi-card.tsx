import type React from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

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
    <div className={cn("p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{value}</span>
            {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
          </div>
        </div>
        {icon && <div className="text-accent">{icon}</div>}
      </div>
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 text-sm", isPositive ? "text-accent" : "text-destructive")}>
          {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          <span>{Math.abs(trend)}% from last month</span>
        </div>
      )}
    </div>
  )
}
