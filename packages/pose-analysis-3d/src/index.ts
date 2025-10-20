// Export types
export * from './types';

// Export geometry utilities
export * from './geometry';

// Export classes
export { PoseDetector, PoseAnalysisError, ErrorCode } from './mediapipe/pose-detector';
export type { PoseDetectorConfig } from './mediapipe/pose-detector';
export { FormValidator } from './exercises/form-validator';
export type { FormValidationResult, FormError, FormMeasurements, FormThresholds } from './exercises/form-validator';
export { PushUpsValidator } from './exercises/push-ups-validator';
export { MarchingValidator } from './exercises/marching-validator';
export { JumpingJacksValidator } from './exercises/jumping-jacks-validator';
export { RepDetector, RepPhase } from './exercises/rep-detector';
export type { RepEvent, RepState } from './exercises/rep-detector';
