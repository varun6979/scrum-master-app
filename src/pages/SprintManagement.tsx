import { useState } from 'react';
import {
  Plus,
  Play,
  CheckSquare,
  Pencil,
  Trash2,
  Calendar,
  Target,
  Zap,
} from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Sprint, SprintStatus } from '../types';
import { formatDate, getDaysLeft } from '../lib/dateUtils';
import { format, addDays } from 'date-fns';

interface SprintFormData {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
}

const emptyForm = (): SprintFormData => {
  const start = new Date();
  const end = addDays(start, 13);
  return {
    name: '',
    goal: '',
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    status: 'planning',
  };
};

export function SprintManagement() {
  const { sprints, stories, addSprint, updateSprint, deleteSprint, startSprint, completeSprint } =
    useScrumStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSprint, setEditSprint] = useState<Sprint | null>(null);
  const [form, setForm] = useState<SprintFormData>(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openCreate = () => {
    setEditSprint(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (sprint: Sprint) => {
    setEditSprint(sprint);
    setForm({
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: sprint.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editSprint) {
      updateSprint(editSprint.id, form);
    } else {
      addSprint(form);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteSprint(id);
    setConfirmDelete(null);
  };

  const sortedSprints = [...sprints].sort((a, b) => {
    const order: Record<SprintStatus, number> = { active: 0, planning: 1, completed: 2 };
    return order[a.status] - order[b.status] || a.startDate.localeCompare(b.startDate);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sprint Management</h1>
          <p className="text-slate-500 text-sm mt-1">{sprints.length} sprints total</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={16} /> Create Sprint
        </Button>
      </div>

      {/* Sprint cards */}
      <div className="space-y-4">
        {sortedSprints.map((sprint) => {
          const sprintStories = stories.filter((s) => s.sprintId === sprint.id);
          const totalPts = sprintStories.reduce((sum, s) => sum + s.storyPoints, 0);
          const donePts = sprintStories
            .filter((s) => s.status === 'done')
            .reduce((sum, s) => sum + s.storyPoints, 0);
          const daysLeft = sprint.status === 'active' ? getDaysLeft(sprint.endDate) : null;

          return (
            <div
              key={sprint.id}
              className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-sm ${
                sprint.status === 'active'
                  ? 'border-brand-200 bg-brand-50/30'
                  : 'border-surface-border'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Name + badge */}
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-base font-semibold text-slate-800">{sprint.name}</h2>
                    <Badge variant="sprint" value={sprint.status} />
                    {sprint.status === 'active' && daysLeft !== null && (
                      <span className={`text-xs font-medium ${daysLeft <= 2 ? 'text-red-500' : 'text-slate-400'}`}>
                        {daysLeft === 0 ? 'Ends today' : `${daysLeft}d left`}
                      </span>
                    )}
                  </div>

                  {/* Goal */}
                  {sprint.goal && (
                    <p className="text-sm text-slate-500 flex items-start gap-1.5 mb-3">
                      <Target size={13} className="mt-0.5 flex-shrink-0 text-slate-400" />
                      {sprint.goal}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-5 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                    </span>
                    <span>{sprintStories.length} stories</span>
                    <span>{totalPts} total pts</span>
                    {sprint.status === 'active' && (
                      <span className="text-green-600 font-medium">{donePts} pts done</span>
                    )}
                    {sprint.status === 'completed' && sprint.velocity !== undefined && (
                      <span className="flex items-center gap-1 text-brand-600 font-medium">
                        <Zap size={11} /> {sprint.velocity} velocity
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {sprint.status === 'planning' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => startSprint(sprint.id)}
                    >
                      <Play size={13} /> Start
                    </Button>
                  )}
                  {sprint.status === 'active' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Complete this sprint? Incomplete stories will return to backlog.')) {
                          completeSprint(sprint.id);
                        }
                      }}
                    >
                      <CheckSquare size={13} /> Complete
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openEdit(sprint)}>
                    <Pencil size={13} />
                  </Button>
                  {confirmDelete === sprint.id ? (
                    <>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(sprint.id)}>
                        Confirm
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => setConfirmDelete(sprint.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sprints.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <Calendar size={20} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No sprints yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-5">Create your first sprint to get started.</p>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} /> Create Sprint
          </Button>
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editSprint ? 'Edit Sprint' : 'Create Sprint'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sprint Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Sprint 5"
              className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sprint Goal</label>
            <textarea
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              rows={2}
              placeholder="What does this sprint aim to achieve?"
              className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!form.name.trim()}>
              {editSprint ? 'Save Changes' : 'Create Sprint'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
