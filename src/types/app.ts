export type QuestionType = 'multiple_choice' | 'short_answer' | 'inference' | 'free_recall';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
  concept_tags: string[];
  difficulty: number;
  passage_evidence: string;
}

export interface ConceptNode {
  id: string;
  label: string;
  type: 'main_idea' | 'detail' | 'concept';
}

export interface ConceptEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface ConceptMap {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface PassageAICache {
  free_recall_prompt: string;
  questions: Question[];
  concept_map: ConceptMap;
  topics: string[];
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export type MindWanderResponse = 'focused' | 'somewhat' | 'wandered' | 'timeout';

export interface MindWanderEvent {
  timestamp: number;
  response: MindWanderResponse;
}

export interface SessionScoreResult {
  rawScore: number;
  maxScore: number;
  pctCorrect: number;
  speedBonus: number;
  streakBonus: number;
  xpEarned: number;
  grade: Grade;
}

export interface SM2Card {
  repetition: number;
  easiness: number;
  intervalDays: number;
  dueDate: string;
}

export type AttentionFrequency = 'off' | 'low' | 'medium' | 'high';
export type SessionLengthMinutes = 5 | 10 | 20 | 0;
export type DifficultyMode = 'auto' | 'fixed';
