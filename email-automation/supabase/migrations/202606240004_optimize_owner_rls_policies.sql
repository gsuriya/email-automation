drop policy if exists "Users can select own draft templates" on public.draft_templates;
create policy "Users can select own draft templates"
on public.draft_templates
for select
using (owner_email = (select auth.jwt()) ->> 'email');

drop policy if exists "Users can insert own draft templates" on public.draft_templates;
create policy "Users can insert own draft templates"
on public.draft_templates
for insert
with check (owner_email = (select auth.jwt()) ->> 'email');

drop policy if exists "Users can update own draft templates" on public.draft_templates;
create policy "Users can update own draft templates"
on public.draft_templates
for update
using (owner_email = (select auth.jwt()) ->> 'email')
with check (owner_email = (select auth.jwt()) ->> 'email');

drop policy if exists "Users can delete own draft templates" on public.draft_templates;
create policy "Users can delete own draft templates"
on public.draft_templates
for delete
using (owner_email = (select auth.jwt()) ->> 'email');

drop policy if exists "Users can select own cold email rows" on public.cold_email_rows;
create policy "Users can select own cold email rows"
on public.cold_email_rows
for select
using (owner_email = (select auth.jwt()) ->> 'email');

drop policy if exists "Users can insert own cold email rows" on public.cold_email_rows;
create policy "Users can insert own cold email rows"
on public.cold_email_rows
for insert
with check (owner_email = (select auth.jwt()) ->> 'email');

drop policy if exists "Users can update own cold email rows" on public.cold_email_rows;
create policy "Users can update own cold email rows"
on public.cold_email_rows
for update
using (owner_email = (select auth.jwt()) ->> 'email')
with check (owner_email = (select auth.jwt()) ->> 'email');

drop policy if exists "Users can delete own cold email rows" on public.cold_email_rows;
create policy "Users can delete own cold email rows"
on public.cold_email_rows
for delete
using (owner_email = (select auth.jwt()) ->> 'email');

drop policy if exists "Users can select own tracker entries" on public.tracker_entries;
create policy "Users can select own tracker entries"
on public.tracker_entries
for select
using (owner_email = (select auth.jwt()) ->> 'email');
