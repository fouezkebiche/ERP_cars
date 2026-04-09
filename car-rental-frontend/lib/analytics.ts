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
  console.log('🔍 API Response:', json) // Debug log
  console.log('🔍 Data object:', json.data) // Debug the data object
  
  // Handle different response formats from backend
  if (json.data?.data) {
    console.log('📊 Using nested data format')
    return json.data.data as T  // Nested: { data: { data: {...} } }
  } else if (json.data?.period) {
    console.log('📊 Using direct data format')
    console.log('📊 Period:', json.data.period)
    console.log('📊 Total Revenue:', json.data.total_revenue)
    
    // Handle revenue comparison format
    if (json.data.current_period) {
      console.log('📊 Using revenue comparison format')
      return {
        ...json.data.current_period,
        period: json.data.period,
        previous_period: json.data.previous_period,
        growth_percentage: json.data.growth_percentage,
      } as T
    }
    
    return json.data as T     // Direct: { data: { period: {...}, ... } }
  } else {
    console.log('📊 Using fallback data format')
    console.log('📊 Data keys:', Object.keys(json.data || {}))
    return json.data as T        // Fallback
  }
}

// ────────────────────────────────────────────────
// SPECIALIZED HELPERS FOR NON-ANALYTICS ENDPOINTS
// (contracts & payments stats live on their own routes)
// ────────────────────────────────────────────────

async function fetchContractStatsFromApi(): Promise<ContractAnalytics> {
  const url = new URL('/api/contracts/stats', BASE_URL)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
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

    throw new Error(errorMessage)
  }

  const json = await response.json()
  const stats = json?.data?.stats ?? json?.data ?? json?.stats ?? {}

  const totalContracts = Number(stats.total_contracts ?? 0)
  const byStatus = stats.by_status ?? {}
  const active = Number(byStatus.active ?? 0)
  const completed = Number(byStatus.completed ?? 0)
  const cancelled = Number(byStatus.cancelled ?? 0)
  const totalRevenue = Number(stats.total_revenue ?? 0)

  const completionRate =
    totalContracts > 0 ? (completed / totalContracts) * 100 : 0

  const avgContractValue =
    totalContracts > 0 ? totalRevenue / totalContracts : 0

  const result: ContractAnalytics = {
    total_contracts: totalContracts,
    by_status: {
      active,
      completed,
      cancelled,
    },
    avg_contract_value: avgContractValue,
    // Backend doesn't currently expose this; can be enhanced later
    avg_duration_days: 0,
    completion_rate: completionRate,
    // Not implemented on the backend yet
    contracts_by_day: [],
  }

  return result
}

async function fetchPaymentStatsFromApi(): Promise<PaymentAnalytics> {
  const url = new URL('/api/payments/stats', BASE_URL)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
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

    throw new Error(errorMessage)
  }

  const json = await response.json()
  const stats = json?.data?.stats ?? json?.data ?? json?.stats ?? {}

  const totalPayments = Number(stats.total_payments ?? 0)
  const byStatus = stats.by_status ?? {}
  const completed = Number(byStatus.completed ?? 0)
  const pending = Number(byStatus.pending ?? 0)
  const failed = Number(byStatus.failed ?? 0)
  const totalAmount = Number(stats.total_revenue ?? 0)

  const averagePayment =
    completed > 0 ? totalAmount / completed : 0

  const byMethodRaw: Record<string, number> = stats.by_method ?? {}
  const byMethodArray = Object.entries(byMethodRaw).map(
    ([method, count]) => {
      const c = Number(count ?? 0)
      const percentage =
        totalPayments > 0 ? (c / totalPayments) * 100 : 0

      return {
        method,
        count: c,
        // Backend stats endpoint does not expose per‑method amounts yet
        amount: 0,
        percentage,
      }
    }
  )

  const result: PaymentAnalytics = {
    total_payments: totalPayments,
    total_amount: totalAmount,
    by_status: {
      completed,
      pending,
      failed,
    },
    by_method: byMethodArray,
    average_payment: averagePayment,
    // Not yet implemented on backend analytics; keep empty for now
    payments_by_day: [],
    outstanding: {
      count: 0,
      total_amount: 0,
    },
  }

  return result
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

  getContractStats: async (params?: AnalyticsPeriod): Promise<ContractAnalytics> => {
    // Currently contract stats live on /api/contracts/stats
    // and not under /api/analytics, so we call that endpoint
    // directly and adapt the response to our frontend type.
    void params // kept for future enhancement (period filters etc.)
    return fetchContractStatsFromApi()
  },

  getPaymentStats: async (params?: AnalyticsPeriod): Promise<PaymentAnalytics> => {
    // Payment stats live on /api/payments/stats;
    // call that endpoint directly and adapt the response.
    void params // kept for future enhancement (period filters etc.)
    return fetchPaymentStatsFromApi()
  },
}