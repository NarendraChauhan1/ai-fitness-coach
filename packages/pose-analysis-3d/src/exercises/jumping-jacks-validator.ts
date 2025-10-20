/**
 * Jumping Jacks Exercise Validator
 * Validates jumping jacks form by checking arm extension and leg spread
 */

import { PoseFrame } from '../types/pose.types';
import { ExerciseType, Discipline } from '../types/exercise.types';
import { calculateAngle, calculateDistance3D } from '../geometry';
import { FormValidationResult, FormError } from './form-validator';

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
    private exerciseType: ExerciseType,
    private discipline: Discipline
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
    let totalScore = 100;

    // Extract landmarks
    const leftShoulder = frame.landmarks.find((l) => l.id === 11);
    const rightShoulder = frame.landmarks.find((l) => l.id === 12);
    const leftElbow = frame.landmarks.find((l) => l.id === 13);
    const rightElbow = frame.landmarks.find((l) => l.id === 14);
    const leftWrist = frame.landmarks.find((l) => l.id === 15);
    const rightWrist = frame.landmarks.find((l) => l.id === 16);
    const leftHip = frame.landmarks.find((l) => l.id === 23);
    const rightHip = frame.landmarks.find((l) => l.id === 24);
    const leftAnkle = frame.landmarks.find((l) => l.id === 27);
    const rightAnkle = frame.landmarks.find((l) => l.id === 28);

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
            type: 'pose_incomplete',
            message: 'Unable to detect full body pose',
            severity: 'high',
            affectedLandmarks: [],
          },
        ],
        timestamp: frame.timestamp,
      };
    }

    // Check 1: Arm elevation (open position)
    // Calculate angle from shoulder to wrist relative to horizontal
    const leftArmAngle = this.calculateArmElevationAngle(leftShoulder, leftWrist);
    const rightArmAngle = this.calculateArmElevationAngle(rightShoulder, rightWrist);
    const avgArmAngle = (leftArmAngle + rightArmAngle) / 2;

    if (avgArmAngle < this.thresholds.minArmElevation) {
      totalScore -= 25;
      errors.push({
        type: 'shallow_depth',
        message: 'Raise your arms higher overhead',
        severity: 'normal',
        affectedLandmarks: [leftWrist.id, rightWrist.id],
        measuredValue: avgArmAngle,
        threshold: this.thresholds.minArmElevation,
      });
    }

    // Check 2: Arm extension (elbows should be relatively straight)
    const leftArmExtension = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightArmExtension = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const minArmExtension = Math.min(leftArmExtension, rightArmExtension);

    if (minArmExtension < this.thresholds.minArmExtension) {
      totalScore -= 15;
      errors.push({
        type: 'incorrect_joint_angle',
        message: 'Straighten your arms more during the movement',
        severity: 'normal',
        affectedLandmarks: [leftElbow.id, rightElbow.id],
        measuredValue: minArmExtension,
        threshold: this.thresholds.minArmExtension,
      });
    }

    // Check 3: Shoulder symmetry
    const shoulderAsymmetry = Math.abs(leftArmAngle - rightArmAngle);
    if (shoulderAsymmetry > this.thresholds.maxShoulderAsymmetry) {
      totalScore -= 15;
      errors.push({
        type: 'asymmetric_movement',
        message: 'Keep both arms at the same height',
        severity: 'normal',
        affectedLandmarks: [leftShoulder.id, rightShoulder.id],
        measuredValue: shoulderAsymmetry,
        threshold: this.thresholds.maxShoulderAsymmetry,
      });
    }

    // Check 4: Leg spread (open position)
    const shoulderWidth = calculateDistance3D(leftShoulder, rightShoulder);
    const legSpread = calculateDistance3D(leftAnkle, rightAnkle);
    const spreadRatio = legSpread / shoulderWidth;

    if (spreadRatio < this.thresholds.minLegSpread) {
      totalScore -= 20;
      errors.push({
        type: 'shallow_depth',
        message: 'Jump your feet wider apart',
        severity: 'normal',
        affectedLandmarks: [leftAnkle.id, rightAnkle.id],
        measuredValue: spreadRatio,
        threshold: this.thresholds.minLegSpread,
      });
    }

    // Check 5: Hip alignment (should stay level)
    const hipTilt = Math.abs(leftHip.y - rightHip.y);
    if (hipTilt > 0.05) {
      totalScore -= 10;
      errors.push({
        type: 'asymmetric_movement',
        message: 'Keep your hips level during the jump',
        severity: 'normal',
        affectedLandmarks: [leftHip.id, rightHip.id],
        measuredValue: hipTilt * 100,
        threshold: 5,
      });
    }

    return {
      score: Math.max(0, totalScore),
      errors,
      timestamp: frame.timestamp,
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
