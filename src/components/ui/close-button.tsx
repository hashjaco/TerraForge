interface Props {
  onClick: () => void;
  label?: string;
}

export function CloseButton({ onClick, label = "Close" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid place-items-center w-6 h-6 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-overlay transition-colors"
    >
      <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
      </svg>
    </button>
  );
}
