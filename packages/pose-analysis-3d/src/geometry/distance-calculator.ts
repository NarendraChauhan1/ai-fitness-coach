import { Landmark } from '../types';

/**
 * Calculate 3D Euclidean distance between two landmarks
 * @param pointA - First landmark
 * @param pointB - Second landmark
 * @returns Normalized distance (0-1 scale based on frame coordinates)
 */
export function calculateDistance3D(pointA: Landmark, pointB: Landmark): number {
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  const dz = pointB.z - pointA.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
