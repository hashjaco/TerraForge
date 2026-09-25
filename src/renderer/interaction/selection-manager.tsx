import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { useSelectionStore } from "@/stores/selection-store";

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Returns the nearest ancestor tagged with userData.objectId under the pointer.
export function pickCivilObject(
  event: MouseEvent,
  camera: THREE.Camera,
  scene: THREE.Scene,
  canvas: HTMLCanvasElement,
): THREE.Object3D | null {
  const rect = canvas.getBoundingClientRect();
  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  for (const hit of hits) {
    let obj: THREE.Object3D | null = hit.object;
    while (obj && !obj.userData.objectId) obj = obj.parent;
    if (obj) return obj;
  }
  return null;
}

export function SelectionManager() {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    let downX = 0;
    let downY = 0;
    function handleDown(e: PointerEvent) {
      downX = e.clientX;
      downY = e.clientY;
    }
    // A click that ends an orbit/pan drag must not change the selection.
    function handleClick(e: MouseEvent) {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 4) return;
      const picked = pickCivilObject(e, camera, scene, canvas);
      const { select, multiSelect, clearSelection } = useSelectionStore.getState();
      if (!picked) return clearSelection();
      if (e.shiftKey || e.metaKey || e.ctrlKey) multiSelect(picked.userData.objectId);
      else select(picked.userData.objectId);
    }
    canvas.addEventListener("pointerdown", handleDown);
    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("click", handleClick);
    };
  }, [camera, scene, gl]);

  return null;
}
