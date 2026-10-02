import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className={`bg-surface text-apptext rounded-xl border border-appborder w-full ${maxWidth} p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto transition-colors`}>
        <div className="flex items-center justify-between pb-3 border-b border-appborder">
          <h3 className="text-base font-semibold text-apptext">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-md text-mutedtext hover:text-apptext hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
