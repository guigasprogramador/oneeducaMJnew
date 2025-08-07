-- Criação da tabela de Trabalhos Acadêmicos
CREATE TABLE public.academic_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_url TEXT NOT NULL,
  document_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.academic_works ENABLE ROW LEVEL SECURITY;

-- Adicionar comentários
COMMENT ON TABLE public.academic_works IS 'Armazena trabalhos acadêmicos enviados por alunos para uma turma.';
COMMENT ON COLUMN public.academic_works.class_id IS 'Referência à turma para a qual o trabalho foi enviado.';
COMMENT ON COLUMN public.academic_works.user_id IS 'Referência ao aluno que enviou o trabalho.';
COMMENT ON COLUMN public.academic_works.title IS 'Título do trabalho.';
COMMENT ON COLUMN public.academic_works.document_url IS 'URL para acessar o documento do trabalho.';
COMMENT ON COLUMN public.academic_works.document_type IS 'Tipo MIME do arquivo.';
COMMENT ON COLUMN public.academic_works.file_size IS 'Tamanho do arquivo em bytes.';
