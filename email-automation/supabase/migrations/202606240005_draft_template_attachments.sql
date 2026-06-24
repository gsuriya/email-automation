alter table public.draft_templates
  add column if not exists attachments jsonb not null default '[]'::jsonb;

alter table public.tracker_entries
  add column if not exists attachments jsonb not null default '[]'::jsonb;
