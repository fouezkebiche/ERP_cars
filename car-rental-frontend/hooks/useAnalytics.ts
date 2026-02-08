// hooks/useAnalytics.ts
import { useState, useEffect, useCallback } from 'react'
import { analyticsAPI } from '@/lib/analytics'
import type {
  DashboardKPIs,
  RevenueData,
  VehiclePerformance,
  CustomerSegmentation,
  ContractAnalytics,
  PaymentAnalytics,
  AnalyticsPeriod,
  VehicleUtilization,
} from '@/lib/analytics'

interface UseAnalyticsResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

function useAnalyticsData<T>(
  fetchFn: (params?: any) => Promise<T>,
  params?: any,
  deps: any[] = []
): UseAnalyticsResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn(params)
      setData(result)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch analytics data'
      setError(errorMessage)
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, ...deps])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export function useDashboard(params?: AnalyticsPeriod) {
  return useAnalyticsData<DashboardKPIs>(
    analyticsAPI.getDashboard,
    params,
    [params?.period, params?.start_date, params?.end_date]
  )
}

export function useRevenue(params?: AnalyticsPeriod & { compare?: boolean }) {
  return useAnalyticsData<RevenueData>(
    analyticsAPI.getRevenue,
    params,
    [params?.period, params?.start_date, params?.end_date, params?.compare]
  )
}

export function useVehiclePerformance(
  params?: AnalyticsPeriod & { metric?: 'utilization' | 'revenue' | 'profit'; limit?: number }
) {
  return useAnalyticsData<VehiclePerformance>(
    analyticsAPI.getVehiclePerformance,
    params,
    [params?.period, params?.start_date, params?.end_date, params?.metric, params?.limit]
  )
}

export function useVehicleUtilization(params?: AnalyticsPeriod & { vehicle_id?: string }) {
  return useAnalyticsData<VehicleUtilization>(
    analyticsAPI.getVehicleUtilization,
    params,
    [params?.period, params?.start_date, params?.end_date, params?.vehicle_id]
  )
}

export function useCustomerSegmentation() {
  return useAnalyticsData<CustomerSegmentation>(
    analyticsAPI.getCustomerSegmentation,
    undefined,
    []
  )
}

