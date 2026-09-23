import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import * as bridge from "@/lib/tauri-bridge";
import type { PVIInput } from "@/lib/types/civil-objects";

export function ProfilePanel() {
  const [name, setName] = useState("Profile 1");
  const objects = useProjectStore((s) => s.objects);
  const addObject = useProjectStore((s) => s.addObject);
  const setStatus = useUIStore((s) => s.setStatusMessage);

  const alignments = Array.from(objects.values()).filter(
    (o) => o.type === "alignment"
  );
  const [selectedAlignmentId, setSelectedAlignmentId] = useState("");

  async function createDemoProfile() {
    if (!selectedAlignmentId) {
      setStatus("Select an alignment first");
      return;
    }

    setStatus("Creating profile...");

    try {
      const pvis: PVIInput[] = [
        { station: 0, elevation: 100, curve_length: 0 },
        { station: 30, elevation: 105, curve_length: 20 },
        { station: 70, elevation: 102, curve_length: 20 },
        { station: 100, elevation: 108, curve_length: 0 },
      ];

      const result = await bridge.createProfile(
        name,
        selectedAlignmentId,
        pvis
      );

      addObject({
        id: result.id,
        name: result.name,
        type: "profile",
        dependencies: [selectedAlignmentId],
        dependents: [],
        version: 1,
        visible: true,
        locked: false,
        data: {
          alignmentId: result.alignment_id,
          pviCount: result.pvi_count,
          sampledPoints: result.sampled_points,
        },
      });

      setStatus(`Profile "${name}" created`);
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  }

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Create Profile
      </h3>
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="space-y-1">
        <label className="text-[11px] text-text-muted">Alignment</label>
        <select
          value={selectedAlignmentId}
          onChange={(e) => setSelectedAlignmentId(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-md text-sm text-text-primary outline-none"
        >
          <option value="">Select alignment...</option>
          {alignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={createDemoProfile}
        disabled={!selectedAlignmentId}
        className="w-full"
      >
        Create Demo Profile
      </Button>
    </div>
  );
}
