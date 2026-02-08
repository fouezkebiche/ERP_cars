// lib/api/employees.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin' | 'manager' | 'sales_agent' | 'fleet_coordinator' | 'accountant' | 'receptionist';
  department?: 'management' | 'sales' | 'fleet' | 'finance' | 'customer_service' | 'operations';
  position?: string;
  status: 'active' | 'on_leave' | 'suspended' | 'terminated';
  salary_type?: 'hourly' | 'monthly' | 'commission' | 'fixed_plus_commission';
  salary?: number;
  commission_rate?: number;
  hire_date: string;
  termination_date?: string;
  work_schedule?: Record<string, { start: string; end: string }>;
  custom_permissions?: Record<string, boolean>;
  total_contracts_created?: number;
  total_revenue_generated?: number;
  user?: {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    last_login_at?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Role {
  value: string;
  label: string;
  description: string;
  permissions: string[];
}

export interface EmployeeStats {
  total_employees: number;
  by_status: {
    active: number;
    on_leave: number;
    terminated: number;
  };
  by_role: Record<string, number>;
  top_performers: Array<{
    id: string;
    full_name: string;
    role: string;
    total_contracts_created: number;
    total_revenue_generated: number;
  }>;
}

export interface CreateEmployeeData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  department?: string;
  position?: string;
  salary_type?: string;
  salary?: number;
  commission_rate?: number;
  hire_date: string;
  work_schedule?: Record<string, { start: string; end: string }>;
  custom_permissions?: Record<string, boolean>;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

export interface UpdateEmployeeData {
  full_name?: string;
  phone?: string;
  position?: string;
  department?: string;
  salary?: number;
  commission_rate?: number;
  status?: string;
  custom_permissions?: Record<string, boolean>;
  work_schedule?: Record<string, { start: string; end: string }>;
}

class EmployeeAPI {
  private getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  }

  // Get all employees with filters
  async getEmployees(params?: {
    status?: string;
    role?: string;
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  }): Promise<{ employees: Employee[]; meta: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_URL}/api/employees?${queryParams.toString()}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  }

  // Get single employee
  async getEmployee(id: string): Promise<{ employee: Employee }> {
    const response = await fetch(`${API_URL}/api/employees/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Create new employee
  async createEmployee(data: CreateEmployeeData): Promise<{ employee: Employee }> {
    const response = await fetch(`${API_URL}/api/employees`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Update employee
  async updateEmployee(id: string, data: UpdateEmployeeData): Promise<{ employee: Employee }> {
    const response = await fetch(`${API_URL}/api/employees/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Terminate employee
  async terminateEmployee(id: string): Promise<{ employee: Employee }> {
    const response = await fetch(`${API_URL}/api/employees/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Reset employee password
  async resetPassword(id: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/employees/${id}/reset-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ new_password: newPassword }),
    });
    return this.handleResponse(response);
  }

  // Get employee statistics
  async getStats(): Promise<{ stats: EmployeeStats }> {
    const response = await fetch(`${API_URL}/api/employees/stats`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Get available roles
  async getRoles(): Promise<{ roles: Role[] }> {
    const response = await fetch(`${API_URL}/api/employees/roles`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
}

export const employeeAPI = new EmployeeAPI();