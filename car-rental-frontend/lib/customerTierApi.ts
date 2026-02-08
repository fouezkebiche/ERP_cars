// lib/customerTierApi.ts - CORRECTED
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface CustomerTierInfo {
  customer_id: string
  customer_name: string
  total_rentals: number
  lifetime_value: number
  tier: 'NEW' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  name: string
  min_rentals: number
  max_rentals: number
  overage_rate: number
  benefits: string[]
  discount_percentage: number
  km_bonus?: number
  progress: {
    current_tier: string
    current_tier_name: string
    current_rentals: number
    next_tier: string | null
    next_tier_name: string | null
    rentals_to_next_tier: number
    progress_percentage: number
    is_max_tier: boolean
  }
}

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export const customerTierApi = {
  // Get customer tier information
  async getTierInfo(customerId: string): Promise<{ success: boolean; data: CustomerTierInfo }> {
    // ✅ FIXED: Use parentheses ( ) not backticks ` `
    const response = await fetch(`${API_URL}/api/customers/${customerId}/tier-info`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch tier info')
    }

    return response.json()
  },
}

// Helper function to get tier color
export const getTierColor = (tier: string): string => {
  const colors: Record<string, string> = {
    NEW: 'bg-gray-500',
    BRONZE: 'bg-orange-600',
    SILVER: 'bg-gray-400',
    GOLD: 'bg-yellow-500',
    PLATINUM: 'bg-purple-600',
  }
  return colors[tier] || 'bg-gray-500'
}

// Helper function to get tier text color
export const getTierTextColor = (tier: string): string => {
  const colors: Record<string, string> = {
    NEW: 'text-gray-500',
    BRONZE: 'text-orange-600',
    SILVER: 'text-gray-400',
    GOLD: 'text-yellow-500',
    PLATINUM: 'text-purple-600',
  }
  return colors[tier] || 'text-gray-500'
}