/** Decorative by default; give the loading region its own localized status. */
export default function Skeleton({ className = '', ...props }) {
  return <div {...props} aria-hidden="true" className={`h-4 rounded-lg bg-skeleton motion-safe:animate-pulse ${className}`} />;
}
