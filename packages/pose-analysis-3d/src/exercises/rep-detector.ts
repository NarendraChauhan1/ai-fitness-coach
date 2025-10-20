import { PoseFrame, ExerciseType, LandmarkID } from '../types';
import { calculateAngle } from '../geometry';

/**
 * Rep detection phase
 */
export enum RepPhase {
  NEUTRAL = 'neutral',
  DOWN = 'down',
  UP = 'up',
}

/**
 * Current rep state
 */
export interface RepState {
  /** Current phase of rep cycle */
  phase: RepPhase;

  /** Progress through current rep (0-100) */
  progress: number;

  /** Frame number when current rep started */
  startFrame: number;

  /** Peak depth/extension so far in current rep */
  currentPeak: number;
}

/**
 * Rep event when rep is completed
 */
export interface RepEvent {
  /** Sequential rep number */
  repNumber: number;

  /** Start frame */
  startFrame: number;

  /** End frame */
  endFrame: number;

  /** Duration in milliseconds */
  durationMs: number;

  /** Peak value achieved */
  peakValue: number;

  /** Peak frame */
  peakFrame: number;

  /** Threshold met */
  thresholdMet: boolean;
}

/**
 * Rep detector with state machine for exercise rep counting
 */
export class RepDetector {
  private state: RepState;
  private repCount = 0;
  private startTimestamp = 0;

  constructor(private exercise: ExerciseType) {
    this.state = {
      phase: RepPhase.NEUTRAL,
      progress: 0,
      startFrame: 0,
      currentPeak: 0,
    };
  }

  /**
   * Process frame for rep detection
   */
  processFrame(frame: PoseFrame): RepEvent | null {
    switch (this.exercise) {
      case ExerciseType.PUSH_UPS:
        return this.processPushUps(frame);
      case ExerciseType.MARCHING:
        return this.processMarching(frame);
      case ExerciseType.JUMPING_JACKS:
        return this.processJumpingJacks(frame);
      default:
        return null;
    }
  }

  /**
   * Process push-ups rep detection
   */
  private processPushUps(frame: PoseFrame): RepEvent | null {
    const getLandmark = (id: LandmarkID) => frame.landmarks.find((l) => l.id === id)!;

    const leftShoulder = getLandmark(LandmarkID.LEFT_SHOULDER);
    const leftElbow = getLandmark(LandmarkID.LEFT_ELBOW);
    const leftWrist = getLandmark(LandmarkID.LEFT_WRIST);

    // Calculate elbow angle
    const elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);

    // Define thresholds
    const DOWN_THRESHOLD = 90; // Elbow bent to 90 degrees or less
    const UP_THRESHOLD = 160; // Elbow nearly straight

    // State machine
    switch (this.state.phase) {
      case RepPhase.NEUTRAL:
      case RepPhase.UP:
        // Waiting for down movement
        if (elbowAngle < DOWN_THRESHOLD) {
          this.state = {
            phase: RepPhase.DOWN,
            progress: 50,
            startFrame: frame.frameNumber,
            currentPeak: elbowAngle,
          };
          this.startTimestamp = frame.timestamp;
        }
        break;

      case RepPhase.DOWN:
        // Track minimum angle reached
        if (elbowAngle < this.state.currentPeak) {
          this.state.currentPeak = elbowAngle;
        }

        // Waiting for up movement
        if (elbowAngle > UP_THRESHOLD) {
          // Rep completed!
          this.repCount++;
          const repEvent: RepEvent = {
            repNumber: this.repCount,
            startFrame: this.state.startFrame,
            endFrame: frame.frameNumber,
            durationMs: frame.timestamp - this.startTimestamp,
            peakValue: this.state.currentPeak,
            peakFrame: this.state.startFrame, // Simplified
            thresholdMet: this.state.currentPeak <= DOWN_THRESHOLD,
          };

          this.state = {
            phase: RepPhase.UP,
            progress: 100,
            startFrame: frame.frameNumber,
            currentPeak: elbowAngle,
          };

          return repEvent;
        } else {
          // Update progress
          this.state.progress = Math.min(
            90,
            50 + ((DOWN_THRESHOLD - elbowAngle) / DOWN_THRESHOLD) * 40
          );
        }
        break;
    }

