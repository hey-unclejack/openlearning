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
