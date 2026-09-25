import type { ReactNode } from "react";
import { CloseButton } from "@/components/ui/close-button";

interface Props {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function DockablePanel({ title, children, onClose, className = "" }: Props) {
  return (
    <div className={`flex flex-col h-full animate-fade-up ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </h3>
        {onClose && (
          <CloseButton onClick={onClose} />
        )}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
