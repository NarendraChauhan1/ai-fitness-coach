/**
 * Jumping Jacks Exercise Validator
 * Validates jumping jacks form by checking arm extension and leg spread
 */

import {
  PoseFrame,
  ExerciseType,
  Discipline,
  FormErrorType,
  Severity,
  LandmarkID,
} from '../types';
import { calculateAngle, calculateDistance3D } from '../geometry';
import { FormValidationResult, FormError, FormMeasurements } from './form-validator';

/**
 * Jumping jacks-specific thresholds
 */
interface JumpingJacksThresholds {
  /** Minimum arm elevation angle (degrees) */
  minArmElevation: number;
  /** Minimum leg spread (as percentage of hip width) */
  minLegSpread: number;
  /** Maximum shoulder asymmetry (degrees) */
  maxShoulderAsymmetry: number;
  /** Minimum arm extension angle (degrees) */
  minArmExtension: number;
}

/**
 * Default thresholds for fitness discipline
 */
const FITNESS_THRESHOLDS: JumpingJacksThresholds = {
  minArmElevation: 160, // Arms should be nearly vertical
  minLegSpread: 1.8, // Legs should be 1.8x shoulder width
  maxShoulderAsymmetry: 15,
  minArmExtension: 150, // Arms should be relatively straight
};

/**
 * Relaxed thresholds for yoga discipline
 */
const YOGA_THRESHOLDS: JumpingJacksThresholds = {
  minArmElevation: 140,
  minLegSpread: 1.5,
  maxShoulderAsymmetry: 20,
  minArmExtension: 135,
};

/**
 * Moderate thresholds for general discipline
 */
const GENERAL_THRESHOLDS: JumpingJacksThresholds = {
  minArmElevation: 150,
  minLegSpread: 1.6,
  maxShoulderAsymmetry: 18,
  minArmExtension: 140,
};

/**
 * Jumping Jacks Validator
 * Checks form for jumping jacks exercise
 */
export class JumpingJacksValidator {
  private thresholds: JumpingJacksThresholds;

  constructor(
    _exerciseType: ExerciseType,
    discipline: Discipline
  ) {
    // Select thresholds based on discipline
    switch (discipline) {
      case Discipline.FITNESS:
        this.thresholds = FITNESS_THRESHOLDS;
        break;
      case Discipline.YOGA:
        this.thresholds = YOGA_THRESHOLDS;
        break;
      case Discipline.GENERAL:
        this.thresholds = GENERAL_THRESHOLDS;
        break;
      default:
        this.thresholds = GENERAL_THRESHOLDS;
    }
  }

  /**
   * Validate jumping jacks form from pose frame
   * @param frame - Current pose frame
   * @returns Form validation result with score and errors
   */
  validateForm(frame: PoseFrame): FormValidationResult {
    const errors: FormError[] = [];
    const measurements: FormMeasurements = {};
    let totalScore = 100;

    // Extract landmarks
    const leftShoulder = frame.landmarks.find((l) => l.id === LandmarkID.LEFT_SHOULDER);
    const rightShoulder = frame.landmarks.find((l) => l.id === LandmarkID.RIGHT_SHOULDER);
    const leftElbow = frame.landmarks.find((l) => l.id === LandmarkID.LEFT_ELBOW);
    const rightElbow = frame.landmarks.find((l) => l.id === LandmarkID.RIGHT_ELBOW);
    const leftWrist = frame.landmarks.find((l) => l.id === LandmarkID.LEFT_WRIST);
    const rightWrist = frame.landmarks.find((l) => l.id === LandmarkID.RIGHT_WRIST);
    const leftHip = frame.landmarks.find((l) => l.id === LandmarkID.LEFT_HIP);
    const rightHip = frame.landmarks.find((l) => l.id === LandmarkID.RIGHT_HIP);
    const leftAnkle = frame.landmarks.find((l) => l.id === LandmarkID.LEFT_ANKLE);
    const rightAnkle = frame.landmarks.find((l) => l.id === LandmarkID.RIGHT_ANKLE);

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftElbow ||
      !rightElbow ||
      !leftWrist ||
      !rightWrist ||
      !leftHip ||
      !rightHip ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return {
        score: 0,
        errors: [
          {
            type: FormErrorType.POSE_INCOMPLETE,
            severity: Severity.HIGH,
            description: 'Unable to detect full body pose',
            measuredValue: 0,
            threshold: 0,
            correction: 'Ensure the camera captures your full body',
          },
        ],
        isAcceptable: false,
        measurements: {},
      };
    }

