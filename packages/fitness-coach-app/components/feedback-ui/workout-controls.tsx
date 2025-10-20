'use client';

import { useState, useEffect } from 'react';
import { Pause, Play, Square, Timer } from 'lucide-react';
import { ExerciseSession } from '@ai-fitness-coach/coaching-engine';

interface WorkoutControlsProps {
  session: ExerciseSession | null;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Workout controls with rep counter, timer, and form score
 */
export function WorkoutControls({ session, onPause, onResume, onEnd }: WorkoutControlsProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!session || isPaused) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [session, isPaused]);

  const handlePause = () => {
    setIsPaused(true);
    onPause?.();
  };

  const handleResume = () => {
    setIsPaused(false);
    onResume?.();
  };

  const handleEnd = () => {
    if (confirm('Are you sure you want to end this session?')) {
      onEnd?.();
    }
  };

  if (!session) return null;

  const progress = (session.repCount / session.targetReps) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-40">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 px-6 py-3 border-b border-gray-700">
        {/* Rep Counter */}
        <div className="text-center">
          <div className="text-gray-400 text-sm font-medium">Reps</div>
          <div className="text-white text-3xl font-bold mt-1">
            {session.repCount}
            <span className="text-gray-500 text-xl">/{session.targetReps}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="text-gray-400 text-sm font-medium flex items-center justify-center">
            <Timer className="w-4 h-4 mr-1" />
            Duration
          </div>
          <div className="text-white text-3xl font-bold mt-1 font-mono">
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Form Score */}
        <div className="text-center">
          <div className="text-gray-400 text-sm font-medium">Form Score</div>
          <div
            className={`text-3xl font-bold mt-1 ${
              session.formScore >= 80
                ? 'text-green-500'
                : session.formScore >= 60
                ? 'text-yellow-500'
                : 'text-red-500'
            }`}
          >
            {session.formScore.toFixed(0)}
            <span className="text-gray-500 text-xl">/100</span>
          </div>
          {/* Circular progress indicator */}
          <div className="relative w-16 h-16 mx-auto mt-2">
            <svg className="transform -rotate-90 w-16 h-16">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-gray-700"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${(session.formScore / 100) * 175.93} 175.93`}
                className={
                  session.formScore >= 80
                    ? 'text-green-500'
                    : session.formScore >= 60
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-4 px-6 py-4">
        {/* Pause/Resume */}
        {isPaused ? (
          <button
            onClick={handleResume}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Play className="w-5 h-5" />
            <span>Resume</span>
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Pause className="w-5 h-5" />
            <span>Pause</span>
          </button>
        )}

        {/* End Session */}
        <button
          onClick={handleEnd}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Square className="w-5 h-5" />
          <span>End Session</span>
        </button>
      </div>
    </div>
  );
}
