create extension if not exists pgcrypto;

create table if not exists learner_profiles (
  session_id text primary key,
  onboarded boolean not null default false,
  streak integer not null default 0,
  current_day integer not null default 1,
  account_mode text not null default 'supervisor' check (account_mode in ('supervisor', 'child')),
  supervisor_pin_hash text,
  active_learner_id text,
  learners jsonb not null default '[]'::jsonb,
  active_goal_id text,
  goals jsonb not null default '[]'::jsonb,
  target_language text not null,
  native_language text not null,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2')),
  daily_minutes integer not null check (daily_minutes between 5 and 120),
  focus text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists study_plan_days (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references learner_profiles(session_id) on delete cascade,
  day_id text not null,
  day_number integer not null,
  title text not null,
  objective text not null,
  vocabulary jsonb not null default '[]'::jsonb,
  chunks jsonb not null default '[]'::jsonb,
  dialogue jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, day_id)
);

create index if not exists study_plan_days_session_day_idx
  on study_plan_days (session_id, day_number);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references learner_profiles(session_id) on delete cascade,
  lesson_id text not null,
  day_id text not null,
  intro text not null,
  coaching_note text not null,
  practice jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, lesson_id)
);

create index if not exists lessons_session_day_idx
  on lessons (session_id, day_id);

create table if not exists review_items (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references learner_profiles(session_id) on delete cascade,
  review_item_id text not null,
  front text not null,
  back text not null,
  hint text not null,
  tags jsonb not null default '[]'::jsonb,
  lesson_id text,
  unit_id text,
  learner_id text not null default 'self',
  learning_type text,
  skill_dimension text,
  goal_id text,
  domain text,
  importance text not null default 'core' check (importance in ('core', 'extension')),
  ease_factor numeric(4,2) not null default 2.5,
  interval_days integer not null default 0,
  repetition_count integer not null default 0,
  lapse_count integer not null default 0,
  due_date timestamptz not null,
  last_reviewed_at timestamptz null,
  last_outcome text not null default 'unseen' check (last_outcome in ('unseen', 'again', 'hard', 'good', 'easy')),
  last_confidence numeric(4,2),
  needs_reinforcement boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (session_id, review_item_id)
);

create index if not exists review_items_due_idx
  on review_items (session_id, due_date);

create index if not exists review_items_lapse_idx
  on review_items (session_id, lapse_count desc);

create table if not exists review_logs (
  id bigint generated always as identity primary key,
  session_id text not null references learner_profiles(session_id) on delete cascade,
  review_item_id text not null,
  grade text not null check (grade in ('again', 'hard', 'good', 'easy')),
  reviewed_at timestamptz not null,
  next_due_date timestamptz not null,
  session_type text not null default 'formal' check (session_type in ('formal', 'warmup', 'extra', 'diagnostic')),
  confidence numeric(4,2),
  response_ms integer,
  lesson_id text,
  unit_id text,
  learner_id text not null default 'self',
  learning_type text,
  skill_dimension text,
  goal_id text,
  domain text,
  outcome text check (outcome in ('correct', 'incorrect'))
);

create index if not exists review_logs_session_reviewed_idx
  on review_logs (session_id, reviewed_at desc);

create table if not exists learning_performance_stats (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  learning_type text not null check (
    learning_type in (
      'translation',
      'sentence-translation',
      'vocabulary',
      'listening',
      'speaking',
      'writing',
      'grammar',
      'comprehension',
      'main-idea',
      'rewrite',
      'summary',
      'concept',
      'procedure',
      'calculation',
      'word-problem',
      'error-analysis',
      'recall',
      'application',
      'explanation'
    )
  ),
  attempts integer not null default 0,
  correct_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (session_id, learning_type)
);

create index if not exists learning_performance_stats_session_idx
  on learning_performance_stats (session_id);

