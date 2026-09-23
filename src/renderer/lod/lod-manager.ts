export interface LODLevel {
  distance: number;
  detail: "high" | "medium" | "low";
  simplificationRatio: number;
}

const DEFAULT_LEVELS: LODLevel[] = [
  { distance: 0, detail: "high", simplificationRatio: 1.0 },
  { distance: 200, detail: "medium", simplificationRatio: 0.5 },
  { distance: 500, detail: "low", simplificationRatio: 0.1 },
];

export function getLODLevel(
  cameraDistance: number,
  levels: LODLevel[] = DEFAULT_LEVELS
): LODLevel {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (cameraDistance >= levels[i].distance) {
      return levels[i];
    }
  }
  return levels[0];
}

export function shouldUpdateLOD(
  previousDistance: number,
  currentDistance: number,
  levels: LODLevel[] = DEFAULT_LEVELS
): boolean {
  const prevLevel = getLODLevel(previousDistance, levels);
  const currLevel = getLODLevel(currentDistance, levels);
  return prevLevel.detail !== currLevel.detail;
}
