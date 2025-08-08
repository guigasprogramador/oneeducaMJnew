-- Este script SQL foi gerado para recriar a estrutura completa do banco de dados.
-- Ele combina o schema base existente com uma série de migrações.
--
-- O script está dividido em duas partes principais:
-- 1. Schema Base: Cria as tabelas que já existem na estrutura atual.
-- 2. Migrações: Aplica as alterações e novas funcionalidades a partir dos arquivos da pasta `novas_tabelas`.
--
-- ATENÇÃO:
-- - Este script é destrutivo e recriará as tabelas. NÃO execute em um ambiente de produção sem um backup.
-- - Algumas políticas de segurança (RLS) dependem de funções customizadas como `get_my_claim()` ou `is_admin()`.
--   Você precisará implementar essas funções de acordo com a sua lógica de autorização.
--

-- Part 1: Base Schema from existing structure

CREATE TABLE public.certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    course_name text NOT NULL,
    user_name text NOT NULL,
    issue_date timestamp with time zone NOT NULL DEFAULT now(),
    expiry_date timestamp with time zone,
    certificate_url text
);

CREATE TABLE public.course_duplications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    original_course_id uuid NOT NULL,
    duplicated_course_id uuid NOT NULL,
    duplicated_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.course_forums (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    thumbnail text,
    duration text,
    instructor text NOT NULL,
    enrolledcount integer DEFAULT 0,
    rating numeric DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    professor_id uuid,
    status text DEFAULT 'pending'::text,
    expiry_date timestamp with time zone,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejection_reason text,
    category text,
    has_evaluative_activity boolean DEFAULT false,
    evaluative_activity_description text
);

CREATE TABLE public.enrollments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    progress integer DEFAULT 0,
    enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone,
    status text DEFAULT 'active'::text
);

CREATE TABLE public.form_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id uuid NOT NULL,
    user_id uuid NOT NULL,
    responses jsonb NOT NULL,
    submitted_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.forum_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id uuid NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    parent_message_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.lesson_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_size bigint,
    uploaded_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.lesson_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone
);

CREATE TABLE public.lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    duration text,
    video_url text,
    content text,
    order_number integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    complementary_files jsonb
);

CREATE TABLE public.modules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    order_number integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    has_quiz boolean DEFAULT false,
    quiz_data jsonb
);

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    name text,
    bio text,
    avatar_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    job_title text,
    company text,
    location text,
    website text,
    email text,
    role text DEFAULT 'student'::text
);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

CREATE TABLE public.quiz_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    module_id uuid NOT NULL,
    responses jsonb NOT NULL,
    score integer,
    max_score integer,
    completed_at timestamp with time zone NOT NULL DEFAULT now()
);
-- Criação da tabela de Turmas (Classes)
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Adicionar comentários para clareza
COMMENT ON TABLE public.classes IS 'Armazena as turmas de um curso, permitindo múltiplas ofertas do mesmo conteúdo.';
COMMENT ON COLUMN public.classes.course_id IS 'Referência ao curso ao qual esta turma pertence.';
COMMENT ON COLUMN public.classes.name IS 'Nome da turma (ex: "Turma 2024.1").';
COMMENT ON COLUMN public.classes.instructor_id IS 'ID do professor responsável pela turma.';
COMMENT ON COLUMN public.classes.start_date IS 'Data de início da turma.';
COMMENT ON COLUMN public.classes.end_date IS 'Data de término da turma.';
-- Criação da tabela de Pré-requisitos de Cursos
CREATE TABLE public.course_prerequisites (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  prerequisite_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, prerequisite_id)
);

ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;

-- Adicionar comentários
COMMENT ON TABLE public.course_prerequisites IS 'Define os pré-requisitos entre cursos.';
COMMENT ON COLUMN public.course_prerequisites.course_id IS 'O curso que requer um pré-requisito.';
COMMENT ON COLUMN public.course_prerequisites.prerequisite_id IS 'O curso que é o pré-requisito.';
-- Modificação da tabela de Matrículas (Enrollments) para usar Turmas (Classes)
-- ATENÇÃO: Este script assume que a tabela 'enrollments' pode ser alterada.
-- Se houver dados existentes, um processo de migração manual será necessário.

