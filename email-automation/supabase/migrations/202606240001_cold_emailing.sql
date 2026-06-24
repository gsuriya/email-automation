create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.gmail_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  access_token text not null,
  refresh_token text,
  expiry_date bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.draft_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cold_email_rows (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  company text not null default '',
  email text not null default '',
  draft_template_id uuid references public.draft_templates(id) on delete set null,
  status text not null default 'draft',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tracker_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  company text not null default '',
  email text not null,
  draft_template_id uuid,
  draft_template_name text not null,
  subject text not null,
  body text not null,
  gmail_message_id text,
  status text not null default 'sent',
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

drop trigger if exists set_gmail_tokens_updated_at on public.gmail_tokens;
create trigger set_gmail_tokens_updated_at
before update on public.gmail_tokens
for each row execute function public.set_updated_at();

drop trigger if exists set_draft_templates_updated_at on public.draft_templates;
create trigger set_draft_templates_updated_at
before update on public.draft_templates
for each row execute function public.set_updated_at();

drop trigger if exists set_cold_email_rows_updated_at on public.cold_email_rows;
create trigger set_cold_email_rows_updated_at
before update on public.cold_email_rows
for each row execute function public.set_updated_at();

create index if not exists cold_email_rows_created_at_idx on public.cold_email_rows(created_at);
create index if not exists tracker_entries_sent_at_idx on public.tracker_entries(sent_at desc);

alter table public.gmail_tokens enable row level security;
alter table public.draft_templates enable row level security;
alter table public.cold_email_rows enable row level security;
alter table public.tracker_entries enable row level security;
