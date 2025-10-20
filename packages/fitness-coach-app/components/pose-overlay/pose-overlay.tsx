'use client';

import { useEffect, useRef, memo } from 'react';
import { PoseFrame, LandmarkID } from '@ai-fitness-coach/pose-analysis-3d';

interface PoseOverlayProps {
  poseFrame: PoseFrame | null;
  videoWidth: number;
  videoHeight: number;
  className?: string;
}

/**
 * Skeletal connections between landmarks
 */
const SKELETON_CONNECTIONS = [
  // Torso
  [LandmarkID.LEFT_SHOULDER, LandmarkID.RIGHT_SHOULDER],
  [LandmarkID.LEFT_SHOULDER, LandmarkID.LEFT_HIP],
  [LandmarkID.RIGHT_SHOULDER, LandmarkID.RIGHT_HIP],
  [LandmarkID.LEFT_HIP, LandmarkID.RIGHT_HIP],

  // Left arm
  [LandmarkID.LEFT_SHOULDER, LandmarkID.LEFT_ELBOW],
  [LandmarkID.LEFT_ELBOW, LandmarkID.LEFT_WRIST],

  // Right arm
  [LandmarkID.RIGHT_SHOULDER, LandmarkID.RIGHT_ELBOW],
  [LandmarkID.RIGHT_ELBOW, LandmarkID.RIGHT_WRIST],

  // Left leg
  [LandmarkID.LEFT_HIP, LandmarkID.LEFT_KNEE],
  [LandmarkID.LEFT_KNEE, LandmarkID.LEFT_ANKLE],

  // Right leg
  [LandmarkID.RIGHT_HIP, LandmarkID.RIGHT_KNEE],
  [LandmarkID.RIGHT_KNEE, LandmarkID.RIGHT_ANKLE],
];

/**
 * Get color based on depth (Z-coordinate)
 * Red = too close, Green = optimal, Yellow = too far
 */
function getDepthColor(z: number): string {
  if (z < -0.15) return '#ef4444'; // red - too close
  if (z > 0.15) return '#eab308'; // yellow - too far
  return '#22c55e'; // green - optimal
}

/**
 * Canvas-based pose overlay with 30+ FPS rendering
 * Memoized to prevent unnecessary re-renders
 */
const PoseOverlayComponent = ({ poseFrame, videoWidth, videoHeight, className = '' }: PoseOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const poseFrameRef = useRef<PoseFrame | null>(null);

  // Keep poseFrame in a ref to avoid recreating render loop
  useEffect(() => {
    poseFrameRef.current = poseFrame;
  }, [poseFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match video
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Start render loop
    const render = () => {
      if (poseFrameRef.current) {
        drawPose(canvas, poseFrameRef.current);
      } else {
        // Clear canvas if no pose
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoWidth, videoHeight]);

  const drawPose = (canvas: HTMLCanvasElement, frame: PoseFrame) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('[PoseOverlay] No canvas context');
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set drawing styles
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    let visibleLandmarks = 0;
    let drawnConnections = 0;

    // Draw connections
    for (const [startId, endId] of SKELETON_CONNECTIONS) {
      const startLandmark = frame.landmarks.find((l) => l.id === startId);
      const endLandmark = frame.landmarks.find((l) => l.id === endId);

      if (!startLandmark || !endLandmark) continue;

      // Only draw if both landmarks are visible
      if (startLandmark.visibility < 0.5 || endLandmark.visibility < 0.5) continue;

      // Calculate positions
      const startX = startLandmark.x * canvas.width;
      const startY = startLandmark.y * canvas.height;
      const endX = endLandmark.x * canvas.width;
      const endY = endLandmark.y * canvas.height;

      // Use average depth for line color
      const avgDepth = (startLandmark.z + endLandmark.z) / 2;
      ctx.strokeStyle = getDepthColor(avgDepth);

      // Draw line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      drawnConnections++;
    }

    // Draw landmarks as circles
    for (const landmark of frame.landmarks) {
      if (landmark.visibility < 0.5) continue;

      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      const color = getDepthColor(landmark.z);

      // Draw circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Draw white border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 3; // Reset
      
      visibleLandmarks++;
    }

    // Log every 60 frames (about once per second at 60 FPS)
    if (frame.frameNumber % 60 === 0) {
      console.log(
        `[PoseOverlay] Frame ${frame.frameNumber}: Drew ${drawnConnections} connections, ${visibleLandmarks} landmarks, confidence: ${(frame.confidence.average * 100).toFixed(0)}%`
      );
    }

    // Draw confidence indicator
    if (frame.confidence.average >= 0.9) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.1)'; // green overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (frame.confidence.average < 0.7) {
      // Low confidence warning
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // red overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Warning text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Low Confidence - Adjust Position', canvas.width / 2, 50);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ pointerEvents: 'none' }}
    />
  );
};

// Export memoized component
export const PoseOverlay = memo(PoseOverlayComponent);
