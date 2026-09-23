import React, { useMemo } from "react";
import { Html } from "@react-three/drei";
import { useProjectStore } from "@/stores/project-store";
import { useViewportStore } from "@/stores/viewport-store";
import type {
  SurfaceObject,
  AlignmentObject,
  ProfileObject,
  PipeNetworkObject,
} from "@/lib/types/civil-objects";

interface LabelStyle {
  textHeight: number;
  precision: number;
  prefix: string;
  suffix: string;
  color: string;
}

const defaultLabelStyle: LabelStyle = {
  textHeight: 10,
  precision: 2,
  prefix: "",
  suffix: "",
  color: "#e0e0e0",
};

export function AnnotationLayer() {
  const objects = useProjectStore((s) => s.objects);
  const showAnnotations = useViewportStore((s) =>
    "showAnnotations" in s ? (s as any).showAnnotations : true
  );

  if (!showAnnotations) return null;

  const labels: React.ReactElement[] = [];

  for (const obj of objects.values()) {
    if (!obj.visible) continue;

    switch (obj.type) {
      case "alignment": {
        const alignment = obj as AlignmentObject;
        const pts = alignment.data.sampledPoints;
        // Station labels every 100 units
        const interval = 100;
        const totalLen = alignment.data.totalLength;
        for (let sta = 0; sta <= totalLen; sta += interval) {
          const idx = Math.floor((sta / totalLen) * (pts.length / 2 - 1)) * 2;
          if (idx >= 0 && idx + 1 < pts.length) {
            labels.push(
              <Html
                key={`sta-${obj.id}-${sta}`}
                position={[pts[idx], 1, -pts[idx + 1]]}
                center
                style={{ pointerEvents: "none" }}
              >
                <div className="text-[9px] text-green-400 font-mono whitespace-nowrap bg-black/60 px-1 rounded">
                  Sta {sta.toFixed(0)}+{((sta % 100) / 100 * 100).toFixed(0).padStart(2, "0")}
                </div>
              </Html>
            );
          }
        }
        break;
      }

      case "pipe-network": {
        const network = obj as PipeNetworkObject;
        for (const node of network.data.nodes) {
          labels.push(
            <Html
              key={`pn-${obj.id}-${node.id}`}
              position={[node.position[0], node.position[2] + 2, -node.position[1]]}
              center
              style={{ pointerEvents: "none" }}
            >
              <div className="text-[8px] text-cyan-400 font-mono whitespace-nowrap bg-black/60 px-1 rounded">
                {node.node_type}<br />
                Rim: {node.rim_elevation.toFixed(1)}m<br />
                Inv: {node.invert_elevation.toFixed(1)}m
              </div>
            </Html>
          );
        }
        for (const pipe of network.data.pipes) {
          const startNode = network.data.nodes.find((n) => n.id === pipe.start_node_id);
          const endNode = network.data.nodes.find((n) => n.id === pipe.end_node_id);
          if (startNode && endNode) {
            const midX = (startNode.position[0] + endNode.position[0]) / 2;
            const midY = (startNode.position[1] + endNode.position[1]) / 2;
            const midZ = (startNode.position[2] + endNode.position[2]) / 2;
            labels.push(
              <Html
                key={`pipe-${obj.id}-${pipe.id}`}
                position={[midX, midZ + 1, -midY]}
                center
                style={{ pointerEvents: "none" }}
              >
                <div className="text-[8px] text-blue-400 font-mono whitespace-nowrap bg-black/60 px-1 rounded">
                  {(pipe.diameter * 1000).toFixed(0)}mm @ {(pipe.slope * 100).toFixed(2)}%
                </div>
              </Html>
            );
          }
        }
        break;
      }
    }
  }

  return <>{labels}</>;
}
