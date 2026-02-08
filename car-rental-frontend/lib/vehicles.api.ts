// lib/vehicles.api.ts - FIXED VERSION
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Vehicle {
  id: string
  company_id: string
  brand: string
  model: string
  year: number
  registration_number: string
  vin?: string
  color?: string
  transmission: 'manual' | 'automatic'
  fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid'
  seats: number
  daily_rate: number
  status: 'available' | 'rented' | 'maintenance' | 'retired'
  mileage: number
  last_maintenance_mileage: number
  next_maintenance_mileage?: number
  maintenance_interval_km: number
  maintenance_alert_threshold: number
  last_maintenance_alert_mileage: number
  last_maintenance_date?: string
  next_maintenance_date?: string
  total_maintenance_costs: number
  maintenance_count: number
  last_oil_change_mileage?: number
  last_oil_change_date?: string
  purchase_price?: number
  purchase_date?: string
  photos: string[]
  features: Record<string, any>
  notes?: string
  created_at: string
  updated_at: string
  costs?: VehicleCost[]
}

export interface VehicleCost {
  id: string
  vehicle_id: string
  cost_type: 'fuel' | 'maintenance' | 'insurance' | 'registration' | 'cleaning' | 'repair' | 'other'
  amount: number
  incurred_date: string
  description?: string
  receipt_url?: string
  created_by: string
  metadata?: Record<string, any>
  created_at: string
}

export interface GetVehiclesParams {
  status?: string
  brand?: string
  transmission?: string
  fuel_type?: string
  min_rate?: number
  max_rate?: number
  search?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'ASC' | 'DESC'
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: {
    pagination: {
      total: number
      page: number
      limit: number
      total_pages: number
    }
  }
}

