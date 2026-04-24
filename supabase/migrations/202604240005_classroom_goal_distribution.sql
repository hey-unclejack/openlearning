alter table learner_profiles
  add column if not exists account_mode text not null default 'supervisor',
  add column if not exists active_learner_id text,
  add column if not exists learners jsonb not null default '[]'::jsonb;

update learner_profiles
set
  active_learner_id = coalesce(active_learner_id, 'self'),
  learners = case
    when jsonb_array_length(learners) > 0 then learners
    else jsonb_build_array(jsonb_build_object(
      'id', 'self',
      'displayName', 'Me',
      'kind', 'self',
      'profile', jsonb_build_object(
        'activeGoalId', active_goal_id,
        'goals', goals,
        'targetLanguage', target_language,
        'nativeLanguage', native_language,
        'level', level,
        'dailyMinutes', daily_minutes,
        'focus', focus
      ),
      'restrictions', jsonb_build_object(
        'learningOnly', false,
        'canEditGoals', true,
        'canUseAiIntake', true
      )
    ))
  end;

alter table review_items
  add column if not exists learner_id text not null default 'self';

alter table review_logs
  add column if not exists learner_id text not null default 'self';

alter table learning_sources
  add column if not exists learner_id text not null default 'self';

alter table generated_plans
  add column if not exists learner_id text not null default 'self';

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
