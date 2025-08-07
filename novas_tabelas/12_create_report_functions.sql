-- Fase 2: Desenvolvimento do Back-end (Funções SQL para Relatórios)

-- 1. Criar um novo esquema para isolar as funções de relatório
CREATE SCHEMA IF NOT EXISTS reports;

-- Conceder permissão de uso do esquema para o role 'authenticated' (ou outro role relevante)
-- Isso permite que os usuários logados chamem as funções neste esquema.
GRANT USAGE ON SCHEMA reports TO authenticated;

-- 2. Implementar a primeira função de relatório (Requisito 3.1.3.1)
-- Esta função retorna o quantitativo de cursos, turmas e aulas.
CREATE OR REPLACE FUNCTION reports.get_quantitative_summary(
    start_date_param DATE,
    end_date_param DATE,
    origin_param TEXT DEFAULT NULL,
    nature_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    course_count BIGINT,
    class_count BIGINT,
    lesson_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT c.id) AS course_count,
        COUNT(DISTINCT cl.id) AS class_count,
        COUNT(DISTINCT l.id) AS lesson_count
    FROM
        public.courses AS c
    LEFT JOIN
        public.classes AS cl ON c.id = cl.course_id
    LEFT JOIN
        public.modules AS m ON c.id = m.course_id
    LEFT JOIN
        public.lessons AS l ON m.id = l.module_id
    WHERE
        -- Filtro de período (baseado na data de criação do curso)
        c.created_at >= start_date_param AND c.created_at < (end_date_param + INTERVAL '1 day')
        -- Filtro de origem (ignorado se for NULO)
        AND (origin_param IS NULL OR c.origin = origin_param)
        -- Filtro de natureza (ignorado se for NULO)
        AND (nature_param IS NULL OR c.nature = nature_param);
END;
$$;

-- Conceder permissão de execução da função para o role 'authenticated'
GRANT EXECUTE ON FUNCTION reports.get_quantitative_summary(DATE, DATE, TEXT, TEXT) TO authenticated;

-- Exemplo de como chamar a função:
/*
SELECT * FROM reports.get_quantitative_summary(
    '2023-01-01',
    '2023-12-31',
    'interno',
    'capacitação'
);
*/

-- Fim do script inicial de funções de relatório.
