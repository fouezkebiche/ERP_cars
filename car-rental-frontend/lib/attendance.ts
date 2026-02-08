// lib/api/attendance.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Attendance {
  id: string;
  company_id: string;
  employee_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | 'weekend';
  leave_type?: 'sick' | 'vacation' | 'personal' | 'unpaid' | 'maternity' | 'paternity';
  leave_reason?: string;
  total_hours?: number;
  overtime_hours?: number;
  break_hours?: number;
  check_in_location?: { lat: number; lng: number; address: string };
  check_out_location?: { lat: number; lng: number; address: string };
  notes?: string;
  recorded_by?: string;
  approved_by?: string;
  employee?: {
    id: string;
    full_name: string;
    position?: string;
    department?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  employee_id: string;
  total_days: number;
  days_present: number;
  days_absent: number;
  days_on_leave: number;
  total_hours: number;
  overtime_hours: number;
  employee?: {
    id: string;
    full_name: string;
    position?: string;
    department?: string;
  };
}

export interface CheckInData {
  employee_id: string;
  check_in_time?: string;
  location?: { lat: number; lng: number; address: string };
  notes?: string;
}

export interface CheckOutData {
  employee_id: string;
  check_out_time?: string;
  location?: { lat: number; lng: number; address: string };
  notes?: string;
}

export interface MarkAttendanceData {
  employee_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | 'weekend';
  check_in_time?: string;
  check_out_time?: string;
  leave_type?: 'sick' | 'vacation' | 'personal' | 'unpaid' | 'maternity' | 'paternity';
  notes?: string;
}

class AttendanceAPI {
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

  // Check in employee
  async checkIn(data: CheckInData): Promise<{ attendance: Attendance }> {
    const response = await fetch(`${API_URL}/api/attendance/check-in`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Check out employee
  async checkOut(data: CheckOutData): Promise<{ attendance: Attendance }> {
    const response = await fetch(`${API_URL}/api/attendance/check-out`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Manually mark attendance
  async markAttendance(data: MarkAttendanceData): Promise<{ attendance: Attendance }> {
    const response = await fetch(`${API_URL}/api/attendance/mark`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Get attendance records
  async getAttendance(params?: {
    employee_id?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ attendance: Attendance[]; meta: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_URL}/api/attendance?${queryParams.toString()}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  }

  // Get attendance summary
  async getAttendanceSummary(params?: {
    employee_id?: string;
    month?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ summary: AttendanceSummary[] }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_URL}/api/attendance/summary?${queryParams.toString()}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  }

  // Get today's attendance
  async getTodayAttendance(): Promise<{
    attendance: Attendance[];
    summary: {
      total_employees: number;
      checked_in: number;
      not_checked_in: number;
      present: number;
      late: number;
      on_leave: number;
    };
  }> {
    const response = await fetch(`${API_URL}/api/attendance/today`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
}

export const attendanceAPI = new AttendanceAPI();