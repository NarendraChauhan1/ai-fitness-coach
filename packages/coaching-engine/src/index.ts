// Export types
export * from './types';

// Export feedback prompts
export * from './feedback/prompts';

// Export classes
export { FeedbackGenerator, SessionContext } from './feedback/feedback-generator';
export { VoiceCoach, VoiceCoachConfig } from './voice/voice-coach';
export { RepCounter, RepCounterConfig, RepStatistics, BasicRepEvent } from './rep-counter/rep-counter';
export { MotivationEngine } from './motivation/motivation-engine';
