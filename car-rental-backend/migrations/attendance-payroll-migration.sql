-- Migration: Add Attendance and Payroll Tables
-- Run this migration to add attendance tracking and payroll management

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Date and timing
  date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  
  -- Attendance status
  status VARCHAR(50) NOT NULL DEFAULT 'present',
  -- Options: 'present', 'absent', 'late', 'half_day', 'leave', 'holiday', 'weekend'
  
  -- Leave details (if status = 'leave')
  leave_type VARCHAR(50),
  -- Options: 'sick', 'vacation', 'personal', 'unpaid', 'maternity', 'paternity'
  leave_reason TEXT,
  leave_approved_by UUID REFERENCES users(id),
  
  -- Working hours
  total_hours DECIMAL(4, 2), -- Calculated: check_out - check_in
  overtime_hours DECIMAL(4, 2) DEFAULT 0,
  break_hours DECIMAL(4, 2) DEFAULT 0,
  
  -- Location tracking (optional)
  check_in_location JSONB, -- {lat, lng, address}
  check_out_location JSONB,
  
  -- Notes and approval
  notes TEXT,
  recorded_by UUID REFERENCES users(id), -- Who marked attendance
  approved_by UUID REFERENCES users(id), -- Manager approval for special cases
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_employee_date UNIQUE (employee_id, date),
  CONSTRAINT valid_times CHECK (check_out_time IS NULL OR check_out_time >= check_in_time),
  CONSTRAINT valid_hours CHECK (total_hours >= 0 AND overtime_hours >= 0)
);

-- Indexes for attendance
CREATE INDEX idx_attendance_company ON attendance(company_id);
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_month ON attendance(company_id, date_trunc('month', date));

-- ============================================
-- PAYROLL TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Pay period
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  payment_date DATE,
  
  -- Basic salary components
  base_salary DECIMAL(12, 2) NOT NULL,
  gross_salary DECIMAL(12, 2) NOT NULL,
  net_salary DECIMAL(12, 2) NOT NULL,
  
  -- Attendance-based calculations
  total_days_in_period INT NOT NULL,
  days_present INT DEFAULT 0,
  days_absent INT DEFAULT 0,
  days_on_leave INT DEFAULT 0,
  total_hours_worked DECIMAL(8, 2) DEFAULT 0,
  overtime_hours DECIMAL(8, 2) DEFAULT 0,
  
  -- Earnings breakdown
  earnings JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "basic_pay": 50000,
  --   "overtime_pay": 5000,
  --   "commission": 10000,
  --   "bonuses": 2000,
  --   "allowances": {"transport": 1000, "housing": 5000}
  -- }
  
  -- Deductions breakdown
  deductions JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "tax": 8000,
  --   "social_security": 3000,
  --   "insurance": 1500,
  --   "unpaid_leave": 2000,
  --   "advance_deduction": 5000,
  --   "other": {"loan": 1000}
  -- }
  
  -- Payment details
  payment_method VARCHAR(50), -- 'bank_transfer', 'cash', 'check'
  payment_reference VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'pending',
  -- Options: 'pending', 'approved', 'paid', 'cancelled'
  
  -- Approval workflow
  calculated_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  paid_by UUID REFERENCES users(id),
  
  -- Notes and attachments
  notes TEXT,
  payslip_url TEXT, -- Link to generated payslip PDF
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_employee_period UNIQUE (employee_id, pay_period_start, pay_period_end),
  CONSTRAINT valid_period CHECK (pay_period_end >= pay_period_start),
  CONSTRAINT valid_amounts CHECK (base_salary >= 0 AND gross_salary >= 0 AND net_salary >= 0)
);

-- Indexes for payroll
CREATE INDEX idx_payroll_company ON payroll(company_id);
CREATE INDEX idx_payroll_employee ON payroll(employee_id);
CREATE INDEX idx_payroll_period ON payroll(pay_period_start, pay_period_end);
CREATE INDEX idx_payroll_status ON payroll(payment_status);
CREATE INDEX idx_payroll_payment_date ON payroll(payment_date);

-- ============================================
-- LEAVE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Leave details
  leave_type VARCHAR(50) NOT NULL,
  -- Options: 'sick', 'vacation', 'personal', 'unpaid', 'maternity', 'paternity', 'emergency'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  
  -- Request details
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  -- Options: 'pending', 'approved', 'rejected', 'cancelled'
  
  -- Approval workflow
  requested_by UUID REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  review_date TIMESTAMP,
  
  -- Supporting documents
  attachment_urls JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_days CHECK (total_days > 0)
);

-- Indexes for leave requests
CREATE INDEX idx_leave_requests_company ON leave_requests(company_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- ============================================
-- SHIFTS TABLE (Optional - for shift-based work)
-- ============================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Shift details
  name VARCHAR(100) NOT NULL, -- e.g., "Morning Shift", "Night Shift"
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Shift settings
  break_duration_minutes INT DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  color_code VARCHAR(7), -- Hex color for UI display
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EMPLOYEE SHIFTS (Assignment)
-- ============================================
CREATE TABLE IF NOT EXISTS employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  
  -- Assignment period
  effective_from DATE NOT NULL,
  effective_to DATE,
  
  -- Days of week (for recurring shifts)
  days_of_week JSONB DEFAULT '[]'::jsonb,
  -- Example: ["monday", "tuesday", "wednesday", "thursday", "friday"]
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EMPLOYEE LEAVE BALANCE
-- ============================================
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Leave type and balance
  leave_type VARCHAR(50) NOT NULL,
  year INT NOT NULL,
  
  -- Balance tracking
  total_allocated INT NOT NULL DEFAULT 0, -- Days allocated per year
  used INT DEFAULT 0,
  pending INT DEFAULT 0, -- Pending approval
  available INT GENERATED ALWAYS AS (total_allocated - used - pending) STORED,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_employee_leave_year UNIQUE (employee_id, leave_type, year)
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate working hours
CREATE OR REPLACE FUNCTION calculate_working_hours(
  check_in TIMESTAMP,
  check_out TIMESTAMP,
  break_minutes INT DEFAULT 60
) RETURNS DECIMAL AS $$
BEGIN
  IF check_out IS NULL OR check_in IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(
    EXTRACT(EPOCH FROM (check_out - check_in)) / 3600 - (break_minutes / 60.0),
    2
  );
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update attendance total_hours on check-out
CREATE OR REPLACE FUNCTION update_attendance_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
    NEW.total_hours := calculate_working_hours(
      NEW.check_in_time,
      NEW.check_out_time,
      COALESCE(NEW.break_hours, 0) * 60
    );
  END IF;
  
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate hours
CREATE TRIGGER update_attendance_hours_trigger
BEFORE INSERT OR UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION update_attendance_hours();

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Insert default shifts
INSERT INTO shifts (company_id, name, start_time, end_time, break_duration_minutes, color_code)
VALUES 
  ((SELECT id FROM companies LIMIT 1), 'Morning Shift', '08:00', '16:00', 60, '#3b82f6'),
  ((SELECT id FROM companies LIMIT 1), 'Afternoon Shift', '12:00', '20:00', 60, '#f59e0b'),
  ((SELECT id FROM companies LIMIT 1), 'Night Shift', '20:00', '04:00', 60, '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON payroll TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_requests TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON shifts TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON employee_shifts TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_balances TO PUBLIC;

-- Migration complete
SELECT 'Attendance and Payroll tables created successfully!' AS status;