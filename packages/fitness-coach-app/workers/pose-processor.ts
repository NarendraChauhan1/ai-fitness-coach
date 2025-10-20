/**
 * Web Worker for MediaPipe pose processing
 * Runs off the main thread to maintain 30+ FPS UI performance
 */

import { PoseDetector, PoseFrame } from '@ai-fitness-coach/pose-analysis-3d';

let detector: PoseDetector | null = null;
let isInitialized = false;

/**
 * Message types for worker communication
 */
type WorkerMessage =
  | { type: 'INIT'; config?: { minDetectionConfidence?: number; minTrackingConfidence?: number } }
  | { type: 'PROCESS_FRAME'; imageData: ImageData; timestamp: number }
  | { type: 'DISPOSE' };

/**
 * Response types from worker
 */
type WorkerResponse =
  | { type: 'INITIALIZED'; success: boolean; error?: string }
  | { type: 'POSE_DETECTED'; poseFrame: PoseFrame; processingTime: number }
  | { type: 'POSE_NOT_DETECTED'; error: string }
  | { type: 'ERROR'; error: string }
  | { type: 'DISPOSED' };

/**
 * Handle incoming messages
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  try {
    switch (message.type) {
      case 'INIT':
        await handleInit(message.config);
        break;

      case 'PROCESS_FRAME':
        await handleProcessFrame(message.imageData, message.timestamp);
        break;

      case 'DISPOSE':
        handleDispose();
        break;

      default:
        postError('Unknown message type');
    }
  } catch (error) {
    postError(error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Initialize MediaPipe detector
 */
async function handleInit(config?: { minDetectionConfidence?: number; minTrackingConfidence?: number }) {
  try {
    if (isInitialized) {
      postResponse({ type: 'INITIALIZED', success: true });
      return;
    }

    detector = new PoseDetector({
      enableGpu: true,
      minDetectionConfidence: config?.minDetectionConfidence || 0.5,
      minTrackingConfidence: config?.minTrackingConfidence || 0.5,
      onProgress: (percent) => {
        // Could send progress updates to main thread if needed
        console.log(`MediaPipe loading: ${percent}%`);
      },
    });

    await detector.initialize();
    isInitialized = true;

    postResponse({ type: 'INITIALIZED', success: true });
  } catch (error) {
    postResponse({
      type: 'INITIALIZED',
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize',
    });
  }
}

/**
 * Process video frame for pose detection
 */
async function handleProcessFrame(imageData: ImageData, _timestamp: number) {
  if (!detector || !isInitialized) {
    postError('Detector not initialized');
    return;
  }

  const startTime = performance.now();

  try {
    // Detect pose directly from ImageData
    const poseFrame = await detector.detectPose(imageData);

    // Calculate processing time
    const processingTime = performance.now() - startTime;

    // Send result back to main thread
    postResponse({
      type: 'POSE_DETECTED',
      poseFrame,
      processingTime,
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('No pose detected')) {
      postResponse({
        type: 'POSE_NOT_DETECTED',
        error: 'No pose detected in frame',
      });
    } else {
      postError(error instanceof Error ? error.message : 'Processing failed');
    }
  }
}

/**
 * Dispose detector and clean up resources
 */
function handleDispose() {
  if (detector) {
    detector.dispose();
    detector = null;
  }
  isInitialized = false;

  postResponse({ type: 'DISPOSED' });
}

/**
 * Post response to main thread
 */
function postResponse(response: WorkerResponse) {
  self.postMessage(response);
}

/**
 * Post error to main thread
 */
function postError(error: string) {
  postResponse({ type: 'ERROR', error });
}

// Export empty object for TypeScript
export {};
