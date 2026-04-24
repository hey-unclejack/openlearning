# Review DB Migration Checklist

Use this checklist after pulling the latest code when the review system schema has changed.

## Apply Migration
- Confirm the target Supabase project matches the environment used by the app.
- Preferred: set `DATABASE_URL` or `SUPABASE_DB_URL`, then run `pnpm migrate:review-db`.
- Alternative: apply [202604240001_review_system_upgrade.sql](/Users/tws/Projects/openlearning/supabase/migrations/202604240001_review_system_upgrade.sql) through your normal Supabase migration flow.
- If you use the Supabase CLI, run your project-standard migration command before restarting the app.

## Verify Schema
- Run `pnpm verify:review-db`.
- Expect the script to pass only when these resources exist:
  - `review_items.lesson_id`, `unit_id`, `learning_type`, `importance`, `last_outcome`, `last_confidence`, `needs_reinforcement`
  - `review_logs.session_type`, `confidence`, `response_ms`, `lesson_id`, `unit_id`, `learning_type`, `outcome`
  - `review_learning_type_summary`
  - `review_lesson_hotspots`

## Verify App Behavior
- Run `pnpm test`.
- Run `pnpm build`.
- Complete the first lesson and confirm the app redirects to `/study/diagnostic/[lessonId]`.
- Finish the diagnostic and confirm the next day queue still schedules those cards in formal review instead of consuming them immediately.
- Run one extra review session and confirm due dates do not move forward.

## Failure Clues
- `column review_items.lesson_id does not exist`
  Run the migration on the actual project your env vars point to.
- `Failed verifying review_learning_type_summary`
  The migration was only partially applied, or the view creation failed.
- Dashboard shows data but `verify:review-db` fails
  The app is using fallback application-layer aggregation, not the database views yet.
