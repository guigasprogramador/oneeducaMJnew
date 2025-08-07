-- Fase 2 (continuação): Funções SQL Adicionais para Relatórios

-- Conceder permissões necessárias se ainda não foram concedidas
GRANT USAGE ON SCHEMA reports TO authenticated;

-- 3. Função para relatório de inscritos por cargo (Requisito 3.1.3.5)
CREATE OR REPLACE FUNCTION reports.get_enrollment_by_role(
    start_date_param DATE,
    end_date_param DATE,
    course_id_param UUID DEFAULT NULL,
    class_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
    course_title TEXT,
    user_role TEXT,
    enrollment_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.title,
        COALESCE(p.role, 'Não especificado'),
        COUNT(e.id)
    FROM
        public.enrollments AS e
    JOIN
        public.profiles AS p ON e.user_id = p.id
    JOIN
        public.classes AS cl ON e.class_id = cl.id
    JOIN
        public.courses AS c ON cl.course_id = c.id
    WHERE
        e.enrolled_at >= start_date_param AND e.enrolled_at < (end_date_param + INTERVAL '1 day')
        AND (course_id_param IS NULL OR c.id = course_id_param)
        AND (class_id_param IS NULL OR cl.id = class_id_param)
    GROUP BY
        c.title, p.role;
END;
$$;

GRANT EXECUTE ON FUNCTION reports.get_enrollment_by_role(DATE, DATE, UUID, UUID) TO authenticated;

-- 4. Função para relatório de alunos por turma (Requisito 3.1.3.6.2)
CREATE OR REPLACE FUNCTION reports.get_students_per_class(
    class_id_param UUID,
    status_param TEXT DEFAULT 'todos' -- 'todos', 'concluintes', 'evadidos'
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
            -- Definição de 'Evadido': progresso < 75% e a turma já terminou.
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
        AND (
            status_param = 'todos' OR
            (status_param = 'concluintes' AND e.completed_at IS NOT NULL) OR
            (status_param = 'evadidos' AND cl.end_date < now() AND e.progress < 75)
        );
END;
$$;

GRANT EXECUTE ON FUNCTION reports.get_students_per_class(UUID, TEXT) TO authenticated;

-- 5. Função para relatório de notas finais (Requisito 3.1.3.6.11)
CREATE OR REPLACE FUNCTION reports.get_final_grades(
    course_id_param UUID DEFAULT NULL,
    class_id_param UUID DEFAULT NULL,
    start_date_param DATE DEFAULT NULL,
    end_date_param DATE DEFAULT NULL
)
RETURNS TABLE (
    user_name TEXT,
    course_title TEXT,
    quiz_title TEXT,
    score NUMERIC(5, 2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.name,
        c.title,
        q.title,
        qa.score
    FROM
        public.quiz_attempts AS qa
    JOIN
        public.profiles AS p ON qa.user_id = p.id
    JOIN
        public.quizzes AS q ON qa.quiz_id = q.id
    JOIN
        public.courses AS c ON q.course_id = c.id
    -- A ligação entre 'tentativa' e 'turma' é indireta.
    -- Assumimos que a tentativa pertence a um curso em que o usuário está numa turma.
    -- Esta consulta pode ser refinada se houver um link direto.
    WHERE
        (course_id_param IS NULL OR c.id = course_id_param)
        AND (start_date_param IS NULL OR qa.completed_at >= start_date_param)
        AND (end_date_param IS NULL OR qa.completed_at < (end_date_param + INTERVAL '1 day'))
        AND (class_id_param IS NULL OR qa.user_id IN (
            SELECT user_id FROM public.enrollments WHERE class_id = class_id_param
        ));
END;
$$;

GRANT EXECUTE ON FUNCTION reports.get_final_grades(UUID, UUID, DATE, DATE) TO authenticated;
