# Get Smart — Technical Architecture

## Overview

Get Smart is a mobile-first React Native app (Expo) with a Supabase backend and Claude AI integration. All AI calls are server-side (Supabase Edge Functions). The client is a stateful Expo Router app with Zustand stores for local state and Supabase for persistence.

```
┌─────────────────────────────────────────────────────┐
│                   iOS / Android                     │
│                                                     │
│   Expo Router  →  Screens  →  Zustand Stores        │
│        │               │           │                │
│        └───────────────┴───────────┘                │
│                        │                            │
│               Supabase JS Client                    │
└────────────────────────┼────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │     Supabase        │
              │                     │
              │  ┌───────────────┐  │
              │  │  Postgres DB  │  │
              │  │  + RLS        │  │
              │  └───────────────┘  │
              │  ┌───────────────┐  │
              │  │  Auth         │  │
              │  └───────────────┘  │
              │  ┌───────────────┐  │
              │  │  Edge Funcs   │──┼──▶  Claude API
              │  │  (Deno)       │  │     claude-sonnet-4-6
              │  └───────────────┘  │
              └─────────────────────┘
```

---

## Directory Structure

```
src/
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx         # Root: Supabase auth listener, Stack config
│   ├── (auth)/             # Unauthenticated group
│   │   ├── _layout.tsx     # Redirects to tabs if already logged in
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/             # Tab bar group (authenticated)
│   │   ├── _layout.tsx     # Redirects to auth if logged out
│   │   ├── home.tsx
│   │   ├── progress.tsx
│   │   └── settings.tsx
│   ├── reading/
│   │   └── [sessionId].tsx # Full-screen modal
│   ├── quiz/
│   │   └── [sessionId].tsx
│   └── results/
│       └── [sessionId].tsx
│
├── components/             # Presentational components, no direct Supabase calls
│   ├── ui/                 # Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ProgressRing.tsx   # SVG ring using react-native-svg
│   │   ├── ScoreBadge.tsx     # Animated grade badge (spring animation)
│   │   └── StreakFlame.tsx    # Animated 🔥 counter
│   ├── reading/
│   │   ├── PassageText.tsx    # ScrollView with scroll tracking
│   │   ├── ReadingTimer.tsx   # Progress bar + clock
│   │   └── MindWanderPrompt.tsx # Semi-transparent overlay
│   ├── quiz/
│   │   ├── FreeRecallInput.tsx
│   │   ├── QuestionCard.tsx   # Multiple choice + short answer modes
│   │   └── FeedbackOverlay.tsx # Slides up from bottom (spring)
│   └── progress/
│       ├── HeatmapCalendar.tsx  # 90-day activity grid
│       ├── SkillRadar.tsx       # SVG radar chart (5 dimensions)
│       └── ConceptGraph.tsx     # SVG node/edge concept map
│
├── hooks/
│   ├── useReadingSession.ts  # Orchestrates timer, mind-wander pings, scroll
│   ├── useQuizSession.ts     # Loads/triggers question generation
│   ├── useSRS.ts             # Daily review queue + new passage selection
│   └── useStreak.ts          # Loads streak from Supabase; updateStreakAfterSession()
│
├── lib/
│   ├── supabase.ts     # createClient singleton (EXPO_PUBLIC_ env vars)
│   ├── claude.ts       # Typed wrappers for Edge Function invocations
│   ├── srs.ts          # Pure SM-2 functions (no side effects)
│   ├── scoring.ts      # Score calculation, XP, grade, difficulty calibration
│   └── attention.ts    # Mind-wander scheduler, WPM estimation
│
├── stores/             # Zustand stores — all ephemeral (no AsyncStorage yet)
│   ├── authStore.ts    # user, session, setSession, signOut
│   ├── readingStore.ts # active passage state, scroll progress, mind-wander events
│   ├── quizStore.ts    # questions cache, answers, current index
│   ├── progressStore.ts # streak snapshot, userLevel, recentAccuracy
│   └── settingsStore.ts # all user preferences
│
└── types/
    ├── app.ts          # Shared TypeScript types (Question, ConceptMap, Grade, etc.)
    └── declarations.d.ts # CSS module declaration for NativeWind global.css
```

---

## Routing & Auth Flow

Expo Router uses file-based routing. Groups `(auth)` and `(tabs)` are layout groups — the parentheses mean they don't appear in URLs.

```
App cold start
     │
     ▼
_layout.tsx
  • supabase.auth.getSession() on mount
  • onAuthStateChange subscription
  • Calls setSession(session)
     │
     ├── session exists ──▶ user navigates to /(tabs)/home
     │
     └── no session ──────▶ user lands at /(auth)/login
                              (auth)/_layout.tsx redirects
                              once session is set
```

