# Get Smart — Restore Points

This document tracks stable checkpoints in the project's history. Use these to recover a known-good state if a change breaks something, or to understand what changed between phases.

---

## How to Use a Restore Point

### View the state at a restore point
```bash
git checkout <tag>       # detach HEAD to that point (read-only)
git checkout main        # return to latest
```

### Restore a file to its state at a restore point
```bash
git checkout <tag> -- src/path/to/file.tsx
```

### Create a new branch from a restore point (safest recovery)
```bash
git checkout -b recovery/my-fix <tag>
# make your fixes, then merge back to main
```

### Hard reset to a restore point (destructive — loses all uncommitted work)
```bash
git reset --hard <tag>
```

---

## Restore Points

---

### `v0.0-expo-init`
**Commit:** `9da1a1a`
**Date:** 2026-06-06
**Tag:** `v0.0-expo-init`

**What it is:** The Expo blank TypeScript template, freshly created. No app code. Only the default Expo scaffolding.

**Use this if:** You need to start completely fresh from the Expo template with none of our changes.

**What's here:**
- `package.json` with default Expo deps only
- Default `App.tsx`, `app.json`
- No `src/`, no `supabase/`, no NativeWind

---

### `v1.0-mvp`
**Commit:** `bfed233`
**Date:** 2026-06-06
**Tag:** `v1.0-mvp`

**What it is:** Full MVP — every screen, all stores, all hooks, schema, seed data, and the Claude Edge Function. TypeScript clean (0 errors). Supabase schema is finalized. 10 seed passages.

**Use this if:**
- Something broke during a later phase and you need a stable base
- You want to re-read the original implementation of any component
- You need to diff against a known-good state

**What's complete:**
- ✅ Expo Router with auth gate
- ✅ Login / Signup screens (Supabase Auth)
- ✅ Home screen (streak, XP, passage selection, SRS queue)
- ✅ Reading screen (passage text, timer, mind-wander pings, scroll tracking)
- ✅ Quiz screen (free recall + 5 questions, per-question feedback)
- ✅ Results screen (animated score, grade badge, concept map, XP)
- ✅ Progress screen (heatmap calendar, skill radar)
- ✅ Settings screen (session length, ping frequency, difficulty, font size)
- ✅ SM-2 spaced repetition engine (`src/lib/srs.ts`)
- ✅ Scoring system with XP, grade, speed/streak bonuses (`src/lib/scoring.ts`)
- ✅ Attention mechanics: mind-wander scheduler, WPM tracking (`src/lib/attention.ts`)
- ✅ Claude Edge Function: question generation + concept map + caching
- ✅ Supabase schema: 8 tables, RLS on all, `srs_due_idx`
- ✅ 10 curated seed passages (difficulty 4–9, psychology/neuroscience/philosophy/science)
- ✅ All UI components: Button, Card, ProgressRing, StreakFlame, ScoreBadge, HeatmapCalendar, SkillRadar, ConceptGraph

**Known limitations at this point** (see [ARCHITECTURE.md](ARCHITECTURE.md)):
- Short-answer grading is exact string match (not AI-graded)
- Settings not persisted across restarts
- Daily session count hardcoded to 0
- `user_difficulty_profile` table exists but `calibrateDifficulty` not yet called post-session
- No offline support

---

## Planned Future Restore Points

These will be tagged as they are built:

| Tag | Phase | What it adds |
|---|---|---|
| `v1.1-persist-settings` | Bug fix | AsyncStorage persistence for settings store |
| `v1.2-session-tracking` | Bug fix | Daily session count wired; difficulty calibration called |
| `v2.0-ai-grading` | Phase 2 | Claude grades short-answer responses; `grade-answer` Edge Function |
| `v2.1-offline` | Phase 2 | Last passage cached in AsyncStorage; offline graceful degradation |
| `v3.0-user-passages` | Phase 3 | User-submitted passages; passage difficulty estimation |
| `v4.0-social` | Phase 4 | Streak sharing, results image, optional leaderboard |
| `v5.0-app-store` | Phase 5 | TestFlight build; App Store submission; IAP |

---

## Creating a New Restore Point

When you reach a stable milestone, tag it:

```bash
git tag -a v1.1-persist-settings -m "Persist settings to AsyncStorage; fix daily session count"
git push origin v1.1-persist-settings
```

Then add an entry to this file describing what the tag contains.

---

## Supabase Schema Versions

The database schema is versioned separately from the app via migration files. These are **not reversible automatically** — treat each migration as append-only.

| File | Applied | What it adds |
|---|---|---|
| `001_schema.sql` | 2026-06-06 | All 8 tables + RLS policies + indexes |
| `002_seed_passages.sql` | 2026-06-06 | 10 curated passages |

### To check which migrations have run
In the Supabase dashboard → SQL Editor:
```sql
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
```

### To add a new migration
Create `supabase/migrations/003_your_change.sql` and run it via the dashboard or:
```bash
supabase db push
```

### Schema restore
If the database schema becomes corrupted, re-run `001_schema.sql` on a fresh Supabase project (Tables → SQL Editor). You will lose all user data. The seed passages can be restored by re-running `002_seed_passages.sql`.

---

## Environment Checklist (for recovery)

If you're rebuilding the environment from scratch, verify each item:

- [ ] `.env.local` exists with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `001_schema.sql` has been run against Supabase
- [ ] `002_seed_passages.sql` has been run (check: `SELECT COUNT(*) FROM passages` should return 10)
- [ ] Edge Function deployed: `supabase functions deploy generate-questions`
- [ ] `ANTHROPIC_API_KEY` set as Supabase secret: `supabase secrets list` should show it
- [ ] `npm install` has been run (check: `node_modules/` exists)
- [ ] TypeScript passes: `npx tsc --noEmit` should show 0 errors
- [ ] App runs: `npm run ios` should launch without red-screen errors
