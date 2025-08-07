-- 1. Create the courses_taught table
CREATE TABLE IF NOT EXISTS public.courses_taught (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    hours_logged NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (professor_id, course_id)
);

-- 2. Create the professor_payments table
CREATE TABLE IF NOT EXISTS public.professor_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add RLS policies for courses_taught
ALTER TABLE public.courses_taught ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can view their own taught courses"
ON public.courses_taught
FOR SELECT USING (auth.uid() = professor_id);

CREATE POLICY "Admins can manage all taught courses"
ON public.courses_taught
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Add RLS policies for professor_payments
ALTER TABLE public.professor_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can view their own payments"
ON public.professor_payments
FOR SELECT USING (auth.uid() = professor_id);

CREATE POLICY "Admins can manage all professor payments"
ON public.professor_payments
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
