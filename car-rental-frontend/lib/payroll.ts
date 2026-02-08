// lib/api/payroll.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Payroll {
  id: string;
  company_id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  payment_date?: string;
  base_salary: number;
  gross_salary: number;
  net_salary: number;
  total_days_in_period: number;
  days_present: number;
  days_absent: number;
  days_on_leave: number;
  total_hours_worked: number;
  overtime_hours: number;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
  payment_method?: 'bank_transfer' | 'cash' | 'check';
  payment_reference?: string;
  payment_status: 'pending' | 'approved' | 'paid' | 'cancelled';
  calculated_by?: string;
  approved_by?: string;
  paid_by?: string;
  notes?: string;
  payslip_url?: string;
  employee?: {
    id: string;
    full_name: string;
    position?: string;
    department?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CalculatePayrollData {
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  payment_date?: string;
}

export interface MarkAsPaidData {
  payment_date: string;
  payment_method: 'bank_transfer' | 'cash' | 'check';
  payment_reference?: string;
}

class PayrollAPI {
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

  // Calculate payroll for an employee
  async calculatePayroll(data: CalculatePayrollData): Promise<{ payroll: Payroll }> {
    const response = await fetch(`${API_URL}/api/payroll/calculate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Get payroll records
  async getPayroll(params?: {
    employee_id?: string;
    month?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ payroll: Payroll[]; meta: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_URL}/api/payroll?${queryParams.toString()}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  }

  // Approve payroll
  async approvePayroll(id: string): Promise<{ payroll: Payroll }> {
    const response = await fetch(`${API_URL}/api/payroll/${id}/approve`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Mark payroll as paid
  async markAsPaid(id: string, data: MarkAsPaidData): Promise<{ payroll: Payroll }> {
    const response = await fetch(`${API_URL}/api/payroll/${id}/pay`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Get payroll statistics
  async getStats(month?: string): Promise<{
    stats: {
      total_payrolls: number;
      total_gross: number;
      total_net: number;
    };
    by_status: Array<{
      payment_status: string;
      count: number;
      amount: number;
    }>;
  }> {
    const queryParams = month ? `?month=${month}` : '';
    const response = await fetch(
      `${API_URL}/api/payroll/stats${queryParams}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  }
}

export const payrollAPI = new PayrollAPI();