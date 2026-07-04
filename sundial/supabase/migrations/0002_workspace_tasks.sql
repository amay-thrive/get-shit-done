-- Workspace: tasks (kanban) — documents table already exists in 0001.
create table public.tasks (
  id text primary key,
  project_id text references public.projects(id),
  document_id text references public.documents(id),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo','in_progress','done','blocked')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  assignee uuid references public.profiles(id),
  due_date date,
  position double precision not null default 0,
  created_by uuid references public.profiles(id),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tasks_status on public.tasks(status, position);
create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_assignee on public.tasks(assignee);

alter table public.tasks enable row level security;
create policy "authenticated read" on public.tasks for select to authenticated using (true);

-- Give existing agents access to the new workspace tools.
update public.agent_definitions
set tools = tools || '{docs.search,docs.create,tasks.query,tasks.create}',
    updated_at = now()
where name in ('chief-of-staff','pipeline-analyst','ops-autopilot','venture-scout','client-intel');

-- Semantic search over workspace documents (mirrors match_memories).
create or replace function public.match_documents(
  query_embedding vector(1536),
  match_count int default 8
)
returns table (id text, title text, kind text, content text, similarity float)
language sql stable
as $$
  select d.id, d.title, d.kind, left(d.content, 1200) as content,
         1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where d.embedding is not null
  order by d.embedding <=> query_embedding
  limit match_count;
$$;
