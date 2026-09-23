import { Canvas } from "@react-three/fiber";
import { SceneManager } from "./scene-manager";
import { CameraController } from "./camera-controller";
import { SelectionManager } from "./interaction/selection-manager";
import { useViewportStore } from "@/stores/viewport-store";

export function Viewport() {
  const projection = useViewportStore((s) => s.projection);

  return (
    <div className="w-full h-full bg-neutral-950 overflow-hidden">
      <Canvas
        camera={{
          position: [100, 100, 100],
          fov: projection === "perspective" ? 60 : undefined,
          near: 0.1,
          far: 100000,
        }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor("#0a0a0a");
        }}
      >
        <CameraController />
        <SceneManager />
        <SelectionManager />
      </Canvas>
    </div>
  );
}
