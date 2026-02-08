// src/services/payment.service.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Payment {
  id: string;
  contract_id: string;
  customer_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'mobile_payment';
  payment_date: string;
  reference_number?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  processed_by: string;
  contract?: any;
  customer?: any;
  processor?: any;
}

interface PaymentFilters {
  contract_id?: string;
  customer_id?: string;
  payment_method?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

interface PaymentStats {
  total_payments: number;
  by_status: {
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
  };
  by_method: Record<string, number>;
  total_revenue: number;
  recent_payments_30d: number;
  recent_revenue_30d: number;
}

class PaymentService {
  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get all payments with filters
  async getAllPayments(filters: PaymentFilters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${API_URL}/api/payments?${queryParams.toString()}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch payments');
    }

    return response.json();
  }

  // Get single payment by ID
  async getPaymentById(id: string) {
    const response = await fetch(`${API_URL}/api/payments/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch payment');
    }

    return response.json();
  }

  // Create new payment
  async createPayment(paymentData: {
    contract_id: string;
    amount: number;
    payment_method: string;
    payment_date?: string;
    reference_number?: string;
    notes?: string;
    status?: string;
  }) {
    const response = await fetch(`${API_URL}/api/payments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment');
    }

    return response.json();
  }

  // Update payment
  async updatePayment(id: string, updates: Partial<Payment>) {
    const response = await fetch(`${API_URL}/api/payments/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update payment');
    }

    return response.json();
  }

  // Get outstanding payments
  async getOutstandingPayments(filters: { customer_id?: string; page?: number; limit?: number } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${API_URL}/api/payments/outstanding?${queryParams.toString()}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch outstanding payments');
    }

    return response.json();
  }

  // Get payments for a specific contract
  async getContractPayments(contractId: string) {
    const response = await fetch(`${API_URL}/api/contracts/${contractId}/payments`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch contract payments');
    }

    return response.json();
  }

  // Get payment statistics
  async getPaymentStats() {
    const response = await fetch(`${API_URL}/api/payments/stats`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch payment statistics');
    }

    return response.json();
  }
}

export const paymentService = new PaymentService();
export type { Payment, PaymentFilters, PaymentStats };