-- POORS durable task history.
-- Security model: the app holds only the publishable (anon) key. Nobody can read or
-- write the tables directly (RLS on, no policies, privileges revoked). The only entry
-- points are two SECURITY DEFINER functions that require a shared secret whose
-- SHA-256 hash lives in a private schema that PostgREST does not expose.
-- Set the secret once (never commit it):
--   insert into poors_private.history_secret (id, secret_hash)
--   values (1, sha256(convert_to('<HISTORY_SECRET>', 'UTF8')))
--   on conflict (id) do update set secret_hash = excluded.secret_hash, updated_at = now();

create schema if not exists poors_private;
revoke all on schema poors_private from public, anon, authenticated;

create table if not exists poors_private.history_secret (
  id smallint primary key default 1 check (id = 1),
  secret_hash bytea not null check (octet_length(secret_hash) = 32),
  updated_at timestamptz not null default now()
);
alter table poors_private.history_secret enable row level security;
revoke all on poors_private.history_secret from public, anon, authenticated;

create table if not exists public.poors_tasks (
  id uuid primary key,
  created_at timestamptz not null default now(),
  mode text not null check (mode in ('plan', 'answer')),
  input text not null check (char_length(input) between 1 and 4000),
  status text not null check (status in ('completed', 'failed')),
  error_code text check (error_code is null or char_length(error_code) <= 64),
  selected_skills jsonb not null default '[]'::jsonb check (jsonb_typeof(selected_skills) = 'array'),
  result_kind text check (result_kind is null or char_length(result_kind) <= 64),
  answer text check (answer is null or char_length(answer) <= 20000),
  provider text check (provider is null or char_length(provider) <= 64),
  model text check (model is null or char_length(model) <= 128),
  events jsonb not null default '[]'::jsonb check (jsonb_typeof(events) = 'array')
);
create index if not exists poors_tasks_created_at_idx on public.poors_tasks (created_at desc);
alter table public.poors_tasks enable row level security;
-- No policies on purpose: anon/authenticated get nothing through PostgREST.
revoke all on public.poors_tasks from public, anon, authenticated;

-- Internal helper, only reachable from the definer functions below (schema is not granted).
create or replace function poors_private.check_secret(p_secret text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_secret is not null
     and char_length(p_secret) between 24 and 256
     and exists (
       select 1 from poors_private.history_secret s
       where s.id = 1
         and s.secret_hash = pg_catalog.sha256(pg_catalog.convert_to(p_secret, 'UTF8'))
     );
$$;
revoke all on function poors_private.check_secret(text) from public, anon, authenticated;

create or replace function public.poors_log_task(p_secret text, p_task jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_cutoff timestamptz;
begin
  if not poors_private.check_secret(p_secret) then
    raise exception 'history: access denied' using errcode = '42501';
  end if;
  if p_task is null or pg_catalog.jsonb_typeof(p_task) <> 'object' then
    raise exception 'history: task must be an object' using errcode = '22023';
  end if;
  if pg_catalog.octet_length(p_task::text) > 65536 then
    raise exception 'history: task too large' using errcode = '22001';
  end if;
  if pg_catalog.jsonb_typeof(coalesce(p_task->'selected_skills', '[]'::jsonb)) <> 'array'
     or pg_catalog.jsonb_array_length(coalesce(p_task->'selected_skills', '[]'::jsonb)) > 25
     or pg_catalog.jsonb_typeof(coalesce(p_task->'events', '[]'::jsonb)) <> 'array'
     or pg_catalog.jsonb_array_length(coalesce(p_task->'events', '[]'::jsonb)) > 50 then
    raise exception 'history: invalid skills or events' using errcode = '22023';
  end if;

  insert into public.poors_tasks
    (id, mode, input, status, error_code, selected_skills, result_kind, answer, provider, model, events)
  values (
    (p_task->>'id')::uuid,
    p_task->>'mode',
    p_task->>'input',
    p_task->>'status',
    p_task->>'error_code',
    coalesce(p_task->'selected_skills', '[]'::jsonb),
    p_task->>'result_kind',
    p_task->>'answer',
    p_task->>'provider',
    p_task->>'model',
    coalesce(p_task->'events', '[]'::jsonb)
  )
  on conflict (id) do nothing
  returning id into v_id;

  -- Keep the free-tier database bounded: retain the newest 5000 tasks.
  select t.created_at into v_cutoff
    from public.poors_tasks t
    order by t.created_at desc
    offset 5000 limit 1;
  if v_cutoff is not null then
    delete from public.poors_tasks t where t.created_at <= v_cutoff;
  end if;

  return coalesce(v_id, (p_task->>'id')::uuid);
end;
$$;

create or replace function public.poors_list_tasks(p_secret text, p_limit int default 20)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not poors_private.check_secret(p_secret) then
    raise exception 'history: access denied' using errcode = '42501';
  end if;
  return coalesce((
    select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(t) order by t.created_at desc)
    from (
      select id, created_at, mode, input, status, error_code, selected_skills,
             result_kind, answer, provider, model, events
      from public.poors_tasks
      order by created_at desc
      limit greatest(1, least(coalesce(p_limit, 20), 50))
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.poors_log_task(text, jsonb) from public, authenticated;
revoke all on function public.poors_list_tasks(text, int) from public, authenticated;
grant execute on function public.poors_log_task(text, jsonb) to anon;
grant execute on function public.poors_list_tasks(text, int) to anon;
