alter table if exists review_items
  add column if not exists lesson_id text,
  add column if not exists unit_id text,
  add column if not exists learning_type text,
  add column if not exists importance text not null default 'core',
  add column if not exists last_outcome text not null default 'unseen',
  add column if not exists last_confidence numeric(4,2),
  add column if not exists needs_reinforcement boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'review_items_importance_check'
  ) then
    alter table review_items
      add constraint review_items_importance_check
      check (importance in ('core', 'extension'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'review_items_last_outcome_check'
  ) then
    alter table review_items
      add constraint review_items_last_outcome_check
      check (last_outcome in ('unseen', 'again', 'hard', 'good', 'easy'));
  end if;
end $$;

alter table if exists review_logs
  add column if not exists session_type text not null default 'formal',
  add column if not exists confidence numeric(4,2),
  add column if not exists response_ms integer,
  add column if not exists lesson_id text,
  add column if not exists unit_id text,
  add column if not exists learning_type text,
  add column if not exists outcome text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'review_logs_session_type_check'
  ) then
    alter table review_logs
      add constraint review_logs_session_type_check
      check (session_type in ('formal', 'warmup', 'extra', 'diagnostic'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'review_logs_outcome_check'
  ) then
    alter table review_logs
      add constraint review_logs_outcome_check
      check (outcome in ('correct', 'incorrect'));
  end if;
end $$;

create index if not exists review_items_session_lesson_idx
  on review_items (session_id, lesson_id);

create index if not exists review_items_session_reinforcement_idx
  on review_items (session_id, needs_reinforcement desc, due_date);

create index if not exists review_logs_session_type_idx
  on review_logs (session_id, session_type, reviewed_at desc);

create or replace view review_learning_type_summary as
select
  session_id,
  learning_type,
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
where learning_type is not null
group by session_id, learning_type;

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
