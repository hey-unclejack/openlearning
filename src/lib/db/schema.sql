create extension if not exists pgcrypto;

create table if not exists learner_profiles (
  session_id text primary key,
  onboarded boolean not null default false,
  streak integer not null default 0,
  current_day integer not null default 1,
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
  ease_factor numeric(4,2) not null default 2.5,
  interval_days integer not null default 0,
  repetition_count integer not null default 0,
  lapse_count integer not null default 0,
  due_date timestamptz not null,
  last_reviewed_at timestamptz null,
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
  next_due_date timestamptz not null
);

create index if not exists review_logs_session_reviewed_idx
  on review_logs (session_id, reviewed_at desc);

create table if not exists learning_performance_stats (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  learning_type text not null check (
    learning_type in (
      'sentence-translation',
      'vocabulary',
      'listening',
      'speaking',
      'writing',
      'grammar'
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
