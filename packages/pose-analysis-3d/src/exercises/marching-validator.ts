/**
 * Marching Exercise Validator
 * Validates marching form by checking hip lift height and knee angle
 */

import { PoseFrame, ExerciseType, Discipline, FormErrorType, Severity, LandmarkID } from '../types';
import { calculateAngle, calculateDistance3D } from '../geometry';
import { FormValidationResult, FormError, FormMeasurements } from './form-validator';

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
   * Validate marching form from pose frame
   * @param frame - Current pose frame
   * @returns Form validation result with score and errors
   */
  validateForm(frame: PoseFrame): FormValidationResult {
    const errors: FormError[] = [];
    const measurements: FormMeasurements = {};
    let totalScore = 100;

    // Extract landmarks
    const leftHip = frame.landmarks.find((l) => l.id === LandmarkID.LEFT_HIP);
    const rightHip = frame.landmarks.find((l) => l.id === LandmarkID.RIGHT_HIP);
    const leftKnee = frame.landmarks.find((l) => l.id === LandmarkID.LEFT_KNEE);
    const rightKnee = frame.landmarks.find((l) => l.id === LandmarkID.RIGHT_KNEE);
    const leftAnkle = frame.landmarks.find((l) => l.id === LandmarkID.LEFT_ANKLE);
    const rightAnkle = frame.landmarks.find((l) => l.id === LandmarkID.RIGHT_ANKLE);

    if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
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

    // Determine which leg is lifted (higher knee = lifted)
    const leftKneeLifted = leftKnee.y < rightKnee.y;
    const liftedKnee = leftKneeLifted ? leftKnee : rightKnee;
    const liftedHip = leftKneeLifted ? leftHip : rightHip;
    const liftedAnkle = leftKneeLifted ? leftAnkle : rightAnkle;
    const groundedKnee = leftKneeLifted ? rightKnee : leftKnee;

    // Check 1: Hip lift height
    const hipLiftHeight = liftedHip.y - liftedKnee.y; // Y decreases upward
    measurements.hipLiftHeight = hipLiftHeight;
    if (hipLiftHeight < this.thresholds.minHipLiftHeight) {
      totalScore -= 20;
      errors.push({
        type: FormErrorType.SHALLOW_DEPTH,
        severity: Severity.NORMAL,
        description: 'Lift your knee higher toward your chest',
        measuredValue: hipLiftHeight * 100,
        threshold: this.thresholds.minHipLiftHeight * 100,
        correction: 'Drive your knee upward until it reaches hip height',
      });
    }

    // Check 2: Knee angle at peak lift
    const kneeAngle = calculateAngle(liftedHip, liftedKnee, liftedAnkle);
    const kneeAngleDiff = Math.abs(kneeAngle - this.thresholds.targetKneeAngle);
    measurements.kneeAngle = {
      left: kneeAngle,
      right: kneeAngle,
    };
    measurements.kneeAngleDifference = kneeAngleDiff;
    if (kneeAngleDiff > this.thresholds.kneeAngleTolerance) {
      totalScore -= 15;
      errors.push({
        type: FormErrorType.INCORRECT_JOINT_ANGLE,
        severity: Severity.NORMAL,
        description: 'Adjust your knee bend - aim for a 90-degree angle',
        measuredValue: kneeAngle,
        threshold: this.thresholds.targetKneeAngle,
        correction: 'Raise your knee until it forms a right angle',
      });
    }

    // Check 3: Hip rotation (symmetry check)
    const hipDistance = calculateDistance3D(leftHip, rightHip);
    const hipRotation = hipDistance > 0 ? Math.abs((leftHip.z - rightHip.z) / hipDistance) * 100 : 0;
    measurements.hipRotation = hipRotation;
    if (hipRotation > this.thresholds.maxHipRotation) {
      totalScore -= 15;
      errors.push({
        type: FormErrorType.ASYMMETRIC_MOVEMENT,
        severity: Severity.NORMAL,
        description: 'Keep your hips level and facing forward',
        measuredValue: hipRotation,
        threshold: this.thresholds.maxHipRotation,
        correction: 'Engage your core to prevent hip rotation',
      });
    }

    // Check 4: Standing leg stability (knee shouldn't collapse)
    const standingLegAngle = calculateAngle(
      leftKneeLifted ? rightHip : leftHip,
      groundedKnee,
      leftKneeLifted ? rightAnkle : leftAnkle
    );
    measurements.standingLegAngle = standingLegAngle;
    if (standingLegAngle < 160) {
      totalScore -= 10;
      errors.push({
        type: FormErrorType.KNEE_VALGUS,
        severity: Severity.HIGH,
        description: 'Keep your standing leg straight and stable',
        measuredValue: standingLegAngle,
        threshold: 160,
        correction: 'Maintain a straight supporting leg while lifting',
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
}
