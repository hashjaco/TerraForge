import type { ReactElement } from "react";
import { Html } from "@react-three/drei";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "@/stores/project-store";
import { useViewportStore } from "@/stores/viewport-store";
import { civilToThree } from "@/renderer/lib/geometry";
import type { AlignmentObject, PipeNetworkObject } from "@/lib/types/civil-objects";

const STATION_INTERVAL = 100;
const STATION_LABEL_HEIGHT = 1;
const NODE_LABEL_LIFT = 2;
const PIPE_LABEL_LIFT = 1;
const LABEL_CLASS =
  "glass rounded px-1.5 py-0.5 font-mono whitespace-nowrap leading-tight tabular text-text-primary";

// Civil station notation: 1250 m → "12+50".
export function formatStation(meters: number): string {
  const hundreds = Math.floor(meters / 100);
  const remainder = Math.round(meters - hundreds * 100);
  const station = `${hundreds}+${String(remainder).padStart(2, "0")}`;
  return station;
}

// Positions each station by true arc length along the sampled polyline, so labels
// stay correct even when sample spacing is uneven.
function stationPoints(pts: number[], interval: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  let travelled = 0;
  let nextStation = 0;
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const x0 = pts[i], y0 = pts[i + 1], x1 = pts[i + 2], y1 = pts[i + 3];
    const segment = Math.hypot(x1 - x0, y1 - y0);
    while (segment > 0 && nextStation <= travelled + segment) {
      const f = (nextStation - travelled) / segment;
      out.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, nextStation]);
      nextStation += interval;
    }
    travelled += segment;
  }
  return out;
}

function Label({ position, children }: { position: [number, number, number]; children: ReactElement | string }) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      {children}
    </Html>
  );
}

function alignmentLabels(obj: AlignmentObject): ReactElement[] {
  const labels = stationPoints(obj.data.sampledPoints, STATION_INTERVAL).map(([x, y, sta]) => (
    <Label key={`sta-${obj.id}-${sta}`} position={civilToThree(x, y, STATION_LABEL_HEIGHT)}>
      <div className={`${LABEL_CLASS} text-[9px] text-amber-300`}>Sta {formatStation(sta)}</div>
    </Label>
  ));
  return labels;
}

// ponytail: one DOM node per label; fine to a few hundred, switch to drei <Text> instancing past that.
function pipeNetworkLabels(obj: PipeNetworkObject): ReactElement[] {
  const { nodes, pipes } = obj.data;
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const labels: ReactElement[] = [];

  for (const node of nodes) {
    const [x, y, z] = node.position;
    labels.push(
      <Label key={`pn-${obj.id}-${node.id}`} position={civilToThree(x, y, z + NODE_LABEL_LIFT)}>
        <div className={`${LABEL_CLASS} text-[8px]`}>
          <div className="text-cyan-300">{node.node_type}</div>
          <div>Rim {node.rim_elevation.toFixed(1)} m</div>
          <div>Inv {node.invert_elevation.toFixed(1)} m</div>
        </div>
      </Label>,
    );
  }

  for (const pipe of pipes) {
    const a = nodesById.get(pipe.start_node_id);
    const b = nodesById.get(pipe.end_node_id);
    if (!a || !b) continue;
    const mid = civilToThree(
      (a.position[0] + b.position[0]) / 2,
      (a.position[1] + b.position[1]) / 2,
      (a.position[2] + b.position[2]) / 2 + PIPE_LABEL_LIFT,
    );
    labels.push(
      <Label key={`pipe-${obj.id}-${pipe.id}`} position={mid}>
        <div className={`${LABEL_CLASS} text-[8px] text-sky-300`}>
          {(pipe.diameter * 1000).toFixed(0)} mm @ {(pipe.slope * 100).toFixed(2)}%
        </div>
      </Label>,
    );
  }
  return labels;
}

function ObjectLabels({ id }: { id: string }) {
  const obj = useProjectStore((s) => s.objects.get(id));
  if (obj?.type === "alignment") return <>{alignmentLabels(obj)}</>;
  if (obj?.type === "pipe-network") return <>{pipeNetworkLabels(obj)}</>;
  return null;
}

export function AnnotationLayer() {
  const showLabels = useViewportStore((s) => s.showLabels);
  const labelledIds = useProjectStore(
    useShallow((s) => {
      const ids: string[] = [];
      for (const obj of s.objects.values()) {
        if (obj.visible && (obj.type === "alignment" || obj.type === "pipe-network")) ids.push(obj.id);
      }
      return ids;
    }),
  );

  if (!showLabels) return null;

  const layer = labelledIds.map((id) => <ObjectLabels key={id} id={id} />);
  return <>{layer}</>;
}
