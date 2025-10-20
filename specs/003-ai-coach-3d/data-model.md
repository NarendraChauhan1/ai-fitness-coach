# Data Model: AI 3D Fitness Coach

**Feature**: AI 3D Fitness Coach | **Branch**: `003-ai-coach-3d` | **Date**: 2025-10-20

## Overview

This document defines the core data structures for the AI Fitness Coach application. All data is **transient** - stored only in memory during active workout sessions and cleared when the session ends. No persistent storage is used.

---

## Core Entities

### 1. PoseFrame

Represents a single timestamped set of 3D pose landmarks captured from MediaPipe.

**Purpose**: Provide raw pose data for form analysis and visualization

**TypeScript Interface**:
```typescript
interface PoseFrame {
  /** Timestamp in milliseconds (performance.now()) */
  timestamp: number;
  
  /** Core body landmarks (12 points) with 3D coordinates */
  landmarks: Landmark[];
  
  /** Visibility/confidence scores for quality assessment */
  confidence: LandmarkConfidence;
  
  /** Current exercise state (idle, in_rep, between_reps) */
  state: ExerciseState;
  
  /** Frame number in current session (incremental) */
  frameNumber: number;
}

interface Landmark {
  /** Landmark ID (11-28 from MediaPipe, filtered) */
  id: LandmarkID;
  
  /** 3D coordinates normalized to camera view */
  x: number;  // 0-1, left to right
  y: number;  // 0-1, top to bottom
  z: number;  // Depth relative to hips (negative = closer to camera)
  
  /** Visibility score (0-1, MediaPipe output) */
  visibility: number;
}

type LandmarkID = 
  | 11  // LEFT_SHOULDER
  | 12  // RIGHT_SHOULDER
  | 13  // LEFT_ELBOW
  | 14  // RIGHT_ELBOW
  | 15  // LEFT_WRIST
  | 16  // RIGHT_WRIST
  | 23  // LEFT_HIP
  | 24  // RIGHT_HIP
  | 25  // LEFT_KNEE
  | 26  // RIGHT_KNEE
  | 27  // LEFT_ANKLE
  | 28; // RIGHT_ANKLE

interface LandmarkConfidence {
  /** Average visibility across all 12 landmarks */
  average: number;
  
  /** Minimum visibility (weakest landmark) */
  minimum: number;
  
  /** Per-landmark visibility map */
  byLandmark: Record<LandmarkID, number>;
}

type ExerciseState = 
  | 'idle'           // No exercise detected
  | 'in_rep'         // Mid-repetition
  | 'between_reps'   // Completed rep, waiting for next
  | 'paused';        // User partially out of frame
```

**Validation Rules**:
- All landmark coordinates must be in range [0, 1] for x/y
- Z-coordinate range: [-1, 1] (normalized)
- Visibility scores: [0, 1]
- Average confidence ≥0.9 required for valid frame (per FR-001)

**Lifecycle**:
- Created: Every MediaPipe frame (30+ per second)
- Updated: Never (immutable snapshots)
- Destroyed: After feedback analysis (not retained)

**Relationships**:
- Many `PoseFrame` → One `ExerciseSession`
- One `PoseFrame` → Zero or one `RepEvent` (triggers rep detection)

---

### 2. ExerciseSession

Captures transient session context for active workout.

**Purpose**: Track live workout metrics and coordinate between pose analysis and coaching

**TypeScript Interface**:
```typescript
interface ExerciseSession {
  /** Unique session ID (UUID v4) */
  id: string;
  
  /** Session start time (ISO 8601 timestamp) */
  startedAt: string;
  
  /** Selected exercise type */
  exercise: ExerciseType;
  
  /** Training discipline (affects form thresholds) */
  discipline: Discipline;
  
  /** Live rep counter */
  repCount: number;
  
  /** Target reps (user-specified or default) */
  targetReps: number;
  
  /** Duration in seconds (live updating) */
  durationSeconds: number;
  
  /** Form quality score (0-100, rolling average) */
  formScore: number;
  
  /** All feedback delivered this session */
  feedbackHistory: FeedbackPrompt[];
  
  /** All completed reps this session */
  repHistory: RepEvent[];
  
  /** Current state of the session */
  status: SessionStatus;
  
  /** Error counters by type */
  errorCounts: Record<FormErrorType, number>;
}

type ExerciseType = 
  | 'marching'
  | 'jumping_jacks'
  | 'push_ups';

type Discipline = 
  | 'fitness'
  | 'yoga'
  | 'general';

type SessionStatus = 
  | 'preparing'    // Instructions/demo phase
  | 'active'       // Workout in progress
  | 'paused'       // User out of frame
  | 'completed';   // Target reps reached or user ended

type FormErrorType =
  | 'knee_valgus'          // Knees collapsing inward
  | 'back_rounding'        // Excessive spine curvature
  | 'elbow_flaring'        // Elbows too wide (push-ups)
  | 'shallow_depth'        // Insufficient range of motion
  | 'asymmetric_movement'  // Left/right imbalance
  | 'neck_misalignment';   // Head position incorrect
```

