import { create } from "zustand";

type ViewMode = "3d" | "plan" | "profile" | "cross-section";
export const DEFAULT_CAMERA_POSITION: [number, number, number] = [100, 100, 100];
export const DEFAULT_CAMERA_TARGET: [number, number, number] = [0, 0, 0];

type CameraProjection = "perspective" | "orthographic";

interface ViewportState {
  viewMode: ViewMode;
  projection: CameraProjection;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  zoom: number;
  cameraResetNonce: number;
  showGrid: boolean;
  showContours: boolean;
  showLabels: boolean;

  setViewMode: (mode: ViewMode) => void;
  setProjection: (projection: CameraProjection) => void;
  setCameraPosition: (pos: [number, number, number]) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleContours: () => void;
  toggleLabels: () => void;
  resetCamera: () => void;
}

export const useViewportStore = create<ViewportState>((set) => ({
  viewMode: "3d",
  projection: "perspective",
  cameraPosition: DEFAULT_CAMERA_POSITION,
  cameraTarget: DEFAULT_CAMERA_TARGET,
  zoom: 1,
  cameraResetNonce: 0,
  showGrid: true,
  showContours: true,
  showLabels: true,

  setViewMode: (viewMode) =>
    set({
      viewMode,
      projection: viewMode === "3d" ? "perspective" : "orthographic",
    }),
  setProjection: (projection) => set({ projection }),
  setCameraPosition: (cameraPosition) => set({ cameraPosition }),
  setCameraTarget: (cameraTarget) => set({ cameraTarget }),
  setZoom: (zoom) => set({ zoom }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleContours: () => set((s) => ({ showContours: !s.showContours })),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  resetCamera: () =>
    set((s) => ({
      cameraPosition: DEFAULT_CAMERA_POSITION,
      cameraTarget: DEFAULT_CAMERA_TARGET,
      zoom: 1,
      cameraResetNonce: s.cameraResetNonce + 1,
    })),
}));
