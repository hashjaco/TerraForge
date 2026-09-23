import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: string;
}

export function Input({ label, suffix, className = "", ...props }: Props) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[11px] text-text-muted block">{label}</label>
      )}
      <div className="relative">
        <input
          className={`w-full px-2.5 py-1.5 bg-surface border border-border rounded-md text-sm text-text-primary outline-none focus:border-border-active transition-colors ${className}`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
