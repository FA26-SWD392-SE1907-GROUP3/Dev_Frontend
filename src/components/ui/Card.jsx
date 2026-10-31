export default function Card({ as: Component = 'div', className = '', children, ...props }) {
  return (
    <Component
      {...props}
      className={`min-w-0 rounded-xl border border-appborder bg-surface p-4 text-apptext shadow-card sm:p-6 ${className}`}
    >
      {children}
    </Component>
  );
}
