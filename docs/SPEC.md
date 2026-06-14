# Get Smart — Product & Feature Specification

## Vision

Train the human brain to read with genuine comprehension. Use neuroscience-validated learning techniques — active recall, spaced repetition, flow calibration, mind-wandering detection — packaged as a daily habit-forming mobile app. The content should always be precisely supported in well-accepted scientific truths. The experience should feel rewarding, not tedious.

Personal goal: train Ryan's own brain, then open it to anyone who wants to think more clearly.

---

## The Science Behind It

Every feature in Get Smart maps to a validated finding in cognitive neuroscience or learning science.

| Feature | Scientific Basis |
|---|---|
| Active recall quizzes | Testing effect (Roediger & Karpicke, 2006) — retrieval practice beats re-reading by ~50% |
| Spaced repetition | Ebbinghaus forgetting curve (1885) — review at optimal intervals prevents decay |
| Immediate feedback | Dopamine prediction error signal (Schultz, 1997) — reward must be immediate and specific |
| Mind-wander pings | Self-report attention probes improve retention (Smallwood & Schooler, 2006) |
| Flow calibration | Csikszentmihalyi's flow channel — 70–80% accuracy is the optimal difficulty target |
| Variable reward (streak freeze, milestones) | Variable reward schedules amplify dopamine prediction error |
| Session length limits | Attention span research — 20–45 min blocks optimize sustained focus |
| Free recall before questions | Testing before exposure (pre-testing effect) activates schema and primes encoding |

---

## Core Loop

```
TODAY'S SESSION
     │
     ▼
[Home] ──── SRS due? ──YES──▶ [Review passage]
              │                      │
              NO                     │
              │                      │
              ▼                      │
         [New passage]               │
         matched to                  │
         user's level                │
              │◄─────────────────────┘
              │
              ▼
         [Reading screen]
         • Full-screen immersive text
         • Timer running
         • Mind-wander pings (random)
         • Scroll progress tracked
              │
     "I've finished reading"
              │
              ▼
         [Quiz screen]
         Q0: Free recall (write everything you remember)
         Q1: Main idea (multiple choice)
         Q2: Key detail (multiple choice)
         Q3: Inference (multiple choice)
         Q4: Vocabulary in context (multiple choice)
         Q5: Critical evaluation (multiple choice)
              │
     After each question:
     • Immediate feedback overlay
     • Correct answer shown if wrong
     • Explanation + passage evidence
              │
              ▼
         [Results screen]
         • Score count-up animation
         • Grade badge (S/A/B/C/D)
         • XP earned + speed/streak bonuses
         • Concept map visualization
         • Mind-wander advisory (if high)
         • "Resurfaces in N days" message
              │
              ▼
         [SM-2 updates]
         • SRS card created/updated
         • Difficulty profile recalibrated
         • Streak updated
         • XP added to total
```

---

## Screens

### Home (`/(tabs)/home`)
- **Streak flame + XP bar** — top of screen, always visible
- **Daily goal ring** — progress toward 3 sessions/day target
- **Review queue chip** — "N passages due for review" (orange, SRS-triggered)
- **Next Session card** — passage title, subject, difficulty level, estimated read time, topic chips
- **Start Reading button** — launches a session; creates `reading_sessions` row in Supabase
- **Recent sessions** (future) — last 3 sessions with grades

**Logic:**
1. Check `srs_cards` for `due_date <= today` — surface oldest due first
2. If no cards due, query `passages` at `difficulty = user_difficulty_profile.current_level` not yet read by this user
3. Fallback: any unread passage

---

### Reading (`/reading/[sessionId]`)
- **Full-screen modal** (slides up from bottom)
- **Header:** passage title + close (×) button
- **Reading timer:** progress bar (if limit set) + elapsed time display
- **Passage text:** large, comfortable typography; configurable font size (S/M/L)
- **Scroll tracking:** scroll position vs content height → estimated words read → WPM
- **Mind-wander prompt** (semi-transparent overlay, not full modal):
  - Fires at random intervals based on frequency setting
  - Three responses: "Fully focused" / "Somewhat" / "Mind wandered"
  - Auto-dismisses in 4 seconds (counts as "somewhat")
  - Max 3 pings per session
- **Session limit alert** (when timer hits limit):
  - Bottom sheet: "Keep reading" or "Stop here"
  - Stopping mid-passage: session abandoned, no score, passage stays in queue
- **"I've finished reading" button** — disabled until user has scrolled past 70% of passage

**On completion:** updates `reading_sessions` (duration, WPM, mind_wander_count), navigates to quiz.

---

### Quiz (`/quiz/[sessionId]`)
- Loads questions from `passage_ai_cache` (or triggers Claude generation if cold cache)
- **Loading state:** "Generating your questions…" with spinner
- **Progress bar:** question N of 6 (including free recall as Q0)

