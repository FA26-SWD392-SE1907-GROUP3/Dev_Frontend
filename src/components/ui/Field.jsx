import { useId } from 'react';

/** Shared label, help and validation wiring for native form controls. */
export default function Field({
  as: Control, id, label, helperText, error, className = '',
  wrapperClassName = '', children, ...props
}) {
  const generatedId = useId();
  const controlId = id || generatedId;
  const helperId = helperText ? `${controlId}-help` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [props['aria-describedby'], helperId, errorId].filter(Boolean).join(' ') || undefined;
  const invalid = error ? true : props['aria-invalid'];

  return (
    <div className={`min-w-0 space-y-2 ${wrapperClassName}`}>
      {label && <label htmlFor={controlId} className="block text-sm font-medium text-apptext">{label}</label>}
      <Control
        {...props}
        id={controlId}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={`block min-h-11 w-full min-w-0 rounded-lg border bg-surface px-3 py-2 text-sm leading-6 text-apptext transition-colors placeholder:text-mutedtext focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:bg-canvas disabled:text-mutedtext motion-reduce:transition-none ${invalid === true || invalid === 'true' ? 'border-danger-text' : 'border-fieldborder'} ${className}`}
      >
        {children}
      </Control>
      {helperText && <p id={helperId} className="text-caption text-mutedtext">{helperText}</p>}
      {error && <p id={errorId} role="alert" className="text-caption text-danger-text">{error}</p>}
    </div>
  );
}