Each layout guard is reactive: `(auth)/_layout.tsx` watches `useAuthStore` and redirects to tabs when `user` becomes non-null. `(tabs)/_layout.tsx` does the reverse.

---

## State Management

Five Zustand stores, each with a focused responsibility:

### `authStore`
```typescript
{ user, session, loading, setSession, signOut }
```
Set by the Supabase `onAuthStateChange` listener in `_layout.tsx`. Read by routing guards and any screen that needs `user.id`.

### `readingStore`
```typescript
{ sessionId, passageId, passageTitle, passageBody, wordCount, passageDifficulty,
  startedAt, readingEndedAt, mindWanderEvents, scrollProgress, wpm,
  startSession, endReading, addMindWanderEvent, setScrollProgress, setWpm, reset }
```
`startSession()` is called from HomeScreen immediately after the Supabase insert. `setScrollProgress()` derives WPM inline. `reset()` is called after Results screen navigates home.

### `quizStore`
```typescript
{ cache, currentIndex, answers, loading,
  setCache, setLoading, nextQuestion, submitAnswer, reset }
```
`cache` is the full `PassageAICache` (questions + concept_map). `answers` accumulates as the user answers each question. `finalizeSession()` in the quiz screen reads `answers` to calculate the total score.

### `progressStore`
```typescript
{ streak, userLevel, recentAccuracy,
  setStreak, addXp, setUserLevel, setRecentAccuracy }
```
Populated from Supabase on app load by `useStreak`. Used by the quiz screen for streak bonus calculation.

### `settingsStore`
```typescript
{ sessionLengthMinutes, mindWanderFrequency, difficultyMode, fixedDifficulty,
  fontSize, notificationsEnabled, reminderHour, ...setters }
```
Currently in-memory only (resets on app restart). Future: persist to `AsyncStorage` via Zustand middleware.

---

## Database Schema

All tables live in Supabase Postgres. Every user-data table has `user_id` as an RLS anchor.

### Row Level Security policy pattern
```sql
-- User-scoped tables
CREATE POLICY "Users manage own X" ON table_name
  FOR ALL USING (auth.uid() = user_id);

-- Public read, service-role write
CREATE POLICY "Authenticated users can read passages" ON passages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can write cache" ON passage_ai_cache
  FOR ALL USING (auth.role() = 'service_role');
```

### Table relationships
```
auth.users
    │
    ├── profiles (1:1)
    ├── user_streaks (1:1)
    ├── user_difficulty_profile (1:1)
    │
    ├── reading_sessions (1:N)
    │       │
    │       ├── quiz_attempts (1:N)
    │       └── session_scores (1:1)
    │
    └── srs_cards (N:M with passages)
            │
passages ───┘
    │
    └── passage_ai_cache (1:1)
```

### Key indexes
```sql
CREATE INDEX srs_due_idx ON srs_cards (user_id, due_date);
-- Enables efficient "what's due today for this user" queries
```

---

## AI Integration

### Why Edge Functions, not client-direct
1. `ANTHROPIC_API_KEY` never touches the device
2. Responses are cached per passage in `passage_ai_cache` — one Claude call serves all users
3. Rate limiting and cost controls can be applied centrally
4. Future: streaming responses, retries, prompt A/B testing

### Call flow
```
quiz/[sessionId].tsx
     │
     ▼
useQuizSession.ts
     │
     ├── Check passage_ai_cache ──HIT──▶ return cached questions
     │
     └── MISS ──▶ supabase.functions.invoke('generate-questions')
                        │
                        ▼
              Edge Function (Deno)
                        │
                        ├── Check cache again (double-check for races)
                        │
                        ├── Load passage from passages table
                        │
                        └── anthropic.messages.create({
                              model: 'claude-sonnet-4-6',
                              thinking: { type: 'adaptive' },
                              messages: [{ content: [
                                { type: 'text', text: passage_body,
                                  cache_control: { type: 'ephemeral' } },
                                { type: 'text', text: generation_prompt }
                              ]}]
                            })
                                 │
                                 ▼
                          Parse JSON response
                                 │
                                 ▼
                       INSERT passage_ai_cache
                                 │
                                 ▼
                         Return to client
```

### Prompt caching
The passage body uses `cache_control: { type: "ephemeral" }` on its content block. Anthropic caches this for 5 minutes. For popular passages read by many users in quick succession, this reduces Claude API cost significantly.

---

## Spaced Repetition Engine (`src/lib/srs.ts`)

Pure functions — no imports, no side effects. Can be unit tested in isolation.

```typescript
sm2Update(card: SM2Card, quality: 0–5): SM2Card
  // Returns updated card with new repetition, easiness, intervalDays, dueDate

pctToQuality(pctCorrect: number, wpm: number): number
  // Maps session performance to SM-2 quality score

defaultCard(): SM2Card
  // Returns a fresh card (due tomorrow, easiness 2.5)
```

