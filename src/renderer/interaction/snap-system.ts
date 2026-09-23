export interface SnapSettings {
  enabled: boolean;
  gridSize: number;
  snapToObjects: boolean;
  snapToGrid: boolean;
  snapDistance: number;
}

const defaultSettings: SnapSettings = {
  enabled: true,
  gridSize: 1.0,
  snapToObjects: true,
  snapToGrid: true,
  snapDistance: 2.0,
};

export function snapToGrid(
  value: number,
  gridSize: number = defaultSettings.gridSize
): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPoint(
  x: number,
  y: number,
  z: number,
  settings: SnapSettings = defaultSettings
): [number, number, number] {
  if (!settings.enabled || !settings.snapToGrid) {
    return [x, y, z];
  }

  return [
    snapToGrid(x, settings.gridSize),
    snapToGrid(y, settings.gridSize),
    z, // don't snap elevation by default
  ];
}
