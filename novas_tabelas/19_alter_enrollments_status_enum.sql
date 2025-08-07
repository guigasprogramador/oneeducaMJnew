-- 1. Create the new enum type for enrollment status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
        CREATE TYPE public.enrollment_status AS ENUM ('active', 'inactive', 'locked', 'cancelled', 'withdrawn');
    END IF;
END
$$;

-- 2. Alter the 'enrollments' table to use the new enum type for the 'status' column
-- This includes casting the existing 'text' data to the new 'enrollment_status' type.
-- It assumes the existing values in the 'status' column are compatible with the new enum.
ALTER TABLE public.enrollments
ALTER COLUMN status TYPE public.enrollment_status
USING status::text::public.enrollment_status;

-- 3. Set the default value for the 'status' column to 'active'
ALTER TABLE public.enrollments
ALTER COLUMN status SET DEFAULT 'active';
