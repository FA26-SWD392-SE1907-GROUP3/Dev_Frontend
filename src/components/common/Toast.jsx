import React from 'react';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl text-xs max-w-sm animate-fade-in border border-slate-700">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <div className="flex-1 text-slate-100">{toast.message}</div>
      <button onClick={onClose} className="text-slate-400 hover:text-white text-base leading-none ml-2">
        &times;
      </button>
    </div>
  );
}
