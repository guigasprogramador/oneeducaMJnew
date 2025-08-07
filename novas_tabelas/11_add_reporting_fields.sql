-- Fase 1: Modificações no Banco de Dados para o Sistema de Relatórios

-- 1. Adicionar colunas 'origin' e 'nature' à tabela 'courses'
ALTER TABLE public.courses ADD COLUMN origin VARCHAR(255);
ALTER TABLE public.courses ADD COLUMN nature VARCHAR(255);

-- Adicionar comentários para explicar as novas colunas
COMMENT ON COLUMN public.courses.origin IS 'Origem do curso (ex: interno, externo, parceria)';
COMMENT ON COLUMN public.courses.nature IS 'Natureza do curso (ex: capacitação, pós-graduação, extensão)';

-- 2. Adicionar coluna 'role' à tabela 'profiles'
ALTER TABLE public.profiles ADD COLUMN role VARCHAR(255);

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