class VehiclesAPI {
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
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    return filtered ? `?${filtered}` : '';
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
      params?: Record<string, any>,
      body?: any
    } = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', params, body } = options;
    const queryString = this.buildQueryString(params);
    const url = `${API_URL}${endpoint}${queryString}`;

    console.log(`🔵 API Request: ${method} ${url}`, { params, body });

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        ...(body && { body: JSON.stringify(body) }),
      });

      console.log(`📡 Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          const error = new Error('Unauthorized');
          (error as any).statusCode = 401;
          (error as any).details = 'Please login again';
          (error as any).success = false;
          throw error;
        }
        
        // Try to parse error response
        let errorData: any;
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = { message: text || response.statusText };
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { message: response.statusText };
        }

        console.error(`❌ API Error Response:`, errorData);

        const error = new Error(errorData.message || `HTTP ${response.status}`);
        (error as any).statusCode = response.status;
        (error as any).details = errorData.details || errorData.error || response.statusText;
        (error as any).success = false;
        
        throw error;
      }

      const result = await response.json();
      console.log(`✅ API Success:`, result);
      return result;
    } catch (error: any) {
      // Re-throw if it's already our formatted error
      if (error.statusCode !== undefined) {
        throw error;
      }
      
      // Network error or other fetch error
      console.error(`❌ Network Error:`, error);
      const networkError = new Error('Network error - Could not connect to server');
      (networkError as any).statusCode = 0;
      (networkError as any).details = error.message;
      (networkError as any).success = false;
      throw networkError;
    }
  }

  // GET /api/vehicles - List all vehicles
  async getVehicles(params?: GetVehiclesParams): Promise<ApiResponse<{ vehicles: Vehicle[] }>> {
    return this.request<{ vehicles: Vehicle[] }>('/api/vehicles', { params });
  }

  // GET /api/vehicles/available - Get available vehicles
  async getAvailableVehicles(params?: { start_date?: string; end_date?: string }): Promise<ApiResponse<{ vehicles: Vehicle[] }>> {
    return this.request<{ vehicles: Vehicle[] }>('/api/vehicles/available', { params });
  }

  // GET /api/vehicles/:id - Get single vehicle
  async getVehicleById(id: string): Promise<ApiResponse<{ vehicle: Vehicle }>> {
    return this.request<{ vehicle: Vehicle }>(`/api/vehicles/${id}`);
  }

  // POST /api/vehicles - Create vehicle
  async createVehicle(data: Partial<Vehicle>): Promise<ApiResponse<{ vehicle: Vehicle }>> {
    return this.request<{ vehicle: Vehicle }>('/api/vehicles', {
      method: 'POST',
      body: data,
    });
  }

  // PUT /api/vehicles/:id - Update vehicle
  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<ApiResponse<{ vehicle: Vehicle }>> {
    return this.request<{ vehicle: Vehicle }>(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  // DELETE /api/vehicles/:id - Delete vehicle
  async deleteVehicle(id: string): Promise<ApiResponse<{ vehicle: Vehicle }>> {
    return this.request<{ vehicle: Vehicle }>(`/api/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  // POST /api/vehicles/:id/costs - Add vehicle cost
  async addVehicleCost(vehicleId: string, data: {
    cost_type: VehicleCost['cost_type']
    amount: number
    incurred_date: string
    description?: string
    receipt_url?: string
  }): Promise<ApiResponse<{ cost: VehicleCost }>> {
    return this.request<{ cost: VehicleCost }>(`/api/vehicles/${vehicleId}/costs`, {
      method: 'POST',
      body: data,
    });
  }

  // GET /api/vehicles/:id/costs - Get cost history
  async getVehicleCosts(vehicleId: string, params?: {
    cost_type?: string
    start_date?: string
    end_date?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ costs: VehicleCost[]; total_cost: number }>> {
    return this.request<{ costs: VehicleCost[]; total_cost: number }>(`/api/vehicles/${vehicleId}/costs`, { params });
  }

  // POST /api/vehicles/:id/maintenance/complete - Complete maintenance
  async completeMaintenanceService(vehicleId: string, data: {
    mileage: number
    service_type: 'oil_change' | 'full_service' | 'tire_change' | 'brake_service' | 'general_inspection' | 'other'
    cost: number
    performed_date: string
    description?: string
    next_service_km?: number
    parts_replaced?: string[]
    technician_name?: string
    service_center?: string
  }): Promise<ApiResponse<{ vehicle: Vehicle; maintenance_cost: VehicleCost }>> {
    return this.request<{ vehicle: Vehicle; maintenance_cost: VehicleCost }>(
      `/api/vehicles/${vehicleId}/maintenance/complete`,
      { method: 'POST', body: data }
    );
  }

  // GET /api/vehicles/:id/maintenance/history - Get maintenance history
  async getMaintenanceHistory(vehicleId: string, params?: {
    page?: number
    limit?: number
  }): Promise<ApiResponse<{
    vehicle: {
      id: string
      brand: string
      model: string
      registration: string
      current_mileage: number
    }
    maintenance_records: VehicleCost[]
    stats: {
      total_maintenance_count: number
      total_maintenance_costs: number
      average_cost_per_service: number
      last_maintenance_date?: string
      last_maintenance_mileage: number
      next_maintenance_mileage?: number
      km_until_next_maintenance: number
      maintenance_interval_km: number
    }
  }>> {
    return this.request(`/api/vehicles/${vehicleId}/maintenance/history`, { params });
  }

  // GET /api/vehicles/maintenance/due - Get vehicles due for maintenance
  async getVehiclesDueMaintenance(status?: 'all' | 'overdue' | 'upcoming'): Promise<ApiResponse<{
    summary: {
      total: number
      critical_overdue: number
      overdue: number
      upcoming: number
    }
    vehicles: {
      critical_overdue: Vehicle[]
      overdue: Vehicle[]
      upcoming: Vehicle[]
    }
  }>> {
    return this.request('/api/vehicles/maintenance/due', {
      params: status ? { status } : undefined
    });
  }
}

// Export singleton instance
export const vehiclesAPI = new VehiclesAPI();

// Export convenience functions for backward compatibility
export const getVehicles = (params?: GetVehiclesParams) => vehiclesAPI.getVehicles(params);
export const getAvailableVehicles = (params?: { start_date?: string; end_date?: string }) => vehiclesAPI.getAvailableVehicles(params);
export const getVehicleById = (id: string) => vehiclesAPI.getVehicleById(id);
export const createVehicle = (data: Partial<Vehicle>) => vehiclesAPI.createVehicle(data);
export const updateVehicle = (id: string, data: Partial<Vehicle>) => vehiclesAPI.updateVehicle(id, data);
export const deleteVehicle = (id: string) => vehiclesAPI.deleteVehicle(id);
export const addVehicleCost = (vehicleId: string, data: any) => vehiclesAPI.addVehicleCost(vehicleId, data);
export const getVehicleCosts = (vehicleId: string, params?: any) => vehiclesAPI.getVehicleCosts(vehicleId, params);
export const completeMaintenanceService = (vehicleId: string, data: any) => vehiclesAPI.completeMaintenanceService(vehicleId, data);
export const getMaintenanceHistory = (vehicleId: string, params?: any) => vehiclesAPI.getMaintenanceHistory(vehicleId, params);
export const getVehiclesDueMaintenance = (status?: 'all' | 'overdue' | 'upcoming') => vehiclesAPI.getVehiclesDueMaintenance(status);