**Question 0 — Free Recall** (`FreeRecallInput`)
- Multiline text input
- Prompt: AI-generated open-ended question ("Write down everything you remember about this passage")
- Submit enabled after 10+ characters
- Not graded for score; always scored as 10 pts (completion credit)
- Research basis: generating output before feedback activates retrieval pathways

**Questions 1–5** (`QuestionCard`)
- Progress indicator, question type label
- Multiple choice: 4 options, single tap to select
- Short answer / inference: multiline text input (future: AI-graded)
- No back navigation — prevents gaming

**After each answer** (`FeedbackOverlay`, slides up from bottom):
- ✅ Correct / ❌ Incorrect
- Correct answer displayed (if wrong)
- 2–3 sentence explanation from Claude
- Passage evidence (verbatim quote)
- "Continue" button to advance

**On final question:** triggers `finalizeSession()` which:
1. Calculates score via `scoring.ts`
2. Inserts `session_scores` row
3. Updates `reading_sessions.completed_at`
4. Runs SM-2 update on `srs_cards`
5. Updates `user_streaks`
6. Navigates to results

---

### Results (`/results/[sessionId]`)
- **Score count-up animation** (1.2 seconds, easing)
- **Grade badge** (spring animation from scale 0 → 1): S / A / B / C / D
- **Stats row:** XP earned, accuracy %, speed bonus (if any), streak bonus (if any)
- **Mind-wander advisory** (yellow card, if high wander rate): "Consider shorter sessions or a quieter environment"
- **Concept map** (SVG): nodes for key ideas, edges for relationships; colors reflect node type
- **SRS message:** "This passage resurfaces in N days"
- **"Back to Home" button** — resets reading and quiz stores

---

### Progress (`/(tabs)/progress`)
- **Stats row:** current streak, total XP, total sessions, current level
- **SRS queue health chip** (orange, if cards due): "N passages due for review today"
- **Activity heatmap** (GitHub-style, 90 days): XP intensity per day
- **Skill radar chart** (5 dimensions): Main Idea, Detail, Inference, Vocabulary, Critical — derived from per-concept quiz attempt accuracy
- **Personal best streak**

---

### Settings (`/(tabs)/settings`)
- **Session length:** 5 / 10 / 20 / ∞ minutes
- **Mind-wander pings:** Off / Low (3 min) / Medium (1.5 min) / High (45s)
- **Difficulty mode:** Auto-calibrate / Fixed (slider 1–10)
- **Font size:** S / M / L
- **Daily reminder:** toggle + time picker (future)
- **Version + attribution**
- **Sign Out** (destructive)

---

## AI Question Generation

### Trigger
When `quiz/[sessionId].tsx` loads and `passage_ai_cache` has no entry for `passage_id`.

### Edge Function: `generate-questions`
- Deno runtime, deployed to Supabase Edge Functions
- Calls `claude-sonnet-4-6` with `thinking: { type: "adaptive" }`
- Uses `cache_control: { type: "ephemeral" }` on passage body to reduce cost across users
- Result stored in `passage_ai_cache` — **write-once, permanent** (passages are static in MVP)

### Question schema (per question)
```typescript
{
  id: string              // "q1"–"q5"
  type: "multiple_choice" | "short_answer" | "inference" | "free_recall"
  question: string
  options?: string[]      // 4 options for multiple_choice
  correct_answer: string
  explanation: string     // 2–3 sentences, references passage evidence
  concept_tags: string[]  // drives SkillRadar dimensions
  difficulty: number      // 1–10
  passage_evidence: string // verbatim quote from passage
}
```

### Concept map schema
```typescript
{
  nodes: Array<{ id, label, type: "main_idea" | "concept" | "detail" }>
  edges: Array<{ from, to, relationship }>
}
```

### Question structure (5 questions, always in this order)
1. **Main idea / thesis** (multiple choice) — what is this passage fundamentally about?
2. **Key supporting detail** (multiple choice) — evidence for the main argument
3. **Inference** (multiple choice) — what can we conclude from the evidence?
4. **Vocabulary in context** (multiple choice) — definition of a specific term as used
5. **Critical evaluation** (inference/multiple choice) — limitations, implications, or application

---

## Scoring System

### Per-question points
- Multiple choice correct: **20 pts**
- Free recall (Q0): **10 pts** (completion credit, not graded for correctness)
- Max score per session: **(5 × 20) + 10 = 110 pts**

### Bonuses
| Bonus | Condition | Points |
|---|---|---|
| Speed (high) | WPM ≥ 250 AND accuracy ≥ 80% | +20 |
| Speed (med) | WPM ≥ 200 AND accuracy ≥ 70% | +10 |
| Streak | +5 per day of streak | up to +30 (6-day cap) |

### Grade thresholds
(applied to: raw + bonuses / max + bonuses)

| Grade | Threshold |
|---|---|
| S | ≥ 95% |
| A | ≥ 80% |
| B | ≥ 65% |
| C | ≥ 50% |
| D | < 50% |

