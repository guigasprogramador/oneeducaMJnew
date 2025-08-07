-- Criação da tabela de Documentos do Curso
CREATE TABLE public.course_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.course_documents ENABLE ROW LEVEL SECURITY;

-- Adicionar comentários
COMMENT ON TABLE public.course_documents IS 'Armazena documentos didáticos associados a um curso.';
COMMENT ON COLUMN public.course_documents.course_id IS 'Referência ao curso ao qual o documento pertence.';
COMMENT ON COLUMN public.course_documents.document_name IS 'Nome do documento para exibição.';
COMMENT ON COLUMN public.course_documents.document_url IS 'URL para acessar o documento.';
