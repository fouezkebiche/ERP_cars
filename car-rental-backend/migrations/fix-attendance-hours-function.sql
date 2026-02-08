-- Migration: Fix calculate_working_hours function overload
-- Reason: check-out was failing with
--   "function calculate_working_hours(timestamp without time zone,
--    timestamp without time zone, numeric) does not exist"
--
-- The trigger update_attendance_hours() calls:
--   calculate_working_hours(NEW.check_in_time, NEW.check_out_time, COALESCE(NEW.break_hours, 0) * 60)
-- which passes a NUMERIC as the third argument. The original function
-- was defined with an INTEGER third parameter, so PostgreSQL could not
-- resolve the call.
--
-- This migration adds an overloaded version of calculate_working_hours
-- that accepts a NUMERIC third parameter, so both calls will work.

CREATE OR REPLACE FUNCTION calculate_working_hours(
  check_in TIMESTAMP,
  check_out TIMESTAMP,
  break_minutes NUMERIC
) RETURNS DECIMAL AS $$
BEGIN
  IF check_out IS NULL OR check_in IS NULL THEN
    RETURN 0;
  END IF;

  RETURN ROUND(
    EXTRACT(EPOCH FROM (check_out - check_in)) / 3600
    - (break_minutes / 60.0),
    2
  );
END;
$$ LANGUAGE plpgsql;

-- End of migration

