import { Pose, Results, POSE_CONNECTIONS } from '@mediapipe/pose';
import { PoseFrame, Landmark, LandmarkID, LandmarkConfidence, ExerciseState } from '../types';

/**
 * Configuration for PoseDetector
 */
export interface PoseDetectorConfig {
  /** Use GPU acceleration (default: true) */
  enableGpu?: boolean;

  /** Minimum detection confidence (0-1, default: 0.5) */
  minDetectionConfidence?: number;

  /** Minimum tracking confidence (0-1, default: 0.5) */
  minTrackingConfidence?: number;

  /** Callback for initialization progress */
  onProgress?: (percent: number) => void;
}

/**
 * Error codes for pose detection
 */
export enum ErrorCode {
  WEBGL_NOT_SUPPORTED = 'WEBGL_NOT_SUPPORTED',
  WASM_LOAD_FAILED = 'WASM_LOAD_FAILED',
  POSE_NOT_DETECTED = 'POSE_NOT_DETECTED',
  INVALID_FRAME = 'INVALID_FRAME',
  NOT_INITIALIZED = 'NOT_INITIALIZED',
}

/**
 * Custom error class for pose analysis
 */
export class PoseAnalysisError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PoseAnalysisError';
  }
}

/**
 * MediaPipe Pose detector for 3D landmark detection
 */
export class PoseDetector {
  private pose: Pose | null = null;
  private ready = false;
  private frameCounter = 0;

  constructor(private config: PoseDetectorConfig = {}) {
    this.config = {
      enableGpu: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      ...config,
    };
  }

  /**
   * Initialize MediaPipe Pose
   */
  async initialize(): Promise<void> {
    try {
      this.pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      this.pose.setOptions({
        modelComplexity: 2, // Heavy variant
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: this.config.minDetectionConfidence!,
        minTrackingConfidence: this.config.minTrackingConfidence!,
      });

      // Report progress
      if (this.config.onProgress) {
        this.config.onProgress(50);
      }

      await this.pose.initialize();

      this.ready = true;

      if (this.config.onProgress) {
        this.config.onProgress(100);
      }
    } catch (error) {
      throw new PoseAnalysisError(
        ErrorCode.WASM_LOAD_FAILED,
        'Failed to initialize MediaPipe',
        { originalError: error }
      );
    }
  }

  /**
   * Process video frame and extract 3D landmarks
   * @param videoFrame - HTMLVideoElement or ImageData
   * @returns PoseFrame with 12 core landmarks
   */
  async detectPose(
    videoFrame: HTMLVideoElement | HTMLImageElement | ImageData
  ): Promise<PoseFrame> {
    if (!this.ready || !this.pose) {
      throw new PoseAnalysisError(ErrorCode.NOT_INITIALIZED, 'Detector not initialized');
    }

    try {
      const results = await this.processPoseFrame(videoFrame);

      if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
        throw new PoseAnalysisError(
          ErrorCode.POSE_NOT_DETECTED,
          'No pose detected in frame'
        );
      }

      // Extract our 12 core landmarks
      const landmarks = this.extractCoreLandmarks(results);
      const confidence = this.calculateConfidence(landmarks);

      this.frameCounter++;

      return {
        timestamp: performance.now(),
        landmarks,
        confidence,
        state: ExerciseState.IDLE,
        frameNumber: this.frameCounter,
      };
    } catch (error) {
      if (error instanceof PoseAnalysisError) {
        throw error;
      }
      throw new PoseAnalysisError(
        ErrorCode.INVALID_FRAME,
        'Failed to process frame',
        { originalError: error }
      );
    }
  }

  /**
   * Process frame with MediaPipe
   */
  private async processPoseFrame(
    videoFrame: HTMLVideoElement | HTMLImageElement | ImageData
  ): Promise<Results> {
    return new Promise((resolve, reject) => {
      if (!this.pose) {
        reject(new Error('Pose not initialized'));
        return;
      }

      this.pose.onResults(resolve);
      this.pose.send({ image: videoFrame as HTMLImageElement }).catch(reject);
    });
  }

  /**
   * Extract 12 core landmarks from MediaPipe results
   */
  private extractCoreLandmarks(results: Results): Landmark[] {
    const coreIds = [
      LandmarkID.LEFT_SHOULDER,
      LandmarkID.RIGHT_SHOULDER,
      LandmarkID.LEFT_ELBOW,
      LandmarkID.RIGHT_ELBOW,
      LandmarkID.LEFT_WRIST,
      LandmarkID.RIGHT_WRIST,
      LandmarkID.LEFT_HIP,
      LandmarkID.RIGHT_HIP,
      LandmarkID.LEFT_KNEE,
      LandmarkID.RIGHT_KNEE,
      LandmarkID.LEFT_ANKLE,
      LandmarkID.RIGHT_ANKLE,
    ];

    return coreIds.map((id) => {
      const mpLandmark = results.poseLandmarks[id];
      return {
        id,
        x: mpLandmark.x,
        y: mpLandmark.y,
        z: mpLandmark.z,
        visibility: mpLandmark.visibility || 0,
      };
    });
  }

  /**
   * Calculate confidence metrics
   */
  private calculateConfidence(landmarks: Landmark[]): LandmarkConfidence {
    const visibilityScores = landmarks.map((l) => l.visibility);
    const sum = visibilityScores.reduce((acc, v) => acc + v, 0);
    const average = sum / visibilityScores.length;
    const minimum = Math.min(...visibilityScores);

    const byLandmark = landmarks.reduce(
      (acc, landmark) => {
        acc[landmark.id] = landmark.visibility;
        return acc;
      },
      {} as Record<LandmarkID, number>
    );

    return { average, minimum, byLandmark };
  }

  /**
   * Check if detector is ready
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    this.ready = false;
    this.frameCounter = 0;
  }
}

// Export connections for overlay rendering
export { POSE_CONNECTIONS };
