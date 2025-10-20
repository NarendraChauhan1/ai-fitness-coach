// Export types
export * from './types';

// Export geometry utilities
export * from './geometry';

// Export classes
export { PoseDetector, PoseDetectorConfig, PoseAnalysisError, ErrorCode } from './mediapipe/pose-detector';
export { FormValidator, FormValidationResult, FormError, FormMeasurements, FormThresholds } from './exercises/form-validator';
export { PushUpsValidator } from './exercises/push-ups-validator';
export { MarchingValidator } from './exercises/marching-validator';
export { JumpingJacksValidator } from './exercises/jumping-jacks-validator';
export { RepDetector, RepEvent, RepPhase } from './exercises/rep-detector';
export type { RepState } from './exercises/rep-detector';
