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
