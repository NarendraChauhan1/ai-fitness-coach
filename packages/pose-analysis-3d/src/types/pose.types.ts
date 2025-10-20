/**
 * MediaPipe landmark IDs for core body points
 * We track 12 landmarks: shoulders, elbows, wrists, hips, knees, ankles
 */
export enum LandmarkID {
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
}

/**
 * Single landmark with 3D coordinates and visibility score
 */
export interface Landmark {
  /** Landmark ID from MediaPipe */
  id: LandmarkID;

  /** X coordinate normalized to [0, 1] (left to right) */
  x: number;

  /** Y coordinate normalized to [0, 1] (top to bottom) */
  y: number;

  /** Z coordinate for depth (negative = closer to camera) */
  z: number;

  /** Visibility/confidence score [0, 1] */
  visibility: number;
}

/**
 * Confidence metrics for detected pose
 */
export interface LandmarkConfidence {
  /** Average visibility across all 12 landmarks */
  average: number;

  /** Minimum visibility (weakest landmark) */
  minimum: number;

  /** Per-landmark visibility map */
  byLandmark: Record<LandmarkID, number>;
}

/**
 * Current state of exercise detection
 */
export enum ExerciseState {
  IDLE = 'idle',
  IN_REP = 'in_rep',
  BETWEEN_REPS = 'between_reps',
  PAUSED = 'paused',
}

/**
 * Complete pose frame with all landmarks and metadata
 */
export interface PoseFrame {
  /** Timestamp in milliseconds (performance.now()) */
  timestamp: number;

  /** Core body landmarks (12 points) with 3D coordinates */
  landmarks: Landmark[];

  /** Visibility/confidence scores for quality assessment */
  confidence: LandmarkConfidence;

  /** Current exercise state */
  state: ExerciseState;

  /** Frame number in current session (incremental) */
  frameNumber: number;
}
