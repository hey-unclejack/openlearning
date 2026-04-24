create table if not exists learning_sources (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references learner_profiles(session_id) on delete cascade,
  source_id text not null,
  source_type text not null check (source_type in ('topic', 'text', 'pdf', 'image', 'url', 'youtube')),
  subject text not null default 'language' check (subject in ('language', 'math', 'chinese')),
  title text not null,
  raw_text text not null,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  user_owns_rights boolean not null default false,
  child_mode boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, source_id)
);

create index if not exists learning_sources_session_created_idx
  on learning_sources (session_id, created_at desc);

create table if not exists generated_plans (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references learner_profiles(session_id) on delete cascade,
  generated_plan_id text not null,
  source_id text not null,
  subject text not null default 'language' check (subject in ('language', 'math', 'chinese')),
  provider_mode text not null check (provider_mode in ('official', 'byok', 'oauth')),
  model text not null,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2')),
  focus text not null,
  daily_minutes integer not null,
  status text not null check (status in ('draft', 'active', 'completed', 'failed')),
  days jsonb not null default '[]'::jsonb,
  quality_warnings jsonb not null default '[]'::jsonb,
  cost_estimate_usd numeric(12,6) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, generated_plan_id)
);

create index if not exists generated_plans_session_created_idx
  on generated_plans (session_id, created_at desc);

create table if not exists ai_provider_connections (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references learner_profiles(session_id) on delete cascade,
  provider text not null,
  mode text not null check (mode in ('official', 'byok', 'oauth')),
  status text not null check (status in ('not_configured', 'configured', 'needs_attention')),
  masked_credential text,
  encrypted_credential text,
  model text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (session_id, provider, mode)
);

create table if not exists ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references learner_profiles(session_id) on delete cascade,
  usage_log_id text not null,
  provider text not null,
  provider_mode text not null check (provider_mode in ('official', 'byok', 'oauth')),
  model text not null,
  source_id text,
  generated_plan_id text,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  cost_estimate_usd numeric(12,6) not null default 0,
  official_quota boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, usage_log_id)
);

create index if not exists ai_usage_logs_session_created_idx
  on ai_usage_logs (session_id, created_at desc);
