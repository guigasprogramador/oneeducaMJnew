-- 1. Create the professor_details table
CREATE TABLE IF NOT EXISTS public.professor_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bio TEXT,
    specialization TEXT,
    qualifications TEXT[],
    availability JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create a trigger to update the 'updated_at' timestamp on every update
CREATE OR REPLACE FUNCTION public.handle_professor_details_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_professor_details_update
BEFORE UPDATE ON public.professor_details
FOR EACH ROW
EXECUTE FUNCTION public.handle_professor_details_update();

-- 3. Add RLS policies for the professor_details table
ALTER TABLE public.professor_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can view their own details"
ON public.professor_details
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Professors can update their own details"
ON public.professor_details
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all professor details"
ON public.professor_details
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
