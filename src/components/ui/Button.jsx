import { LoaderCircle } from 'lucide-react';

const variants = {
  primary: 'border-transparent bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border-appborder bg-surface text-apptext hover:bg-surface-hover',
  danger: 'border-transparent bg-danger text-on-danger hover:bg-danger-hover',
  ghost: 'border-transparent bg-transparent text-apptext hover:bg-surface-hover',
};

/** Keeps the accessible button name stable while loading. */
export default function Button({
  variant = 'primary', loading = false, disabled = false,
  type = 'button', className = '', children, ...props
}) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || props['aria-busy'] || undefined}
      className={`inline-flex min-h-11 min-w-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${variants[variant] || variants.primary} ${className}`}
    >
      {loading && <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  );
}