The quiz screen calls these after `finalizeSession()`:
1. Load existing `srs_cards` row (or use `defaultCard()`)
2. Call `sm2Update(card, quality)`
3. `supabase.from('srs_cards').upsert(...)` with new values

---

## Scoring Pipeline (`src/lib/scoring.ts`)

```typescript
calculateScore(input: ScoreInput): SessionScoreResult
  // rawScore + speedBonus + streakBonus → xpEarned, grade, pctCorrect

calibrateDifficulty(currentLevel, sessionsAtLevel, recentAccuracy, latestAccuracy): number
  // Returns new difficulty level (1–10) or same if no adjustment needed
```

Called in quiz screen after all answers are submitted:
```
answers[] → sum scoreDelta → rawScore
rawScore + wpm + currentStreak → calculateScore()
SessionScoreResult → INSERT session_scores
xpEarned → UPDATE user_streaks.total_xp
sm2Update → UPSERT srs_cards
updateStreakAfterSession() → UPSERT user_streaks (current_streak, last_session_date)
```

---

## Attention System (`src/lib/attention.ts`)

### `scheduleMindWanderPings(frequency, onPing): cleanup`
Returns a cleanup function (to call in `useEffect` return). Fires `onPing` at random intervals within `[minInterval, minInterval × 2]`, max 3 times.

### Integration in `useReadingSession.ts`
```
startedAt set in readingStore
     │
     ▼
useEffect fires
     │
     ├── scheduleMindWanderPings → calls showPingRef.current()
     │
     └── setTimeout(onSessionLimit, limitMinutes × 60000)
```

`ReadingScreen` registers its ping callback via `registerPingCallback(cb)` — a ref-based approach that avoids re-subscribing on every render.

---

## Component Patterns

### SVG charts (react-native-svg)
All data visualizations (`ProgressRing`, `SkillRadar`, `ConceptGraph`, `HeatmapCalendar`) use `react-native-svg` directly — no third-party chart library. This keeps bundle size small and gives full control over animations and layout.

### Animation approach
- `Animated.spring` for entrance animations (ScoreBadge, FeedbackOverlay)
- `Animated.timing` for count-up animations (score, XP) with listener to drive display state
- `Animated.sequence` for compound animations (StreakFlame pulse)
- All animations use `useNativeDriver: true` where possible (transform, opacity)
- `expo-haptics` triggers alongside visual feedback

### NativeWind v4
All styling via `className` props. Custom theme tokens defined in `tailwind.config.js`:
- `brand-{50–900}`: indigo palette
- `accent-{orange,yellow,green,red}`: feedback colors

`nativewind-env.d.ts` provides TypeScript type augmentation for `className` on all RN primitives.

---

## Environment & Configuration

### `.env.local` (client, git-ignored)
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
`EXPO_PUBLIC_` prefix makes these available to the Expo bundler at build time. Never put `ANTHROPIC_API_KEY` here.

### Supabase secrets (server-side only)
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```
Accessed in Edge Functions via `Deno.env.get('ANTHROPIC_API_KEY')`.

### `app.json`
- `scheme: "getsmart"` — deep link scheme
- `userInterfaceStyle: "automatic"` — respects system dark/light mode
- Plugin declarations for `expo-router`, `expo-av`, `expo-notifications`

---

## Adding a New Screen

1. Create `src/app/path/screen.tsx` — Expo Router picks it up automatically
2. Add to the `Stack` in `src/app/_layout.tsx` if you need custom animation options
3. Use `router.push('/path/screen')` or `router.replace(...)` to navigate
4. If it needs auth, add a guard in the screen or its group layout

---

## Adding a New Passage

1. Insert into Supabase directly (dashboard or CLI):
```sql
INSERT INTO passages (title, body, word_count, subject, difficulty, topics)
VALUES ('Title', 'Body text...', 300, 'science', 5, ARRAY['tag1', 'tag2']);
```
2. `passage_ai_cache` will be generated automatically on first quiz attempt for that passage.

---

## Known Limitations (MVP)

- **Short-answer grading is binary:** currently `answer.toLowerCase() === correct_answer.toLowerCase()` — correct only for exact matches. Phase 2 adds Claude AI grading.
- **Settings are not persisted:** Zustand stores reset on app restart. Fix: add `AsyncStorage` persistence middleware.
- **No offline support:** requires network for all Supabase queries. Fix: cache last passage body in `AsyncStorage`.
- **Daily session count not tracked:** `HomeScreen` hardcodes `todaySessionCount = 0`. Fix: query `reading_sessions WHERE DATE(started_at) = today`.
- **`user_difficulty_profile` not yet wired:** `calibrateDifficulty` is implemented in `scoring.ts` but not called after sessions yet.
- **Streak freeze tokens not UI-accessible:** stored in DB but no button to apply them.
