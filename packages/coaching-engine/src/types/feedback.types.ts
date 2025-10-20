/**
 * Feedback category
 */
export enum FeedbackType {
  CORRECTIVE = 'corrective',
  MOTIVATIONAL = 'motivational',
  INSTRUCTIONAL = 'instructional',
  WARNING = 'warning',
  CONFIRMATION = 'confirmation',
}

/**
 * Severity level for feedback prioritization
 */
export enum Severity {
  INFO = 'info',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Feedback delivery method
 */
export enum Modality {
  VOICE = 'voice',
  VISUAL = 'visual',
  HAPTIC = 'haptic',
}

/**
 * Text-to-speech status
 */
export enum TTSStatus {
  QUEUED = 'queued',
  SPEAKING = 'speaking',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  FAILED = 'failed',
}

/**
 * Condition that triggered feedback
 */
export interface TriggerCondition {
  /** Rule identifier (e.g., "knee_valgus_threshold_exceeded") */
  rule: string;

  /** Measured value that triggered the rule */
  measuredValue: number;

  /** Threshold that was crossed */
  threshold: number;
}

/**
 * Feedback prompt to be delivered to user
 */
export interface FeedbackPrompt {
  /** Unique feedback ID */
  id: string;

  /** Predefined text message */
  message: string;

  /** Feedback category */
  type: FeedbackType;

  /** How urgent/important the feedback is */
  severity: Severity;

  /** Delivery method(s) used */
  modality: Modality[];

  /** When feedback was triggered (ISO 8601) */
  triggeredAt: string;

  /** Condition that triggered the feedback */
  triggerCondition: TriggerCondition;

  /** TTS delivery status */
  ttsStatus: TTSStatus;

  /** Associated rep (if corrective feedback) */
  repNumber?: number;
}
