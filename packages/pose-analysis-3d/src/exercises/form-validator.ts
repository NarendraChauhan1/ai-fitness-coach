import { PoseFrame, ExerciseType, Discipline, FormErrorType, Severity } from '../types';
import { calculateAngle } from '../geometry';

/**
 * Form validation result
 */
export interface FormValidationResult {
  /** Overall form quality (0-100) */
  score: number;

  /** Detected errors ordered by severity */
  errors: FormError[];

  /** Whether form is acceptable (score ≥ 70) */
  isAcceptable: boolean;

  /** Calculated angles/distances used in validation */
  measurements: FormMeasurements;
}

/**
 * Individual form error
 */
export interface FormError {
  /** Error type identifier */
  type: FormErrorType;

  /** Severity level */
  severity: Severity;

  /** Human-readable explanation */
  description: string;

  /** Measured value that triggered error */
  measuredValue: number;

  /** Expected threshold */
  threshold: number;

  /** Suggested correction */
  correction: string;
}

/**
 * Measurements used for form analysis
 */
export interface FormMeasurements {
  /** Knee angles (degrees, 0-180) */
  kneeAngle?: { left: number; right: number };

  /** Elbow angles (degrees, 0-180) */
  elbowAngle?: { left: number; right: number };

  /** Hip depth (normalized, 0-1) */
  hipDepth?: number;

  /** Shoulder alignment (degrees from horizontal) */
  shoulderTilt?: number;

  /** Back curvature (degrees deviation from straight) */
  spineAngle?: number;
}

/**
 * Form thresholds for validation
 */
export interface FormThresholds {
  /** Minimum knee angle for full rep */
  minKneeAngle: number;

  /** Maximum knee valgus angle */
  maxKneeValgus: number;

  /** Maximum back curvature */
  maxSpineCurvature: number;

  /** Minimum elbow bend for push-up */
  minElbowBend: number;

  /** Maximum asymmetry between left/right (degrees) */
  maxAsymmetry: number;
}

/**
 * Base form validator class
 */
export class FormValidator {
  protected thresholds: FormThresholds;

  constructor(protected exercise: ExerciseType, protected discipline: Discipline) {
    this.thresholds = this.getDefaultThresholds();
  }

  /**
   * Get default thresholds based on discipline
   */
  protected getDefaultThresholds(): FormThresholds {
    const baseThresholds: FormThresholds = {
      minKneeAngle: 90,
      maxKneeValgus: 10,
      maxSpineCurvature: 15,
      minElbowBend: 90,
      maxAsymmetry: 15,
    };

    // Adjust based on discipline
    switch (this.discipline) {
      case Discipline.YOGA:
        return {
          ...baseThresholds,
          minKneeAngle: 80,
          maxSpineCurvature: 20,
          maxAsymmetry: 20,
        };
      case Discipline.GENERAL:
        return {
          ...baseThresholds,
          minKneeAngle: 85,
          maxSpineCurvature: 18,
        };
      case Discipline.FITNESS:
      default:
        return baseThresholds;
    }
  }

  /**
   * Validate form for current frame
   */
  validateForm(
    frame: PoseFrame,
    previousFrames?: PoseFrame[]
  ): FormValidationResult {
    const errors: FormError[] = [];
    const measurements: FormMeasurements = {};

    // Override in subclasses for exercise-specific validation
    const score = this.calculateFormScore(errors);

    return {
      score,
      errors: errors.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, normal: 2, info: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      isAcceptable: score >= 70,
      measurements,
    };
  }

  /**
   * Update thresholds
   */
  setThresholds(thresholds: Partial<FormThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): FormThresholds {
    return { ...this.thresholds };
  }

  /**
   * Calculate form score based on errors
   */
  protected calculateFormScore(errors: FormError[]): number {
    if (errors.length === 0) {
      return 100;
    }

    let deductions = 0;
    for (const error of errors) {
      switch (error.severity) {
        case Severity.CRITICAL:
          deductions += 30;
          break;
        case Severity.HIGH:
          deductions += 20;
          break;
        case Severity.NORMAL:
          deductions += 10;
          break;
        case Severity.INFO:
          deductions += 5;
          break;
      }
    }

    return Math.max(0, 100 - deductions);
  }
}
