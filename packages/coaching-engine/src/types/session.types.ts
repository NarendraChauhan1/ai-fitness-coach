import { FeedbackPrompt } from './feedback.types';
import { RepEvent } from './rep.types';

/**
 * Exercise type
 */
export enum ExerciseType {
  MARCHING = 'marching',
  JUMPING_JACKS = 'jumping_jacks',
  PUSH_UPS = 'push_ups',
}

/**
 * Training discipline
 */
export enum Discipline {
  FITNESS = 'fitness',
  YOGA = 'yoga',
  GENERAL = 'general',
}

/**
 * Session status
 */
export enum SessionStatus {
  PREPARING = 'preparing',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

/**
 * Active workout session (transient, not persisted)
 */
export interface ExerciseSession {
  /** Unique session ID (UUID v4) */
  id: string;

  /** Session start time (ISO 8601) */
  startedAt: string;

  /** Selected exercise type */
  exercise: ExerciseType;

  /** Training discipline */
  discipline: Discipline;

  /** Live rep counter */
  repCount: number;

  /** Target reps */
  targetReps: number;

  /** Duration in seconds */
  durationSeconds: number;

  /** Form quality score (0-100, rolling average) */
  formScore: number;

  /** All feedback delivered this session */
  feedbackHistory: FeedbackPrompt[];

  /** All completed reps this session */
  repHistory: RepEvent[];

  /** Current state */
  status: SessionStatus;

  /** Error counters by type */
  errorCounts: Record<string, number>;
}
