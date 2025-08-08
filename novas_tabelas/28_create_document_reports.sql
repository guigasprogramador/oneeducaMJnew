-- Fase 3: Relatórios Adicionais (Documentos)

-- Conceder permissões necessárias se ainda não foram concedidas
GRANT USAGE ON SCHEMA reports TO authenticated;

-- 1. Função para relatório de quantitativo de documentos emitidos (Requisito 3.2.4.2)
-- Esta função retorna a contagem de cada tipo de documento.
CREATE OR REPLACE FUNCTION reports.get_document_issuance_summary(
    start_date_param DATE DEFAULT NULL,
    end_date_param DATE DEFAULT NULL
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
    GROUP BY
        d.document_type;
END;
$$;

GRANT EXECUTE ON FUNCTION reports.get_document_issuance_summary(DATE, DATE) TO authenticated;

-- Exemplo de como chamar a função:
/*
SELECT * FROM reports.get_document_issuance_summary('2023-01-01', '2023-12-31');
*/
