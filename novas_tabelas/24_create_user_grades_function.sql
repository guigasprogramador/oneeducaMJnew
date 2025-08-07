-- Função SQL para buscar notas de um usuário específico em um curso
-- Isso é mais seguro e eficiente do que buscar todas as notas e filtrar no cliente.

CREATE OR REPLACE FUNCTION public.get_user_final_grades(
    user_id_param UUID,
    course_id_param UUID
)
RETURNS TABLE (
    user_id UUID,
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
        p.id,
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
    WHERE
        qa.user_id = user_id_param AND q.course_id = course_id_param;
END;
$$;

-- Conceder permissões para que usuários autenticados possam chamar esta função
GRANT EXECUTE ON FUNCTION public.get_user_final_grades(UUID, UUID) TO authenticated;
