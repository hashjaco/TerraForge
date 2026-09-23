import { TransformControls } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";

interface Props {
  target: THREE.Object3D;
  mode?: "translate" | "rotate" | "scale";
  onDragEnd?: (position: [number, number, number]) => void;
}

export function TransformGizmo({
  target,
  mode = "translate",
  onDragEnd,
}: Props) {
  const controlsRef = useRef(null);

  return (
    <TransformControls
      ref={controlsRef}
      object={target}
      mode={mode}
      size={0.75}
      onMouseUp={() => {
        if (onDragEnd) {
          const pos = target.position;
          onDragEnd([pos.x, pos.y, pos.z]);
        }
      }}
    />
  );
}
