-- Fase 4: Implementação do Controle de Frequência

-- 1. Criar um tipo ENUM para o status de frequência
CREATE TYPE public.attendance_status AS ENUM (
    'presente',
    'ausente',
    'ausente_justificado'
);

-- 2. Criar a tabela de frequência de alunos (class_attendance)
CREATE TABLE public.class_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    status public.attendance_status NOT NULL,
    notes TEXT, -- Para justificativas ou observações
    recorded_by UUID REFERENCES public.profiles(id), -- Quem registrou a frequência
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(class_id, user_id, event_date) -- Garante um registro por aluno por dia de evento
);

ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

-- Adicionar comentários para clareza
COMMENT ON TABLE public.class_attendance IS 'Registra a frequência dos alunos nos eventos da turma.';
COMMENT ON COLUMN public.class_attendance.status IS 'Status da frequência: presente, ausente, ou ausente com justificativa.';
COMMENT ON COLUMN public.class_attendance.notes IS 'Observações ou justificativa para a ausência.';
COMMENT ON COLUMN public.class_attendance.recorded_by IS 'ID do usuário (admin/professor) que registrou a frequência.';

-- 3. Criar a função de relatório de frequência
CREATE OR REPLACE FUNCTION reports.get_student_attendance_summary(
    class_id_param UUID
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    total_events BIGINT,
    present_count BIGINT,
    absent_count BIGINT,
    justified_absence_count BIGINT,
    attendance_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH attendance_counts AS (
        SELECT
            ca.user_id,
            COUNT(*) AS total_events,
            COUNT(*) FILTER (WHERE ca.status = 'presente') AS present_count,
            COUNT(*) FILTER (WHERE ca.status = 'ausente') AS absent_count,
            COUNT(*) FILTER (WHERE ca.status = 'ausente_justificado') AS justified_absence_count
        FROM
            public.class_attendance AS ca
        WHERE
            ca.class_id = class_id_param
        GROUP BY
            ca.user_id
    )
    SELECT
        ac.user_id,
        p.name,
        ac.total_events,
        ac.present_count,
        ac.absent_count,
        ac.justified_absence_count,
        -- Taxa de presença é (presentes / (total - justificadas)) * 100
        CASE
            WHEN (ac.total_events - ac.justified_absence_count) > 0
            THEN (ac.present_count::NUMERIC * 100 / (ac.total_events - ac.justified_absence_count))
            ELSE 0
        END AS attendance_rate
    FROM
        attendance_counts ac
    JOIN
        public.profiles p ON ac.user_id = p.id;
END;
$$;

GRANT EXECUTE ON FUNCTION reports.get_student_attendance_summary(UUID) TO authenticated;

-- Exemplo de como chamar a função:
/*
SELECT * FROM reports.get_student_attendance_summary('uuid_da_turma_aqui');
*/
