import { Canvas } from "@react-three/fiber";
import {
  AdaptiveDpr,
  Bvh,
  Environment,
  GizmoHelper,
  GizmoViewcube,
  Lightformer,
  PerformanceMonitor,
} from "@react-three/drei";
import { SceneManager } from "./scene-manager";
import { CameraController } from "./camera-controller";
import { SelectionManager } from "./interaction/selection-manager";
import { AnnotationLayer } from "./annotations/annotation-layer";
import { useViewportStore } from "@/stores/viewport-store";
import { useThemeColors } from "@/lib/theme-tokens";

// Studio-style lighting baked once into a small cubemap; no HDR download, so it works offline in Tauri.
function StudioEnvironment() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={2} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
      <Lightformer form="rect" intensity={0.6} position={[-10, 3, 5]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} />
      <Lightformer form="rect" intensity={0.4} color="#9ec5ff" position={[10, 3, -5]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} />
    </Environment>
  );
}

export function Viewport() {
  const projection = useViewportStore((s) => s.projection);
  const viewMode = useViewportStore((s) => s.viewMode);
  const colors = useThemeColors();

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: colors.surface }} data-tutorial-id="viewport">
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{
          position: [100, 100, 100],
          fov: projection === "perspective" ? 50 : undefined,
          near: 0.1,
          far: 100000,
        }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={[colors.surface]} />
        <PerformanceMonitor>
          <AdaptiveDpr pixelated />
        </PerformanceMonitor>
        <StudioEnvironment />
        <CameraController />
        <Bvh firstHitOnly>
          <SceneManager />
        </Bvh>
        <AnnotationLayer />
        <SelectionManager />
        {viewMode === "3d" && (
          <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
            <GizmoViewcube
              color={colors.surfaceRaised}
              hoverColor={colors.accent}
              textColor={colors.textPrimary}
              strokeColor={colors.border}
              opacity={0.95}
            />
          </GizmoHelper>
        )}
      </Canvas>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: `inset 0 0 120px rgba(0,0,0,${colors.isLight ? 0.08 : 0.35})` }}
      />
    </div>
  );
}
