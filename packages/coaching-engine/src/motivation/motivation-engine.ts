/**
 * Motivation Engine
 * Generates motivational prompts based on workout progress and milestones
 */

import { FeedbackPrompt, FeedbackType, Severity, Modality, TTSStatus } from '../types/feedback.types';

/**
 * Configuration for milestone percentages that trigger motivation
 */
interface MilestoneConfig {
  /** Milestone percentages (0-100) */
  percentages: number[];
  /** Minimum consecutive good reps to trigger streak motivation */
  streakThreshold: number;
}

/**
 * Default milestone configuration
 */
const DEFAULT_MILESTONES: MilestoneConfig = {
  percentages: [25, 50, 75, 100],
  streakThreshold: 5,
};

/**
 * Motivational prompt templates
 */
const MOTIVATIONAL_PROMPTS = {
  milestone25: "Great start! You're 25% done. Keep it up!",
  milestone50: "Halfway there! You're doing amazing!",
  milestone75: "Almost done! Just 25% more to go!",
  milestone100: "Excellent work! You've completed your set!",
  streak5: "Five in a row with perfect form! Outstanding!",
  streak10: "Ten perfect reps! You're on fire!",
  personalBest: "That's a new personal best! Keep pushing!",
  encouragement: "You've got this! Stay focused!",
};

/**
 * Motivation Engine
 * Tracks progress and generates motivational feedback at key milestones
 */
export class MotivationEngine {
  private config: MilestoneConfig;
  private triggeredMilestones: Set<number>;
  private currentStreak: number;
  private lastStreakMilestone: number;

  /**
   * Creates a new MotivationEngine instance
   * @param config - Optional milestone configuration
   */
  constructor(config?: Partial<MilestoneConfig>) {
    this.config = { ...DEFAULT_MILESTONES, ...config };
    this.triggeredMilestones = new Set();
    this.currentStreak = 0;
    this.lastStreakMilestone = 0;
  }

  /**
   * Generate motivational feedback based on current progress
   * @param currentReps - Number of reps completed
   * @param targetReps - Total reps target
   * @param lastRepFormScore - Form score of the last rep (0-100)
   * @returns FeedbackPrompt if milestone reached, null otherwise
   */
  generateMotivation(
    currentReps: number,
    targetReps: number,
    lastRepFormScore: number
  ): FeedbackPrompt | null {
    // Update streak tracking
    if (lastRepFormScore >= 70) {
      this.currentStreak++;
    } else {
      this.currentStreak = 0;
    }

    // Check for streak milestone first (higher priority)
    const streakFeedback = this.checkMilestone(currentReps);
    if (streakFeedback) {
      return streakFeedback;
    }

    // Check for percentage milestone
    const percentageComplete = (currentReps / targetReps) * 100;
    for (const milestone of this.config.percentages) {
      if (percentageComplete >= milestone && !this.triggeredMilestones.has(milestone)) {
        this.triggeredMilestones.add(milestone);
        return this.createMotivationalPrompt(milestone, currentReps);
      }
    }

    return null;
  }

  /**
   * Check for streak-based milestones
   * @param currentReps - Current rep count
   * @param targetReps - Target rep count
   * @returns FeedbackPrompt if streak milestone reached, null otherwise
   */
  checkMilestone(currentReps: number): FeedbackPrompt | null {
    // Check for 5-rep streak
    if (
      this.currentStreak >= this.config.streakThreshold &&
      this.currentStreak > this.lastStreakMilestone
    ) {
      this.lastStreakMilestone = this.currentStreak;

      // Determine which streak message to use
      let message: string;
      if (this.currentStreak >= 10) {
        message = MOTIVATIONAL_PROMPTS.streak10;
      } else {
        message = MOTIVATIONAL_PROMPTS.streak5;
      }

      return {
        id: `motivation-streak-${Date.now()}`,
        message,
        type: FeedbackType.MOTIVATIONAL,
        severity: Severity.NORMAL,
        modality: [Modality.VOICE, Modality.VISUAL],
        triggeredAt: new Date().toISOString(),
        triggerCondition: {
          rule: 'good_form_streak',
          measuredValue: this.currentStreak,
          threshold: this.config.streakThreshold,
        },
        ttsStatus: TTSStatus.QUEUED,
        repNumber: currentReps,
      };
    }

    return null;
  }

  /**
   * Create a motivational prompt for a milestone percentage
   * @param milestone - Milestone percentage
   * @param repNumber - Current rep number
   * @returns FeedbackPrompt
   */
  private createMotivationalPrompt(milestone: number, repNumber: number): FeedbackPrompt {
    let message: string;
    switch (milestone) {
      case 25:
        message = MOTIVATIONAL_PROMPTS.milestone25;
        break;
      case 50:
        message = MOTIVATIONAL_PROMPTS.milestone50;
        break;
      case 75:
        message = MOTIVATIONAL_PROMPTS.milestone75;
        break;
      case 100:
        message = MOTIVATIONAL_PROMPTS.milestone100;
        break;
      default:
        message = MOTIVATIONAL_PROMPTS.encouragement;
    }

    return {
      id: `motivation-milestone-${milestone}-${Date.now()}`,
      message,
      type: FeedbackType.MOTIVATIONAL,
      severity: Severity.INFO,
      modality: [Modality.VOICE, Modality.VISUAL],
      triggeredAt: new Date().toISOString(),
      triggerCondition: {
        rule: 'milestone_percentage_reached',
        measuredValue: milestone,
        threshold: milestone,
      },
      ttsStatus: TTSStatus.QUEUED,
      repNumber,
    };
  }

  /**
   * Reset the motivation engine for a new session
   */
  reset(): void {
    this.triggeredMilestones.clear();
    this.currentStreak = 0;
    this.lastStreakMilestone = 0;
  }

  /**
   * Get current streak count
   * @returns Current streak count
   */
  getCurrentStreak(): number {
    return this.currentStreak;
  }
}
