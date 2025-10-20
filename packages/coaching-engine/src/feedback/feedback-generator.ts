import { ExerciseType, FeedbackPrompt, FeedbackType, Modality, TTSStatus, Severity } from '../types';
import { getPrompt } from './prompts';

/**
 * Form validation result (imported from pose-analysis-3d)
 */
interface FormValidationResult {
  score: number;
  errors: FormError[];
  isAcceptable: boolean;
  measurements: unknown;
}

interface FormError {
  type: string;
  severity: string;
  description: string;
  measuredValue: number;
  threshold: number;
  correction: string;
}

/**
 * Session context for deduplication
 */
export interface SessionContext {
  /** Recent feedback history (last 10 seconds) */
  recentFeedback: FeedbackPrompt[];

  /** Current session duration in seconds */
  durationSeconds: number;

  /** Current rep number */
  repCount: number;
}

/**
 * Feedback generator for form corrections
 */
export class FeedbackGenerator {
  private readonly DEDUP_WINDOW_MS = 5000; // 5 seconds

  constructor(_exercise: ExerciseType) {}

  /**
   * Generate feedback based on form validation result
   */
  generateFeedback(
    formResult: FormValidationResult,
    sessionContext: SessionContext
  ): FeedbackPrompt[] {
    if (formResult.errors.length === 0) {
      return [];
    }

    const feedbackList: FeedbackPrompt[] = [];
    const now = new Date().toISOString();
    const nowMs = Date.now();

    // Filter out recent duplicates
    const recentMessages = new Set(
      sessionContext.recentFeedback
        .filter(
          (f) =>
            nowMs - new Date(f.triggeredAt).getTime() < this.DEDUP_WINDOW_MS
        )
        .map((f) => f.message)
    );

    // Take highest severity error that hasn't been reported recently
    for (const error of formResult.errors) {
      const message = this.getMessageForError(error.type);

      // Skip if recently reported (unless critical)
      if (recentMessages.has(message) && error.severity !== 'critical') {
        continue;
      }

      const feedback: FeedbackPrompt = {
        id: `feedback-${Date.now()}-${Math.random()}`,
        message,
        type: FeedbackType.CORRECTIVE,
        severity: this.mapSeverity(error.severity),
        modality: [Modality.VOICE, Modality.VISUAL],
        triggeredAt: now,
        triggerCondition: {
          rule: error.type,
          measuredValue: error.measuredValue,
          threshold: error.threshold,
        },
        ttsStatus: TTSStatus.QUEUED,
        repNumber: sessionContext.repCount,
      };

      feedbackList.push(feedback);

      // Only return top priority feedback to avoid overwhelming user
      if (feedbackList.length >= 1) {
        break;
      }
    }

    return feedbackList;
  }

  /**
   * Map error type to feedback message
   */
  private getMessageForError(errorType: string): string {
    const errorKeyMap: Record<string, string> = {
      knee_valgus: 'knee_valgus',
      back_rounding: 'back_rounding',
      elbow_flaring: 'elbow_flaring',
      shallow_depth: 'shallow_depth',
      asymmetric_movement: 'asymmetric_left',
      neck_misalignment: 'neck_forward',
    };

    const key = errorKeyMap[errorType] || 'check_form';
    return getPrompt('corrective', key);
  }

  private mapSeverity(severity: string): Severity {
    switch (severity) {
      case 'critical':
        return Severity.CRITICAL;
      case 'high':
        return Severity.HIGH;
      case 'normal':
        return Severity.NORMAL;
      case 'info':
      default:
        return Severity.INFO;
    }
  }
}
