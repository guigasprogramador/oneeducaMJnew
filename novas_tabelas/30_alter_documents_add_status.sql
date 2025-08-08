-- Fase 5: Aprimoramento do Controle de Documentos

-- 1. Criar um tipo ENUM para o status do documento
CREATE TYPE public.document_status_enum AS ENUM (
    'emitido',
    'enviado',
    'arquivado',
    'cancelado'
);

-- 2. Adicionar a coluna 'status' à tabela 'documents'
ALTER TABLE public.documents
ADD COLUMN status public.document_status_enum NOT NULL DEFAULT 'emitido';

-- Adicionar comentário para clareza
COMMENT ON COLUMN public.documents.status IS 'Status do ciclo de vida do documento (emitido, enviado, arquivado, cancelado).';

-- 3. Atualizar a função de relatório de documentos para incluir o filtro de status
-- Em vez de criar uma nova, vamos modificar a existente para ser mais versátil.
CREATE OR REPLACE FUNCTION reports.get_document_issuance_summary(
    start_date_param DATE DEFAULT NULL,
    end_date_param DATE DEFAULT NULL,
    status_param public.document_status_enum DEFAULT NULL
)
RETURNS TABLE (
    document_type_br TEXT,
    issuance_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN d.document_type = 'declaration' THEN 'Declaração'
            WHEN d.document_type = 'contract' THEN 'Contrato'
            WHEN d.document_type = 'student_id_card' THEN 'Carteira de Identificação'
            WHEN d.document_type = 'report_card' THEN 'Boletim'
            WHEN d.document_type = 'school_transcript' THEN 'Histórico Escolar'
            ELSE d.document_type::TEXT
        END AS document_type_br,
        COUNT(d.id) AS issuance_count
    FROM
        public.documents AS d
    WHERE
      (start_date_param IS NULL OR d.issue_date >= start_date_param)
      AND (end_date_param IS NULL OR d.issue_date < (end_date_param + INTERVAL '1 day'))
      AND (status_param IS NULL OR d.status = status_param)
    GROUP BY
        d.document_type;
END;
$$;

-- A permissão precisa ser refeita para a nova assinatura da função
DROP FUNCTION IF EXISTS reports.get_document_issuance_summary(DATE, DATE);
GRANT EXECUTE ON FUNCTION reports.get_document_issuance_summary(DATE, DATE, public.document_status_enum) TO authenticated;

-- Exemplo de como chamar a função com o novo filtro:
/*
SELECT * FROM reports.get_document_issuance_summary('2023-01-01', '2023-12-31', 'arquivado');
*/
