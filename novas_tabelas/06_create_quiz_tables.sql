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
COMMENT ON TABLE public.quiz_attempt_answers IS 'Armazena as respostas fornecidas por um usuário em uma tentativa de quiz.';
