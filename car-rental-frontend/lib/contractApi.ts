// lib/contractApi.ts (UPDATED WITH KM LIMITS & OVERAGE)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface Contract {
  id: string
  contract_number: string
  company_id: string
  customer_id: string
  vehicle_id: string
  created_by: string
  start_date: string
  end_date: string
  actual_return_date?: string
  daily_rate: string
  total_days: number
  base_amount: string
  additional_charges: string
  discount_amount: string
  tax_amount: string
  total_amount: string
  
  // KM Tracking
  start_mileage?: number
  end_mileage?: number
  actual_km_driven?: number
  daily_km_limit?: number
  total_km_allowed?: number
  km_overage?: number
  overage_rate_per_km?: string
  overage_charges?: string
  
  // Legacy fields
  mileage_limit?: number
  mileage_charge_per_km?: string
  
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'extended'
  extras?: Record<string, any>
  contract_pdf_url?: string
  contract_signed_date?: string
  deposit_amount: string
  deposit_returned: boolean
  notes?: string
  created_at: string
  updated_at: string
  customer?: {
    id: string
    full_name: string
    email?: string
    phone: string
    customer_type: 'individual' | 'corporate'
    total_rentals?: number
  }
  vehicle?: {
    id: string
    brand: string
    model: string
    year: number
    registration_number: string
    status: string
    mileage?: number
  }
  creator?: {
    id: string
    full_name: string
    email: string
  }
  payments?: Array<{
    id: string
    amount: string
    payment_method: string
    payment_date: string
    status: string
  }>
}

export interface ContractStats {
  total_contracts: number
  by_status: {
    active: number
    completed: number
    cancelled: number
  }
  total_revenue: number
  recent_contracts_30d: number
}

export interface OverageEstimate {
  contract_id: string
  contract_number: string
  start_mileage: number
  estimated_end_mileage: number
  estimated_km_driven: number
  allowed_km: {
    base_daily_limit: number
    bonus_km_per_day: number
    total_daily_limit: number
    total_days: number
    total_km_allowed: number
    tier: string
    tier_name: string
  }
  estimated_overage: {
    km_overage: number
    overage_rate: number
    base_overage_charges: number
    discount_percentage: number
    discount_amount: number
    final_overage_charges: number
    tier: string
    tier_name: string
    savings: number
  }
  customer_tier: string
  warning?: string
}

interface ListContractsParams {
  status?: 'draft' | 'active' | 'completed' | 'cancelled' | 'extended'
  customer_id?: string
  vehicle_id?: string
  start_date?: string
  end_date?: string
  search?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'ASC' | 'DESC'
}

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export const contractApi = {
  // List all contracts with filters
  async list(params?: ListContractsParams) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id)
    if (params?.vehicle_id) queryParams.append('vehicle_id', params.vehicle_id)
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order)

    const response = await fetch(`${API_URL}/api/contracts?${queryParams}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch contracts')
    }

    return response.json()
  },

  // Get single contract
  async getById(id: string) {
    const response = await fetch(`${API_URL}/api/contracts/${id}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch contract')
    }

    return response.json()
  },

  // Get contract statistics
  async getStats() {
    const response = await fetch(`${API_URL}/api/contracts/stats`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch contract stats')
    }

    return response.json()
  },

  // Create contract
  async create(data: {
    customer_id: string
    vehicle_id: string
    start_date: string
    end_date: string
    daily_rate: number
    daily_km_limit?: number
    deposit_amount?: number
    additional_charges?: number
    discount_amount?: number
    extras?: Record<string, any>
    notes?: string
  }) {
    const response = await fetch(`${API_URL}/api/contracts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create contract')
    }

    return response.json()
  },

  // Update contract
  async update(id: string, data: Partial<Contract>) {
    const response = await fetch(`${API_URL}/api/contracts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update contract')
    }

    return response.json()
  },

  // Complete contract (OLD - still works)
  async complete(id: string, data: {
    actual_return_date: string
    end_mileage: number
    additional_charges?: number
    notes?: string
  }) {
    const response = await fetch(`${API_URL}/api/contracts/${id}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to complete contract')
    }

    return response.json()
  },

  // Complete contract with mileage (NEW - with tier pricing)
  async completeWithMileage(id: string, data: {
    end_mileage: number
    actual_return_date: string
    additional_charges?: number
    notes?: string
  }) {
    const response = await fetch(`${API_URL}/api/contracts/${id}/complete-with-mileage`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to complete contract')
    }

    return response.json()
  },

  // Estimate overage charges (NEW)
  async estimateOverage(id: string, estimatedEndMileage: number): Promise<{ success: boolean; data: OverageEstimate }> {
    const response = await fetch(
      `${API_URL}/api/contracts/${id}/mileage-estimate?estimated_end_mileage=${estimatedEndMileage}`,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to estimate overage')
    }

    return response.json()
  },

  // Cancel contract
  async cancel(id: string, reason?: string) {
    const response = await fetch(`${API_URL}/api/contracts/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to cancel contract')
    }

    return response.json()
  },

  // Extend contract
  async extend(id: string, data: { new_end_date: string; notes?: string }) {
    const response = await fetch(`${API_URL}/api/contracts/${id}/extend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to extend contract')
    }

    return response.json()
  },
}