import { PoseFrame, LandmarkID, FormErrorType, Severity } from '../types';
import { calculateAngle, calculateDistance3D } from '../geometry';
import { FormValidator, FormError, FormValidationResult, FormMeasurements } from './form-validator';

/**
 * Push-ups specific form validator
 */
export class PushUpsValidator extends FormValidator {
  /**
   * Validate push-ups form
   */
  validateForm(frame: PoseFrame, previousFrames?: PoseFrame[]): FormValidationResult {
    const errors: FormError[] = [];
    const measurements: FormMeasurements = {};

    // Get landmarks
    const getLandmark = (id: LandmarkID) => frame.landmarks.find((l) => l.id === id)!;

    const leftShoulder = getLandmark(LandmarkID.LEFT_SHOULDER);
    const rightShoulder = getLandmark(LandmarkID.RIGHT_SHOULDER);
    const leftElbow = getLandmark(LandmarkID.LEFT_ELBOW);
    const rightElbow = getLandmark(LandmarkID.RIGHT_ELBOW);
    const leftWrist = getLandmark(LandmarkID.LEFT_WRIST);
    const rightWrist = getLandmark(LandmarkID.RIGHT_WRIST);
    const leftHip = getLandmark(LandmarkID.LEFT_HIP);
    const rightHip = getLandmark(LandmarkID.RIGHT_HIP);

    // 1. Check elbow angles
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

    measurements.elbowAngle = {
      left: leftElbowAngle,
      right: rightElbowAngle,
    };

    // Check if elbows are properly bent (during down phase)
    if (leftElbowAngle < this.thresholds.minElbowBend) {
      errors.push({
        type: FormErrorType.SHALLOW_DEPTH,
        severity: Severity.NORMAL,
        description: 'Go deeper in the push-up',
        measuredValue: leftElbowAngle,
        threshold: this.thresholds.minElbowBend,
        correction: 'Lower your chest closer to the ground',
      });
    }

    // Check elbow flaring (elbows should be close to body)
    const leftElbowFlare = Math.abs(leftElbow.x - leftShoulder.x);
    const rightElbowFlare = Math.abs(rightElbow.x - rightShoulder.x);
    const avgFlare = (leftElbowFlare + rightElbowFlare) / 2;

    if (avgFlare > 0.15) {
      // Threshold for elbow position
      errors.push({
        type: FormErrorType.ELBOW_FLARING,
        severity: Severity.HIGH,
        description: 'Elbows are flaring out',
        measuredValue: avgFlare,
        threshold: 0.15,
        correction: 'Keep your elbows closer to your body',
      });
    }

    // 2. Check spine alignment (back should be straight)
    const shoulderMidpoint = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      z: (leftShoulder.z + rightShoulder.z) / 2,
    };
    const hipMidpoint = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      z: (leftHip.z + rightHip.z) / 2,
    };

    // Calculate spine angle (should be near 0 for straight back)
    const spineAngle = Math.abs(
      Math.atan2(hipMidpoint.y - shoulderMidpoint.y, hipMidpoint.x - shoulderMidpoint.x) *
        (180 / Math.PI)
    );

    measurements.spineAngle = spineAngle;

    if (spineAngle > this.thresholds.maxSpineCurvature) {
      errors.push({
        type: FormErrorType.BACK_ROUNDING,
        severity: Severity.CRITICAL,
        description: 'Back is not straight',
        measuredValue: spineAngle,
        threshold: this.thresholds.maxSpineCurvature,
        correction: 'Keep your core tight and back straight',
      });
    }

    // 3. Check shoulder alignment (should be level)
    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
    measurements.shoulderTilt = shoulderTilt * 100; // Convert to percentage

    if (shoulderTilt > 0.05) {
      errors.push({
        type: FormErrorType.ASYMMETRIC_MOVEMENT,
        severity: Severity.NORMAL,
        description: 'Shoulders are not level',
        measuredValue: shoulderTilt * 100,
        threshold: 5,
        correction: 'Keep your shoulders level',
      });
    }

    // 4. Check elbow asymmetry
    const elbowAsymmetry = Math.abs(leftElbowAngle - rightElbowAngle);

    if (elbowAsymmetry > this.thresholds.maxAsymmetry) {
      errors.push({
        type: FormErrorType.ASYMMETRIC_MOVEMENT,
        severity: Severity.HIGH,
        description: 'Uneven arm movement detected',
        measuredValue: elbowAsymmetry,
        threshold: this.thresholds.maxAsymmetry,
        correction: 'Keep both arms moving together',
      });
    }

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
}
