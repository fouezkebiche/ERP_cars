// components/dashboard/KmUsageProgress.tsx
"use client"

import { AlertTriangle, CheckCircle, MapPin } from "lucide-react"

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
  className = "" 
}: KmUsageProgressProps) {
  const percentage = (kmDriven / kmAllowed) * 100
  const isNearLimit = percentage >= 75
  const isOverLimit = percentage >= 100
  
  const getColor = () => {
    if (isOverLimit) return 'bg-red-500'
    if (isNearLimit) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getTextColor = () => {
    if (isOverLimit) return 'text-red-600'
    if (isNearLimit) return 'text-amber-600'
    return 'text-green-600'
  }

  const getIcon = () => {
    if (isOverLimit) return <AlertTriangle className="w-4 h-4 text-red-600" />
    if (isNearLimit) return <AlertTriangle className="w-4 h-4 text-amber-600" />
    return <CheckCircle className="w-4 h-4 text-green-600" />
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">KM Usage</span>
        </div>
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className={`font-semibold ${getTextColor()}`}>
            {kmDriven.toLocaleString()} / {kmAllowed.toLocaleString()} km
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{percentage.toFixed(1)}% used</span>
        {percentage < 100 ? (
          <span>{(kmAllowed - kmDriven).toLocaleString()} km remaining</span>
        ) : (
          <span className="text-red-600 font-semibold">
            {(kmDriven - kmAllowed).toLocaleString()} km over limit!
          </span>
        )}
      </div>

      {/* Tier Bonus Info */}
      {tierBonus && tierBonus > 0 && (
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">
          <span className="font-medium text-blue-700 dark:text-blue-400">
            ✨ Loyalty bonus: +{tierBonus} km/day included
          </span>
        </div>
      )}

      {/* Daily Limit Info */}
      {dailyLimit && (
        <div className="text-xs text-muted-foreground">
          Daily limit: {dailyLimit.toLocaleString()} km/day
          {tierBonus && ` (${dailyLimit - tierBonus} base + ${tierBonus} bonus)`}
        </div>
      )}
    </div>
  )
}