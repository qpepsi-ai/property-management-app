const VARIANTS = {
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
  info: "bg-info-bg text-info-fg",
  neutral: "bg-neutral-bg text-neutral-fg",
} as const;

export default function Badge({
  variant = "neutral",
  children,
}: {
  variant?: keyof typeof VARIANTS;
  children: React.ReactNode;
}) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}
