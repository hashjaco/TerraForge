import { useState, useRef, useEffect, type ReactNode } from "react";

interface DropdownItem {
  id: string;
  label: string;
  onClick: () => void;
}

interface Props {
  trigger: ReactNode;
  items: DropdownItem[];
}

export function Dropdown({ trigger, items }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-surface-raised border border-border rounded-lg shadow-xl py-1 min-w-[160px] z-50">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-surface-overlay transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
