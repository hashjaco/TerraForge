import { Grid } from "@react-three/drei";
import { useShallow } from "zustand/react/shallow";
import { TerrainMesh } from "./objects/terrain-mesh";
import { AlignmentLine } from "./objects/alignment-line";
import { CorridorMesh } from "./objects/corridor-mesh";
import { PipeNetworkMesh } from "./objects/pipe-network-mesh";
import { ContourLines } from "./objects/contour-lines";
import { FeatureLineMesh } from "./objects/feature-line-mesh";
import { ParcelBoundary } from "./objects/parcel-boundary";
import { IntersectionMesh } from "./objects/intersection-mesh";
import { useProjectStore } from "@/stores/project-store";
import { useViewportStore } from "@/stores/viewport-store";
import { useThemeColors } from "@/lib/theme-tokens";

// Each object subscribes to its own store entry, so editing one object re-renders
// only that object; the manager itself re-renders only when the visible set changes.
function SceneObject({ id }: { id: string }) {
  const obj = useProjectStore((s) => s.objects.get(id));
  const showContours = useViewportStore((s) => s.showContours);
  if (!obj) return null;

  switch (obj.type) {
    case "surface":
      return (
        <>
          <TerrainMesh objectId={id} data={obj.data} />
          {showContours && <ContourLines objectId={id} data={obj.data} />}
        </>
      );
    case "alignment":
      return <AlignmentLine objectId={id} data={obj.data} />;
    case "corridor":
      return <CorridorMesh objectId={id} data={obj.data} />;
    case "pipe-network":
      return <PipeNetworkMesh objectId={id} data={obj.data} />;
    case "feature-line":
      return <FeatureLineMesh objectId={id} data={obj.data} />;
    case "parcel":
      return <ParcelBoundary objectId={id} data={obj.data} />;
    case "intersection":
      return <IntersectionMesh objectId={id} data={obj.data} />;
    default:
      return null;
  }
}

export function SceneManager() {
  const visibleIds = useProjectStore(
    useShallow((s) => {
      const ids: string[] = [];
      for (const obj of s.objects.values()) {
        if (obj.visible) ids.push(obj.id);
      }
      return ids;
    }),
  );
  const showGrid = useViewportStore((s) => s.showGrid);
  const colors = useThemeColors();

  return (
    <>
      <hemisphereLight args={["#dbe7ff", "#2a2419", 0.35]} />
      <directionalLight position={[100, 200, 100]} intensity={1.1} />
      <directionalLight position={[-50, 100, -50]} intensity={0.25} />

      {showGrid && (
        <Grid
          args={[1000, 1000]}
          cellSize={10}
          cellThickness={0.6}
          cellColor={colors.border}
          sectionSize={50}
          sectionThickness={1.2}
          sectionColor={colors.accent}
          fadeDistance={800}
          fadeStrength={1.5}
          followCamera
          infiniteGrid
        />
      )}

      {visibleIds.map((id) => (
        <SceneObject key={id} id={id} />
      ))}
    </>
  );
}
