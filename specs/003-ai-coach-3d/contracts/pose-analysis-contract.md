# Contract: pose-analysis-3d Package

**Package**: `@ai-fitness-coach/pose-analysis-3d`  
**Version**: 1.0.0  
**Purpose**: Core 3D pose detection and form analysis library

---

## Public API

### 1. PoseDetector

**Purpose**: Initialize and run MediaPipe Pose Heavy variant

```typescript
class PoseDetector {
  /**
   * Initialize MediaPipe Pose with configuration
   * @throws Error if WebGL not supported or WASM load fails
   */
  constructor(config: PoseDetectorConfig);
  
  /**
   * Process video frame and extract landmarks
   * @param videoFrame - HTMLVideoElement or ImageData
   * @returns PoseFrame with 12 core landmarks
   * @throws Error if frame invalid or pose not detected
   */
  detectPose(videoFrame: HTMLVideoElement | ImageData): Promise<PoseFrame>;
  
  /**
   * Clean up resources (must call on unmount)
   */
  dispose(): void;
  
  /**
   * Check if detector is ready to process frames
   */
  isReady(): boolean;
}

interface PoseDetectorConfig {
  /** Use GPU acceleration (default: true) */
  enableGpu: boolean;
  
  /** Minimum confidence threshold (0-1, default: 0.5) */
  minDetectionConfidence: number;
  
  /** Minimum tracking confidence (0-1, default: 0.5) */
  minTrackingConfidence: number;
  
  /** Callback for initialization progress */
  onProgress?: (percent: number) => void;
}
```

**Contract Guarantees**:
- ✅ Returns exactly 12 landmarks (IDs: 11-16, 23-28)
- ✅ Coordinates normalized to [0, 1] for x/y
- ✅ Z-coordinate in range [-1, 1] (depth relative to hips)
- ✅ Average confidence ≥0.9 when pose detected
- ✅ Throws error if pose not detected (caller handles gracefully)

**Performance Requirements**:
- First detection: <200ms after `detectPose()` call
- Subsequent detections: <33ms (30 FPS)
- Memory usage: <100MB after initialization
- GPU memory: <200MB

---

### 2. FormValidator

**Purpose**: Validate exercise form against discipline-specific rules

```typescript
class FormValidator {
  /**
   * Create validator for specific exercise and discipline
   */
  constructor(exercise: ExerciseType, discipline: Discipline);
  
  /**
   * Analyze pose frame for form errors
   * @param frame - Current pose frame
   * @param previousFrames - Last 5-10 frames for smoothing (optional)
   * @returns List of detected errors with severity
   */
  validateForm(
    frame: PoseFrame,
    previousFrames?: PoseFrame[]
  ): FormValidationResult;
  
  /**
   * Update thresholds for more/less strict validation
   */
  setThresholds(thresholds: Partial<FormThresholds>): void;
  
  /**
   * Get current thresholds for inspection
   */
  getThresholds(): FormThresholds;
}

interface FormValidationResult {
  /** Overall form quality (0-100) */
  score: number;
  
  /** Detected errors ordered by severity */
  errors: FormError[];
  
  /** Whether form is acceptable (score ≥ 70) */
  isAcceptable: boolean;
  
  /** Calculated angles/distances used in validation */
  measurements: FormMeasurements;
}

interface FormError {
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

interface FormMeasurements {
  /** Knee angle (degrees, 0-180) */
  kneeAngle?: { left: number; right: number };
  
  /** Elbow angle (degrees, 0-180) */
  elbowAngle?: { left: number; right: number };
  
  /** Hip depth (normalized, 0-1) */
  hipDepth?: number;
  
  /** Shoulder alignment (degrees from horizontal) */
  shoulderTilt?: number;
  
  /** Back curvature (degrees deviation from straight) */
  spineAngle?: number;
}

interface FormThresholds {
  /** Minimum knee angle for full rep (squats) */
  minKneeAngle: number;
  
  /** Maximum knee valgus angle (collapse prevention) */
  maxKneeValgus: number;
  
  /** Maximum back curvature (injury prevention) */
  maxSpineCurvature: number;
  
  /** Minimum elbow bend for push-up */
  minElbowBend: number;
  
  /** Maximum asymmetry between left/right (degrees) */
  maxAsymmetry: number;
}
```

**Contract Guarantees**:
- ✅ Score always in range [0, 100]
- ✅ Errors sorted by severity (critical first)
- ✅ Validation completes in <10ms
- ✅ Supports all 3 initial exercises (marching, jumping_jacks, push_ups)

---

### 3. GeometryUtils

**Purpose**: 3D geometry calculations for pose analysis

