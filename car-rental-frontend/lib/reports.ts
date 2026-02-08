// lib/api/reports.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  vehicleIds?: string[];
  customerIds?: string[];
  minRevenue?: number;
  maxRevenue?: number;
  minUtilization?: number;
  maxUtilization?: number;
  vehicleBrand?: string;
  customerType?: 'individual' | 'corporate';
  sortBy?: 'profit' | 'revenue' | 'utilization';
}

export interface ExecutiveReport {
  report_type: 'executive_summary';
  generated_at: string;
  period: { start: string; end: string; days: number };
  summary: {
    total_revenue: number;
    revenue_growth: number;
    total_contracts: number;
    fleet_utilization: number;
    active_customers: number;
    new_customers: number;
    maintenance_alerts: number;
  };
  revenue_breakdown: {
    total: number;
    average_transaction: number;
    payment_count: number;
    by_method: Array<{
      method: string;
      amount: number;
      count: number;
    }>;
  };
  fleet_overview: {
    total_vehicles: number;
    active_rentals: number;
    available: number;
    maintenance: number;
    average_utilization: number;
  };
  top_customers: Array<{
    name: string;
    type: string;
    total_rentals: number;
    lifetime_value: number;
  }>;
  top_vehicles: Array<any>;
  trends: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
}

export interface VehicleReport {
  report_type: 'vehicle_performance';
  generated_at: string;
  period: { start: string; end: string; days: number };
  fleet_summary: {
    total_vehicles: number;
    total_revenue: number;
    total_costs: number;
    total_profit: number;
    average_utilization: number;
    profit_margin: number;
  };
  top_performers: Array<any>;
  bottom_performers: Array<any>;
  maintenance_alerts: Array<{
    registration: string;
    vehicle: string;
    current_mileage: number;
    next_maintenance: number;
    km_overdue: number;
  }>;
  all_vehicles: Array<any>;
}

export interface CustomerReport {
  report_type: 'customer_insights';
  generated_at: string;
  period: { start: string; end: string; days: number };
  customer_segmentation: {
    total_customers: number;
    segments: {
      vip: { count: number; total_value: number; customers: Array<any> };
      high_value: { count: number; total_value: number };
      medium_value: { count: number; total_value: number };
      low_value: { count: number; total_value: number };
    };
  };
  retention_metrics: {
    new_customers: number;
    repeat_customers: number;
    total_active_customers: number;
    retention_rate: number;
  };
  booking_trends: Array<{
    date: string;
    bookings: number;
    avg_duration: string;
  }>;
  booking_patterns: {
    by_weekday: Array<{ day: string; count: number }>;
    by_customer_type: Array<{ type: string; bookings: number; revenue: number }>;
  };
}

export type ReportData = ExecutiveReport | VehicleReport | CustomerReport;
export type ReportType = 'executive' | 'vehicle' | 'customer';

class ReportsAPI {
  private getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private buildQueryString(params?: Record<string, any>): string {
    if (!params) return '';
    
    const filtered = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => acc.append(key, String(v)));
        } else {
          acc.append(key, String(value));
        }
        return acc;
      }, new URLSearchParams());
    
    const queryString = filtered.toString();
    return queryString ? `?${queryString}` : '';
  }

  private async request<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = this.buildQueryString(params);
    const url = `${API_URL}${endpoint}${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data.report;
  }

  // Generate JSON Report
  async generateReport(type: ReportType, filters?: ReportFilters): Promise<ReportData> {
    return this.request<ReportData>(`/api/reports/${type}`, filters);
  }

  // Download PDF Report
  async downloadPDF(type: ReportType, filters?: ReportFilters): Promise<void> {
    const queryString = this.buildQueryString(filters);
    const url = `${API_URL}/api/reports/${type}/pdf${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Download Excel Report
  async downloadExcel(type: ReportType, filters?: ReportFilters): Promise<void> {
    const queryString = this.buildQueryString(filters);
    const url = `${API_URL}/api/reports/${type}/excel${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to download Excel: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Download JSON Report
  async downloadJSON(type: ReportType, filters?: ReportFilters): Promise<void> {
    const report = await this.generateReport(type, filters);
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
}

export const reportsAPI = new ReportsAPI();