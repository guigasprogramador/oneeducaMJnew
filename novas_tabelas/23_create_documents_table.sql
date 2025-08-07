-- SQL para a Tabela de Documentos Gerais

-- Enum para tipos de documentos, para garantir consistência
CREATE TYPE public.document_type_enum AS ENUM (
    'declaration',
    'contract',
    'student_id_card',
    'report_card',
    'school_transcript'
);

-- Tabela para armazenar documentos gerais
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type public.document_type_enum NOT NULL,
    title TEXT NOT NULL,
    content_html TEXT NOT NULL,
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    authentication_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

    -- Relação opcional com um curso, se o documento for específico de um curso
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_authentication_code ON public.documents(authentication_code);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON public.documents(document_type);


-- Habilitar Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Usuários podem ver seus próprios documentos
CREATE POLICY "Users can view their own documents"
ON public.documents FOR SELECT
USING (auth.uid() = user_id);

-- Administradores podem gerenciar todos os documentos
CREATE POLICY "Admins can manage all documents"
ON public.documents FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Função para verificar um documento pelo código de autenticação.
-- Esta função pode ser chamada por usuários anônimos para verificar a autenticidade de um documento.
CREATE OR REPLACE FUNCTION public.get_document_by_auth_code(auth_code TEXT)
RETURNS SETOF public.documents AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.documents
    WHERE authentication_code = auth_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissão para o role 'anon' (usuários não autenticados) chamar esta função
GRANT EXECUTE ON FUNCTION public.get_document_by_auth_code(TEXT) TO anon;

-- Usuários autenticados também devem poder chamar a função
GRANT EXECUTE ON FUNCTION public.get_document_by_auth_code(TEXT) TO authenticated;
