/**
 * Marching Exercise Validator
 * Validates marching form by checking hip lift height and knee angle
 */

import { PoseFrame } from '../types/pose.types';
import { ExerciseType, Discipline } from '../types/exercise.types';
import { calculateAngle, calculateDistance3D } from '../geometry';
import { FormValidationResult, FormError } from './form-validator';

/**
 * Marching-specific thresholds
 */
interface MarchingThresholds {
  /** Minimum hip lift height (Y-coordinate difference) */
  minHipLiftHeight: number;
  /** Target knee angle at peak lift (degrees) */
  targetKneeAngle: number;
  /** Tolerance for knee angle (degrees) */
  kneeAngleTolerance: number;
  /** Maximum hip rotation during lift (degrees) */
  maxHipRotation: number;
}

/**
 * Default thresholds for fitness discipline
 */
const FITNESS_THRESHOLDS: MarchingThresholds = {
  minHipLiftHeight: 0.15, // 15% of frame height
  targetKneeAngle: 90,
  kneeAngleTolerance: 10,
  maxHipRotation: 15,
};

/**
 * Relaxed thresholds for yoga discipline
 */
const YOGA_THRESHOLDS: MarchingThresholds = {
  minHipLiftHeight: 0.10, // Lower requirement
  targetKneeAngle: 80,
  kneeAngleTolerance: 15,
  maxHipRotation: 20,
};

/**
 * Moderate thresholds for general discipline
 */
const GENERAL_THRESHOLDS: MarchingThresholds = {
  minHipLiftHeight: 0.12,
  targetKneeAngle: 85,
  kneeAngleTolerance: 12,
  maxHipRotation: 18,
};

/**
 * Marching Validator
 * Checks form for marching exercise (high knees)
 */
export class MarchingValidator {
  private thresholds: MarchingThresholds;

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
   * Validate marching form from pose frame
   * @param frame - Current pose frame
   * @returns Form validation result with score and errors
   */
  validateForm(frame: PoseFrame): FormValidationResult {
    const errors: FormError[] = [];
    let totalScore = 100;

    // Extract landmarks
    const leftHip = frame.landmarks.find((l) => l.id === 23);
    const rightHip = frame.landmarks.find((l) => l.id === 24);
    const leftKnee = frame.landmarks.find((l) => l.id === 25);
    const rightKnee = frame.landmarks.find((l) => l.id === 26);
    const leftAnkle = frame.landmarks.find((l) => l.id === 27);
    const rightAnkle = frame.landmarks.find((l) => l.id === 28);

    if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
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

    // Determine which leg is lifted (higher knee = lifted)
    const leftKneeLifted = leftKnee.y < rightKnee.y;
    const liftedKnee = leftKneeLifted ? leftKnee : rightKnee;
    const liftedHip = leftKneeLifted ? leftHip : rightHip;
    const liftedAnkle = leftKneeLifted ? leftAnkle : rightAnkle;
    const groundedKnee = leftKneeLifted ? rightKnee : leftKnee;

    // Check 1: Hip lift height
    const hipLiftHeight = liftedHip.y - liftedKnee.y; // Y decreases upward
    if (hipLiftHeight < this.thresholds.minHipLiftHeight) {
      totalScore -= 20;
      errors.push({
        type: 'shallow_depth',
        message: 'Lift your knee higher toward your chest',
        severity: 'normal',
        affectedLandmarks: [liftedKnee.id],
        measuredValue: hipLiftHeight * 100,
        threshold: this.thresholds.minHipLiftHeight * 100,
      });
    }

    // Check 2: Knee angle at peak lift
    const kneeAngle = calculateAngle(liftedHip, liftedKnee, liftedAnkle);
    const kneeAngleDiff = Math.abs(kneeAngle - this.thresholds.targetKneeAngle);
    if (kneeAngleDiff > this.thresholds.kneeAngleTolerance) {
      totalScore -= 15;
      errors.push({
        type: 'incorrect_joint_angle',
        message: 'Adjust your knee bend - aim for a 90-degree angle',
        severity: 'normal',
        affectedLandmarks: [liftedKnee.id],
        measuredValue: kneeAngle,
        threshold: this.thresholds.targetKneeAngle,
      });
    }

    // Check 3: Hip rotation (symmetry check)
    const hipDistance = calculateDistance3D(leftHip, rightHip);
    const hipRotation = Math.abs((leftHip.z - rightHip.z) / hipDistance) * 100;
    if (hipRotation > this.thresholds.maxHipRotation) {
      totalScore -= 15;
      errors.push({
        type: 'asymmetric_movement',
        message: 'Keep your hips level and facing forward',
        severity: 'normal',
        affectedLandmarks: [leftHip.id, rightHip.id],
        measuredValue: hipRotation,
        threshold: this.thresholds.maxHipRotation,
      });
    }

    // Check 4: Standing leg stability (knee shouldn't collapse)
    const standingLegAngle = calculateAngle(
      leftKneeLifted ? rightHip : leftHip,
      groundedKnee,
      leftKneeLifted ? rightAnkle : leftAnkle
    );
    if (standingLegAngle < 160) {
      totalScore -= 10;
      errors.push({
        type: 'knee_valgus',
        message: 'Keep your standing leg straight and stable',
        severity: 'high',
        affectedLandmarks: [groundedKnee.id],
        measuredValue: standingLegAngle,
        threshold: 160,
      });
    }

    return {
      score: Math.max(0, totalScore),
      errors,
      timestamp: frame.timestamp,
    };
  }
}
