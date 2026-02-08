// lib/analytics.ts

// ────────────────────────────────────────────────
// TYPES (kept the same as you showed)
// ────────────────────────────────────────────────

export interface AnalyticsPeriod {
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year'
  start_date?: string
  end_date?: string
}

export interface DashboardKPIs {
  period: { start: string; end: string }
  revenue: {
    total: number
    average_transaction: number
    payment_count: number
    growth?: number
  }
  fleet: {
    total_vehicles: number
    active_rentals: number
    available_vehicles: number
    maintenance_vehicles: number
    average_utilization: number
  }
  customers: {
    total: number
    new: number
    repeat: number
    retention_rate: number
  }
  top_vehicles: Array<{
    vehicle_id: string
    brand: string
    model: string
    registration_number: string
    utilization_rate: number
    total_revenue: number
    rental_count: number
  }>
}

export interface RevenueData {
  period: { start: string; end: string }
  total_revenue: number
  payment_count: number
  average_transaction_value: number
  revenue_by_method: Array<{ method: string; amount: number; count: number }>
  revenue_by_day: Array<{ date: string; revenue: number; transactions: number }>
  current_period?: any
  previous_period?: any
  growth_percentage?: number
}

export interface VehiclePerformance {
  period: { start: string; end: string }
  metric: string
  fleet_summary: {
    total_vehicles: number
    average_utilization: number
    total_revenue: number
    total_rentals: number
  }
  vehicles: Array<{
    vehicle_id: string
    brand: string
    model: string
    registration_number: string
    daily_rate: number
    current_status: string
    total_days_rented: number
    available_days: number
    utilization_rate: number
    total_revenue: number
    revenue_per_day: number
    rental_count: number
  }>
}

export interface CustomerSegmentation {
  total_customers: number
  segments: {
    vip: { count: number; total_value: number; customers: Array<any> }
    high_value: { count: number; total_value: number }
    medium_value: { count: number; total_value: number }
    low_value: { count: number; total_value: number }
  }
}

export interface VehicleUtilization {
  period: { start: string; end: string }
  vehicles: Array<{
    vehicle_id: string
    brand: string
    model: string
    registration_number: string
    utilization_rate: number
    total_days_rented: number
    available_days: number
    total_revenue: number
  }>
}

export interface ContractAnalytics {
  total_contracts: number
  by_status: {
    active: number
    completed: number
    cancelled: number
  }
  avg_contract_value: number
  avg_duration_days: number
  completion_rate: number
  contracts_by_day: Array<{
    date: string
    count: number
    value: number
  }>
}

export interface PaymentAnalytics {
  total_payments: number
  total_amount: number
  by_status: {
    completed: number
    pending: number
    failed: number
  }
  by_method: Array<{
    method: string
    count: number
    amount: number
    percentage: number
  }>
  average_payment: number
  payments_by_day: Array<{
    date: string
    count: number
    amount: number
  }>
  outstanding: {
    count: number
    total_amount: number
  }
}

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (typeof window !== 'undefined') {
    // ← Changed to match the rest of your app
    const token = localStorage.getItem('accessToken')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return headers
}

function analyticsEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : '/' + path
  return `/api/analytics${cleanPath}`
}

function buildUrl(path: string, params?: Record<string, any>): string {
  const url = new URL(analyticsEndpoint(path), BASE_URL)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  return url.toString()
}

async function apiFetch<T>(path: string, queryParams?: Record<string, any>): Promise<T> {
  const url = buildUrl(path, queryParams)

  console.log('→ Fetching:', url) // debug

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',           // ← important for fresh data
  })

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`
    try {
      const errData = await response.json()
      errorMessage = errData.message || errorMessage
    } catch {}

    if (response.status === 401) {
      throw new Error('Authentication required. Please login first.')
    }
    if (response.status === 404) {
      throw new Error(`Endpoint not found: ${path}`)
    }

    throw new Error(errorMessage)
  }

  const json = await response.json()
  return json.data as T
}

// ────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────

export const analyticsAPI = {
  getDashboard: async (params?: AnalyticsPeriod): Promise<DashboardKPIs> => {
    return apiFetch<DashboardKPIs>('/dashboard', params)
  },

  getRevenue: async (
    params?: AnalyticsPeriod & { compare?: boolean }
  ): Promise<RevenueData> => {
    return apiFetch<RevenueData>('/revenue', params)
  },

  getVehiclePerformance: async (
    params?: AnalyticsPeriod & {
      metric?: 'utilization' | 'revenue' | 'profit'
      limit?: number
    }
  ): Promise<VehiclePerformance> => {
    return apiFetch<VehiclePerformance>('/vehicles', params)
  },

  getVehicleUtilization: async (
    params?: AnalyticsPeriod & { vehicle_id?: string }
  ): Promise<VehicleUtilization> => {
    return apiFetch<VehicleUtilization>('/vehicles/utilization', params)
  },

  getVehicleProfitLoss: async (
    params?: AnalyticsPeriod
  ): Promise<any> => {   // ← you can type it better later
    return apiFetch<any>('/vehicles/profit-loss', params)
  },

  getCustomerAnalytics: async (
    params?: AnalyticsPeriod
  ): Promise<any> => {
    return apiFetch<any>('/customers', params)
  },

  getCustomerSegmentation: async (): Promise<CustomerSegmentation> => {
    return apiFetch<CustomerSegmentation>('/customers/segmentation')
  },

  getCustomerRetention: async (
    params?: AnalyticsPeriod
  ): Promise<any> => {
    return apiFetch<any>('/customers/retention', params)
  },
}