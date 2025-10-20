'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Loader2, Video } from 'lucide-react';
import { CameraDiagnostics } from './camera-diagnostics';

export interface CameraError {
  code: 'PERMISSION_DENIED' | 'NO_CAMERA_FOUND' | 'UNKNOWN_ERROR';
  message: string;
}

interface CameraCaptureProps {
  onReady?: (videoElement: HTMLVideoElement) => void;
  onError?: (error: CameraError) => void;
  className?: string;
  autoStart?: boolean; // If true, starts camera automatically (requires user interaction first)
}

/**
 * Camera capture component with getUserMedia integration
 * Requires explicit user interaction before requesting camera permission
 */
export function CameraCapture({ onReady, onError, className = '', autoStart = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isBrowserReady, setIsBrowserReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  // Check if we're in a browser environment and APIs are available
  const checkBrowserSupport = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    if (typeof navigator === 'undefined') {
      return false;
    }
    if (!navigator.mediaDevices) {
      return false;
    }
    if (!navigator.mediaDevices.getUserMedia) {
      return false;
    }
    return true;
  }, []);


  const initializeCamera = useCallback(async () => {
    console.log('[Camera] initializeCamera() called');
    setIsInitializing(true);
    setError(null);
    
    try {
      // Ensure we're in a browser environment
      console.log('[Camera] Checking browser support...');
      if (!checkBrowserSupport()) {
        console.error('[Camera] Browser support check failed');
        throw new Error('Camera API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
      }
      console.log('[Camera] Browser support OK, requesting camera access...');

      // Request camera access with constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user', // Front camera
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      console.log('[Camera] Camera stream obtained successfully');
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setIsReady(true);
                setIsInitializing(false);
                if (onReady && videoRef.current) {
                  onReady(videoRef.current);
                }
              })
              .catch((playErr) => {
                console.error('Video play error:', playErr);
                const cameraError: CameraError = {
                  code: 'UNKNOWN_ERROR',
                  message: 'Failed to start video playback. Please try again.',
                };
                setError(cameraError);
                setIsInitializing(false);
                if (onError) {
                  onError(cameraError);
                }
              });
          }
        };
      }
    } catch (err) {
      console.error('[Camera] Camera initialization error:', err);

      let cameraError: CameraError;

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          cameraError = {
            code: 'PERMISSION_DENIED',
            message: 'Camera permission denied. Please click "Allow" when prompted or enable camera access in your browser settings.',
          };
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          cameraError = {
            code: 'NO_CAMERA_FOUND',
            message: 'No camera found. Please connect a camera and try again.',
          };
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          cameraError = {
            code: 'UNKNOWN_ERROR',
            message: 'Camera is already in use by another application. Please close other apps using the camera.',
          };
        } else {
          cameraError = {
            code: 'UNKNOWN_ERROR',
            message: `Camera error: ${err.message}`,
          };
        }
      } else {
        cameraError = {
          code: 'UNKNOWN_ERROR',
          message: err instanceof Error ? err.message : 'Failed to initialize camera. Please check your browser settings.',
        };
      }

      setError(cameraError);
      setIsInitializing(false);

      if (onError) {
        onError(cameraError);
      }
    }
  }, [onError, onReady, checkBrowserSupport]);

  const handleStartCamera = useCallback(() => {
    console.log('[Camera] User clicked Enable Camera button');
    if (!isBrowserReady) {
      console.warn('[Camera] Browser not ready yet, waiting...');
      return;
    }
    console.log('[Camera] Setting hasUserInteracted=true and initializing camera');
    setHasUserInteracted(true);
    void initializeCamera();
  }, [initializeCamera, isBrowserReady]);

  const handleRetry = useCallback(() => {
    setError(null);
    void initializeCamera();
  }, [initializeCamera]);

  // Check if browser is ready (client-side only)
  useEffect(() => {
    // Ensure we're in the browser
    if (typeof window !== 'undefined') {
      console.log('[Camera] Window detected, browser is loading...');
      // Small delay to ensure all browser APIs are loaded
      const timer = setTimeout(() => {
        console.log('[Camera] Browser ready, APIs loaded');
        setIsBrowserReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  // Auto-start if enabled and browser is ready
  useEffect(() => {
    if (autoStart && isBrowserReady && !isReady && !isInitializing && !error && !hasUserInteracted) {
      // Additional delay to ensure everything is mounted
      const timer = setTimeout(() => {
        setHasUserInteracted(true);
        void initializeCamera();
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoStart, isBrowserReady, isReady, isInitializing, error, hasUserInteracted, initializeCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className={`relative ${className}`}>
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }} // Mirror for front camera
      />

      {/* Browser initializing */}
      {!isBrowserReady && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
      )}

      {/* Camera permission prompt - shown before user interaction */}
      {isBrowserReady && !hasUserInteracted && !isReady && !error && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="bg-white bg-opacity-10 rounded-full p-6 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
              <Video className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-white text-2xl font-bold mb-3">Camera Access Required</h3>
            <p className="text-gray-200 mb-6">
              This app needs access to your camera to track your workout form and provide real-time feedback.
            </p>
            <button
              onClick={handleStartCamera}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors shadow-lg"
            >
              Enable Camera
            </button>
            <p className="text-gray-300 text-sm mt-4">
              Click "Allow" when your browser asks for camera permission
            </p>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isInitializing && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Initializing camera...</p>
            <p className="text-gray-400 text-sm mt-2">Please allow camera access when prompted</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <CameraOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-white text-xl font-bold mb-3">Camera Error</h3>
            <p className="text-gray-300 mb-6">{error.message}</p>
            
            {error.code === 'PERMISSION_DENIED' && (
              <div className="bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded-lg p-4 mb-4 text-left">
                <p className="text-yellow-200 text-sm font-semibold mb-2">How to fix:</p>
                <ol className="text-yellow-100 text-sm space-y-1 list-decimal list-inside">
                  <li>Click the camera icon in your browser's address bar</li>
                  <li>Select "Allow" for camera access</li>
                  <li>Click the "Try Again" button below</li>
                </ol>
              </div>
            )}
            
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Ready indicator */}
      {isReady && !error && (
        <div className="absolute top-4 right-4 bg-green-500 rounded-full p-2 shadow-lg animate-pulse">
          <Camera className="w-6 h-6 text-white" />
        </div>
      )}

      {/* Diagnostics panel - shown when there's an error */}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 max-h-48 overflow-y-auto">
          <CameraDiagnostics />
        </div>
      )}
    </div>
  );
}
