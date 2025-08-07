-- Tabela para Formulários Personalizados (Custom Forms)
CREATE TABLE public.custom_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(course_id) -- Apenas um formulário por curso
);
ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.custom_forms IS 'Armazena a estrutura de formulários de inscrição personalizados para cursos.';

-- Tabela para Campos do Formulário (Form Fields)
CREATE TABLE public.form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL, -- ex: text, textarea, select, checkbox, radio
  options JSONB, -- Para tipos como select, checkbox, radio
  is_required BOOLEAN DEFAULT false,
  order_number INTEGER NOT NULL
);
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.form_fields IS 'Define os campos de um formulário personalizado.';

-- Tabela para Submissões de Formulário (Form Submissions)
CREATE TABLE public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(form_id, user_id)
);
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.form_submissions IS 'Registra que um usuário submeteu um formulário específico.';

-- Tabela para Respostas da Submissão (Submission Answers)
CREATE TABLE public.submission_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.form_submissions(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.form_fields(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL
);
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.submission_answers IS 'Armazena as respostas fornecidas por um usuário em um formulário.';
