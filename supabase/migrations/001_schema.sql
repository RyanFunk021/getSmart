-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  avatar_url   text,
  timezone     text DEFAULT 'UTC',
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- ─── Passages ────────────────────────────────────────────────────────────────
CREATE TABLE passages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  body         text NOT NULL,
  word_count   int NOT NULL DEFAULT 0,
  subject      text NOT NULL,
  difficulty   int NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
  topics       text[] DEFAULT '{}',
  source_url   text,
  is_curated   boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE passages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read passages" ON passages
  FOR SELECT USING (auth.role() = 'authenticated');

-- ─── Passage AI Cache ─────────────────────────────────────────────────────────
CREATE TABLE passage_ai_cache (
  passage_id    uuid PRIMARY KEY REFERENCES passages ON DELETE CASCADE,
  questions     jsonb NOT NULL,
  concept_map   jsonb NOT NULL,
  cache_version int DEFAULT 1,
  generated_at  timestamptz DEFAULT now()
);

ALTER TABLE passage_ai_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read cache" ON passage_ai_cache
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service role can write cache" ON passage_ai_cache
  FOR ALL USING (auth.role() = 'service_role');

-- ─── Reading Sessions ─────────────────────────────────────────────────────────
CREATE TABLE reading_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  passage_id         uuid NOT NULL REFERENCES passages,
  started_at         timestamptz DEFAULT now(),
  reading_ended_at   timestamptz,
  completed_at       timestamptz,
  reading_duration_ms int,
  wpm                int,
  mind_wander_count  int DEFAULT 0,
  mind_wander_events jsonb DEFAULT '[]',
  flow_score         float,
  difficulty_at_start int,
  is_review          boolean DEFAULT false
);

ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON reading_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ─── Quiz Attempts ────────────────────────────────────────────────────────────
CREATE TABLE quiz_attempts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid NOT NULL REFERENCES reading_sessions ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  question_index    int NOT NULL,
  question_snapshot jsonb NOT NULL,
  user_answer       text,
  is_correct        boolean,
  score_delta       int DEFAULT 0,
  time_to_answer_ms int,
  feedback_seen     boolean DEFAULT false,
  attempted_at      timestamptz DEFAULT now()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own attempts" ON quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

-- ─── Session Scores ───────────────────────────────────────────────────────────
CREATE TABLE session_scores (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid UNIQUE NOT NULL REFERENCES reading_sessions ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  raw_score    int NOT NULL DEFAULT 0,
  max_score    int NOT NULL DEFAULT 0,
  pct_correct  float DEFAULT 0,
  speed_bonus  int DEFAULT 0,
  streak_bonus int DEFAULT 0,
  xp_earned   int DEFAULT 0,
  grade        text DEFAULT 'D',
  scored_at    timestamptz DEFAULT now()
);

ALTER TABLE session_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scores" ON session_scores
  FOR ALL USING (auth.uid() = user_id);

-- ─── User Streaks ─────────────────────────────────────────────────────────────
CREATE TABLE user_streaks (
  user_id                uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  current_streak         int DEFAULT 0,
  longest_streak         int DEFAULT 0,
  last_session_date      date,
  total_sessions         int DEFAULT 0,
  total_xp               int DEFAULT 0,
  freeze_tokens_available int DEFAULT 1,
  updated_at             timestamptz DEFAULT now()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own streak" ON user_streaks
  FOR ALL USING (auth.uid() = user_id);

-- ─── SRS Cards ───────────────────────────────────────────────────────────────
CREATE TABLE srs_cards (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  passage_id     uuid NOT NULL REFERENCES passages ON DELETE CASCADE,
  repetition     int DEFAULT 0,
  easiness       float DEFAULT 2.5,
  interval_days  int DEFAULT 1,
  due_date       date DEFAULT CURRENT_DATE + INTERVAL '1 day',
  last_reviewed  date,
  concept_scores jsonb DEFAULT '{}',
  UNIQUE (user_id, passage_id)
);

ALTER TABLE srs_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own SRS cards" ON srs_cards
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX srs_due_idx ON srs_cards (user_id, due_date);

-- ─── User Difficulty Profile ──────────────────────────────────────────────────
CREATE TABLE user_difficulty_profile (
  user_id           uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  current_level     int DEFAULT 3 CHECK (current_level BETWEEN 1 AND 10),
  recent_accuracy   float DEFAULT 0.7,
  recent_speed_wpm  int DEFAULT 200,
  sessions_at_level int DEFAULT 0,
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE user_difficulty_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own difficulty profile" ON user_difficulty_profile
  FOR ALL USING (auth.uid() = user_id);