```typescript
namespace GeometryUtils {
  /**
   * Calculate angle between three landmarks (in degrees)
   * @returns Angle in degrees (0-180)
   */
  export function calculateAngle(
    pointA: Landmark,
    pointB: Landmark,  // Vertex
    pointC: Landmark
  ): number;
  
  /**
   * Calculate 3D distance between two landmarks
   * @returns Normalized distance (0-1 scale)
   */
  export function calculateDistance3D(
    pointA: Landmark,
    pointB: Landmark
  ): number;
  
  /**
   * Calculate depth (Z-axis) difference
   * @returns Positive if B is closer to camera than A
   */
  export function calculateDepth(
    pointA: Landmark,
    pointB: Landmark
  ): number;
  
  /**
   * Check if point is within acceptable range of target
   * @param tolerance - Acceptable deviation (0-1)
   */
  export function isWithinTolerance(
    current: number,
    target: number,
    tolerance: number
  ): boolean;
  
  /**
   * Smooth values across frames (moving average)
   * @param values - Last N frame values
   * @param windowSize - Number of frames to average (default: 5)
   */
  export function smoothValue(
    values: number[],
    windowSize?: number
  ): number;
}
```

**Contract Guarantees**:
- ✅ All angles returned in degrees (not radians)
- ✅ Distance calculations account for Z-depth
- ✅ Functions are pure (no side effects)
- ✅ Calculations complete in <1ms each

---

### 4. RepDetector

**Purpose**: Detect rep completion from pose sequence

```typescript
class RepDetector {
  /**
   * Create rep detector for specific exercise
   */
  constructor(exercise: ExerciseType);
  
  /**
   * Process new pose frame for rep detection
   * @param frame - Current pose frame
   * @returns RepEvent if rep completed, null otherwise
   */
  processFrame(frame: PoseFrame): RepEvent | null;
  
  /**
   * Reset detector state (for new exercise session)
   */
  reset(): void;
  
  /**
   * Get current rep state (for UI display)
   */
  getState(): RepState;
}

interface RepState {
  /** Current phase of rep cycle */
  phase: 'down' | 'up' | 'neutral';
  
  /** Progress through current rep (0-100) */
  progress: number;
  
  /** Frame number when current rep started */
  startFrame: number;
  
  /** Peak depth/extension so far in current rep */
  currentPeak: number;
}
```

**Contract Guarantees**:
- ✅ Returns `RepEvent` only when full rep cycle completes
- ✅ No false positives (≤5% error rate per spec)
- ✅ State machine prevents double-counting
- ✅ Processing takes <5ms per frame

---

## Data Types (Re-exported)

```typescript
export {
  PoseFrame,
  Landmark,
  LandmarkID,
  LandmarkConfidence,
  ExerciseState,
  ExerciseType,
  Discipline,
  FormErrorType,
  RepEvent,
  PeakMetrics
} from './types';
```

---

## Error Handling

All public methods use standard error handling:

```typescript
class PoseAnalysisError extends Error {
  code: ErrorCode;
  details?: Record<string, unknown>;
}

enum ErrorCode {
  WEBGL_NOT_SUPPORTED = 'WEBGL_NOT_SUPPORTED',
  WASM_LOAD_FAILED = 'WASM_LOAD_FAILED',
  POSE_NOT_DETECTED = 'POSE_NOT_DETECTED',
  INVALID_FRAME = 'INVALID_FRAME',
  NOT_INITIALIZED = 'NOT_INITIALIZED'
}
```

**Error Contract**:
- ✅ All errors include `code` for programmatic handling
- ✅ `details` object provides debugging info
- ✅ Never throws generic `Error` (always `PoseAnalysisError`)

---

## Usage Example

```typescript
import { PoseDetector, FormValidator, RepDetector } from '@ai-fitness-coach/pose-analysis-3d';

// Initialize detector
const detector = new PoseDetector({
  enableGpu: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// Initialize validators
const formValidator = new FormValidator('push_ups', 'fitness');
const repDetector = new RepDetector('push_ups');

// Process video frames
async function processFrame(videoElement: HTMLVideoElement) {
  try {
    // Detect pose
    const poseFrame = await detector.detectPose(videoElement);
    
    // Validate form
    const formResult = formValidator.validateForm(poseFrame);
    
    // Detect rep completion
    const repEvent = repDetector.processFrame(poseFrame);
    
    return { poseFrame, formResult, repEvent };
  } catch (error) {
    if (error.code === 'POSE_NOT_DETECTED') {
      // Handle user out of frame
    }
    throw error;
  }
}

// Cleanup
detector.dispose();
```

---

## Testing Contract

Package must include:
- ✅ Unit tests for all geometry calculations
- ✅ Integration tests with sample pose fixtures
- ✅ Performance benchmarks (must meet timing requirements)
- ✅ Mock MediaPipe output for consistent testing

---

**Contract Version**: 1.0.0 | **Last Updated**: 2025-10-20
