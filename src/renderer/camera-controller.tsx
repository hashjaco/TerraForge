import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { useViewportStore } from "@/stores/viewport-store";

function PlanViewCamera() {
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 500, 0]}
        zoom={2}
        near={0.1}
        far={10000}
      />
      <OrbitControls
        makeDefault
        enableRotate={false}
        enableDamping
        dampingFactor={0.1}
        panSpeed={1.5}
        zoomSpeed={1.2}
        minZoom={0.1}
        maxZoom={100}
      />
    </>
  );
}

function PerspectiveViewCamera() {
  const setCameraPosition = useViewportStore((s) => s.setCameraPosition);
  const setCameraTarget = useViewportStore((s) => s.setCameraTarget);

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={0.5}
      panSpeed={1}
      zoomSpeed={1.2}
      minDistance={1}
      maxDistance={10000}
      onChange={(e) => {
        if (e?.target) {
          const controls = e.target as any;
          const pos = controls.object.position;
          const tgt = controls.target;
          setCameraPosition([pos.x, pos.y, pos.z]);
          setCameraTarget([tgt.x, tgt.y, tgt.z]);
        }
      }}
    />
  );
}

function ProfileViewCamera() {
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 0, 500]}
        zoom={2}
        near={0.1}
        far={10000}
        up={[0, 1, 0]}
      />
      <OrbitControls
        makeDefault
        enableRotate={false}
        enableDamping
        dampingFactor={0.1}
        panSpeed={1.5}
        zoomSpeed={1.2}
        minZoom={0.1}
        maxZoom={100}
      />
    </>
  );
}

function CrossSectionViewCamera() {
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[500, 0, 0]}
        zoom={3}
        near={0.1}
        far={10000}
        up={[0, 0, 1]}
      />
      <OrbitControls
        makeDefault
        enableRotate={false}
        enableDamping
        dampingFactor={0.1}
        panSpeed={1.5}
        zoomSpeed={1.2}
        minZoom={0.1}
        maxZoom={100}
      />
    </>
  );
}

export function CameraController() {
  const viewMode = useViewportStore((s) => s.viewMode);

  switch (viewMode) {
    case "plan":
      return <PlanViewCamera />;
    case "profile":
      return <ProfileViewCamera />;
    case "cross-section":
      return <CrossSectionViewCamera />;
    default:
      return <PerspectiveViewCamera />;
  }
}
