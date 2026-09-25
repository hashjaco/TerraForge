import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white shadow-elev-1 hover:bg-primary-500 hover:shadow-[0_0_0_1px_var(--tf-accent),0_4px_16px_-4px_var(--tf-accent)] active:bg-primary-700",
  secondary:
    "bg-surface-overlay text-text-primary border border-border hover:bg-surface-secondary hover:border-text-muted",
  ghost: "text-text-secondary hover:bg-surface-overlay hover:text-text-primary",
  danger: "bg-error/10 text-error hover:bg-error/20",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-sm",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={`rounded-md font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.97] inline-flex items-center justify-center gap-1.5 ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? "opacity-50 cursor-not-allowed active:scale-100" : "cursor-pointer"} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
