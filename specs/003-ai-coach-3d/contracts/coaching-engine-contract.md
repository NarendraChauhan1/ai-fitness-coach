# Contract: coaching-engine Package

**Package**: `@ai-fitness-coach/coaching-engine`  
**Version**: 1.0.0  
**Purpose**: Feedback generation, voice coaching, and motivation system

---

## Public API

### 1. FeedbackGenerator

**Purpose**: Generate contextual feedback based on form analysis

```typescript
class FeedbackGenerator {
  /**
   * Create feedback generator for specific exercise
   */
  constructor(exercise: ExerciseType);
  
  /**
   * Generate feedback based on form validation result
   * @param formResult - Output from FormValidator
   * @param sessionContext - Current session state for deduplication
   * @returns Array of feedback prompts to deliver (prioritized)
   */
  generateFeedback(
    formResult: FormValidationResult,
    sessionContext: SessionContext
  ): FeedbackPrompt[];
  
  /**
   * Generate motivational feedback based on progress
   * @param repCount - Current rep count
   * @param targetReps - Goal reps
   * @param formScore - Recent form quality
   */
  generateMotivation(
    repCount: number,
    targetReps: number,
    formScore: number
  ): FeedbackPrompt | null;
}

interface SessionContext {
  /** Recent feedback history (last 10 seconds) */
  recentFeedback: FeedbackPrompt[];
  
  /** Current session duration in seconds */
  durationSeconds: number;
  
  /** Current rep number */
  repCount: number;
}
```

**Contract Guarantees**:
- ✅ Returns max 1 feedback per form error (prioritized by severity)
- ✅ Never returns duplicate feedback within 5-second window
- ✅ Critical severity feedback always included (never filtered)
- ✅ Generation completes in <5ms

---

### 2. VoiceCoach

**Purpose**: Manage text-to-speech delivery and audio queue

```typescript
class VoiceCoach {
  /**
   * Initialize voice coach with browser TTS
   * @throws Error if Web Speech API not supported
   */
  constructor(config?: VoiceCoachConfig);
  
  /**
   * Speak feedback prompt using TTS
   * @param feedback - Feedback to deliver
   * @returns Promise that resolves when speech completes
   */
  speak(feedback: FeedbackPrompt): Promise<void>;
  
  /**
   * Queue multiple feedback items (auto-prioritizes)
   * @param feedbackList - Array of feedback to queue
   */
  queueFeedback(feedbackList: FeedbackPrompt[]): void;
  
  /**
   * Stop current speech immediately
   */
  stop(): void;
  
  /**
   * Clear all queued feedback
   */
  clearQueue(): void;
  
  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean;
  
  /**
   * Get current queue length
   */
  getQueueLength(): number;
}

interface VoiceCoachConfig {
  /** Voice selection (default: first available) */
  voiceName?: string;
  
  /** Speech rate (0.1-10, default: 1.0) */
  rate?: number;
  
  /** Pitch (0-2, default: 1.0) */
  pitch?: number;
  
  /** Volume (0-1, default: 1.0) */
  volume?: number;
  
  /** Max queue size (default: 3) */
  maxQueueSize?: number;
}
```

**Contract Guarantees**:
- ✅ Queue prioritizes by severity (critical → high → normal → info)
- ✅ Skips low-priority items when queue exceeds `maxQueueSize`
- ✅ Updates `FeedbackPrompt.ttsStatus` during lifecycle
- ✅ Meets ≤200ms latency for first item in queue

**Queue Behavior**:
1. Critical severity: Always queued, never skipped
2. High severity: Queued if space available
3. Normal severity: Queued if queue < 50% capacity
4. Info severity: Only queued if queue empty

---

### 3. RepCounter

**Purpose**: Advanced rep counting with form-aware validation

```typescript
class RepCounter {
  /**
   * Create rep counter for specific exercise
   */
  constructor(exercise: ExerciseType, config?: RepCounterConfig);
  
  /**
   * Process new rep event from RepDetector
   * @param repEvent - Raw rep detection event
   * @param formScore - Form quality for this rep
   * @returns Validated RepEvent or null if rejected
   */
  processRep(
    repEvent: RepEvent,
    formScore: number
  ): RepEvent | null;
  
  /**
   * Get current rep count
   */
  getCurrentCount(): number;
  
  /**
   * Reset counter for new session
   */
  reset(): void;
  
  /**
   * Get statistics for current session
   */
  getStatistics(): RepStatistics;
}

interface RepCounterConfig {
  /** Minimum form score to count rep (0-100, default: 50) */
  minFormScore?: number;
  
  /** Require voice confirmation for each rep (default: true) */
  voiceConfirmation?: boolean;
  
  /** Minimum time between reps in ms (debounce, default: 500) */
  minRepInterval?: number;
}

interface RepStatistics {
  /** Total reps counted */
  totalReps: number;
  
  /** Average form score across all reps */
  averageFormScore: number;
  
  /** Best rep (highest form score) */
  bestRep: RepEvent | null;
  
  /** Reps rejected due to poor form */
  rejectedReps: number;
  
  /** Average rep duration in ms */
  averageRepDuration: number;
}
```

