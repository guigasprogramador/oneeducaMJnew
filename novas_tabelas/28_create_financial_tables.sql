-- SQL for novas_tabelas/28_create_financial_tables.sql

-- Tabela Central de Transações Financeiras
CREATE TABLE public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')), -- 'income' (receita), 'expense' (despesa)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'canceled')),
    due_date TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,
    related_contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_entity_link CHECK (profile_id IS NOT NULL OR provider_id IS NOT NULL)
);

COMMENT ON COLUMN public.financial_transactions.type IS 'Tipo de transação: ''income'' (receita) ou ''expense'' (despesa)';
COMMENT ON COLUMN public.financial_transactions.status IS 'Status da transação: ''pending'', ''paid'', ''overdue'', ''canceled''';
COMMENT ON COLUMN public.financial_transactions.profile_id IS 'Link para um usuário (aluno, professor)';
COMMENT ON COLUMN public.financial_transactions.provider_id IS 'Link para um prestador de serviço';
COMMENT ON COLUMN public.financial_transactions.related_contract_id IS 'Link para um contrato específico (opcional)';

-- Tabela de Bolsas de Estudo
CREATE TABLE public.scholarships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.scholarships IS 'Gerencia os tipos de bolsas de estudo disponíveis';

-- Tabela de Associação: Alunos e Bolsas de Estudo
CREATE TABLE public.profile_scholarships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (profile_id, scholarship_id) -- Garante que um perfil não tenha a mesma bolsa duas vezes
);

COMMENT ON TABLE public.profile_scholarships IS 'Associa bolsas de estudo a perfis de usuários (alunos)';

-- Habilitar RLS e criar políticas de acesso
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_scholarships ENABLE ROW LEVEL SECURITY;

-- Política para Admins em financial_transactions
CREATE POLICY "Admins can manage all financial transactions"
ON public.financial_transactions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para Admins em scholarships
CREATE POLICY "Admins can manage all scholarships"
ON public.scholarships
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para Admins em profile_scholarships
CREATE POLICY "Admins can manage all profile scholarships"
ON public.profile_scholarships
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Adicionar políticas para usuários visualizarem suas próprias transações
CREATE POLICY "Users can view their own financial transactions"
ON public.financial_transactions
FOR SELECT
USING (
  profile_id = auth.uid()
);
