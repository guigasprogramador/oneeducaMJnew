-- Função SQL para buscar todos os dados necessários para um histórico escolar de um usuário

CREATE OR REPLACE FUNCTION public.get_user_transcript_data(
    user_id_param UUID
)
RETURNS TABLE (
    course_id UUID,
    course_title TEXT,
    enrollment_status TEXT,
    final_grade NUMERIC,
    completion_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH course_grades AS (
        -- Primeiro, calcular a nota média para cada curso/usuário que tem notas
        SELECT
            q.course_id,
            qa.user_id,
            AVG(qa.score) as average_score
        FROM
            public.quiz_attempts AS qa
        JOIN
            public.quizzes AS q ON qa.quiz_id = q.id
        WHERE
            qa.user_id = user_id_param
        GROUP BY
            q.course_id, qa.user_id
    )
    -- Agora, junte com as matrículas para obter o histórico completo
    SELECT
        c.id as course_id,
        c.title as course_title,
        CASE
            WHEN e.completed_at IS NOT NULL THEN 'Concluído'
            WHEN e.progress > 0 THEN 'Em Andamento'
            ELSE 'Inscrito'
        END as enrollment_status,
        ROUND(cg.average_score, 2) as final_grade,
        e.completed_at as completion_date
    FROM
        public.enrollments AS e
    JOIN
        public.courses AS c ON e.course_id = c.id
    LEFT JOIN
        course_grades AS cg ON e.course_id = cg.course_id AND e.user_id = cg.user_id
    WHERE
        e.user_id = user_id_param
    ORDER BY
        e.enrolled_at DESC;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_user_transcript_data(UUID) TO authenticated;
