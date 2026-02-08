// components/dashboard/CustomerTierBadge.tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { Award, Star, Crown, Zap } from "lucide-react"

interface CustomerTierBadgeProps {
  tier: 'NEW' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  tierName?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const TIER_CONFIG = {
  NEW: {
    color: 'bg-gray-500 text-white hover:bg-gray-600',
    icon: Award,
    label: 'New',
  },
  BRONZE: {
    color: 'bg-orange-600 text-white hover:bg-orange-700',
    icon: Award,
    label: 'Bronze',
  },
  SILVER: {
    color: 'bg-gray-400 text-white hover:bg-gray-500',
    icon: Star,
    label: 'Silver',
  },
  GOLD: {
    color: 'bg-yellow-500 text-black hover:bg-yellow-600',
    icon: Crown,
    label: 'Gold',
  },
  PLATINUM: {
    color: 'bg-purple-600 text-white hover:bg-purple-700',
    icon: Zap,
    label: 'Platinum',
  },
}

export function CustomerTierBadge({ 
  tier, 
  tierName, 
  showIcon = true,
  size = 'md' 
}: CustomerTierBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.NEW
  const Icon = config.icon
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <Badge className={`${config.color} ${sizeClasses[size]} font-semibold`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {tierName || config.label}
    </Badge>
  )
}