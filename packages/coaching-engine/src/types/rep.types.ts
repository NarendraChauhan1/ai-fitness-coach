import { FeedbackPrompt } from './feedback.types';

/**
 * Peak metrics achieved during a rep
 */
export interface PeakMetrics {
  /** Peak value (e.g., lowest hip Y-coordinate or minimum elbow angle) */
  peakValue: number;

  /** Frame number where peak occurred */
  peakFrame: number;

  /** Whether peak met minimum threshold */
  thresholdMet: boolean;
}

/**
 * Individual repetition event with form assessment
 */
export interface RepEvent {
  /** Sequential rep number (1-indexed) */
  repNumber: number;

  /** Frame number when rep started */
  startFrame: number;

  /** Frame number when rep completed */
  endFrame: number;

  /** Duration in milliseconds */
  durationMs: number;

  /** Form quality score for this rep (0-100) */
  correctnessScore: number;

  /** Specific form errors detected */
  errorsDetected: string[];

  /** Feedback delivered during this rep */
  feedbackGiven: FeedbackPrompt[];

  /** Timestamp of completion (ISO 8601) */
  completedAt: string;

  /** Peak depth/extension achieved */
  peakMetrics: PeakMetrics;
}
