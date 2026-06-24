alter table public.gmail_tokens
  add column if not exists name text,
  add column if not exists picture text;

alter table public.draft_templates
  add column if not exists owner_email text;

alter table public.cold_email_rows
  add column if not exists owner_email text;

alter table public.tracker_entries
  add column if not exists owner_email text;

with default_user as (
  select email
  from public.gmail_tokens
  order by updated_at desc
  limit 1
)
update public.draft_templates
set owner_email = (select email from default_user)
where owner_email is null;

with default_user as (
  select email
  from public.gmail_tokens
  order by updated_at desc
  limit 1
)
update public.cold_email_rows
set owner_email = (select email from default_user)
where owner_email is null;

with default_user as (
  select email
  from public.gmail_tokens
  order by updated_at desc
  limit 1
)
update public.tracker_entries
set owner_email = (select email from default_user)
where owner_email is null;

alter table public.draft_templates
  alter column owner_email set not null;

alter table public.cold_email_rows
  alter column owner_email set not null;

alter table public.tracker_entries
  alter column owner_email set not null;

create index if not exists draft_templates_owner_updated_idx
  on public.draft_templates(owner_email, updated_at desc);

create index if not exists cold_email_rows_owner_created_idx
  on public.cold_email_rows(owner_email, created_at);

create index if not exists tracker_entries_owner_sent_idx
  on public.tracker_entries(owner_email, sent_at desc);
