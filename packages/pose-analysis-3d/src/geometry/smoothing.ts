/**
 * Smooth values across frames using moving average
 * @param values - Array of values from previous frames
 * @param windowSize - Number of frames to average (default: 5)
 * @returns Smoothed value
 */
export function smoothValue(values: number[], windowSize: number = 5): number {
  if (values.length === 0) {
    return 0;
  }

  // Take only the most recent values up to windowSize
  const recentValues = values.slice(-windowSize);

  // Calculate average
  const sum = recentValues.reduce((acc, val) => acc + val, 0);
  return sum / recentValues.length;
}
