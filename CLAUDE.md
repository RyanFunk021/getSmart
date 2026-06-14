@AGENTS.md

# Get Smart — Claude Code Context

## What this project is

A mobile brain-training / reading comprehension app built in React Native (Expo). The core loop: read a passage → free recall → 5 AI-generated comprehension questions → immediate feedback → score + XP → spaced repetition scheduling.

**Docs to read before making significant changes:**
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how everything fits together
- [docs/SPEC.md](docs/SPEC.md) — what every feature is supposed to do
- [docs/RESTORE_POINTS.md](docs/RESTORE_POINTS.md) — stable checkpoints, recovery instructions

## Stack

- **React Native (Expo SDK 56)** with Expo Router (file-based routing under `src/app/`)
- **NativeWind v4** — Tailwind via `className` props on all RN components
- **Zustand** — 5 stores: `authStore`, `readingStore`, `quizStore`, `progressStore`, `settingsStore`
- **Supabase** — Postgres + Auth + RLS + Edge Functions
- **Claude API** (`claude-sonnet-4-6`) — question generation, server-side only via Edge Functions

## Critical rules

**Never put ANTHROPIC_API_KEY in the client.** It belongs in Supabase secrets only, accessed via `Deno.env.get()` in Edge Functions.

**Expo SDK 56 has changed things.** Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any Expo-specific code (navigation, plugins, native modules).

**NativeWind v4 className types** are provided by `nativewind-env.d.ts` (references `nativewind/types`). The tsconfig excludes `supabase/functions/` — that directory uses Deno, not Node.

**RLS is on every table.** User-scoped tables require `auth.uid() = user_id`. The `passage_ai_cache` and `passages` tables are readable by any authenticated user but only writable via service role (Edge Functions use the service key).

## Key files

| File | Purpose |
|---|---|
| `src/lib/srs.ts` | Pure SM-2 spaced repetition functions — no side effects |
| `src/lib/scoring.ts` | Score formula, XP, grade (S/A/B/C/D), difficulty calibration |
| `src/lib/attention.ts` | Mind-wander ping scheduler, WPM estimation |
| `src/hooks/useReadingSession.ts` | Orchestrates timer, pings, scroll tracking |
| `src/hooks/useSRS.ts` | Daily review queue + new passage selection logic |
| `supabase/migrations/001_schema.sql` | Full database schema — all 8 tables + RLS |
| `supabase/functions/generate-questions/index.ts` | Claude integration — generates + caches questions |

## Known issues to fix (prioritized)

1. **Settings don't persist** — `settingsStore` is in-memory. Add Zustand `AsyncStorage` persistence.
2. **Daily session count is hardcoded 0** — `home.tsx` needs to query `reading_sessions WHERE DATE(started_at) = today`.
3. **Short-answer grading is exact match** — needs Claude `grade-answer` Edge Function for real grading.
4. **`calibrateDifficulty` not called** — implemented in `scoring.ts` but not invoked after session finalization.
5. **Streak freeze tokens have no UI** — stored in DB but no button to apply them.

## Environment setup

```bash
# .env.local (never commit this)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase secrets (server-side, set once)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

## Adding a passage

```sql
INSERT INTO passages (title, body, word_count, subject, difficulty, topics)
VALUES ('Title', 'Body...', 300, 'science', 5, ARRAY['tag1']);
```

Questions are auto-generated on first quiz attempt for that passage.

## TypeScript

Run `npx tsc --noEmit` to check. Should always be 0 errors. The `supabase/functions/` directory is excluded from the app tsconfig (Deno runtime, not Node).
