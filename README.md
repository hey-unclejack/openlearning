# OpenLearning v1

An SRS-first language learning assistant built with Next.js App Router.

## What is included

- Landing page with product positioning
- Supabase Google-only auth
- Onboarding flow for learner profile
- Dashboard with daily review stats and retention summary
- SRS review flow with `again / hard / good / easy`
- Scene-based daily lessons
- Practice area with immediate feedback
- Progress page with plan map and weakness tracking
- API routes for onboarding and review submission

## Tech

- Next.js 15
- React 19
- TypeScript
- Session-aware local fallback store
- Supabase-ready repository layer

## Run

```bash
pnpm install
pnpm dev
```

## Optional Supabase setup

1. Create a Supabase project.
2. Run the SQL in [`src/lib/db/schema.sql`](/Users/tws/Projects/openlearning/src/lib/db/schema.sql).
3. Copy [`.env.example`](/Users/tws/Projects/openlearning/.env.example) to `.env.local`.
4. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
5. In Supabase Auth, enable the Google provider and add your callback URL:
   `/auth/callback`

Without these env vars, the app falls back to a local in-memory store keyed by a session cookie.

## Notes

- Supabase integration is designed around anonymous session ids for now; auth can be layered in later.
- Without Supabase env vars, data still resets when the server restarts.
- The auth pages are placeholders and intended to be replaced with Supabase Auth.
- The API surface is already separated so persistence can be swapped in later.

## Suggested next steps

1. Replace the in-memory store with Supabase/Postgres.
2. Persist SRS state and learner progress per user.
3. Connect OpenAI generation for personalized plans and richer feedback.
4. Add real auth and route protection.