-- 1. Create the new enum type for enrollment status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
        CREATE TYPE public.enrollment_status AS ENUM ('active', 'inactive', 'locked', 'cancelled', 'withdrawn');
    END IF;
END
$$;

-- 2. Remover o valor padrão temporariamente, se existir
ALTER TABLE public.enrollments ALTER COLUMN status DROP DEFAULT;

-- 3. Atualizar quaisquer valores existentes na coluna 'status' para um valor válido do ENUM
-- Esta é uma etapa CRÍTICA. Você deve garantir que todos os valores atuais na coluna 'status'
-- correspondam a um dos valores do ENUM ('active', 'inactive', 'locked', 'cancelled', 'withdrawn').
-- Se houver valores diferentes, eles devem ser atualizados ou definidos como um valor padrão válido.
-- Por exemplo, se você tiver 'pending' ou 'completed', decida como mapeá-los.
-- Exemplo: UPDATE public.enrollments SET status = 'active' WHERE status = 'pending';
-- Exemplo: UPDATE public.enrollments SET status = 'active' WHERE status = 'completed';
-- Se você não tiver certeza dos valores existentes, execute um SELECT DISTINCT status FROM public.enrollments;
-- e adicione as instruções UPDATE necessárias aqui.

-- 4. Alterar o tipo da coluna 'status' para o novo ENUM
ALTER TABLE public.enrollments
    ALTER COLUMN status TYPE public.enrollment_status
    USING status::public.enrollment_status;

-- 5. Adicionar o valor padrão de volta para a coluna 'status'
ALTER TABLE public.enrollments
    ALTER COLUMN status SET DEFAULT 'active';

-- 6. Adicionar a nova coluna class_id
ALTER TABLE public.enrollments
ADD COLUMN class_id UUID;

-- 7. Adicionar a chave estrangeira para a tabela de turmas
ALTER TABLE public.enrollments
ADD CONSTRAINT fk_enrollments_class_id
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- 8. Remover a constraint de unicidade antiga (o nome pode variar)
-- Primeiro, precisamos encontrar o nome da constraint de unicidade.
-- Execute este comando para encontrar o nome:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.enrollments'::regclass AND contype = 'u';
-- Assumindo que o nome seja 'enrollments_user_id_course_id_key', o comando seria:
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_user_id_course_id_key;

-- 9. Remover a coluna course_id
ALTER TABLE public.enrollments
DROP COLUMN course_id;

-- 10. Adicionar a nova constraint de unicidade para usuário e turma
ALTER TABLE public.enrollments
ADD UNIQUE (user_id, class_id);

-- 11. Tornar a coluna class_id NOT NULL após a migração dos dados
ALTER TABLE public.enrollments
ALTER COLUMN class_id SET NOT NULL;

COMMENT ON TABLE public.enrollments IS 'Tabela de matrículas atualizada para associar usuários a turmas específicas.';
COMMENT ON COLUMN public.enrollments.class_id IS 'Referência à turma em que o usuário está matriculado.';
-- Adiciona colunas de Ementa (Syllabus) e Bibliografia na tabela de Cursos
ALTER TABLE public.courses
ADD COLUMN syllabus TEXT,
ADD COLUMN bibliography TEXT;

-- Adicionar comentários para as novas colunas
COMMENT ON COLUMN public.courses.syllabus IS 'A ementa completa do curso.';
COMMENT ON COLUMN public.courses.bibliography IS 'A bibliografia recomendada para o curso.';
-- Criação da tabela de Documentos do Curso
CREATE TABLE public.course_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.course_documents ENABLE ROW LEVEL SECURITY;

-- Adicionar comentários
COMMENT ON TABLE public.course_documents IS 'Armazena documentos didáticos associados a um curso.';
COMMENT ON COLUMN public.course_documents.course_id IS 'Referência ao curso ao qual o documento pertence.';
COMMENT ON COLUMN public.course_documents.document_name IS 'Nome do documento para exibição.';
COMMENT ON COLUMN public.course_documents.document_url IS 'URL para acessar o documento.';
-- Tabela para Quizzes (Avaliações)
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.quizzes IS 'Armazena os quizzes ou avaliações de um curso.';

-- Tabela para Questões (Questions)
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- ex: multiple_choice, true_false, short_answer
  order_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.questions IS 'Armazena as questões de um quiz.';

-- Tabela para Respostas (Answers)
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.answers IS 'Armazena as opções de resposta para uma questão.';

