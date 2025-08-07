-- Modificação da tabela de Matrículas (Enrollments) para usar Turmas (Classes)
-- ATENÇÃO: Este script assume que a tabela 'enrollments' pode ser alterada.
-- Se houver dados existentes, um processo de migração manual será necessário.

-- 1. Adicionar a nova coluna class_id
ALTER TABLE public.enrollments
ADD COLUMN class_id UUID;

-- 2. Adicionar a chave estrangeira para a tabela de turmas
ALTER TABLE public.enrollments
ADD CONSTRAINT fk_enrollments_class_id
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- 3. Remover a constraint de unicidade antiga (o nome pode variar)
-- Primeiro, precisamos encontrar o nome da constraint de unicidade.
-- Execute este comando para encontrar o nome:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.enrollments'::regclass AND contype = 'u';
-- Assumindo que o nome seja 'enrollments_user_id_course_id_key', o comando seria:
-- ALTER TABLE public.enrollments DROP CONSTRAINT enrollments_user_id_course_id_key;
-- Como o nome pode não ser fixo, este passo pode precisar de ajuste manual.

-- 4. Remover a coluna course_id
ALTER TABLE public.enrollments
DROP COLUMN course_id;

-- 5. Adicionar a nova constraint de unicidade para usuário e turma
ALTER TABLE public.enrollments
ADD UNIQUE (user_id, class_id);

-- 6. Tornar a coluna class_id NOT NULL após a migração dos dados
ALTER TABLE public.enrollments
ALTER COLUMN class_id SET NOT NULL;

COMMENT ON TABLE public.enrollments IS 'Tabela de matrículas atualizada para associar usuários a turmas específicas.';
COMMENT ON COLUMN public.enrollments.class_id IS 'Referência à turma em que o usuário está matriculado.';
