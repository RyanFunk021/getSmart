# Get Smart

A neuroscience-backed reading comprehension and brain training app for iOS and Android.

The core idea: reading for comprehension is a trainable skill. Get Smart applies the best-validated techniques from cognitive science — active recall, spaced repetition, flow calibration, and dopamine reward loops — into a habit-forming mobile experience.

**The loop:**
> Read a curated passage → Free recall → 5 AI-generated comprehension questions → Immediate feedback → Score + XP + grade → Spaced repetition scheduling

---

## What makes it different

Most "brain training" apps either gamify trivial exercises that don't transfer to real-world thinking, or offer passive reading with no comprehension check. Get Smart combines:

- **Active recall over re-reading** — testing yourself beats rereading by ~50% retention (Roediger & Karpicke, 2006)
- **Spaced repetition** — passages resurface at the precise moment you're about to forget them (SM-2 algorithm)
- **AI-generated questions** — Claude reads each passage and generates 5 questions tuned to its difficulty: main idea, key detail, inference, vocabulary, critical evaluation
- **Attention training** — random mind-wandering pings during reading train metacognitive awareness
- **Flow calibration** — difficulty auto-adjusts to keep accuracy in the 70–80% range (challenging but rewarding)
- **Dopamine loop** — immediate feedback, XP, streaks, grade badges (S/A/B/C/D), haptics, sound

---

## Tech stack

| Layer | Choice |
|---|---|
| Mobile | React Native (Expo SDK 56) |
| Routing | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind for RN) |
| State | Zustand |
| Backend | Supabase (Postgres + Auth + RLS) |
| AI | Claude API (`claude-sonnet-4-6`) via Supabase Edge Functions |
| Charts | react-native-svg (hand-rolled radar, heatmap, concept graph) |

---

## Project structure

```
getSmart/
├── src/
│   ├── app/                        # Expo Router screens
│   │   ├── (auth)/                 # Login, Signup
│   │   ├── (tabs)/                 # Home, Progress, Settings
│   │   ├── reading/[sessionId].tsx # Immersive reader
│   │   ├── quiz/[sessionId].tsx    # Question flow
│   │   └── results/[sessionId].tsx # Score reveal
│   ├── components/
│   │   ├── ui/                     # Button, Card, ProgressRing, StreakFlame, ScoreBadge
│   │   ├── reading/                # PassageText, ReadingTimer, MindWanderPrompt
│   │   ├── quiz/                   # FreeRecallInput, QuestionCard, FeedbackOverlay
│   │   └── progress/               # HeatmapCalendar, SkillRadar, ConceptGraph
│   ├── stores/                     # Zustand: auth, reading, quiz, progress, settings
│   ├── hooks/                      # useReadingSession, useQuizSession, useSRS, useStreak
│   ├── lib/                        # supabase, claude, srs, scoring, attention
│   └── types/                      # app.ts (shared types)
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql          # All tables + RLS policies
│   │   └── 002_seed_passages.sql   # 10 curated passages
│   └── functions/
│       └── generate-questions/     # Claude Edge Function
└── docs/
    ├── SPEC.md                     # Product + feature specification
    ├── ARCHITECTURE.md             # Technical architecture deep-dive
    └── RESTORE_POINTS.md           # Stable checkpoints for recovery
```

---

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo`
- Supabase account (free tier is fine)
- Supabase CLI: `brew install supabase/tap/supabase`
- Anthropic API key

### 1. Clone and install

```bash
git clone https://github.com/RyanFunk021/getSmart.git
cd getSmart
npm install
```

### 2. Create Supabase project

Go to [supabase.com](https://supabase.com) → New project. Copy the **Project URL** and **anon key** from Settings → API.

### 3. Run migrations

In the Supabase dashboard → SQL Editor, run both files in order:
- `supabase/migrations/001_schema.sql`
- `supabase/migrations/002_seed_passages.sql`

Or with the CLI:
```bash
supabase link --project-ref your-project-ref
supabase db push
```

### 4. Configure environment

Create `.env.local` in the project root:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Deploy the Claude Edge Function

```bash
supabase functions deploy generate-questions
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### 6. Run

```bash
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

Or scan the QR code in Expo Go with `npm start`.

---

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env.local` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Supabase anonymous key |
| `ANTHROPIC_API_KEY` | Supabase secret | Claude API key (server-side only) |

---

## Key decisions

**Why Claude calls live in Edge Functions, not the client:** The API key never touches the device, and question generation is cached per passage — one Claude call serves all users who read the same passage.

**Why SM-2, not FSRS:** SM-2 is simpler to implement correctly and sufficient for text comprehension. FSRS requires more data per card to perform optimally. The schema supports upgrading without breaking changes.

**Why Zustand, not Redux:** Minimal boilerplate, excellent TypeScript inference, five clean isolated stores. No selectors, no reducers.

---

## Roadmap

See [docs/SPEC.md](docs/SPEC.md) for the full feature specification and phase breakdown.

- [ ] Phase 2: Short-answer AI grading (Claude scores open-ended responses)
- [ ] Phase 3: User-submitted passages
- [ ] Phase 4: Social features — compare streaks, share results
- [ ] Phase 5: App Store release

---

## License

MIT
