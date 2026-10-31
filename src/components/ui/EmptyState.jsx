export default function EmptyState({
  icon: Icon, title, description, action, className = '', ...props
}) {
  return (
    <div {...props} className={`flex min-w-0 flex-col items-center gap-4 rounded-xl border border-dashed border-appborder bg-surface px-4 py-10 text-center sm:px-6 ${className}`}>
      {Icon && <span className="flex size-12 items-center justify-center rounded-xl bg-info-soft text-info-text"><Icon aria-hidden="true" className="size-6" /></span>}
      <div className="max-w-md space-y-2">
        <p className="text-base font-semibold text-apptext">{title}</p>
        {description && <p className="text-sm leading-6 text-mutedtext">{description}</p>}
      </div>
      {action && <div className="flex max-w-full flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