**Validation Rules**:
- `repCount` ≤ `targetReps`
- `durationSeconds` ≥ 0
- `formScore` in range [0, 100]
- `status` transitions: preparing → active → (paused)* → completed

**Lifecycle**:
- Created: When user starts exercise (after demo)
- Updated: Every frame and on rep completion
- Destroyed: When user exits workout page (no persistence)

**Relationships**:
- One `ExerciseSession` → Many `RepEvent`
- One `ExerciseSession` → Many `FeedbackPrompt`

---

### 3. RepEvent

Logs an individual repetition with form assessment.

**Purpose**: Track rep completion and quality for immediate feedback

**TypeScript Interface**:
```typescript
interface RepEvent {
  /** Sequential rep number (1-indexed) */
  repNumber: number;
  
  /** Frame number when rep started */
  startFrame: number;
  
  /** Frame number when rep completed */
  endFrame: number;
  
  /** Duration in milliseconds */
  durationMs: number;
  
  /** Form quality score for this rep (0-100) */
  correctnessScore: number;
  
  /** Specific form errors detected */
  errorsDetected: FormErrorType[];
  
  /** Feedback delivered during this rep */
  feedbackGiven: FeedbackPrompt[];
  
  /** Timestamp of completion */
  completedAt: string;
  
  /** Peak depth/extension achieved (exercise-specific) */
  peakMetrics: PeakMetrics;
}

interface PeakMetrics {
  /** Lowest hip Y-coordinate (squats) or elbow angle (push-ups) */
  peakValue: number;
  
  /** Frame where peak occurred */
  peakFrame: number;
  
  /** Whether peak met minimum threshold */
  thresholdMet: boolean;
}
```

**Validation Rules**:
- `endFrame` > `startFrame`
- `correctnessScore` in range [0, 100]
- `repNumber` sequential within session
- `durationMs` ≥ 100 (minimum realistic rep time)

**Lifecycle**:
- Created: When rep cycle completes (bottom/top position detected)
- Updated: Never (immutable after creation)
- Destroyed: With parent `ExerciseSession`

**Relationships**:
- Many `RepEvent` → One `ExerciseSession`
- One `RepEvent` → Many `FeedbackPrompt` (corrective feedback)

---

### 4. FeedbackPrompt

Defines corrective or motivational messages delivered to user.

**Purpose**: Log what feedback was given and when to prevent spam and track coaching effectiveness

**TypeScript Interface**:
```typescript
interface FeedbackPrompt {
  /** Unique feedback ID */
  id: string;
  
  /** Predefined text message */
  message: string;
  
  /** Feedback category */
  type: FeedbackType;
  
  /** How urgent/important the feedback is */
  severity: Severity;
  
  /** Delivery method(s) used */
  modality: Modality[];
  
  /** When feedback was triggered */
  triggeredAt: string;
  
  /** Condition that triggered the feedback */
  triggerCondition: TriggerCondition;
  
  /** Whether TTS completed successfully */
  ttsStatus: TTSStatus;
  
  /** Associated rep (if corrective feedback) */
  repNumber?: number;
}

type FeedbackType = 
  | 'corrective'      // Fix form error
  | 'motivational'    // Encouragement
  | 'instructional'   // Technique tip
  | 'warning'         // Injury risk alert
  | 'confirmation';   // Rep counted

type Severity = 
  | 'info'      // Low priority (can be skipped if queue full)
  | 'normal'    // Standard coaching feedback
  | 'high'      // Important form correction
  | 'critical'; // Immediate injury risk

type Modality = 
  | 'voice'   // TTS output
  | 'visual'  // On-screen text
  | 'haptic'; // Mobile vibration (future)

interface TriggerCondition {
  /** What triggered this feedback */
  rule: string;  // e.g., "knee_valgus_threshold_exceeded"
  
  /** Measured value that triggered rule */
  measuredValue: number;
  
  /** Threshold that was crossed */
  threshold: number;
}

type TTSStatus = 
  | 'queued'     // Waiting in audio queue
  | 'speaking'   // Currently playing
  | 'completed'  // Successfully delivered
  | 'skipped'    // Queue full, lower priority
  | 'failed';    // TTS error
```

