-- Criação da tabela de Pré-requisitos de Cursos
CREATE TABLE public.course_prerequisites (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  prerequisite_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, prerequisite_id)
);

ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;

-- Adicionar comentários
COMMENT ON TABLE public.course_prerequisites IS 'Define os pré-requisitos entre cursos.';
COMMENT ON COLUMN public.course_prerequisites.course_id IS 'O curso que requer um pré-requisito.';
COMMENT ON COLUMN public.course_prerequisites.prerequisite_id IS 'O curso que é o pré-requisito.';
