import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import * as bridge from "@/lib/tauri-bridge";
import type { SegmentInput } from "@/lib/types/civil-objects";

export function AlignmentPanel() {
  const [name, setName] = useState("Alignment 1");
  const addObject = useProjectStore((s) => s.addObject);
  const setStatus = useUIStore((s) => s.setStatusMessage);

  async function createDemoAlignment() {
    setStatus("Creating alignment...");

    try {
      const segments: SegmentInput[] = [
        {
          segment_type: "line",
          start: [0, 0],
          end: [50, 0],
        },
        {
          segment_type: "arc",
          center: [50, 20],
          radius: 20,
          start_angle: -Math.PI / 2,
          sweep_angle: Math.PI / 2,
        },
        {
          segment_type: "line",
          start: [70, 20],
          end: [70, 80],
        },
      ];

      const result = await bridge.createAlignment(name, segments);

      addObject({
        id: result.id,
        name: result.name,
        type: "alignment",
        dependencies: [],
        dependents: [],
        version: 1,
        visible: true,
        locked: false,
        data: {
          totalLength: result.total_length,
          sampledPoints: result.sampled_points,
          segmentCount: result.segment_count,
        },
      });

      setStatus(
        `Alignment "${name}" created (${result.total_length.toFixed(1)}m)`
      );
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  }

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Create Alignment
      </h3>
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button
        variant="primary"
        size="sm"
        onClick={createDemoAlignment}
        data-tutorial-id="create-alignment-button"
        className="w-full"
      >
        Create Demo Alignment
      </Button>
    </div>
  );
}
