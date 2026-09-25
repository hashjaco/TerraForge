import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import * as bridge from "@/lib/tauri-bridge";

export function CorridorPanel() {
  const [name, setName] = useState("Corridor 1");
  const [frequency, setFrequency] = useState("10");
  const objects = useProjectStore((s) => s.objects);
  const addObject = useProjectStore((s) => s.addObject);
  const setStatus = useUIStore((s) => s.setStatusMessage);

  const alignments = Array.from(objects.values()).filter(
    (o) => o.type === "alignment"
  );
  const profiles = Array.from(objects.values()).filter(
    (o) => o.type === "profile"
  );

  const [pickedAlignmentId, setSelectedAlignmentId] = useState("");
  const [pickedProfileId, setSelectedProfileId] = useState("");
  const selectedAlignmentId = pickedAlignmentId || alignments[alignments.length - 1]?.id || "";
  const selectedProfileId = pickedProfileId || profiles[profiles.length - 1]?.id || "";

  async function createCorridor() {
    if (!selectedAlignmentId || !selectedProfileId) {
      setStatus("Select an alignment and profile first");
      return;
    }

    setStatus("Building corridor...");

    try {
      const result = await bridge.createCorridor(
        name,
        selectedAlignmentId,
        selectedProfileId,
        parseFloat(frequency) || 10
      );

      addObject({
        id: result.id,
        name: result.name,
        type: "corridor",
        dependencies: [selectedAlignmentId, selectedProfileId],
        dependents: [],
        version: 1,
        visible: true,
        locked: false,
        data: {
          alignmentId: result.alignment_id,
          profileId: result.profile_id,
          vertexCount: result.vertex_count,
          triangleCount: result.triangle_count,
          vertices: result.vertices,
          indices: result.indices,
        },
      });

      setStatus(
        `Corridor "${name}" created (${result.vertex_count} vertices)`
      );
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  }

  return (
    <div className="p-3 space-y-3" data-tutorial-id="corridor-form">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Create Corridor
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

      <div className="space-y-1">
        <label className="text-[11px] text-text-muted">Profile</label>
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-md text-sm text-text-primary outline-none"
        >
          <option value="">Select profile...</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Cross-section Interval"
        value={frequency}
        onChange={(e) => setFrequency(e.target.value)}
        type="number"
        suffix="m"
      />

      <Button
        variant="primary"
        size="sm"
        onClick={createCorridor}
        disabled={!selectedAlignmentId || !selectedProfileId}
        className="w-full"
      >
        Build Corridor
      </Button>
    </div>
  );
}