**Validation Rules**:
- `message` must match predefined prompt library (~20-30 phrases)
- `triggeredAt` must be within current session timeframe
- Critical severity feedback never skipped

**Lifecycle**:
- Created: When trigger condition met during pose analysis
- Updated: When TTS status changes (queued → speaking → completed)
- Destroyed: With parent `ExerciseSession`

**Relationships**:
- Many `FeedbackPrompt` → One `ExerciseSession`
- Zero or one `FeedbackPrompt` → One `RepEvent`

---

## Removed Entities

### UserProfile (Removed)

**Reason**: Per clarifications, no persistent storage is required. User preferences can be held in memory or browser sessionStorage if needed for single-session customization.

**Original Purpose**: Store user preferences, device capabilities, session history
**Current Alternative**: Use Zustand store for transient UI preferences (e.g., show/hide skeleton overlay)

---

## Data Flow

```
┌─────────────────┐
│  MediaPipe Pose │
│   (30+ FPS)     │
└────────┬────────┘
         │
         ▼
    ┌─────────┐
    │PoseFrame│ ───► Pose Analysis (Web Worker)
    └─────────┘
         │
         ├──────────────────────┐
         ▼                      ▼
  ┌──────────────┐      ┌────────────────┐
  │ Rep Detection│      │ Form Validation│
  └──────┬───────┘      └────────┬───────┘
         │                       │
         ▼                       ▼
    ┌─────────┐          ┌────────────────┐
    │RepEvent │          │FeedbackPrompt  │
    └────┬────┘          └───────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │ExerciseSession  │ (Updated in Zustand store)
            └─────────────────┘
                     │
                     ▼
            ┌──────────────────┐
            │   UI Updates     │
            │ (Rep count, etc.)│
            └──────────────────┘
```

---

## State Management

**Primary Store**: Zustand `workoutStore`

```typescript
interface WorkoutStore {
  /** Current active session (null if not working out) */
  currentSession: ExerciseSession | null;
  
  /** Start a new workout session */
  startSession: (exercise: ExerciseType, discipline: Discipline) => void;
  
  /** Update session with new rep */
  addRep: (rep: RepEvent) => void;
  
  /** Add feedback to session */
  addFeedback: (feedback: FeedbackPrompt) => void;
  
  /** End current session (clears all data) */
  endSession: () => void;
  
  /** Update live metrics (duration, form score) */
  updateMetrics: (metrics: Partial<ExerciseSession>) => void;
}
```

**No Persistence**: Store cleared when user navigates away or closes browser tab.

---

## TypeScript Module Structure

```
packages/pose-analysis-3d/src/types/
├── pose.types.ts          # PoseFrame, Landmark, LandmarkID
├── exercise.types.ts      # ExerciseType, Discipline, ExerciseState
└── index.ts

packages/coaching-engine/src/types/
├── feedback.types.ts      # FeedbackPrompt, FeedbackType, Modality
├── rep.types.ts           # RepEvent, PeakMetrics
├── session.types.ts       # ExerciseSession, SessionStatus
└── index.ts

packages/fitness-coach-app/lib/store/
└── workout-store.ts       # Zustand store implementation
```

---

## Validation Summary

| Entity | Key Validations |
|--------|----------------|
| PoseFrame | Coordinate ranges [0,1], confidence ≥0.9, 12 landmarks present |
| ExerciseSession | Status transitions valid, repCount ≤ targetReps, formScore [0,100] |
| RepEvent | endFrame > startFrame, sequential repNumber, durationMs ≥ 100 |
| FeedbackPrompt | Message in predefined library, critical severity never skipped |

---

## Performance Considerations

- **PoseFrame**: Created 30+ times/second → Must be lightweight, immutable
- **Feedback deduplication**: Prevent same feedback within 5-second window
- **Memory management**: Clear old frames after analysis (keep only last 30 for smoothing)
- **RepEvent history**: Cap at 1000 reps per session (prevents memory leak for marathon sessions)

---

**Document Status**: Complete | **Last Updated**: 2025-10-20
