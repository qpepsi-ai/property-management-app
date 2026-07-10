export const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export const labelClass = "block text-xs font-medium text-muted";

export const cardClass = "rounded-2xl bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]";

// Wraps a page's content in a white panel, so the app's gray backdrop
// (--page-bg) shows on the sides and around it, rather than the page
// itself being edge-to-edge white.
export const pagePanelClass =
  "my-8 bg-background rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]";

export const linkClass = "text-accent hover:underline";

export function buttonClass(
  variant: "primary" | "secondary" | "danger" | "ghost" = "primary",
) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-accent text-accent-foreground hover:bg-[#0077ed]",
    secondary: "bg-surface text-foreground hover:bg-[#e8e8ed]",
    danger: "border border-danger-fg/30 text-danger-fg hover:bg-danger-bg",
    ghost: "text-accent hover:underline px-0 py-0 rounded-none",
  };
  return `${base} ${variants[variant]}`;
}
