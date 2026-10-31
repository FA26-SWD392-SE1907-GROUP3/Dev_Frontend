import Button from './Button';
import Card from './Card';
import PageHeader from './PageHeader';

/** Full-page form shell; callers supply fields, validation and save callbacks. */
export default function FormPage({
  title, description, onBack, onSubmit, children, saving = false,
  disabled = false, error, saveLabel = 'Lưu', cancelLabel = 'Hủy',
  backLabel = '← Quay lại danh sách', className = '',
}) {
  return (
    <section className={`min-w-0 space-y-6 ${className}`}>
      <Button variant="ghost" disabled={saving} onClick={onBack}>{backLabel}</Button>
      <PageHeader title={title} description={description} />
      <Card as="form" aria-label={title} aria-busy={saving || undefined} onSubmit={event => {
        event.preventDefault();
        if (!saving && !disabled) onSubmit?.(event);
      }}>
        <fieldset disabled={saving} className="m-0 min-w-0 space-y-6 border-0 p-0">
          {children}
        </fieldset>
        {error && <p role="alert" className="mt-4 break-words text-sm text-danger-text">{typeof error === 'string' ? error : error.message || 'Không thể lưu dữ liệu. Vui lòng thử lại.'}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-appborder pt-6">
          <Button variant="secondary" disabled={saving} onClick={onBack}>{cancelLabel}</Button>
          <Button type="submit" loading={saving} disabled={disabled || !onSubmit}>{saveLabel}</Button>
        </div>
      </Card>
    </section>
  );
}