**Contract Guarantees**:
- ✅ Rejects reps below `minFormScore` threshold
- ✅ Debounces rapid false positives (min interval enforcement)
- ✅ Triggers voice confirmation via `VoiceCoach` integration
- ✅ Maintains ≤5% error rate (per spec SC-002)

---

### 4. MotivationEngine

**Purpose**: Generate contextual motivational messages

```typescript
class MotivationEngine {
  /**
   * Generate motivational prompt based on session state
   * @param state - Current session state
   * @returns Motivational feedback or null if not triggered
   */
  generateMotivation(state: MotivationState): FeedbackPrompt | null;
  
  /**
   * Check if milestone reached (trigger celebration)
   * @param repCount - Current rep count
   * @returns Milestone feedback if triggered
   */
  checkMilestone(repCount: number): FeedbackPrompt | null;
}

interface MotivationState {
  /** Current rep count */
  repCount: number;
  
  /** Target reps */
  targetReps: number;
  
  /** Recent form score trend (last 5 reps) */
  formTrend: number[];
  
  /** Session duration in seconds */
  durationSeconds: number;
  
  /** Consecutive good reps (form ≥ 80) */
  streak: number;
}
```

**Contract Guarantees**:
- ✅ Returns null most of the time (avoid spam)
- ✅ Triggers on: 25%, 50%, 75%, 100% completion
- ✅ Triggers on: 5+ rep streak with good form
- ✅ Triggers on: Form improvement detected (trend analysis)

**Predefined Motivational Messages** (~10 phrases):
- "Great form! Keep it up!"
- "You're doing amazing!"
- "Halfway there! Stay strong!"
- "Perfect technique!"
- "Almost done! Finish strong!"
- "Excellent work!"
- "Nice steady pace!"
- "Your form is improving!"
- "Last few reps! You got this!"
- "Session complete! Well done!"

---

## Data Types (Re-exported)

```typescript
export {
  FeedbackPrompt,
  FeedbackType,
  Severity,
  Modality,
  TriggerCondition,
  TTSStatus,
  RepEvent,
  ExerciseSession
} from './types';
```

---

## Predefined Feedback Library

**Corrective Feedback** (~20 phrases):

```typescript
const CORRECTIVE_PROMPTS = {
  // Knee corrections
  knee_valgus: "Keep your knees out",
  knee_depth: "Go lower",
  
  // Back corrections
  back_rounding: "Straighten your back",
  lower_back_arch: "Tighten your core",
  
  // Arm/shoulder corrections
  elbow_flaring: "Tuck your elbows in",
  shoulder_hunch: "Shoulders back and down",
  
  // Depth/range corrections
  shallow_depth: "Deeper movement",
  incomplete_extension: "Fully extend",
  
  // Asymmetry corrections
  asymmetric_left: "Even out your left side",
  asymmetric_right: "Even out your right side",
  
  // Positioning
  too_close: "Step back from camera",
  too_far: "Move closer to camera",
  neck_forward: "Keep your neck neutral",
  
  // Timing
  too_fast: "Slow down your tempo",
  too_slow: "Pick up the pace",
  
  // General
  hold_position: "Hold this position",
  good_form: "Good form",
  reset_position: "Reset your position"
};
```

**Warning Messages** (~5 phrases):
- "Stop! Unsafe form detected"
- "Risk of injury, please adjust"
- "Take a break if needed"
- "Check your form"
- "Move back into frame"

---

## Integration Example

```typescript
import { 
  FeedbackGenerator, 
  VoiceCoach, 
  RepCounter, 
  MotivationEngine 
} from '@ai-fitness-coach/coaching-engine';

// Initialize components
const feedbackGen = new FeedbackGenerator('push_ups');
const voiceCoach = new VoiceCoach({ rate: 1.0, maxQueueSize: 3 });
const repCounter = new RepCounter('push_ups', { minFormScore: 50 });
const motivator = new MotivationEngine();

// Process form validation results
function handleFormResult(
  formResult: FormValidationResult,
  sessionContext: SessionContext
) {
  // Generate corrective feedback
  const feedback = feedbackGen.generateFeedback(formResult, sessionContext);
  
  // Queue for voice delivery
  if (feedback.length > 0) {
    voiceCoach.queueFeedback(feedback);
  }
}

// Process rep completion
function handleRepComplete(
  repEvent: RepEvent,
  formScore: number,
  motivationState: MotivationState
) {
  // Validate and count rep
  const validatedRep = repCounter.processRep(repEvent, formScore);
  
  if (validatedRep) {
    // Voice confirmation
    voiceCoach.speak({
      message: `${repCounter.getCurrentCount()}`,
      type: 'confirmation',
      severity: 'normal',
      modality: ['voice']
    });
    
    // Check for motivational triggers
    const motivation = motivator.generateMotivation(motivationState);
    if (motivation) {
      voiceCoach.queueFeedback([motivation]);
    }
  }
}
```

---

## Testing Contract

Package must include:
- ✅ Unit tests for feedback generation logic
- ✅ Unit tests for queue prioritization
- ✅ Mock Web Speech API for consistent testing
- ✅ Integration tests for full coaching pipeline

---

**Contract Version**: 1.0.0 | **Last Updated**: 2025-10-20
