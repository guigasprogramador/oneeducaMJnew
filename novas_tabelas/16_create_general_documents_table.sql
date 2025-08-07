-- Criação da tabela de Documentos Gerais
CREATE TABLE public.general_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT NOT NULL,
  document_type TEXT,
  category TEXT,
  file_size BIGINT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.general_documents ENABLE ROW LEVEL SECURITY;

-- Adicionar comentários
COMMENT ON TABLE public.general_documents IS 'Armazena documentos gerais para o diretório online.';
COMMENT ON COLUMN public.general_documents.title IS 'Título do documento.';
COMMENT ON COLUMN public.general_documents.description IS 'Descrição do documento.';
COMMENT ON COLUMN public.general_documents.document_url IS 'URL para acessar o documento.';
COMMENT ON COLUMN public.general_documents.document_type IS 'Tipo MIME do arquivo.';
COMMENT ON COLUMN public.general_documents.category IS 'Categoria ou natureza do documento.';
COMMENT ON COLUMN public.general_documents.file_size IS 'Tamanho do arquivo em bytes.';
COMMENT ON COLUMN public.general_documents.created_by IS 'Referência ao usuário que fez o upload do documento.';
