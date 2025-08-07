-- Tabela para Avisos (Announcements)
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE, -- Opcional, para avisos de uma turma específica
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.announcements IS 'Armazena avisos e informações para cursos ou turmas.';
COMMENT ON COLUMN public.announcements.course_id IS 'O curso ao qual o aviso está associado.';
COMMENT ON COLUMN public.announcements.class_id IS 'A turma específica para o aviso (se aplicável).';
COMMENT ON COLUMN public.announcements.created_by IS 'O usuário (instrutor/admin) que criou o aviso.';
