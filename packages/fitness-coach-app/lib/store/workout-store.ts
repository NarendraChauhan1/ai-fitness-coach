import { create } from 'zustand';
import {
  ExerciseSession,
  ExerciseType,
  Discipline,
  SessionStatus,
  RepEvent,
  FeedbackPrompt,
} from '@ai-fitness-coach/coaching-engine';

/**
 * Workout store state
 */
interface WorkoutState {
  /** Current active session */
  currentSession: ExerciseSession | null;

  /** Start a new workout session */
  startSession: (
    exercise: ExerciseType,
    discipline: Discipline,
    targetReps?: number
  ) => void;

  /** Add a completed rep */
  addRep: (rep: RepEvent) => void;

  /** Add feedback to session */
  addFeedback: (feedback: FeedbackPrompt) => void;

  /** Update session metrics */
  updateMetrics: (updates: Partial<ExerciseSession>) => void;

  /** End current session */
  endSession: () => void;

  /** Update session status */
  setStatus: (status: SessionStatus) => void;
}

/**
 * Create workout store
 */
export const useWorkoutStore = create<WorkoutState>((set) => ({
  currentSession: null,

  startSession: (exercise, discipline, targetReps = 10) => {
    const session: ExerciseSession = {
      id: `session-${Date.now()}`,
      startedAt: new Date().toISOString(),
      exercise,
      discipline,
      repCount: 0,
      targetReps,
      durationSeconds: 0,
      formScore: 100,
      feedbackHistory: [],
      repHistory: [],
      status: SessionStatus.ACTIVE,
      errorCounts: {},
    };

    set({ currentSession: session });
  },

  addRep: (rep) => {
    set((state) => {
      if (!state.currentSession) return state;

      const updatedSession = {
        ...state.currentSession,
        repCount: state.currentSession.repCount + 1,
        repHistory: [...state.currentSession.repHistory, rep],
      };

      return { currentSession: updatedSession };
    });
  },

  addFeedback: (feedback) => {
    set((state) => {
      if (!state.currentSession) return state;

      const updatedSession = {
        ...state.currentSession,
        feedbackHistory: [...state.currentSession.feedbackHistory, feedback],
      };

      // Update error counts
      const errorType = feedback.triggerCondition.rule;
      updatedSession.errorCounts = {
        ...updatedSession.errorCounts,
        [errorType]: (updatedSession.errorCounts[errorType] || 0) + 1,
      };

      return { currentSession: updatedSession };
    });
  },

  updateMetrics: (updates) => {
    set((state) => {
      if (!state.currentSession) return state;

      return {
        currentSession: {
          ...state.currentSession,
          ...updates,
        },
      };
    });
  },

  setStatus: (status) => {
    set((state) => {
      if (!state.currentSession) return state;

      return {
        currentSession: {
          ...state.currentSession,
          status,
        },
      };
    });
  },

  endSession: () => {
    set({ currentSession: null });
  },
}));
