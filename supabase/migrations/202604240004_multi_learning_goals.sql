alter table learner_profiles
  add column if not exists active_goal_id text,
  add column if not exists goals jsonb not null default '[]'::jsonb;

update learner_profiles
set
  active_goal_id = coalesce(active_goal_id, 'goal-english-core'),
  goals = case
    when jsonb_array_length(goals) > 0 then goals
    else jsonb_build_array(jsonb_build_object(
      'id', 'goal-english-core',
      'domain', 'language',
      'title', 'English learning',
      'targetLanguage', target_language,
      'nativeLanguage', native_language,
      'level', level,
      'purpose', focus,
      'dailyMinutes', daily_minutes
    ))
  end;

alter table review_items
  add column if not exists skill_dimension text,
  add column if not exists goal_id text,
  add column if not exists domain text;

alter table review_logs
  add column if not exists skill_dimension text,
  add column if not exists goal_id text,
  add column if not exists domain text;

update review_items
set
  skill_dimension = coalesce(skill_dimension, nullif(learning_type, 'sentence-translation'), 'translation'),
  goal_id = coalesce(goal_id, 'goal-english-core'),
  domain = coalesce(domain, 'language');

update review_logs
set
  skill_dimension = coalesce(skill_dimension, nullif(learning_type, 'sentence-translation'), 'translation'),
  goal_id = coalesce(goal_id, 'goal-english-core'),
  domain = coalesce(domain, 'language');

alter table learning_sources
  add column if not exists goal_id text,
  add column if not exists domain text not null default 'language';

alter table generated_plans
  add column if not exists goal_id text,
  add column if not exists domain text not null default 'language';

alter table learning_sources
  drop constraint if exists learning_sources_subject_check;

alter table learning_sources
  drop constraint if exists learning_sources_domain_check,
  add constraint learning_sources_domain_check check (domain in ('language', 'school-subject', 'exam-cert', 'self-study', 'mandarin-literacy', 'math', 'general'));

alter table generated_plans
  drop constraint if exists generated_plans_subject_check;

alter table generated_plans
  drop constraint if exists generated_plans_domain_check,
  add constraint generated_plans_domain_check check (domain in ('language', 'school-subject', 'exam-cert', 'self-study', 'mandarin-literacy', 'math', 'general'));

alter table learning_performance_stats
  drop constraint if exists learning_performance_stats_learning_type_check,
  add constraint learning_performance_stats_learning_type_check check (
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
  );

update learning_sources
set
  goal_id = coalesce(goal_id, 'goal-english-core'),
  domain = case
    when subject = 'chinese' then 'mandarin-literacy'
    when subject in ('language', 'math', 'mandarin-literacy', 'general') then subject
    else 'language'
  end;

update generated_plans
set
  goal_id = coalesce(goal_id, 'goal-english-core'),
  domain = case
    when subject = 'chinese' then 'mandarin-literacy'
    when subject in ('language', 'math', 'mandarin-literacy', 'general') then subject
    else 'language'
  end;

drop view if exists review_learning_type_summary;

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
