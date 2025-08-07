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

-- Tabela: general_documents
-- 1. Todos os usuários autenticados podem ver todos os documentos.
-- 2. Apenas administradores podem inserir, atualizar ou deletar documentos.
--    (Vou usar uma função `is_admin()` que deve ser criada separadamente ou já existir)

-- Habilitar RLS na tabela
ALTER TABLE public.general_documents ENABLE ROW LEVEL SECURITY;

-- Apagar políticas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem ver documentos gerais" ON public.general_documents;
DROP POLICY IF EXISTS "Admins podem gerenciar documentos gerais" ON public.general_documents;

-- Criar novas políticas
CREATE POLICY "Usuários autenticados podem ver documentos gerais"
  ON public.general_documents FOR SELECT
  USING (auth.role() = 'authenticated');

-- Esta política assume a existência de uma função is_admin() ou um custom claim no JWT.
-- Exemplo com custom claim: `auth.jwt() ->> 'user_role' = 'admin'`
-- Exemplo com função: `public.is_admin(auth.uid())`
-- Vou usar uma abordagem simples que pode ser adaptada, verificando uma role 'admin'.
-- Se não houver uma função de admin, esta política precisa ser ajustada.
CREATE POLICY "Admins podem gerenciar documentos gerais"
  ON public.general_documents FOR ALL
  USING (
    -- Assumindo que admins têm uma role específica ou são identificados de alguma forma.
    -- Esta é uma suposição que pode precisar de ajuste.
    -- Por exemplo, se houver uma tabela `user_roles`.
    get_my_claim('user_role') = '"admin"'
  )
  WITH CHECK (
    get_my_claim('user_role') = '"admin"'
  );

-- Tabela: quiz_attempt_answers
-- A política para esta tabela já deve existir. Apenas precisamos garantir que o acesso
-- ao `document_url` siga as mesmas regras do resto da linha.
-- Não é necessário criar uma nova política apenas para a coluna.
-- A política existente deve garantir que apenas o usuário que fez a tentativa
-- e talvez o professor possam ver a resposta.
