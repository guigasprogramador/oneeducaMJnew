-- Criação da tabela de Turmas (Classes)
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Adicionar comentários para clareza
COMMENT ON TABLE public.classes IS 'Armazena as turmas de um curso, permitindo múltiplas ofertas do mesmo conteúdo.';
COMMENT ON COLUMN public.classes.course_id IS 'Referência ao curso ao qual esta turma pertence.';
COMMENT ON COLUMN public.classes.name IS 'Nome da turma (ex: "Turma 2024.1").';
COMMENT ON COLUMN public.classes.instructor_id IS 'ID do professor responsável pela turma.';
COMMENT ON COLUMN public.classes.start_date IS 'Data de início da turma.';
COMMENT ON COLUMN public.classes.end_date IS 'Data de término da turma.';
