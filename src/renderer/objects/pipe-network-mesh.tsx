import * as THREE from "three";
import { useSelectionStore } from "@/stores/selection-store";
import type { PipeNetworkData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: PipeNetworkData;
}

export function PipeNetworkMesh({ objectId, data }: Props) {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const isSelected = selectedIds.includes(objectId);
  const nodeColor = isSelected ? "#60a5fa" : "#22c55e";
  const pipeColor = isSelected ? "#93c5fd" : "#4ade80";

  const pipeGeometries = data.pipes.map((pipe) => {
    const startNode = data.nodes.find((n) => n.id === pipe.start_node_id);
    const endNode = data.nodes.find((n) => n.id === pipe.end_node_id);
    if (!startNode || !endNode) return null;

    // Swap Y and Z: civil (X,Y,Z-up) → Three.js (X,Y-up,Z)
    const start = new THREE.Vector3(
      startNode.position[0],
      startNode.invert_elevation,
      startNode.position[1]
    );
    const end = new THREE.Vector3(
      endNode.position[0],
      endNode.invert_elevation,
      endNode.position[1]
    );

    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const midpoint = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);

    return { pipe, start, end, direction, length, midpoint };
  });

  return (
    <group userData={{ objectId }}>
      {data.nodes.map((node) => (
        <mesh
          key={node.id}
          position={[node.position[0], node.invert_elevation, node.position[1]]}
        >
          <sphereGeometry args={[node.node_type === "manhole" ? 0.5 : 0.3, 16, 16]} />
          <meshStandardMaterial color={nodeColor} />
        </mesh>
      ))}

      {pipeGeometries.map((pg, i) => {
        if (!pg) return null;
        const { midpoint, length, start, end, pipe } = pg;

        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

        return (
          <mesh key={pipe.id} position={midpoint} quaternion={quaternion}>
            <cylinderGeometry args={[pipe.diameter / 2, pipe.diameter / 2, length, 12]} />
            <meshStandardMaterial color={pipeColor} transparent opacity={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}
