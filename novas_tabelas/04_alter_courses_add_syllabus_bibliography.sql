-- Adiciona colunas de Ementa (Syllabus) e Bibliografia na tabela de Cursos
ALTER TABLE public.courses
ADD COLUMN syllabus TEXT,
ADD COLUMN bibliography TEXT;

-- Adicionar comentários para as novas colunas
COMMENT ON COLUMN public.courses.syllabus IS 'A ementa completa do curso.';
COMMENT ON COLUMN public.courses.bibliography IS 'A bibliografia recomendada para o curso.';
