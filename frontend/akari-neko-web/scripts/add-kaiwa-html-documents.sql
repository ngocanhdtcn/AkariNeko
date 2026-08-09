alter table public.kaiwa_lessons
  add column if not exists html_documents jsonb not null default '[]'::jsonb;
