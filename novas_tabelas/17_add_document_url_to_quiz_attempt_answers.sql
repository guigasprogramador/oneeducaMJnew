-- Adicionar coluna para upload de arquivo nas respostas de questionários
ALTER TABLE public.quiz_attempt_answers
ADD COLUMN document_url TEXT;

COMMENT ON COLUMN public.quiz_attempt_answers.document_url IS 'URL para um arquivo enviado como resposta a uma questão.';
