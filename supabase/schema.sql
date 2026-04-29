-- ============================================================
-- ScrumBoard Pro – Full Schema
-- Run this in Supabase: SQL Editor → New Query → Run
-- ============================================================

-- Profiles (one per auth user, auto-created on signup)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz default now() not null
);

-- Organizations (teams / workspaces)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now() not null
);

-- Org members (user ↔ org mapping + display info)
create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role text not null default 'developer',
  avatar_initials text not null default 'U',
  avatar_color text not null default '#6366F1',
  capacity_points int not null default 40,
  joined_at timestamptz default now() not null,
  unique(org_id, user_id)
);

-- Epics
create table if not exists public.epics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  title text not null,
  description text default '',
  color text default '#6366F1',
  status text default 'active',
  start_date text,
  end_date text,
  created_at timestamptz default now() not null
);

-- Sprints
create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  goal text default '',
  start_date text not null default '',
  end_date text not null default '',
  status text default 'planned',
  velocity int,
  created_at timestamptz default now() not null
);

-- Stories
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  title text not null,
  description text default '',
  type text default 'story',
  status text default 'backlog',
  priority text default 'medium',
  story_points int default 0,
  epic_id uuid references public.epics(id) on delete set null,
  sprint_id uuid references public.sprints(id) on delete set null,
  assignee_id uuid references public.org_members(id) on delete set null,
  labels text[] default '{}',
  acceptance_criteria text default '',
  sort_order int default 0,
  is_blocker boolean default false,
  attachments jsonb default '[]',
  subtasks jsonb default '[]',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Milestones
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  title text not null,
  description text default '',
  due_date text not null default '',
  status text default 'on_track',
  epic_id uuid references public.epics(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Risks
create table if not exists public.risks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  title text not null,
  description text default '',
  probability text default 'medium',
  impact text default 'medium',
  status text default 'open',
  mitigation text default '',
  owner_id uuid references public.org_members(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Decisions
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  title text not null,
  context text default '',
  decision text default '',
  outcome text default '',
  status text default 'proposed',
  author_id uuid references public.org_members(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Dependencies
create table if not exists public.dependencies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  from_story_id uuid references public.stories(id) on delete cascade not null,
  to_story_id uuid references public.stories(id) on delete cascade not null,
  type text default 'blocks',
  created_at timestamptz default now() not null
);

-- Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  story_id uuid references public.stories(id) on delete cascade not null,
  author_id uuid references public.org_members(id) on delete set null,
  body text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Standup entries
create table if not exists public.standup_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  member_id uuid references public.org_members(id) on delete set null,
  date text not null,
  yesterday text default '',
  today text default '',
  blockers text default '',
  created_at timestamptz default now() not null
);

-- Org settings (one row per org)
create table if not exists public.org_settings (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  project_name text default 'My Project',
  sprint_duration int default 14,
  story_point_scale text default 'fibonacci',
  velocity_baseline int default 40,
  wip_limits jsonb default '{}',
  updated_at timestamptz default now() not null
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.epics enable row level security;
alter table public.sprints enable row level security;
alter table public.stories enable row level security;
alter table public.milestones enable row level security;
alter table public.risks enable row level security;
alter table public.decisions enable row level security;
alter table public.dependencies enable row level security;
alter table public.comments enable row level security;
alter table public.standup_entries enable row level security;
alter table public.org_settings enable row level security;

-- Helper: get the calling user's org_id
create or replace function public.get_user_org_id()
returns uuid language sql stable security definer as $$
  select org_id from public.org_members where user_id = auth.uid() limit 1;
$$;

-- Profiles
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Organizations
create policy "org member can view org" on public.organizations for select using (
  exists (select 1 from public.org_members where org_id = organizations.id and user_id = auth.uid())
);
create policy "authenticated can create org" on public.organizations for insert with check (auth.uid() is not null);
create policy "org owner can update" on public.organizations for update using (created_by = auth.uid());

-- Org members
create policy "members can view org members" on public.org_members for select using (
  exists (select 1 from public.org_members om where om.org_id = org_members.org_id and om.user_id = auth.uid())
);
create policy "user can insert self as member" on public.org_members for insert with check (user_id = auth.uid());
create policy "admin can manage members" on public.org_members for all using (
  exists (select 1 from public.org_members om where om.org_id = org_members.org_id and om.user_id = auth.uid() and om.role in ('owner', 'admin'))
);

-- Epics
create policy "epics select" on public.epics for select using (org_id = get_user_org_id());
create policy "epics insert" on public.epics for insert with check (org_id = get_user_org_id());
create policy "epics update" on public.epics for update using (org_id = get_user_org_id());
create policy "epics delete" on public.epics for delete using (org_id = get_user_org_id());

-- Sprints
create policy "sprints select" on public.sprints for select using (org_id = get_user_org_id());
create policy "sprints insert" on public.sprints for insert with check (org_id = get_user_org_id());
create policy "sprints update" on public.sprints for update using (org_id = get_user_org_id());
create policy "sprints delete" on public.sprints for delete using (org_id = get_user_org_id());

-- Stories
create policy "stories select" on public.stories for select using (org_id = get_user_org_id());
create policy "stories insert" on public.stories for insert with check (org_id = get_user_org_id());
create policy "stories update" on public.stories for update using (org_id = get_user_org_id());
create policy "stories delete" on public.stories for delete using (org_id = get_user_org_id());

-- Milestones
create policy "milestones select" on public.milestones for select using (org_id = get_user_org_id());
create policy "milestones insert" on public.milestones for insert with check (org_id = get_user_org_id());
create policy "milestones update" on public.milestones for update using (org_id = get_user_org_id());
create policy "milestones delete" on public.milestones for delete using (org_id = get_user_org_id());

-- Risks
create policy "risks select" on public.risks for select using (org_id = get_user_org_id());
create policy "risks insert" on public.risks for insert with check (org_id = get_user_org_id());
create policy "risks update" on public.risks for update using (org_id = get_user_org_id());
create policy "risks delete" on public.risks for delete using (org_id = get_user_org_id());

-- Decisions
create policy "decisions select" on public.decisions for select using (org_id = get_user_org_id());
create policy "decisions insert" on public.decisions for insert with check (org_id = get_user_org_id());
create policy "decisions update" on public.decisions for update using (org_id = get_user_org_id());
create policy "decisions delete" on public.decisions for delete using (org_id = get_user_org_id());

-- Dependencies
create policy "dependencies select" on public.dependencies for select using (org_id = get_user_org_id());
create policy "dependencies insert" on public.dependencies for insert with check (org_id = get_user_org_id());
create policy "dependencies delete" on public.dependencies for delete using (org_id = get_user_org_id());

-- Comments
create policy "comments select" on public.comments for select using (org_id = get_user_org_id());
create policy "comments insert" on public.comments for insert with check (org_id = get_user_org_id());
create policy "comments update" on public.comments for update using (org_id = get_user_org_id());
create policy "comments delete" on public.comments for delete using (org_id = get_user_org_id());

-- Standup entries
create policy "standups select" on public.standup_entries for select using (org_id = get_user_org_id());
create policy "standups insert" on public.standup_entries for insert with check (org_id = get_user_org_id());
create policy "standups update" on public.standup_entries for update using (org_id = get_user_org_id());
create policy "standups delete" on public.standup_entries for delete using (org_id = get_user_org_id());

-- Org settings
create policy "settings select" on public.org_settings for select using (org_id = get_user_org_id());
create policy "settings upsert" on public.org_settings for all using (org_id = get_user_org_id());

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-create org_settings when org is created
create or replace function public.handle_new_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.org_settings (org_id, project_name)
  values (new.id, new.name)
  on conflict (org_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_org_created on public.organizations;
create trigger on_org_created
  after insert on public.organizations
  for each row execute procedure public.handle_new_org();

-- Enable realtime for key tables
alter publication supabase_realtime add table public.stories;
alter publication supabase_realtime add table public.sprints;
alter publication supabase_realtime add table public.epics;
alter publication supabase_realtime add table public.org_members;
alter publication supabase_realtime add table public.milestones;
alter publication supabase_realtime add table public.risks;
