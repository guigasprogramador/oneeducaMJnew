-- Adicionar coluna CPF à tabela de perfis
ALTER TABLE public.profiles
ADD COLUMN cpf TEXT;

-- Adicionar um constraint de unicidade para garantir que não hajam CPFs duplicados.
-- CPFs nulos não são comparados, permitindo múltiplos nulos.
ALTER TABLE public.profiles
ADD CONSTRAINT unique_cpf UNIQUE (cpf);
