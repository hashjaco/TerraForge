import { useState, type ReactNode } from "react";
import { useEducationStore } from "@/stores/education-store";

interface EducationalTooltipProps {
  term: string;
  explanation: string;
  children: ReactNode;
}

export function EducationalTooltip({
  term,
  explanation,
  children,
}: EducationalTooltipProps) {
  const showTooltips = useEducationStore((s) => s.showTooltips);
  const [visible, setVisible] = useState(false);

  if (!showTooltips) return <>{children}</>;

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="border-b border-dashed border-primary-400/50 cursor-help">
        {children}
      </span>
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-surface-raised border border-border rounded-lg shadow-xl p-3 max-w-[250px]">
            <div className="text-xs font-semibold text-primary-400 mb-1">
              {term}
            </div>
            <div className="text-[11px] text-text-secondary leading-relaxed">
              {explanation}
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

export const CIVIL_TOOLTIPS: Record<string, string> = {
  Surface:
    "A 3D representation of terrain, created from survey points using triangulation (TIN) or a regular grid.",
  Alignment:
    "The horizontal path of a road or feature, defined by lines, arcs, and spirals in plan view.",
  Profile:
    "The vertical elevation along an alignment, showing how the road rises and falls over the terrain.",
  Corridor:
    "A 3D model of a road created by sweeping a cross-section template along an alignment and profile.",
  "Pipe Network":
    "A system of pipes and structures (manholes, inlets) for storm water, sewage, or water distribution.",
  Station:
    "A distance measurement along an alignment from its starting point. Station 1+00 = 100m from start.",
  PVI: "Point of Vertical Intersection - where two grade lines meet in a profile, usually connected by a vertical curve.",
  TIN: "Triangulated Irregular Network - a surface model made of connected triangles formed from survey points.",
  "Cross Section":
    "A slice perpendicular to the alignment showing the road shape: lanes, shoulders, slopes, and ditches.",
};
