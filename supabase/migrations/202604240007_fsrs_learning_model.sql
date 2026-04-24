alter table if exists learner_profiles
  add column if not exists desired_retention numeric(4,2) not null default 0.90;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'learner_profiles_desired_retention_check'
  ) then
    alter table learner_profiles
      add constraint learner_profiles_desired_retention_check
      check (desired_retention between 0.75 and 0.97);
  end if;
end $$;

alter table if exists review_items
  add column if not exists fsrs_state text not null default 'New',
  add column if not exists fsrs_stability numeric(10,4) not null default 0,
  add column if not exists fsrs_difficulty numeric(10,4) not null default 0,
  add column if not exists fsrs_elapsed_days integer not null default 0,
  add column if not exists fsrs_scheduled_days integer not null default 0,
  add column if not exists fsrs_reps integer not null default 0,
  add column if not exists fsrs_lapses integer not null default 0,
  add column if not exists fsrs_last_review timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'review_items_fsrs_state_check'
  ) then
    alter table review_items
      add constraint review_items_fsrs_state_check
      check (fsrs_state in ('New', 'Learning', 'Review', 'Relearning'));
  end if;
end $$;

create index if not exists review_items_session_fsrs_due_idx
  on review_items (session_id, fsrs_state, due_date);

alter table if exists review_logs
  add column if not exists fsrs_rating integer,
  add column if not exists fsrs_state_before text,
  add column if not exists fsrs_state_after text,
  add column if not exists fsrs_stability_before numeric(10,4),
  add column if not exists fsrs_stability_after numeric(10,4),
  add column if not exists fsrs_difficulty_before numeric(10,4),
  add column if not exists fsrs_difficulty_after numeric(10,4),
  add column if not exists scheduled_days_after integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'review_logs_fsrs_rating_check'
  ) then
    alter table review_logs
      add constraint review_logs_fsrs_rating_check
      check (fsrs_rating between 1 and 4);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'review_logs_fsrs_state_before_check'
  ) then
    alter table review_logs
      add constraint review_logs_fsrs_state_before_check
      check (fsrs_state_before in ('New', 'Learning', 'Review', 'Relearning'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'review_logs_fsrs_state_after_check'
  ) then
    alter table review_logs
      add constraint review_logs_fsrs_state_after_check
      check (fsrs_state_after in ('New', 'Learning', 'Review', 'Relearning'));
  end if;
end $$;
