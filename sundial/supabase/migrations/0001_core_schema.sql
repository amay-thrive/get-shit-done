-- Sundial OS core schema: event-sourced, AI-native.
-- (Already applied to the live sundial-os project as migration
--  "sundial_os_core_schema". Kept here so the repo is self-contained.)
create extension if not exists vector;
create extension if not exists pg_trgm;

-- ── Identity ────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Business objects ────────────────────────────────────────
create table public.clients (
  id text primary key,
  name text not null,
  email text,
  phone text,
  company text,
  vertical text check (vertical in ('performance','health','wellness','education')),
  zoho_contact_id text,
  stripe_customer_id text,
  status text not null default 'active' check (status in ('lead','active','archived')),
  health_score int check (health_score between 0 and 100),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id text primary key,
  client_id text references public.clients(id),
  name text not null,
  description text,
  status text not null default 'planning' check (status in ('planning','active','paused','completed','cancelled')),
  vertical text check (vertical in ('performance','health','wellness','education')),
  start_date date,
  target_end_date date,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id text primary key,
  client_id text references public.clients(id),
  project_id text references public.projects(id),
  stripe_invoice_id text,
  number text not null unique,
  status text not null default 'draft' check (status in ('draft','pending_approval','sent','paid','overdue','cancelled','void')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  due_date date,
  paid_at timestamptz,
  line_items jsonb not null default '[]',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id text primary key,
  invoice_id text references public.invoices(id),
  stripe_payment_id text,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null check (status in ('succeeded','failed','refunded','pending')),
  method text,
  received_at timestamptz not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ── Event spine (immutable, append-only) ────────────────────
create table public.events (
  id bigint generated always as identity primary key,
  event_id text not null unique,
  type text not null,
  actor_type text not null check (actor_type in ('user','agent','system','webhook')),
  actor_id text,
  subject_type text,
  subject_id text,
  payload jsonb not null default '{}',
  correlation_id text,
  created_at timestamptz not null default now()
);

-- ── Agent runtime ───────────────────────────────────────────
create table public.agent_definitions (
  id text primary key,
  name text not null unique,
  description text,
  system_prompt text not null,
  tools text[] not null default '{}',
  model text not null default 'claude-sonnet-4-5',
  max_tokens integer not null default 8192,
  max_steps integer not null default 20,
  triggers jsonb not null default '[]',
  requires_approval_for text[] not null default '{}',
  enabled boolean not null default true,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_runs (
  id text primary key,
  agent_id text not null references public.agent_definitions(id),
  trigger_type text not null check (trigger_type in ('manual','cron','event','chain','api')),
  trigger_source text,
  status text not null default 'pending' check (status in ('pending','running','waiting_approval','completed','failed','cancelled')),
  input jsonb,
  output jsonb,
  error text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_microdollars bigint not null default 0,
  correlation_id text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.agent_steps (
  id text primary key,
  run_id text not null references public.agent_runs(id) on delete cascade,
  step_index integer not null,
  kind text not null check (kind in ('thinking','tool_call','tool_result','message','approval_request')),
  tool_name text,
  content jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (run_id, step_index)
);

-- ── Human-in-the-loop approvals ─────────────────────────────
create table public.approvals (
  id text primary key,
  run_id text references public.agent_runs(id) on delete cascade,
  agent_id text references public.agent_definitions(id),
  tool_name text not null,
  action_summary text not null,
  action_payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── AI memory (pgvector) ────────────────────────────────────
create table public.memories (
  id text primary key,
  scope text not null,
  kind text not null default 'observation' check (kind in ('observation','decision','preference','fact','summary')),
  content text not null,
  embedding vector(1536),
  importance real not null default 0.5,
  source_run_id text references public.agent_runs(id),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.documents (
  id text primary key,
  title text not null,
  kind text not null default 'note' check (kind in ('note','brief','sop','meeting','contract','other')),
  content text not null,
  embedding vector(1536),
  subject_type text,
  subject_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Integration plumbing ────────────────────────────────────
create table public.webhook_events (
  id text primary key,
  source text not null,
  event_type text not null,
  payload jsonb not null,
  signature text,
  processed boolean not null default false,
  processing_error text,
  idempotency_key text unique,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.audit_log (
  id text primary key,
  actor_id text,
  actor_email text,
  action text not null,
  resource_type text not null,
  resource_id text,
  details jsonb not null default '{}',
  ip_address text,
  created_at timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────────
create index idx_clients_status on public.clients(status);
create index idx_clients_name_trgm on public.clients using gin (name gin_trgm_ops);
create index idx_projects_client on public.projects(client_id);
create index idx_projects_status on public.projects(status);
create index idx_invoices_client on public.invoices(client_id);
create index idx_invoices_status on public.invoices(status);
create index idx_payments_invoice on public.payments(invoice_id);
create index idx_events_type on public.events(type);
create index idx_events_subject on public.events(subject_type, subject_id);
create index idx_events_correlation on public.events(correlation_id);
create index idx_events_created on public.events(created_at desc);
create index idx_agent_runs_agent on public.agent_runs(agent_id, created_at desc);
create index idx_agent_runs_status on public.agent_runs(status);
create index idx_agent_steps_run on public.agent_steps(run_id, step_index);
create index idx_approvals_status on public.approvals(status) where status = 'pending';
create index idx_memories_scope on public.memories(scope);
create index idx_memories_embedding on public.memories using hnsw (embedding vector_cosine_ops);
create index idx_documents_embedding on public.documents using hnsw (embedding vector_cosine_ops);
create index idx_webhook_events_idem on public.webhook_events(idempotency_key);

-- ── RLS: authenticated users read; writes flow through the
--        service-role API layer ─────────────────────────────
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.events enable row level security;
alter table public.agent_definitions enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_steps enable row level security;
alter table public.approvals enable row level security;
alter table public.memories enable row level security;
alter table public.documents enable row level security;
alter table public.webhook_events enable row level security;
alter table public.audit_log enable row level security;

create policy "authenticated read" on public.profiles for select to authenticated using (true);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "authenticated read" on public.clients for select to authenticated using (true);
create policy "authenticated read" on public.projects for select to authenticated using (true);
create policy "authenticated read" on public.invoices for select to authenticated using (true);
create policy "authenticated read" on public.payments for select to authenticated using (true);
create policy "authenticated read" on public.events for select to authenticated using (true);
create policy "authenticated read" on public.agent_definitions for select to authenticated using (true);
create policy "authenticated read" on public.agent_runs for select to authenticated using (true);
create policy "authenticated read" on public.agent_steps for select to authenticated using (true);
create policy "authenticated read" on public.approvals for select to authenticated using (true);
create policy "authenticated read" on public.memories for select to authenticated using (true);
create policy "authenticated read" on public.documents for select to authenticated using (true);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- semantic search helper
create or replace function public.match_memories(
  query_embedding vector(1536),
  match_scope text default null,
  match_count int default 8
)
returns table (id text, scope text, kind text, content text, importance real, similarity float)
language sql stable
as $$
  select m.id, m.scope, m.kind, m.content, m.importance,
         1 - (m.embedding <=> query_embedding) as similarity
  from public.memories m
  where m.embedding is not null
    and (match_scope is null or m.scope = match_scope)
  order by m.embedding <=> query_embedding
  limit match_count;
$$;
