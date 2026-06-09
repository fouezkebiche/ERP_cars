"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useAuth } from "@/context/AuthContext"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export interface SubscriptionInfo {
  subscription_plan: string
  subscription_status: "active" | "inactive" | "trial" | "suspended"
  subscription_start_date?: string
  subscription_end_date?: string | null
  trial_ends_at?: string | null
  trial_duration_days: number
  monthly_recurring_revenue?: number
  plan_price_monthly?: number | null
  allowed: boolean
  reason?: string | null
  daysRemaining?: number | null
  isTrial: boolean
  isExpired: boolean
}

export interface PricingPlan {
  id: string
  name: string
  description?: string
  priceMonthly: number
  maxVehicles: number
  maxUsers?: number
  tier: string
  features?: string[]
}

interface CompanyContextType {
  subscription: SubscriptionInfo | null
  loading: boolean
  refreshSubscription: () => Promise<void>
  requestUpgrade: (message?: string) => Promise<void>
  changePlan: (planId: string) => Promise<void>
  fetchPlans: () => Promise<PricingPlan[]>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSubscription = useCallback(async () => {
    const token = localStorage.getItem("accessToken")
    if (!token || !user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/company/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to load subscription")
      const json = await res.json()
      setSubscription(json.data?.subscription || json.subscription || null)
    } catch {
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshSubscription()
  }, [refreshSubscription])

  const changePlan = async (planId: string) => {
    const token = localStorage.getItem("accessToken")
    if (!token) throw new Error("Not authenticated")

    const res = await fetch(`${API_URL}/api/company/subscription/plan`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planId }),
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.message || "Failed to change plan")

    const updated = json.data?.subscription
    if (updated) setSubscription(updated)
    else await refreshSubscription()
  }

  const fetchPlans = async (): Promise<PricingPlan[]> => {
    const token = localStorage.getItem("accessToken")
    if (!token) return []

    const res = await fetch(`${API_URL}/api/company/subscription/plans`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data?.plans || []
  }

  const requestUpgrade = async (message?: string) => {
    const token = localStorage.getItem("accessToken")
    if (!token) throw new Error("Not authenticated")

    const res = await fetch(`${API_URL}/api/company/subscription/request-upgrade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.message || "Request failed")
    return json
  }

  return (
    <CompanyContext.Provider value={{ subscription, loading, refreshSubscription, requestUpgrade, changePlan, fetchPlans }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider")
  return ctx
}
