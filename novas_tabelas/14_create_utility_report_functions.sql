-- Funções de Utilitário Adicionais para Relatórios

-- Função para buscar alunos por faixa de progresso.
-- Útil para relatórios como "Alunos em Fase de Conclusão" (progresso >= 80 e <= 99).
CREATE OR REPLACE FUNCTION reports.get_students_by_progress_range(
    class_id_param UUID,
    min_progress_param INT,
    max_progress_param INT
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    enrollment_status TEXT,
    progress INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        CASE
            WHEN e.completed_at IS NOT NULL THEN 'Concluinte'
            -- A definição de 'Evadido' pode variar, mas usamos a mesma lógica dos outros relatórios por consistência
            WHEN cl.end_date < now() AND e.progress < 75 THEN 'Evadido'
            ELSE 'Em andamento'
        END AS status,
        e.progress
    FROM
        public.enrollments AS e
    JOIN
        public.profiles AS p ON e.user_id = p.id
    JOIN
        public.classes AS cl ON e.class_id = cl.id
    WHERE
        e.class_id = class_id_param
        AND e.progress >= min_progress_param
        AND e.progress <= max_progress_param
    ORDER BY
        p.name;
END;
$$;

-- Conceder permissão de execução da função
GRANT EXECUTE ON FUNCTION reports.get_students_by_progress_range(UUID, INT, INT) TO authenticated;
