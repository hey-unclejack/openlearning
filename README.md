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
- Learning-type performance now persists in `learning_performance_stats`; rerun the schema SQL if your project was created before this table was added.

## Design System

### Core controls

- Primary action uses `.button`
- Secondary page-level action uses `.button-secondary`
- Low-emphasis action uses `.ghost-button`
- Success and error feedback use the global top-center toast via `ToastNotice`

### Selection patterns

- Step-by-step choices and settings choices should share the same `choice-grid / choice-card` system
- Do not create a second visual language for settings selectors when the onboarding selector already solves the same problem
- Settings may tune spacing or sizing, but should stay on top of the same base component and interaction rules
- Selected state must remain visible through border, surface, and motion, not color alone

### Course content blocks

- Scenario lessons should follow a stable block order: `objective -> vocabulary -> chunks -> dialogue -> coach note -> practice`
- `eyebrow` marks the block category, while `title` states the task or lesson topic
- Do not repeat the same meaning in both `eyebrow` and `title`
- Summary and plan blocks for lessons should continue using the existing `review-card` surface instead of inventing a second lesson card style

### Current implementations

- Onboarding choices in [onboarding-form.tsx](/Users/tws/Projects/openlearning/src/components/onboarding/onboarding-form.tsx)
- Profile settings language selector in [settings-form.tsx](/Users/tws/Projects/openlearning/src/components/profile/settings-form.tsx)
- Toast feedback in [toast-notice.tsx](/Users/tws/Projects/openlearning/src/components/ui/toast-notice.tsx)
- Shared control styles in [globals.css](/Users/tws/Projects/openlearning/src/app/globals.css)

## Suggested next steps

1. Replace the in-memory store with Supabase/Postgres.
2. Persist SRS state and learner progress per user.
3. Connect OpenAI generation for personalized plans and richer feedback.
4. Add real auth and route protection.
