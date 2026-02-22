// lib/api/admin.ts
// Admin API service connecting to your Express backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Request failed")
  }
  return json.data as T
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Company {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  subscription_plan: "basic" | "professional" | "enterprise"
  subscription_status: "active" | "inactive" | "trial" | "suspended"
  subscription_start_date?: string
  trial_ends_at?: string
  monthly_recurring_revenue: number
  created_at: string
  user_count?: number
  vehicle_count?: number
}

export interface CompanyDetail extends Company {
  users: {
    id: string
    full_name: string
    email: string
    role: string
    is_active: boolean
    last_login_at?: string
  }[]
  stats: {
    vehicles: number
    total_contracts: number
    active_contracts: number
  }
}

export interface PlatformStats {
  companies: {
    total: number
    active: number
    trial: number
    suspended: number
    new_this_month: number
    growth_percentage: number
  }
  users: { total: number }
  vehicles: { total: number }
  contracts: { total: number; active: number }
  revenue: {
    total_mrr: number
    by_plan: { plan: string; count: number; mrr: number }[]
  }
}

export interface CompaniesQuery {
  status?: "active" | "inactive" | "trial" | "suspended"
  plan?: "basic" | "professional" | "enterprise"
  search?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: "ASC" | "DESC"
}

export interface CompaniesResponse {
  companies: Company[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

// ─── Platform Stats ───────────────────────────────────────────────────────────

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const res = await fetch(`${API_URL}/api/admin/stats`, {
    headers: getAuthHeaders(),
  })
  return handleResponse<PlatformStats>(res)
}

// ─── Companies CRUD ───────────────────────────────────────────────────────────

export async function fetchAllCompanies(
  query: CompaniesQuery = {}
): Promise<{ companies: Company[]; pagination: CompaniesResponse["pagination"] }> {
  const params = new URLSearchParams()
  if (query.status) params.set("status", query.status)
  if (query.plan) params.set("plan", query.plan)
  if (query.search) params.set("search", query.search)
  if (query.page) params.set("page", String(query.page))
  if (query.limit) params.set("limit", String(query.limit))
  if (query.sort_by) params.set("sort_by", query.sort_by)
  if (query.sort_order) params.set("sort_order", query.sort_order)

  const res = await fetch(`${API_URL}/api/admin/companies?${params.toString()}`, {
    headers: getAuthHeaders(),
  })

  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed")
  return {
    companies: json.data.companies,
    pagination: json.meta.pagination,
  }
}

export async function fetchCompanyById(id: string): Promise<CompanyDetail> {
  const res = await fetch(`${API_URL}/api/admin/companies/${id}`, {
    headers: getAuthHeaders(),
  })
  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed")
  return json.data as CompanyDetail
}

export async function updateSubscription(
  id: string,
  payload: {
    subscription_plan?: Company["subscription_plan"]
    subscription_status?: Company["subscription_status"]
    monthly_recurring_revenue?: number
  }
): Promise<Company> {
  const res = await fetch(`${API_URL}/api/admin/companies/${id}/subscription`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed")
  return json.data.company as Company
}

export async function suspendCompany(
  id: string,
  reason?: string
): Promise<Company> {
  const res = await fetch(`${API_URL}/api/admin/companies/${id}/suspend`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  })
  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed")
  return json.data.company as Company
}

export async function reactivateCompany(id: string): Promise<Company> {
  const res = await fetch(`${API_URL}/api/admin/companies/${id}/reactivate`, {
    method: "PUT",
    headers: getAuthHeaders(),
  })
  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed")
  return json.data.company as Company
}