    return null;
  }

  /**
   * Process marching rep detection (left/right leg cycle)
   */
  private processMarching(frame: PoseFrame): RepEvent | null {
    const getLandmark = (id: LandmarkID) => frame.landmarks.find((l) => l.id === id)!;

    const leftHip = getLandmark(LandmarkID.LEFT_HIP);
    const rightHip = getLandmark(LandmarkID.RIGHT_HIP);
    const leftKnee = getLandmark(LandmarkID.LEFT_KNEE);
    const rightKnee = getLandmark(LandmarkID.RIGHT_KNEE);

    // Determine which leg is lifted (higher knee = lifted leg)
    const leftKneeLifted = leftKnee.y < rightKnee.y;
    const liftedKnee = leftKneeLifted ? leftKnee : rightKnee;
    const liftedHip = leftKneeLifted ? leftHip : rightHip;

    // Calculate hip lift height
    const hipLiftHeight = liftedHip.y - liftedKnee.y; // Y decreases upward

    // Define thresholds
    const LIFT_THRESHOLD = 0.12; // Knee lifted 12% of frame height above hip
    const DOWN_THRESHOLD = 0.05; // Knee back down near hip level

    // State machine
    switch (this.state.phase) {
      case RepPhase.NEUTRAL:
      case RepPhase.DOWN:
        // Waiting for lift movement
        if (hipLiftHeight > LIFT_THRESHOLD) {
          this.state = {
            phase: RepPhase.UP,
            progress: 50,
            startFrame: frame.frameNumber,
            currentPeak: hipLiftHeight,
          };
          this.startTimestamp = frame.timestamp;
        }
        break;

      case RepPhase.UP:
        // Track maximum height reached
        if (hipLiftHeight > this.state.currentPeak) {
          this.state.currentPeak = hipLiftHeight;
        }

        // Waiting for down movement (alternate leg lift completes rep)
        if (hipLiftHeight < DOWN_THRESHOLD) {
          // Rep completed!
          this.repCount++;
          const repEvent: RepEvent = {
            repNumber: this.repCount,
            startFrame: this.state.startFrame,
            endFrame: frame.frameNumber,
            durationMs: frame.timestamp - this.startTimestamp,
            peakValue: this.state.currentPeak,
            peakFrame: this.state.startFrame, // Simplified
            thresholdMet: this.state.currentPeak >= LIFT_THRESHOLD,
          };

          this.state = {
            phase: RepPhase.DOWN,
            progress: 100,
            startFrame: frame.frameNumber,
            currentPeak: hipLiftHeight,
          };

          return repEvent;
        } else {
          // Update progress
          this.state.progress = Math.min(
            90,
            50 + (hipLiftHeight / LIFT_THRESHOLD) * 40
          );
        }
        break;
    }

    return null;
  }

  /**
   * Process jumping jacks rep detection (open/close cycle)
   */
  private processJumpingJacks(frame: PoseFrame): RepEvent | null {
    const getLandmark = (id: LandmarkID) => frame.landmarks.find((l) => l.id === id)!;

    const leftWrist = getLandmark(LandmarkID.LEFT_WRIST);
    const rightWrist = getLandmark(LandmarkID.RIGHT_WRIST);
    const leftAnkle = getLandmark(LandmarkID.LEFT_ANKLE);
    const rightAnkle = getLandmark(LandmarkID.RIGHT_ANKLE);

    // Calculate arm spread (wrists distance)
    const armSpread = Math.abs(leftWrist.x - rightWrist.x);
    
    // Calculate leg spread (ankles distance)
    const legSpread = Math.abs(leftAnkle.x - rightAnkle.x);
    
    // Combined spread metric (average of normalized arm and leg spread)
    const combinedSpread = (armSpread + legSpread) / 2;

    // Define thresholds
    const OPEN_THRESHOLD = 0.4; // Arms/legs spread wide
    const CLOSED_THRESHOLD = 0.15; // Arms/legs together

    // State machine
    switch (this.state.phase) {
      case RepPhase.NEUTRAL:
      case RepPhase.DOWN:
        // Waiting for open position
        if (combinedSpread > OPEN_THRESHOLD) {
          this.state = {
            phase: RepPhase.UP,
            progress: 50,
            startFrame: frame.frameNumber,
            currentPeak: combinedSpread,
          };
          this.startTimestamp = frame.timestamp;
        }
        break;

      case RepPhase.UP:
        // Track maximum spread reached
        if (combinedSpread > this.state.currentPeak) {
          this.state.currentPeak = combinedSpread;
        }

        // Waiting for closed position
        if (combinedSpread < CLOSED_THRESHOLD) {
          // Rep completed!
          this.repCount++;
          const repEvent: RepEvent = {
            repNumber: this.repCount,
            startFrame: this.state.startFrame,
            endFrame: frame.frameNumber,
            durationMs: frame.timestamp - this.startTimestamp,
            peakValue: this.state.currentPeak,
            peakFrame: this.state.startFrame, // Simplified
            thresholdMet: this.state.currentPeak >= OPEN_THRESHOLD,
          };

          this.state = {
            phase: RepPhase.DOWN,
            progress: 100,
            startFrame: frame.frameNumber,
            currentPeak: combinedSpread,
          };

          return repEvent;
        } else {
          // Update progress
          this.state.progress = Math.min(
            90,
            50 + (combinedSpread / OPEN_THRESHOLD) * 40
          );
        }
        break;
    }

    return null;
  }

  /**
   * Reset detector state
   */
  reset(): void {
    this.state = {
      phase: RepPhase.NEUTRAL,
      progress: 0,
      startFrame: 0,
      currentPeak: 0,
    };
    this.repCount = 0;
    this.startTimestamp = 0;
  }

  /**
   * Get current state
   */
  getState(): RepState {
    return { ...this.state };
  }
}
