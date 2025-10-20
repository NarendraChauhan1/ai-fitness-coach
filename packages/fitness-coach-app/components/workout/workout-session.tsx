'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkoutStore } from '@/lib/store/workout-store';
import {
  ExerciseType,
  Discipline,
  FeedbackGenerator,
  VoiceCoach,
  RepCounter,
  MotivationEngine,
  BasicRepEvent,
  FeedbackPrompt,
  FeedbackType,
  Modality,
  Severity,
  TTSStatus,
} from '@ai-fitness-coach/coaching-engine';
import {
  PushUpsValidator,
  MarchingValidator,
  JumpingJacksValidator,
  RepDetector,
  PoseFrame,
} from '@ai-fitness-coach/pose-analysis-3d';
import { CameraCapture } from '@/components/camera/camera-capture';
import { PoseOverlay } from '@/components/pose-overlay/pose-overlay';
import { FeedbackDisplay } from '@/components/feedback-ui/feedback-display';
import { WorkoutControls } from '@/components/feedback-ui/workout-controls';
import { usePoseDetector } from '@/lib/hooks/use-pose-detector';

interface WorkoutSessionProps {
  exercise: string;
  discipline?: string;
}

export function WorkoutSession({ exercise, discipline }: WorkoutSessionProps) {
  const router = useRouter();

  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [poseFrame, setPoseFrame] = useState<PoseFrame | null>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1280, height: 720 });
  const [poseNotDetected, setPoseNotDetected] = useState(false);
  const [thermalThrottling, setThermalThrottling] = useState(false);
  const [poorLighting, setPoorLighting] = useState(false);
  const poseDetectionTimeoutRef = useRef<NodeJS.Timeout>();
  const fpsHistoryRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);

  const processingLoopRef = useRef<number>();
  const formValidatorRef = useRef<PushUpsValidator | MarchingValidator | JumpingJacksValidator | null>(null);
  const repDetectorRef = useRef<RepDetector | null>(null);
  const feedbackGeneratorRef = useRef<FeedbackGenerator | null>(null);
  const voiceCoachRef = useRef<VoiceCoach | null>(null);
  const repCounterRef = useRef<RepCounter | null>(null);
  const motivationEngineRef = useRef<MotivationEngine | null>(null);

  const { currentSession, startSession, endSession, addRep, addFeedback, updateMetrics } =
    useWorkoutStore();

  const exerciseType = useMemo(() => {
    switch (exercise) {
      case 'push_ups':
        return ExerciseType.PUSH_UPS;
      case 'marching':
        return ExerciseType.MARCHING;
      case 'jumping_jacks':
        return ExerciseType.JUMPING_JACKS;
      default:
        return ExerciseType.PUSH_UPS;
    }
  }, [exercise]);

  const disciplineValue = useMemo(() => {
    switch (discipline) {
      case 'yoga':
        return Discipline.YOGA;
      case 'general':
        return Discipline.GENERAL;
      default:
        return Discipline.FITNESS;
    }
  }, [discipline]);

  useEffect(() => {
    startSession(exerciseType, disciplineValue, 10);

    switch (exerciseType) {
      case ExerciseType.PUSH_UPS:
        formValidatorRef.current = new PushUpsValidator(exerciseType, disciplineValue);
        break;
      case ExerciseType.MARCHING:
        formValidatorRef.current = new MarchingValidator(exerciseType, disciplineValue);
        break;
      case ExerciseType.JUMPING_JACKS:
        formValidatorRef.current = new JumpingJacksValidator(exerciseType, disciplineValue);
        break;
    }

    repDetectorRef.current = new RepDetector(exerciseType);
    feedbackGeneratorRef.current = new FeedbackGenerator(exerciseType);
    voiceCoachRef.current = new VoiceCoach({ rate: 1.0, maxQueueSize: 3 });
    repCounterRef.current = new RepCounter(exerciseType, { minFormScore: 50 });
    motivationEngineRef.current = new MotivationEngine();

    return () => {
      if (processingLoopRef.current) {
        cancelAnimationFrame(processingLoopRef.current);
      }
      voiceCoachRef.current?.stop();
      endSession();
    };
  }, [disciplineValue, exerciseType, startSession, endSession]);

  const handlePoseDetected = useCallback(
    (detectedPoseFrame: PoseFrame) => {
      setPoseFrame(detectedPoseFrame);

      setPoseNotDetected(false);
      if (poseDetectionTimeoutRef.current) {
        clearTimeout(poseDetectionTimeoutRef.current);
      }
      poseDetectionTimeoutRef.current = setTimeout(() => {
        setPoseNotDetected(true);
      }, 3000);

      frameCountRef.current++;
      fpsHistoryRef.current.push(fpsRef.current);
      if (fpsHistoryRef.current.length > 30) {
        fpsHistoryRef.current.shift();
      }

      if (frameCountRef.current > 30) {
        const avgFps =
          fpsHistoryRef.current.reduce((sum, value) => sum + value, 0) /
          fpsHistoryRef.current.length;
        setThermalThrottling(avgFps < 15 && avgFps > 0);
      }

      const avgVisibility = detectedPoseFrame.confidence.average;
      setPoorLighting(avgVisibility < 0.8 && avgVisibility > 0.5);

      if (!formValidatorRef.current || !currentSession) {
        return;
      }

      const formResult = formValidatorRef.current.validateForm(detectedPoseFrame);
      updateMetrics({ formScore: formResult.score });

      if (feedbackGeneratorRef.current && formResult.errors.length > 0) {
        const feedback = feedbackGeneratorRef.current.generateFeedback(formResult, {
          recentFeedback: currentSession.feedbackHistory,
          durationSeconds: currentSession.durationSeconds,
          repCount: currentSession.repCount,
        });

        feedback.forEach((fb) => {
          addFeedback(fb);
          voiceCoachRef.current?.queueFeedback([fb]);
        });
      }

      if (repDetectorRef.current) {
        const repEvent = repDetectorRef.current.processFrame(detectedPoseFrame);

        if (repEvent && repCounterRef.current) {
          const basicRepEvent: BasicRepEvent = {
            repNumber: repEvent.repNumber,
            startFrame: repEvent.startFrame,
            endFrame: repEvent.endFrame,
            durationMs: repEvent.durationMs,
            peakValue: repEvent.peakValue,
            peakFrame: repEvent.peakFrame,
          };

          const validatedRep = repCounterRef.current.processRep(basicRepEvent, formResult.score);

          if (validatedRep) {
            addRep(validatedRep);

            const confirmationPrompt: FeedbackPrompt = {
              id: `rep-${validatedRep.repNumber}`,
              message: `${validatedRep.repNumber}`,
              type: FeedbackType.CONFIRMATION,
              severity: Severity.NORMAL,
              modality: [Modality.VOICE],
              triggeredAt: new Date().toISOString(),
              triggerCondition: {
                rule: 'rep_completed',
                measuredValue: 0,
                threshold: 0,
              },
              ttsStatus: TTSStatus.QUEUED,
              repNumber: validatedRep.repNumber,
            };

            void voiceCoachRef.current?.speak(confirmationPrompt);

            if (motivationEngineRef.current && currentSession) {
              const motivationalPrompt = motivationEngineRef.current.generateMotivation(
                currentSession.repCount + 1,
                currentSession.targetReps,
                validatedRep.correctnessScore
              );

              if (motivationalPrompt) {
                addFeedback(motivationalPrompt);
                voiceCoachRef.current?.queueFeedback([motivationalPrompt]);
              }
            }
          }
        }
      }
    },
    [
      addFeedback,
      addRep,
      currentSession,
      updateMetrics,
      setPoseNotDetected,
      setPoseFrame,
    ]
  );

  const fpsRef = useRef(0);

  // Initialize pose detector with Web Worker
  const { processFrame, isInitialized: poseDetectorReady, fps } = usePoseDetector({
    onPoseDetected: handlePoseDetected,
    onError: (error) => console.error('Pose detection error:', error),
  });

  useEffect(() => {
    fpsRef.current = fps;
  }, [fps]);

  const startProcessingLoop = useCallback(() => {
    if (!videoElement || !poseDetectorReady) {
      return;
    }

    const loop = () => {
      if (videoElement && poseDetectorReady) {
        processFrame(videoElement);
      }
      processingLoopRef.current = requestAnimationFrame(loop);
    };

    loop();
  }, [processFrame, poseDetectorReady, videoElement]);

  // Start processing loop when video is ready
  useEffect(() => {
    if (videoElement && poseDetectorReady) {
      void startProcessingLoop();
    }

    return () => {
      if (processingLoopRef.current) {
        cancelAnimationFrame(processingLoopRef.current);
      }
    };
  }, [videoElement, poseDetectorReady, startProcessingLoop]);

  const handleCameraReady = (video: HTMLVideoElement) => {
    setVideoElement(video);
    setVideoDimensions({
      width: video.videoWidth,
      height: video.videoHeight,
    });
  };

  const handleEndSession = () => {
    voiceCoachRef.current?.stop();
    endSession();
    router.push('/workout');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main Content */}
      <div className="relative h-screen">
        {/* Camera Feed with Overlay */}
        <div className="absolute inset-0">
          <CameraCapture 
            onReady={handleCameraReady} 
            className="w-full h-full"
          />
          <PoseOverlay
            poseFrame={poseFrame}
            videoWidth={videoDimensions.width}
            videoHeight={videoDimensions.height}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>

        {/* FPS Counter (top-left) */}
        {fps > 0 && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm font-mono">
            {fps} FPS
          </div>
        )}

        {/* Feedback Display */}
        <FeedbackDisplay feedback={currentSession?.feedbackHistory || []} />

        {/* Workout Controls */}
        <WorkoutControls session={currentSession} onEnd={handleEndSession} />

        {/* Pose Not Detected Warning */}
        {poseNotDetected && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-90 text-white px-8 py-6 rounded-lg text-center shadow-2xl">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-2xl font-bold mb-2">Move Into Frame</h3>
            <p className="text-gray-300">Position yourself so the camera can see your full body</p>
          </div>
        )}

        {/* Thermal Throttling Warning */}
        {thermalThrottling && (
          <div className="absolute top-24 left-4 bg-orange-600 bg-opacity-90 text-white px-4 py-3 rounded-lg text-sm shadow-lg max-w-xs">
            <h4 className="font-bold mb-1">⚠️ Performance Warning</h4>
            <p className="text-xs">Device may be overheating. Frame rate reduced.</p>
          </div>
        )}

        {/* Poor Lighting Warning */}
        {poorLighting && !thermalThrottling && (
          <div className="absolute top-24 left-4 bg-yellow-600 bg-opacity-90 text-white px-4 py-3 rounded-lg text-sm shadow-lg max-w-xs">
            <h4 className="font-bold mb-1">💡 Lighting Notice</h4>
            <p className="text-xs">Improve lighting for better pose detection accuracy.</p>
          </div>
        )}
      </div>
    </div>
  );
}
