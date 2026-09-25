import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import * as bridge from "@/lib/tauri-bridge";

export function PipePanel() {
  const [name, setName] = useState("Storm Network 1");
  const [systemType, setSystemType] = useState("storm");
  const addObject = useProjectStore((s) => s.addObject);
  const setStatus = useUIStore((s) => s.setStatusMessage);

  async function createNetwork() {
    setStatus("Creating pipe network...");

    try {
      const result = await bridge.createPipeNetwork(name, systemType);

      addObject({
        id: result.id,
        name: result.name,
        type: "pipe-network",
        dependencies: [],
        dependents: [],
        version: 1,
        visible: true,
        locked: false,
        data: {
          systemType: result.system_type,
          nodeCount: result.node_count,
          pipeCount: result.pipe_count,
          nodes: result.nodes,
          pipes: result.pipes,
        },
      });

      setStatus(`Pipe network "${name}" created`);
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  }

  return (
    <div className="p-3 space-y-3" data-tutorial-id="pipe-form">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Create Pipe Network
      </h3>
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="space-y-1">
        <label className="text-[11px] text-text-muted">System Type</label>
        <select
          value={systemType}
          onChange={(e) => setSystemType(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-md text-sm text-text-primary outline-none"
        >
          <option value="storm">Storm Sewer</option>
          <option value="sanitary">Sanitary Sewer</option>
          <option value="water">Water</option>
        </select>
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={createNetwork}
        className="w-full"
      >
        Create Network
      </Button>
    </div>
  );
}
