'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseFrame } from '@ai-fitness-coach/pose-analysis-3d';

interface UsePoseDetectorOptions {
  onPoseDetected?: (poseFrame: PoseFrame) => void;
  onError?: (error: string) => void;
}

interface PoseDetectorState {
  isInitialized: boolean;
  isProcessing: boolean;
  error: string | null;
  fps: number;
}

/**
 * Hook to manage Web Worker for pose detection
 */
export function usePoseDetector(options: UsePoseDetectorOptions = {}) {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<PoseDetectorState>({
    isInitialized: false,
    isProcessing: false,
    error: null,
    fps: 0,
  });

  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now() });
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const restartAttemptsRef = useRef(0);
  const MAX_RESTART_ATTEMPTS = 3;
  const optionsRef = useRef(options);
  const initializeWorkerRef = useRef<() => void>(() => {});

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  /**
   * Handle worker crash and attempt restart
   */
  const handleWorkerCrash = useCallback(() => {
    console.error('Worker crashed, attempting restart...');
    
    if (restartAttemptsRef.current >= MAX_RESTART_ATTEMPTS) {
      setState((prev) => ({
        ...prev,
        error: 'Worker crashed permanently after 3 attempts',
        isInitialized: false,
      }));
      optionsRef.current?.onError?.('Pose detector failed permanently. Please refresh the page.');
      return;
    }

    // Terminate crashed worker
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    // Increment restart attempts
    restartAttemptsRef.current++;

    // Attempt restart after delay
    restartTimeoutRef.current = setTimeout(() => {
      console.log(`Restart attempt ${restartAttemptsRef.current}/${MAX_RESTART_ATTEMPTS}`);
      initializeWorkerRef.current();
    }, 1000); // 1 second delay
  }, []);

  /**
   * Initialize or restart worker
   */
  const initializeWorker = useCallback(() => {
    // Create Web Worker
    workerRef.current = new Worker(new URL('../../workers/pose-processor.ts', import.meta.url));

    // Handle worker errors and crashes
    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error);
      handleWorkerCrash();
    };

    // Handle messages from worker
    workerRef.current.onmessage = (event) => {
      const message = event.data;

      switch (message.type) {
        case 'INITIALIZED':
          if (message.success) {
            setState((prev) => ({ ...prev, isInitialized: true, error: null }));
          } else {
            setState((prev) => ({
              ...prev,
              isInitialized: false,
              error: message.error || 'Initialization failed',
            }));
            optionsRef.current?.onError?.(message.error || 'Initialization failed');
          }
          break;

        case 'POSE_DETECTED':
          updateFPS();
          setState((prev) => ({ ...prev, isProcessing: false }));
          optionsRef.current?.onPoseDetected?.(message.poseFrame);
          break;

        case 'POSE_NOT_DETECTED':
          setState((prev) => ({ ...prev, isProcessing: false }));
          // Don't treat as error, just no pose in frame
          break;

        case 'ERROR':
          setState((prev) => ({ ...prev, isProcessing: false, error: message.error }));
          optionsRef.current?.onError?.(message.error);
          break;

        case 'DISPOSED':
          setState((prev) => ({ ...prev, isInitialized: false }));
          break;
      }
    };

    // Initialize detector
    workerRef.current.postMessage({ type: 'INIT' });

    // Reset restart attempts on successful initialization
    if (restartAttemptsRef.current > 0) {
      console.log('Worker successfully restarted');
      restartAttemptsRef.current = 0;
    }
  }, [handleWorkerCrash]);

  useEffect(() => {
    initializeWorker();

    return () => {
      // Clear restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'DISPOSE' });
        workerRef.current.terminate();
      }
    };
  }, [initializeWorker]);

  /**
   * Update FPS counter
   */
  const updateFPS = () => {
    fpsCounterRef.current.frames++;
    const now = performance.now();
    const elapsed = now - fpsCounterRef.current.lastTime;

    if (elapsed >= 1000) {
      const fps = Math.round((fpsCounterRef.current.frames / elapsed) * 1000);
      setState((prev) => ({ ...prev, fps }));
      fpsCounterRef.current.frames = 0;
      fpsCounterRef.current.lastTime = now;
    }
  };

  /**
   * Process a video frame
   */
  const processFrame = useCallback(
    (videoElement: HTMLVideoElement) => {
      if (!workerRef.current || !state.isInitialized || state.isProcessing) {
        return;
      }

      // Create canvas to extract ImageData
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Get ImageData
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Send to worker
      setState((prev) => ({ ...prev, isProcessing: true }));
      workerRef.current.postMessage(
        {
          type: 'PROCESS_FRAME',
          imageData,
          timestamp: performance.now(),
        },
        [imageData.data.buffer] // Transfer ImageData buffer for better performance
      );
    },
    [state.isInitialized, state.isProcessing]
  );

  return {
    processFrame,
    isInitialized: state.isInitialized,
    isProcessing: state.isProcessing,
    error: state.error,
    fps: state.fps,
  };
}
