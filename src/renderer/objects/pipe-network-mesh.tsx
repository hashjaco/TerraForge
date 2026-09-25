import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useIsSelected } from "@/stores/selection-store";
import { civilToThree } from "@/renderer/lib/geometry";
import type { PipeNetworkData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: PipeNetworkData;
}

// ponytail: module-level unit geometries shared by every network, never disposed (a few KB total).
const UNIT_SPHERE = new THREE.SphereGeometry(1, 16, 12);
const UNIT_CYLINDER = new THREE.CylinderGeometry(1, 1, 1, 12);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

function nodePosition(node: PipeNetworkData["nodes"][number]) {
  return civilToThree(node.position[0], node.position[1], node.invert_elevation);
}

function writeInstances(nodesMesh: THREE.InstancedMesh, pipesMesh: THREE.InstancedMesh, data: PipeNetworkData) {
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const nodesById = new Map(data.nodes.map((n) => [n.id, n]));

  data.nodes.forEach((node, i) => {
    const radius = node.node_type === "manhole" ? 0.5 : 0.3;
    position.set(...nodePosition(node));
    scale.setScalar(radius);
    quaternion.identity();
    nodesMesh.setMatrixAt(i, matrix.compose(position, quaternion, scale));
  });

  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const dir = new THREE.Vector3();
  let pipeCount = 0;
  for (const pipe of data.pipes) {
    const a = nodesById.get(pipe.start_node_id);
    const b = nodesById.get(pipe.end_node_id);
    if (!a || !b) continue;
    start.set(...nodePosition(a));
    end.set(...nodePosition(b));
    dir.subVectors(end, start);
    const length = dir.length();
    if (length === 0) continue;
    position.addVectors(start, end).multiplyScalar(0.5);
    quaternion.setFromUnitVectors(Y_AXIS, dir.divideScalar(length));
    scale.set(pipe.diameter / 2, length, pipe.diameter / 2);
    pipesMesh.setMatrixAt(pipeCount++, matrix.compose(position, quaternion, scale));
  }
  pipesMesh.count = pipeCount;

  for (const mesh of [nodesMesh, pipesMesh]) {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }
}

export function PipeNetworkMesh({ objectId, data }: Props) {
  const isSelected = useIsSelected(objectId);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const pipesRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (nodesRef.current && pipesRef.current) {
      writeInstances(nodesRef.current, pipesRef.current, data);
    }
  }, [data]);

  return (
    <group userData={{ objectId }}>
      <instancedMesh
        key={`n${data.nodes.length}`}
        ref={nodesRef}
        args={[UNIT_SPHERE, undefined, data.nodes.length]}
      >
        <meshStandardMaterial color={isSelected ? "#60a5fa" : "#22c55e"} roughness={0.4} metalness={0.2} />
      </instancedMesh>
      <instancedMesh
        key={`p${data.pipes.length}`}
        ref={pipesRef}
        args={[UNIT_CYLINDER, undefined, data.pipes.length]}
      >
        <meshStandardMaterial
          color={isSelected ? "#93c5fd" : "#4ade80"}
          roughness={0.35}
          metalness={0.3}
          transparent
          opacity={0.85}
        />
      </instancedMesh>
    </group>
  );
}
