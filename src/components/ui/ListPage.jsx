import { useEffect, useId, useRef, useState } from 'react';
import { Pencil, Search, Trash2 } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import EmptyState from './EmptyState';
import Input from './Input';
import PageHeader from './PageHeader';
import Skeleton from './Skeleton';

const defaultSearchKeys = ['name', 'title', 'content', 'keyword'];
const readValue = (row, key) => String(key).split('.').reduce((value, part) => value?.[part], row);
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi').trim();
const messageOf = error => typeof error === 'string' ? error : error?.message;

function DeleteConfirmation({ row, onDelete, onClose, getRowLabel }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const rowLabel = getRowLabel?.(row) ?? row.name ?? row.title ?? row.content;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  async function confirm() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const result = await onDelete(row);
      if (result !== false) onClose();
    } catch (failure) {
      setError(messageOf(failure) || 'Không thể xóa dữ liệu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-busy={saving || undefined}
      onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-md space-y-4 rounded-xl border border-appborder bg-surface p-6 text-apptext shadow-card backdrop:bg-slate-950/60"
    >
      <h2 id={titleId} className="text-section font-semibold">Bạn chắc chắn muốn xóa?</h2>
      {rowLabel && <p className="break-words text-sm text-mutedtext">{rowLabel}</p>}
      {error && <p role="alert" className="text-sm text-danger-text">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button autoFocus variant="secondary" disabled={saving} onClick={onClose}>Hủy</Button>
        <Button variant="danger" loading={saving} onClick={confirm}>Xóa</Button>
      </div>
    </dialog>
  );
}

/**
 * columns: { key, label, render?: (row) => ReactNode, className? }[]
 * searchKeys accepts property paths or row => value functions.
 * Callers own data fetching, permissions, mutations and success toasts.
 * onDelete must reject on failure (or return false to keep the dialog open).
 */
export default function ListPage({
  title, description, columns = [], rows = [],
  onCreate, createLabel = '+ Tạo mới', onEdit, onDelete, extraRowActions,
  canEditRow = () => true, canDeleteRow = () => true,
  editDisabled = () => false, deleteDisabled = () => false, editTitle, deleteTitle,
  onRowClick, openLabel = 'Xem chi tiết', getRowLabel,
  searchKeys = defaultSearchKeys, searchLabel = 'Tìm kiếm',
  searchPlaceholder = 'Tìm kiếm theo tên hoặc từ khóa...',
  loading = false, error, onRetry, toolbar, secondaryActions,
  keyField = 'id', className = '',
}) {
  const [search, setSearch] = useState('');
  const [deletingRow, setDeletingRow] = useState(null);
  const deleteTriggerRef = useRef(null);
  const searchRef = useRef(null);
  const closeConfirmation = () => {
    setDeletingRow(null);
    requestAnimationFrame(() => {
      const target = deleteTriggerRef.current;
      (target?.isConnected ? target : searchRef.current)?.focus();
    });
  };
  const query = normalize(search);
  const filteredRows = query
    ? rows.filter(row => searchKeys.some(key => normalize(typeof key === 'function' ? key(row) : readValue(row, key)).includes(query)))
    : rows;
  const hasActions = Boolean(onEdit || onDelete || extraRowActions || onRowClick);
  const columnCount = Math.max(1, columns.length + Number(hasActions));
  const createAction = onCreate && <Button onClick={onCreate}>{createLabel}</Button>;
  const headerActions = (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:w-64">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 size-4 text-mutedtext" />
        <Input ref={searchRef} type="search" aria-label={searchLabel} placeholder={searchPlaceholder} value={search} onChange={event => setSearch(event.target.value)} className="pl-10" />
      </div>
      {secondaryActions}
      {createAction}
    </div>
  );

  return (
    <section className={`min-w-0 space-y-6 ${className}`}>
      <PageHeader title={title} description={description} action={headerActions} />
      {toolbar && <div className="flex min-w-0 flex-wrap items-end gap-4">{toolbar}</div>}
      {error && !loading ? (
        <Card>
          <div role="alert" className="space-y-2">
            <p className="font-medium text-danger-text">Không thể tải dữ liệu.</p>
            {messageOf(error) && <p className="break-words text-sm text-mutedtext">{messageOf(error)}</p>}
          </div>
          {onRetry && <Button className="mt-4" variant="secondary" onClick={onRetry}>Thử lại</Button>}
        </Card>
      ) : !loading && rows.length === 0 ? (
        <EmptyState title="Chưa có dữ liệu" action={createAction} />
      ) : !loading && filteredRows.length === 0 ? (
        <EmptyState title="Không tìm thấy kết quả" action={<Button variant="secondary" onClick={() => setSearch('')}>Xóa tìm kiếm</Button>} />
      ) : (
        <div className="min-w-0 overflow-hidden rounded-xl border border-appborder bg-surface shadow-card">
          <p role="status" aria-live="polite" className="sr-only">{loading ? 'Đang tải dữ liệu...' : `${filteredRows.length} kết quả`}</p>
          <div role="region" aria-label={title} tabIndex={0} className="max-h-[70vh] overflow-auto focus-visible:outline-offset-[-2px]">
            <table aria-busy={loading || undefined} className="w-full min-w-[40rem] border-collapse text-left text-sm text-apptext">
              <caption className="sr-only">{title}</caption>
              <thead className="sticky top-0 z-10 bg-thead text-xs font-semibold tracking-wide text-mutedtext">
                <tr>
                  {columns.map(column => <th key={column.key} scope="col" className={`h-11 border-b border-appborder px-4 py-3 ${column.className || ''}`}>{column.label}</th>)}
                  {hasActions && <th scope="col" className="h-11 border-b border-appborder px-4 py-3 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }, (_, index) => (
                  <tr key={index} aria-hidden="true" className="border-b border-appborder last:border-0">
                    {Array.from({ length: columnCount }, (_, cell) => <td key={cell} className="h-14 px-4 py-4"><Skeleton className={cell === 0 ? 'w-3/4' : 'w-2/3'} /></td>)}
                  </tr>
                )) : filteredRows.map((row, index) => (
                  <tr
                    key={typeof keyField === 'function' ? keyField(row) : readValue(row, keyField) ?? index}
                    onClick={onRowClick ? event => {
                      if (!event.target.closest('button, a, input, select, textarea, label, [role="button"]')) onRowClick(row);
                    } : undefined}
                    className={`border-b border-appborder even:bg-canvas hover:bg-surface-hover focus-within:bg-surface-hover last:border-0 ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {columns.map(column => <td key={column.key} className={`h-14 px-4 py-3 align-middle ${column.className || ''}`}>{column.render ? column.render(row) : readValue(row, column.key)}</td>)}
                    {hasActions && <td className="h-14 whitespace-nowrap px-4 py-2 align-middle">
                      <div className="flex items-center justify-end gap-2">
                        {onRowClick && <Button variant="secondary" onClick={() => onRowClick(row)}>{openLabel}</Button>}
                        {extraRowActions?.(row)}
                        {onEdit && canEditRow(row) && <Button variant="ghost" disabled={editDisabled(row)} title={typeof editTitle === 'function' ? editTitle(row) : editTitle} onClick={() => onEdit(row)}><Pencil aria-hidden="true" className="size-4" />Sửa</Button>}
                        {onDelete && canDeleteRow(row) && <Button variant="ghost" disabled={deleteDisabled(row)} title={typeof deleteTitle === 'function' ? deleteTitle(row) : deleteTitle} className="text-danger-text" onClick={event => { deleteTriggerRef.current = event.currentTarget; setDeletingRow(row); }}><Trash2 aria-hidden="true" className="size-4" />Xóa</Button>}
                      </div>
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {deletingRow !== null && <DeleteConfirmation row={deletingRow} onDelete={onDelete} onClose={closeConfirmation} getRowLabel={getRowLabel} />}
    </section>
  );
}