-- Tabela para Tentativas de Quiz (Quiz Attempts)
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score NUMERIC(5, 2),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(quiz_id, user_id) -- Um usuário pode ter apenas uma tentativa por quiz (pode ser ajustado)
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.quiz_attempts IS 'Registra as tentativas dos usuários em um quiz.';

-- Tabela para Respostas das Tentativas (Quiz Attempt Answers)
CREATE TABLE public.quiz_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.answers(id) ON DELETE CASCADE, -- Pode ser nulo para questões abertas
  answer_text_input TEXT, -- Para respostas de texto curto
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.quiz_attempt_answers IS 'Armazena as respostas fornecidas por um usuário em um formulário.';
-- Tabela para Avisos (Announcements)
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE, -- Opcional, para avisos de uma turma específica
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.announcements IS 'Armazena avisos e informações para cursos ou turmas.';
COMMENT ON COLUMN public.announcements.course_id IS 'O curso ao qual o aviso está associado.';
COMMENT ON COLUMN public.announcements.class_id IS 'A turma específica para o aviso (se aplicável).';
COMMENT ON COLUMN public.announcements.created_by IS 'O usuário (instrutor/admin) que criou o aviso.';
-- Tabela para Eventos de Calendário (Calendar Events)
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT, -- Para agendamento de sala (física ou virtual)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.calendar_events IS 'Armazena eventos de calendário, como aulas ao vivo ou prazos, associados a uma turma.';
COMMENT ON COLUMN public.calendar_events.class_id IS 'A turma à qual o evento pertence.';
COMMENT ON COLUMN public.calendar_events.start_time IS 'Data e hora de início do evento.';
COMMENT ON COLUMN public.calendar_events.end_time IS 'Data e hora de término do evento.';
COMMENT ON COLUMN public.calendar_events.location IS 'Local do evento, como um link de sala virtual ou nome de sala física.';
-- Tabela para Formulários Personalizados (Custom Forms)
CREATE TABLE public.custom_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(course_id) -- Apenas um formulário por curso
);
ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.custom_forms IS 'Armazena a estrutura de formulários de inscrição personalizados para cursos.';

-- Tabela para Campos do Formulário (Form Fields)
CREATE TABLE public.form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL, -- ex: text, textarea, select, checkbox, radio
  options JSONB, -- Para tipos como select, checkbox, radio
  is_required BOOLEAN DEFAULT false,
  order_number INTEGER NOT NULL
);
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.form_fields IS 'Define os campos de um formulário personalizado.';

-- Tabela para Submissões de Formulário (Form Submissions)
CREATE TABLE public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(form_id, user_id)
);
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.form_submissions IS 'Registra que um usuário submeteu um formulário específico.';

-- Tabela para Respostas da Submissão (Submission Answers)
CREATE TABLE public.submission_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.form_submissions(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.form_fields(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL
);
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.submission_answers IS 'Armazena as respostas fornecidas por um usuário em um formulário.';
-- Fase 1: Modificações no Banco de Dados para o Sistema de Relatórios

-- 1. Adicionar colunas 'origin' e 'nature' à tabela 'courses'
ALTER TABLE public.courses ADD COLUMN origin VARCHAR(255);
ALTER TABLE public.courses ADD COLUMN nature VARCHAR(255);

-- Adicionar comentários para explicar as novas colunas
COMMENT ON COLUMN public.courses.origin IS 'Origem do curso (ex: interno, externo, parceria)';
COMMENT ON COLUMN public.courses.nature IS 'Natureza do curso (ex: capacitação, pós-graduação, extensão)';

-- 2. Adicionar coluna 'role' à tabela 'profiles'
-- A coluna 'role' já existe na tabela 'profiles' a partir do schema base.
-- A linha abaixo foi comentada para evitar erro.
-- ALTER TABLE public.profiles ADD COLUMN role VARCHAR(255);

-- Adicionar comentário para explicar a nova coluna
COMMENT ON COLUMN public.profiles.role IS 'Cargo do usuário (ex: membro, servidor, terceirizado)';

-- Opcional: Adicionar uma tabela para os cargos permitidos para manter a consistência
CREATE TABLE public.user_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT
);

