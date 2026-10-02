import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Modal from '../common/Modal';
import { Plus, Edit2 } from 'lucide-react';

export default function LecturerRubric({ rubric, setRubric, onShowToast, t }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCriterion, setNewCriterion] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newWeight, setNewWeight] = useState(2.0);

  const [editingItem, setEditingItem] = useState(null);

  const handleAddCriterion = (e) => {
    e.preventDefault();
    if (!newCriterion.trim()) return;

    const item = {
      id: `rub-${Date.now()}`,
      criterion: newCriterion.trim(),
      description: newDesc.trim(),
      weight: Number(newWeight),
      maxPoints: Number(newWeight),
    };

    setRubric([...rubric, item]);
    setIsAddOpen(false);
    setNewCriterion('');
    setNewDesc('');
    setNewWeight(2.0);
    onShowToast(`${item.criterion} added.`);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setRubric(rubric.map((r) => (r.id === editingItem.id ? editingItem : r)));
    setEditingItem(null);
    onShowToast(t.saveChanges);
  };

  const totalPoints = rubric.reduce((acc, curr) => acc + curr.weight, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-apptext tracking-tight">{t.rubricTitle}</h1>
          <p className="text-sm text-mutedtext mt-1">{t.rubricSub}</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium flex items-center space-x-2 transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addCriterion}</span>
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-appborder shadow-xs overflow-hidden transition-colors">
        {/* Rubric Header Banner */}
        <div className="p-5 border-b border-appborder flex flex-wrap justify-between items-center bg-canvas/60 gap-2">
          <div>
            <h3 className="text-sm font-semibold text-apptext">
              {t.activeRubric}
            </h3>
            <p className="text-xs text-mutedtext mt-0.5">
              {t.totalWeight}: <span className="font-semibold text-apptext">{totalPoints.toFixed(1)} points</span>
            </p>
          </div>
          <StatusBadge status={t.statusApproved} />
        </div>

        {/* Rubric Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-appborder text-xs font-semibold uppercase">
              <tr>
                <th className="px-5 py-3">{t.colCriterion}</th>
                <th className="px-5 py-3">{t.colDescription}</th>
                <th className="px-5 py-3">{t.colWeight}</th>
                <th className="px-5 py-3 text-right">{t.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-appborder">
              {rubric.map((item) => (
                <tr key={item.id} className="h-[52px] hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-semibold text-apptext whitespace-nowrap">
                    {item.criterion}
                  </td>
                  <td className="px-5 py-3 text-mutedtext text-xs leading-relaxed max-w-lg">
                    {item.description}
                  </td>
                  <td className="px-5 py-3 font-medium text-apptext whitespace-nowrap">
                    {item.weight.toFixed(1)} pts ({((item.weight / totalPoints) * 100).toFixed(0)}%)
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditingItem({ ...item })}
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{t.editPrompt}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Criterion Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={t.addCriterion}>
        <form onSubmit={handleAddCriterion} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-apptext mb-1">{t.colCriterion}</label>
            <input
              type="text"
              required
              value={newCriterion}
              onChange={(e) => setNewCriterion(e.target.value)}
              placeholder="e.g. Synthesis & Application"
              className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-apptext mb-1">{t.colDescription}</label>
            <textarea
              required
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Candidate articulates real-world application of deadlock prevention..."
              className="w-full p-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-apptext mb-1">{t.colWeight}</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="10"
              required
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="h-10 px-4 rounded-lg border border-appborder text-xs font-medium text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs"
            >
              {t.addCriterion}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Criterion Modal */}
      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title={t.rubricTitle}>
        {editingItem && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">{t.colCriterion}</label>
              <input
                type="text"
                required
                value={editingItem.criterion}
                onChange={(e) => setEditingItem({ ...editingItem, criterion: e.target.value })}
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">{t.colDescription}</label>
              <textarea
                required
                rows={3}
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="w-full p-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-apptext mb-1">{t.colWeight}</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="10"
                required
                value={editingItem.weight}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    weight: Number(e.target.value),
                    maxPoints: Number(e.target.value),
                  })
                }
                className="w-full h-10 px-3 bg-canvas border border-appborder rounded-lg text-sm text-apptext focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="h-10 px-4 rounded-lg border border-appborder text-xs font-medium text-mutedtext hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs"
              >
                {t.saveChanges}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
