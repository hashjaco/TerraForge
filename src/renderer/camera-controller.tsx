import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { CameraControls, OrbitControls, OrthographicCamera } from "@react-three/drei";
import type { CameraControls as CameraControlsImpl } from "@react-three/drei";
import {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
  useViewportStore,
} from "@/stores/viewport-store";
import { pickCivilObject } from "@/renderer/interaction/selection-manager";

const FIT_PADDING = { paddingTop: 4, paddingBottom: 4, paddingLeft: 4, paddingRight: 4 };
const scratchPosition = new THREE.Vector3();
const scratchTarget = new THREE.Vector3();

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
  const controlsRef = useRef<CameraControlsImpl>(null);
  const resetNonce = useViewportStore((s) => s.cameraResetNonce);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    if (resetNonce === 0) return;
    controlsRef.current?.setLookAt(...DEFAULT_CAMERA_POSITION, ...DEFAULT_CAMERA_TARGET, true);
  }, [resetNonce]);

  useEffect(() => {
    const canvas = gl.domElement;
    function focusPicked(e: MouseEvent) {
      const picked = pickCivilObject(e, camera, scene, canvas);
      if (picked) controlsRef.current?.fitToBox(picked, true, FIT_PADDING);
    }
    canvas.addEventListener("dblclick", focusPicked);
    return () => canvas.removeEventListener("dblclick", focusPicked);
  }, [camera, scene, gl]);

  // Writes to the store only when motion settles; per-frame writes re-render every subscriber.
  function publishCamera() {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.getPosition(scratchPosition);
    controls.getTarget(scratchTarget);
    const { setCameraPosition, setCameraTarget } = useViewportStore.getState();
    setCameraPosition([scratchPosition.x, scratchPosition.y, scratchPosition.z]);
    setCameraTarget([scratchTarget.x, scratchTarget.y, scratchTarget.z]);
  }

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      smoothTime={0.22}
      draggingSmoothTime={0.08}
      minDistance={1}
      maxDistance={10000}
      dollyToCursor
      onRest={publishCamera}
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
