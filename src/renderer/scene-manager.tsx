import { useRef } from "react";
import { TerrainMesh } from "./objects/terrain-mesh";
import { AlignmentLine } from "./objects/alignment-line";
import { CorridorMesh } from "./objects/corridor-mesh";
import { PipeNetworkMesh } from "./objects/pipe-network-mesh";
import { ContourLines } from "./objects/contour-lines";
import { FeatureLineMesh } from "./objects/feature-line-mesh";
import { ParcelBoundary } from "./objects/parcel-boundary";
import { IntersectionMesh } from "./objects/intersection-mesh";
import { TransformGizmo } from "./interaction/transform-gizmo";
import { useProjectStore } from "@/stores/project-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useViewportStore } from "@/stores/viewport-store";
import { Grid } from "@react-three/drei";
import type {
  SurfaceObject,
  AlignmentObject,
  CorridorObject,
  PipeNetworkObject,
  FeatureLineObject,
  ParcelObject,
  IntersectionObject,
} from "@/lib/types/civil-objects";
import type * as THREE from "three";

interface GroupedObjects {
  surfaces: SurfaceObject[];
  alignments: AlignmentObject[];
  corridors: CorridorObject[];
  pipeNetworks: PipeNetworkObject[];
  featureLines: FeatureLineObject[];
  parcels: ParcelObject[];
  intersections: IntersectionObject[];
}

export function SceneManager() {
  const objects = useProjectStore((s) => s.objects);
  const showGrid = useViewportStore((s) => s.showGrid);
  const showContours = useViewportStore((s) => s.showContours);
  const selectedIds = useSelectionStore((s) => s.selectedIds);

  const grouped: GroupedObjects = {
    surfaces: [],
    alignments: [],
    corridors: [],
    pipeNetworks: [],
    featureLines: [],
    parcels: [],
    intersections: [],
  };

  for (const obj of objects.values()) {
    if (!obj.visible) continue;
    switch (obj.type) {
      case "surface":
        grouped.surfaces.push(obj as SurfaceObject);
        break;
      case "alignment":
        grouped.alignments.push(obj as AlignmentObject);
        break;
      case "corridor":
        grouped.corridors.push(obj as CorridorObject);
        break;
      case "pipe-network":
        grouped.pipeNetworks.push(obj as PipeNetworkObject);
        break;
      case "feature-line":
        grouped.featureLines.push(obj as FeatureLineObject);
        break;
      case "parcel":
        grouped.parcels.push(obj as ParcelObject);
        break;
      case "intersection":
        grouped.intersections.push(obj as IntersectionObject);
        break;
    }
  }

  const selectedObj =
    selectedIds.length === 1 ? objects.get(selectedIds[0]) : undefined;
  const showGizmo = selectedObj?.visible && selectedObj.type !== "profile";

  const gizmoTargetRef = useRef<THREE.Object3D | null>(null);

  function handleGizmoDragEnd(position: [number, number, number]) {
    if (!selectedObj) return;
  }

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[100, 200, 100]} intensity={0.8} />
      <directionalLight position={[-50, 100, -50]} intensity={0.3} />

      {showGrid && (
        <Grid
          args={[1000, 1000]}
          cellSize={10}
          cellThickness={0.5}
          cellColor="#1a1a2e"
          sectionSize={50}
          sectionThickness={1}
          sectionColor="#2a2a4e"
          fadeDistance={500}
          infiniteGrid
        />
      )}

      {grouped.surfaces.map((obj) => (
        <TerrainMesh key={obj.id} objectId={obj.id} data={obj.data} />
      ))}

      {showContours &&
        grouped.surfaces.map((obj) => (
          <ContourLines
            key={`contour-${obj.id}`}
            objectId={obj.id}
            data={obj.data}
          />
        ))}

      {grouped.alignments.map((obj) => (
        <AlignmentLine key={obj.id} objectId={obj.id} data={obj.data} />
      ))}

      {grouped.corridors.map((obj) => (
        <CorridorMesh key={obj.id} objectId={obj.id} data={obj.data} />
      ))}

      {grouped.pipeNetworks.map((obj) => (
        <PipeNetworkMesh key={obj.id} objectId={obj.id} data={obj.data} />
      ))}

      {grouped.featureLines.map((obj) => (
        <FeatureLineMesh key={obj.id} objectId={obj.id} data={obj.data} />
      ))}

      {grouped.parcels.map((obj) => (
        <ParcelBoundary key={obj.id} objectId={obj.id} data={obj.data} />
      ))}

      {grouped.intersections.map((obj) => (
        <IntersectionMesh key={obj.id} objectId={obj.id} data={obj.data} />
      ))}

      {showGizmo && gizmoTargetRef.current && (
        <TransformGizmo
          target={gizmoTargetRef.current}
          onDragEnd={handleGizmoDragEnd}
        />
      )}
    </>
  );
}