create table if not exists learning_sources (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references learner_profiles(session_id) on delete cascade,
  source_id text not null,
  source_type text not null check (source_type in ('topic', 'text', 'pdf', 'image', 'url', 'youtube')),
  learner_id text not null default 'self',
  goal_id text,
  domain text not null default 'language' check (domain in ('language', 'school-subject', 'exam-cert', 'self-study', 'mandarin-literacy', 'math', 'general')),
  subject text not null default 'language',
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
  learner_id text not null default 'self',
  goal_id text,
  domain text not null default 'language' check (domain in ('language', 'school-subject', 'exam-cert', 'self-study', 'mandarin-literacy', 'math', 'general')),
  subject text not null default 'language',
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

create table if not exists classrooms (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references learner_profiles(session_id) on delete cascade,
  classroom_id text not null,
  teacher_account_id text not null,
  title text not null,
  school_name text,
  grade_band text,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, classroom_id)
);

create index if not exists classrooms_session_created_idx
  on classrooms (session_id, created_at desc);

create table if not exists class_goal_templates (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references learner_profiles(session_id) on delete cascade,
  template_id text not null,
  classroom_id text not null,
  source_goal_id text not null,
  title text not null,
  domain text not null check (domain in ('language', 'school-subject', 'exam-cert', 'self-study', 'mandarin-literacy', 'math', 'general')),
  subject text,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2')),
  purpose text not null,
  daily_minutes integer not null check (daily_minutes between 5 and 120),
  template_version integer not null default 1,
  sync_policy text not null default 'append-new-content' check (sync_policy in ('append-new-content')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (session_id, template_id)
);

create index if not exists class_goal_templates_classroom_idx
  on class_goal_templates (session_id, classroom_id);

create table if not exists class_invites (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references learner_profiles(session_id) on delete cascade,
  invite_id text not null,
  classroom_id text not null,
  template_id text not null,
  code text not null,
  status text not null default 'active' check (status in ('active', 'disabled', 'expired')),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, invite_id),
  unique (code)
);

create index if not exists class_invites_code_idx
  on class_invites (code);

create table if not exists class_enrollments (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references learner_profiles(session_id) on delete cascade,
  enrollment_id text not null,
  classroom_id text not null,
  template_id text not null,
  parent_account_id text not null,
  child_learner_id text not null,
  assigned_goal_id text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  joined_at timestamptz not null default timezone('utc', now()),
  unique (session_id, enrollment_id)
);

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

create table if not exists ai_settings (
  session_id text primary key references learner_profiles(session_id) on delete cascade,
  enabled boolean not null default false,
  permissions jsonb not null default '{
    "generate_courses": false,
    "auto_search_courses": false,
    "course_optimization": false,
    "learning_optimization": false
  }'::jsonb,
  connection_preference text not null default 'platform' check (connection_preference in ('platform', 'custom')),
  custom_connection_mode text not null default 'api' check (custom_connection_mode in ('api', 'oauth')),
  updated_at timestamptz not null default timezone('utc', now())
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

create or replace view review_learning_type_summary as
select
  session_id,
  coalesce(skill_dimension, learning_type) as learning_type,
  count(*)::integer as attempts,
  count(*) filter (where outcome = 'correct')::integer as correct_count,
  count(*) filter (where outcome = 'incorrect')::integer as incorrect_count,
  round(
    coalesce(
      (count(*) filter (where outcome = 'correct'))::numeric / nullif(count(*)::numeric, 0),
      0
    ),
    4
  ) as accuracy,
  count(*) filter (where session_type in ('formal', 'warmup'))::integer as formal_attempts,
  count(*) filter (where session_type = 'extra')::integer as extra_attempts,
  max(reviewed_at) as last_reviewed_at
from review_logs
where coalesce(skill_dimension, learning_type) is not null
group by session_id, coalesce(skill_dimension, learning_type);

create or replace view review_lesson_hotspots as
select
  session_id,
  lesson_id,
  count(*)::integer as attempts,
  count(*) filter (where outcome = 'incorrect')::integer as misses,
  round(
    coalesce(
      (count(*) filter (where outcome = 'incorrect'))::numeric / nullif(count(*)::numeric, 0),
      0
    ),
    4
  ) as miss_rate,
  max(reviewed_at) as last_reviewed_at
from review_logs
where lesson_id is not null
group by session_id, lesson_id;