### XP formula
```
xpEarned = floor((rawScore + bonuses) × difficultyMultiplier)
difficultyMultiplier = 1 + (passageDifficulty - 5) × 0.1
```
A difficulty-10 passage awards 1.5× XP vs difficulty-5.

---

## Spaced Repetition (SM-2)

### Quality mapping (pct_correct → SM-2 quality 0–5)
| pct_correct | condition | quality |
|---|---|---|
| ≥ 0.9 | AND wpm ≥ 200 | 5 |
| ≥ 0.8 | | 4 |
| ≥ 0.65 | | 3 |
| ≥ 0.5 | | 2 |
| ≥ 0.3 | | 1 |
| < 0.3 | | 0 |

### Interval schedule
- quality ≥ 3 (correct): rep=0 → 1 day; rep=1 → 6 days; rep≥2 → prev × easiness
- quality < 3 (incorrect): reset to 1 day, repetition = 0
- easiness = max(1.3, EF + 0.1 − (5−q) × (0.08 + (5−q) × 0.02))

### Daily queue logic
1. Check `srs_cards WHERE due_date <= today ORDER BY due_date LIMIT 5`
2. If empty, serve new passage at `difficulty = user_difficulty_profile.current_level`
3. New passage must not appear in user's `reading_sessions`

---

## Attention Mechanics

### Mind-wander pings
- Scheduler fires at random interval: `[minInterval, minInterval × 2]`
- **Low:** min 3 min | **Medium:** min 90s | **High:** min 45s
- Max 3 pings per session (avoids annoyance)
- Semi-transparent overlay — passage remains visible
- Auto-dismisses after 4 seconds → recorded as "somewhat"
- High wander rate (> half of pings = "wandered") → advisory on Results screen

### Session length limits
- User-configurable: 5 / 10 / 20 / ∞ minutes
- On limit: bottom sheet with "Keep reading" / "Stop here"
- Stopping mid-passage = abandoned session (no score, passage stays in queue)

### Reading speed tracking
- `onScroll` event sampled every 500ms
- `scrollProgress = scrollOffset / (contentHeight − layoutHeight)`
- `wordsRead = wordCount × scrollProgress`
- `wpm = (wordsRead / elapsedMs) × 60000`
- Used for: speed bonus, flow calibration, session diagnostics

### Flow calibration
After every 3 sessions at current difficulty level:
- If `latestAccuracy > 0.85 AND recentAccuracy > 0.82`: level up
- If `latestAccuracy < 0.55 AND recentAccuracy < 0.60`: level down
- Target: 70–80% accuracy (challenging but rewarding)

---

## Streak System

### Rules
- Streak increments if user completes ≥ 1 session today
- Grace period: 25 hours (handles timezone edge cases, travel)
- **Freeze tokens:** 1 per week — prevents loss during illness/travel (future: UI to apply)
- **Milestone badges** (future): 3 / 7 / 14 / 30 / 100 days

### Storage
`user_streaks` table:
- `current_streak`, `longest_streak`, `last_session_date`, `total_sessions`, `total_xp`, `freeze_tokens_available`

---

## Content

### Seed passages (10, in `002_seed_passages.sql`)
| Title | Subject | Difficulty |
|---|---|---|
| The Forgetting Curve | Psychology | 4 |
| How Dopamine Actually Works | Neuroscience | 6 |
| The Science of Flow | Psychology | 5 |
| Active Recall vs. Re-reading | Psychology | 5 |
| Why Sleep Consolidates Memory | Neuroscience | 6 |
| The Attention Economy | Psychology | 7 |
| The Structure of Scientific Revolutions | Science | 8 |
| How Habits Form in the Brain | Neuroscience | 6 |
| The Ocean and Climate Regulation | Science | 7 |
| The Philosophy of Mind | Philosophy | 9 |

### Content standards
- All claims must be supported by well-accepted scientific evidence
- Passages 250–800 words
- Written to explain, not persuade
- No political content, no health claims without citation
- Difficulty calibrated to vocabulary and conceptual density (1 = accessible, 10 = graduate-level)

---

## Future Phases

### Phase 2 — AI grading of short answers
- Short-answer and inference questions allow free-text responses
- Claude grades open-ended answers 0–20 pts based on key concept coverage
- New Edge Function: `grade-answer`

### Phase 3 — User-submitted passages
- Users paste any text (article, chapter, essay)
- System extracts word count, estimates difficulty, generates questions
- `is_curated = false` flag on passages table

### Phase 4 — Social + sharing
- Compare streaks with friends
- Share Results screen as image
- Leaderboard (opt-in)

### Phase 5 — App Store release
- TestFlight → public beta
- App Store Connect submission
- In-app purchase: Premium (unlimited sessions/day, advanced analytics)

### Phase 6 — Content expansion
- Daily curated passage (editorial team or AI-assisted)
- Subject packs (science, history, philosophy, literature)
- Audio narration option