    // Check 1: Arm elevation (open position)
    // Calculate angle from shoulder to wrist relative to horizontal
    const leftArmAngle = this.calculateArmElevationAngle(leftShoulder, leftWrist);
    const rightArmAngle = this.calculateArmElevationAngle(rightShoulder, rightWrist);
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;
    measurements.armElevation = { left: leftArmAngle, right: rightArmAngle };

    if (avgArmAngle < this.thresholds.minArmElevation) {
      totalScore -= 25;
      errors.push({
        type: FormErrorType.SHALLOW_DEPTH,
        severity: Severity.NORMAL,
        description: 'Raise your arms higher overhead',
        measuredValue: avgArmAngle,
        threshold: this.thresholds.minArmElevation,
        correction: 'Lift both arms until they are vertical above your head',
      });
    }

    // Check 2: Arm extension (elbows should be relatively straight)
    const leftArmExtension = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightArmExtension = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const minArmExtension = Math.min(leftArmExtension, rightArmExtension);
    measurements.armExtension = { left: leftArmExtension, right: rightArmExtension };

    if (minArmExtension < this.thresholds.minArmExtension) {
      totalScore -= 15;
      errors.push({
        type: FormErrorType.INCORRECT_JOINT_ANGLE,
        severity: Severity.NORMAL,
        description: 'Straighten your arms more during the movement',
        measuredValue: minArmExtension,
        threshold: this.thresholds.minArmExtension,
        correction: 'Extend your elbows fully as you reach overhead',
      });
    }

    // Check 3: Shoulder symmetry
    const shoulderAsymmetry = Math.abs(leftArmAngle - rightArmAngle);
    measurements.shoulderAsymmetry = shoulderAsymmetry;
    if (shoulderAsymmetry > this.thresholds.maxShoulderAsymmetry) {
      totalScore -= 15;
      errors.push({
        type: FormErrorType.ASYMMETRIC_MOVEMENT,
        severity: Severity.NORMAL,
        description: 'Keep both arms at the same height',
        measuredValue: shoulderAsymmetry,
        threshold: this.thresholds.maxShoulderAsymmetry,
        correction: 'Raise both arms evenly to match height',
      });
    }

    // Check 4: Leg spread (open position)
    const shoulderWidth = calculateDistance3D(leftShoulder, rightShoulder);
    const legSpread = calculateDistance3D(leftAnkle, rightAnkle);
    const spreadRatio = legSpread / shoulderWidth;
    measurements.legSpreadRatio = spreadRatio;

    if (spreadRatio < this.thresholds.minLegSpread) {
      totalScore -= 20;
      errors.push({
        type: FormErrorType.SHALLOW_DEPTH,
        severity: Severity.NORMAL,
        description: 'Jump your feet wider apart',
        measuredValue: spreadRatio,
        threshold: this.thresholds.minLegSpread,
        correction: 'Land with your feet wider than shoulder width',
      });
    }

    // Check 5: Hip alignment (should stay level)
    const hipTilt = Math.abs(leftHip.y - rightHip.y);
    measurements.hipTilt = hipTilt;
    if (hipTilt > 0.05) {
      totalScore -= 10;
      errors.push({
        type: FormErrorType.ASYMMETRIC_MOVEMENT,
        severity: Severity.NORMAL,
        description: 'Keep your hips level during the jump',
        measuredValue: hipTilt * 100,
        threshold: 5,
        correction: 'Engage your core to prevent hip tilting side to side',
      });
    }

    const score = Math.max(0, totalScore);
    const severityOrder: Record<Severity, number> = {
      [Severity.CRITICAL]: 0,
      [Severity.HIGH]: 1,
      [Severity.NORMAL]: 2,
      [Severity.INFO]: 3,
    };

    return {
      score,
      errors: errors.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]),
      isAcceptable: score >= 70,
      measurements,
    };
  }

  /**
   * Calculate arm elevation angle relative to horizontal
   * @param shoulder - Shoulder landmark
   * @param wrist - Wrist landmark
   * @returns Angle in degrees (0 = horizontal, 90 = vertical)
   */
  private calculateArmElevationAngle(
    shoulder: { x: number; y: number; z: number },
    wrist: { x: number; y: number; z: number }
  ): number {
    const dy = shoulder.y - wrist.y; // Y decreases upward
    const dx = Math.abs(wrist.x - shoulder.x);
    const angleRad = Math.atan2(dy, dx);
    return (angleRad * 180) / Math.PI;
  }
}
