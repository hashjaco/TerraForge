import { useState, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface Props {
  tabs: Tab[];
  defaultTab?: string;
  active?: string;
  onChange?: (id: string) => void;
}

export function Tabs({ tabs, defaultTab, active: controlledActive, onChange }: Props) {
  const [uncontrolledActive, setUncontrolledActive] = useState(defaultTab || tabs[0]?.id);
  const active = controlledActive ?? uncontrolledActive;
  const setActive = onChange ?? setUncontrolledActive;

  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border shrink-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
              active === tab.id
                ? "text-primary-400 border-primary-500"
                : "text-text-secondary border-transparent hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">{activeTab?.content}</div>
    </div>
  );
}
