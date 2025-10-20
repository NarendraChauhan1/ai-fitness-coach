// Export types
export * from './types';

// Export feedback prompts
export * from './feedback/prompts';

// Export classes
export { FeedbackGenerator } from './feedback/feedback-generator';
export type { SessionContext } from './feedback/feedback-generator';
export { VoiceCoach } from './voice/voice-coach';
export type { VoiceCoachConfig } from './voice/voice-coach';
export { RepCounter } from './rep-counter/rep-counter';
export type { RepCounterConfig, RepStatistics, BasicRepEvent } from './rep-counter/rep-counter';
export { MotivationEngine } from './motivation/motivation-engine';
