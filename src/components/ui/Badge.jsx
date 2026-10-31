const variants = {
  neutral: 'bg-neutral-soft text-neutral-text',
  info: 'bg-info-soft text-info-text',
  success: 'bg-success-soft text-success-text',
  warning: 'bg-warning-soft text-warning-text',
  danger: 'bg-danger-soft text-danger-text',
};

export default function Badge({ variant = 'neutral', className = '', children, ...props }) {
  return (
    <span {...props} className={`inline-flex min-h-6 max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5 ${variants[variant] || variants.neutral} ${className}`}>
      {children}
    </span>
  );
}
