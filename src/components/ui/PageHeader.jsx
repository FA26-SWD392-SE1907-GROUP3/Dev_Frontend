export default function PageHeader({ title, description, action, className = '', children, ...props }) {
  return (
    <header {...props} className={`flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div className="min-w-0 space-y-2">
        <h1 className="break-words text-[1.75rem] font-semibold leading-tight tracking-tight text-apptext sm:text-page">{title}</h1>
        {description && <p className="max-w-2xl text-sm leading-6 text-mutedtext">{description}</p>}
        {children}
      </div>
      {action && <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2 sm:justify-end">{action}</div>}
    </header>
  );
}
