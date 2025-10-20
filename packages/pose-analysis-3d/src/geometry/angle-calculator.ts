import { Landmark } from '../types';

/**
 * Calculate angle between three landmarks (in degrees)
 * @param pointA - First point
 * @param pointB - Vertex point (angle is measured here)
 * @param pointC - Third point
 * @returns Angle in degrees (0-180)
 */
export function calculateAngle(pointA: Landmark, pointB: Landmark, pointC: Landmark): number {
  // Vector from B to A
  const vectorBA = {
    x: pointA.x - pointB.x,
    y: pointA.y - pointB.y,
    z: pointA.z - pointB.z,
  };

  // Vector from B to C
  const vectorBC = {
    x: pointC.x - pointB.x,
    y: pointC.y - pointB.y,
    z: pointC.z - pointB.z,
  };

  // Calculate dot product
  const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y + vectorBA.z * vectorBC.z;

  // Calculate magnitudes
  const magnitudeBA = Math.sqrt(
    vectorBA.x * vectorBA.x + vectorBA.y * vectorBA.y + vectorBA.z * vectorBA.z
  );
  const magnitudeBC = Math.sqrt(
    vectorBC.x * vectorBC.x + vectorBC.y * vectorBC.y + vectorBC.z * vectorBC.z
  );

  // Calculate angle in radians
  const angleRadians = Math.acos(dotProduct / (magnitudeBA * magnitudeBC));

  // Convert to degrees
  return (angleRadians * 180) / Math.PI;
}
