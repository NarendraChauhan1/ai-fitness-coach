import { Landmark } from '../types';

/**
 * Calculate depth (Z-axis) difference between two landmarks
 * @param pointA - First landmark
 * @param pointB - Second landmark
 * @returns Positive if B is closer to camera than A, negative otherwise
 */
export function calculateDepth(pointA: Landmark, pointB: Landmark): number {
  // Z is negative when closer to camera, so reverse the subtraction
  return pointA.z - pointB.z;
}
