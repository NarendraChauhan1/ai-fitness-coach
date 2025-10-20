'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Zap } from 'lucide-react';
import { FeedbackPrompt, Severity, FeedbackType } from '@ai-fitness-coach/coaching-engine';

interface FeedbackDisplayProps {
  feedback: FeedbackPrompt[];
  maxVisible?: number;
}

/**
 * Get icon and colors based on severity and feedback type
 */
function getSeverityStyles(severity: Severity, type: FeedbackType) {
  // Motivational messages get special styling
  if (type === FeedbackType.MOTIVATIONAL) {
    return {
      icon: Zap,
      bgColor: 'bg-purple-600',
      textColor: 'text-white',
      borderColor: 'border-purple-700',
    };
  }

  switch (severity) {
    case Severity.CRITICAL:
      return {
        icon: AlertCircle,
        bgColor: 'bg-red-600',
        textColor: 'text-white',
        borderColor: 'border-red-700',
      };
    case Severity.HIGH:
      return {
        icon: AlertTriangle,
        bgColor: 'bg-orange-600',
        textColor: 'text-white',
        borderColor: 'border-orange-700',
      };
    case Severity.NORMAL:
      return {
        icon: Info,
        bgColor: 'bg-blue-600',
        textColor: 'text-white',
        borderColor: 'border-blue-700',
      };
    case Severity.INFO:
      return {
        icon: CheckCircle,
        bgColor: 'bg-green-600',
        textColor: 'text-white',
        borderColor: 'border-green-700',
      };
  }
}

/**
 * Animated feedback display component
 */
export function FeedbackDisplay({ feedback, maxVisible = 3 }: FeedbackDisplayProps) {
  // Show only the most recent feedback items
  const visibleFeedback = feedback.slice(-maxVisible);

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <AnimatePresence mode="popLayout">
        {visibleFeedback.map((item) => {
          const styles = getSeverityStyles(item.severity, item.type);
          const Icon = styles.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className={`${styles.bgColor} ${styles.textColor} rounded-lg shadow-2xl mb-3 border-2 ${styles.borderColor}`}
            >
              <div className="p-4 flex items-center space-x-3">
                <Icon className="w-6 h-6 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-lg">{item.message}</p>
                  {item.triggerCondition && (
                    <p className="text-sm opacity-90 mt-1">
                      Measured: {item.triggerCondition.measuredValue.toFixed(1)}° | Target:{' '}
                      {item.triggerCondition.threshold.toFixed(1)}°
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty state */}
      {visibleFeedback.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800 bg-opacity-75 text-white rounded-lg shadow-lg p-4 text-center"
        >
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-semibold">Good form! Keep going!</p>
        </motion.div>
      )}
    </div>
  );
}
