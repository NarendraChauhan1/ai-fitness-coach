/**
 * Supported exercise types
 */
export enum ExerciseType {
  MARCHING = 'marching',
  JUMPING_JACKS = 'jumping_jacks',
  PUSH_UPS = 'push_ups',
}

/**
 * Training discipline (affects form thresholds)
 */
export enum Discipline {
  FITNESS = 'fitness',
  YOGA = 'yoga',
  GENERAL = 'general',
}

/**
 * Types of form errors that can be detected
 */
export enum FormErrorType {
  KNEE_VALGUS = 'knee_valgus',
  BACK_ROUNDING = 'back_rounding',
  ELBOW_FLARING = 'elbow_flaring',
  SHALLOW_DEPTH = 'shallow_depth',
  ASYMMETRIC_MOVEMENT = 'asymmetric_movement',
  NECK_MISALIGNMENT = 'neck_misalignment',
}

/**
 * Severity level for feedback
 */
export enum Severity {
  INFO = 'info',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}
