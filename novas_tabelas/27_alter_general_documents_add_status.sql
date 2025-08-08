-- Adicionar a coluna 'status' à tabela 'general_documents'
ALTER TABLE public.general_documents
ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'archived'));

-- Adicionar um comentário para a nova coluna
COMMENT ON COLUMN public.general_documents.status IS 'Status do documento (ex: active, archived).';

-- Função para atualizar o timestamp da coluna 'updated_at'
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger na tabela 'general_documents' para ser acionado em cada UPDATE
CREATE TRIGGER set_timestamp_general_documents
BEFORE UPDATE ON public.general_documents
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Adicionar um comentário para o trigger para clareza
COMMENT ON TRIGGER set_timestamp_general_documents ON public.general_documents
IS 'Trigger para atualizar automaticamente o campo updated_at em qualquer atualização de linha.';