-- Popular com alguns cargos iniciais como exemplo
INSERT INTO public.user_roles (role_name) VALUES
('Membro'),
('Servidor'),
('Extraquadro'),
('Terceirizado'),
('Estagiário Jurídico'),
('Estagiário Não Jurídico'),
('Residente Jurídico'),
('Residente Técnico'),
('Público Externo');

-- Fim das modificações da Fase 1.
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
-- Criação da tabela de Trabalhos Acadêmicos
CREATE TABLE public.academic_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_url TEXT NOT NULL,
  document_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.academic_works ENABLE ROW LEVEL SECURITY;

-- Adicionar comentários
COMMENT ON TABLE public.academic_works IS 'Armazena trabalhos acadêmicos enviados por alunos para uma turma.';
COMMENT ON COLUMN public.academic_works.class_id IS 'Referência à turma para a qual o trabalho foi enviado.';
COMMENT ON COLUMN public.academic_works.user_id IS 'Referência ao aluno que enviou o trabalho.';
COMMENT ON COLUMN public.academic_works.title IS 'Título do trabalho.';
COMMENT ON COLUMN public.academic_works.document_url IS 'URL para acessar o documento do trabalho.';
COMMENT ON COLUMN public.academic_works.document_type IS 'Tipo MIME do arquivo.';
COMMENT ON COLUMN public.academic_works.file_size IS 'Tamanho do arquivo em bytes.';
-- Criação da tabela de Documentos Gerais
CREATE TABLE public.general_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT NOT NULL,
  document_type TEXT,
  category TEXT,
  file_size BIGINT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.general_documents ENABLE ROW LEVEL SECURITY;

-- Adicionar comentários
COMMENT ON TABLE public.general_documents IS 'Armazena documentos gerais para o diretório online.';
COMMENT ON COLUMN public.general_documents.title IS 'Título do documento.';
COMMENT ON COLUMN public.general_documents.description IS 'Descrição do documento.';
COMMENT ON COLUMN public.general_documents.document_url IS 'URL para acessar o documento.';
COMMENT ON COLUMN public.general_documents.document_type IS 'Tipo MIME do arquivo.';
COMMENT ON COLUMN public.general_documents.category IS 'Categoria ou natureza do documento.';
COMMENT ON COLUMN public.general_documents.file_size IS 'Tamanho do arquivo em bytes.';
COMMENT ON COLUMN public.general_documents.created_by IS 'Referência ao usuário que fez o upload do documento.';
-- Adicionar coluna para upload de arquivo nas respostas de questionários
ALTER TABLE public.quiz_attempt_answers
ADD COLUMN document_url TEXT;

COMMENT ON COLUMN public.quiz_attempt_answers.document_url IS 'URL para um arquivo enviado como resposta a uma questão.';
-- Políticas de Segurança a Nível de Linha para as novas tabelas de documentos

-- Tabela: academic_works
-- 1. Alunos podem ver seus próprios trabalhos enviados.
-- 2. Alunos podem inserir trabalhos para si mesmos.
-- 3. Professores (instrutores da turma) podem ver todos os trabalhos da turma.
-- 4. Admins podem fazer tudo. (Assumindo uma função 'admin' ou verificando via uma tabela de roles)

-- Habilitar RLS na tabela (já feito no script de criação, mas garantindo)
ALTER TABLE public.academic_works ENABLE ROW LEVEL SECURITY;

-- Apagar políticas existentes para evitar erros
DROP POLICY IF EXISTS "Alunos podem ver seus próprios trabalhos" ON public.academic_works;
DROP POLICY IF EXISTS "Alunos podem inserir seus próprios trabalhos" ON public.academic_works;
DROP POLICY IF EXISTS "Instrutores podem ver trabalhos de suas turmas" ON public.academic_works;
DROP POLICY IF EXISTS "Admins têm acesso total" ON public.academic_works;

-- Criar novas políticas
CREATE POLICY "Alunos podem ver seus próprios trabalhos"
  ON public.academic_works FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Alunos podem inserir seus próprios trabalhos"
  ON public.academic_works FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Esta política assume que existe uma forma de verificar se o usuário é instrutor da turma.
-- Usando a tabela `classes` para verificar o `instructor_id`.
CREATE POLICY "Instrutores podem ver trabalhos de suas turmas"
  ON public.academic_works FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = academic_works.class_id AND c.instructor_id = auth.uid()
    )
  );
