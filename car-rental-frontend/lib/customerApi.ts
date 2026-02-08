// lib/api/customerApi.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface Customer {
  id: string
  company_id: string
  customer_type: 'individual' | 'corporate'
  full_name: string
  company_name?: string
  email?: string
  phone: string
  address?: string
  city?: string
  date_of_birth?: string
  id_card_number?: string
  drivers_license_number?: string
  license_expiry_date?: string
  id_card_photo_url?: string
  license_photo_url?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  is_blacklisted: boolean
  apply_tier_discount?: boolean
  total_rentals: number
  lifetime_value: string
  created_at: string
  updated_at: string
}

export interface CustomerHistory {
  customer: {
    id: string
    full_name: string
    email?: string
    phone: string
  }
  contracts: Array<{
    id: string
    contract_number: string
    start_date: string
    end_date: string
    total_amount: string
    status: string
    vehicle: {
      id: string
      brand: string
      model: string
      year: number
      registration_number: string
    }
    payments: Array<{
      id: string
      amount: string
      payment_method: string
      payment_date: string
      status: string
    }>
  }>
  stats: {
    total_contracts: number
    total_spent: number
    completed_contracts: number
    active_contracts: number
  }
}

export interface CustomerStats {
  total_customers: number
  by_type: {
    individual: number
    corporate: number
  }
  blacklisted: number
  recent_customers_30d: number
  top_customers: Array<{
    id: string
    full_name: string
    email?: string
    total_rentals: number
    lifetime_value: string
  }>
}

interface ListCustomersParams {
  customer_type?: 'individual' | 'corporate'
  is_blacklisted?: boolean
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

export const customerApi = {
  // List all customers with filters
  async list(params?: ListCustomersParams) {
    const queryParams = new URLSearchParams()
    if (params?.customer_type) queryParams.append('customer_type', params.customer_type)
    if (params?.is_blacklisted !== undefined) queryParams.append('is_blacklisted', String(params.is_blacklisted))
    if (params?.search) queryParams.append('search', params.search)
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.limit) queryParams.append('limit', String(params.limit))
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order)

    const response = await fetch(`${API_URL}/api/customers?${queryParams}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch customers')
    }

    return response.json()
  },

  // Get single customer
  async getById(id: string) {
    const response = await fetch(`${API_URL}/api/customers/${id}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch customer')
    }

    return response.json()
  },

  // Get customer rental history
  async getHistory(id: string, params?: { status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.limit) queryParams.append('limit', String(params.limit))

    const response = await fetch(`${API_URL}/api/customers/${id}/history?${queryParams}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch customer history')
    }

    return response.json()
  },

  // Get customer statistics
  async getStats() {
    const response = await fetch(`${API_URL}/api/customers/stats`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch customer stats')
    }

    return response.json()
  },

  // Create customer
  async create(data: Partial<Customer>) {
    const response = await fetch(`${API_URL}/api/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create customer')
    }

    return response.json()
  },

  // Update customer
  async update(id: string, data: Partial<Customer>) {
    const response = await fetch(`${API_URL}/api/customers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update customer')
    }

    return response.json()
  },

  // Delete customer
  async delete(id: string) {
    const response = await fetch(`${API_URL}/api/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete customer')
    }

    return response.json()
  },
}