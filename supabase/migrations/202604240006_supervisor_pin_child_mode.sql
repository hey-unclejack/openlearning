alter table learner_profiles
  add column if not exists supervisor_pin_hash text;
