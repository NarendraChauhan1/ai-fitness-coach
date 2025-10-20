import { RepEvent, ExerciseType, PeakMetrics } from '../types';

/**
 * Basic rep event from pose detector (before form assessment)
 */
export interface BasicRepEvent {
  repNumber: number;
  startFrame: number;
  endFrame: number;
  durationMs: number;
  peakValue: number;
  peakFrame: number;
}

/**
 * Rep counter configuration
 */
export interface RepCounterConfig {
  /** Minimum form score to count rep (0-100, default: 50) */
  minFormScore?: number;

  /** Require voice confirmation for each rep (default: true) */
  voiceConfirmation?: boolean;

  /** Minimum time between reps in ms (debounce, default: 500) */
  minRepInterval?: number;
}

/**
 * Rep statistics
 */
export interface RepStatistics {
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

/**
 * Extended rep event with form score
 */
interface ExtendedRepEvent extends RepEvent {
  formScore?: number;
}

/**
 * Rep counter with form-aware validation
 */
export class RepCounter {
  private count = 0;
  private repHistory: ExtendedRepEvent[] = [];
  private rejectedCount = 0;
  private lastRepTimestamp = 0;
  private config: Required<RepCounterConfig>;

  constructor(
    _exercise: ExerciseType,
    config: RepCounterConfig = {}
  ) {
    this.config = {
      minFormScore: 50,
      voiceConfirmation: true,
      minRepInterval: 500,
      ...config,
    };
  }

  /**
   * Process new rep event from pose detector
   * Transforms basic rep data into full RepEvent with form assessment
   */
  processRep(basicRepEvent: BasicRepEvent, formScore: number): RepEvent | null {
    const now = Date.now();

    // Debounce: Check minimum interval
    if (now - this.lastRepTimestamp < this.config.minRepInterval) {
      return null;
    }

    // Validate form score
    if (formScore < this.config.minFormScore) {
      this.rejectedCount++;
      return null;
    }

    // Accept the rep
    this.count++;
    this.lastRepTimestamp = now;

    // Transform basic rep event into full RepEvent with form assessment
    const peakMetrics: PeakMetrics = {
      peakValue: basicRepEvent.peakValue,
      peakFrame: basicRepEvent.peakFrame,
      thresholdMet: formScore >= this.config.minFormScore,
    };

    const fullRepEvent: RepEvent = {
      repNumber: this.count,
      startFrame: basicRepEvent.startFrame,
      endFrame: basicRepEvent.endFrame,
      durationMs: basicRepEvent.durationMs,
      correctnessScore: formScore,
      errorsDetected: [], // Will be populated by FeedbackGenerator
      feedbackGiven: [], // Will be populated by VoiceCoach
      completedAt: new Date().toISOString(),
      peakMetrics,
    };

    const extendedRep: ExtendedRepEvent = {
      ...fullRepEvent,
      formScore,
    };

    this.repHistory.push(extendedRep);

    return fullRepEvent;
  }

  /**
   * Get current rep count
   */
  getCurrentCount(): number {
    return this.count;
  }

  /**
   * Reset counter
   */
  reset(): void {
    this.count = 0;
    this.repHistory = [];
    this.rejectedCount = 0;
    this.lastRepTimestamp = 0;
  }

  /**
   * Get statistics
   */
  getStatistics(): RepStatistics {
    if (this.repHistory.length === 0) {
      return {
        totalReps: 0,
        averageFormScore: 0,
        bestRep: null,
        rejectedReps: this.rejectedCount,
        averageRepDuration: 0,
      };
    }

    const totalFormScore = this.repHistory.reduce(
      (sum, rep) => sum + (rep.formScore || 0),
      0
    );
    const averageFormScore = totalFormScore / this.repHistory.length;

    const bestRep = this.repHistory.reduce((best, rep) =>
      (rep.formScore || 0) > (best.formScore || 0) ? rep : best
    );

    const totalDuration = this.repHistory.reduce(
      (sum, rep) => sum + rep.durationMs,
      0
    );
    const averageRepDuration = totalDuration / this.repHistory.length;

    return {
      totalReps: this.count,
      averageFormScore,
      bestRep,
      rejectedReps: this.rejectedCount,
      averageRepDuration,
    };
  }
}
