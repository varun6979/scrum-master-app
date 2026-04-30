import { useState } from 'react';
import { Users, Plus, Trash2, Edit2, X, Mail, Plane, CalendarOff } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { TeamMember, MemberRole } from '../types';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';

function isOOOToday(member: TeamMember): boolean {
  if (!member.oooStart || !member.oooEnd) return false;
  const today = new Date().toISOString().split('T')[0];
  return today >= member.oooStart && today <= member.oooEnd;
}

function formatOOORange(start: string, end: string): string {
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  scrum_master: 'Scrum Master',
  product_owner: 'Product Owner',
  developer: 'Developer',
  designer: 'Designer',
  qa: 'QA Engineer',
};

const AVATAR_COLORS = ['#4F6EF7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function MemberForm({ member, onSave, onCancel }: {
  member?: TeamMember | null;
  onSave: (data: Omit<TeamMember, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(member?.name ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [role, setRole] = useState<MemberRole>(member?.role ?? 'developer');
  const [capacity, setCapacity] = useState(member?.capacityPoints ?? 30);
  const [color, setColor] = useState(member?.avatarColor ?? AVATAR_COLORS[0]);
  const [oooStart, setOooStart] = useState(member?.oooStart ?? '');
  const [oooEnd, setOooEnd] = useState(member?.oooEnd ?? '');

  const initials = name.trim().split(' ').map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(), email, role, avatarInitials: initials, avatarColor: color, capacityPoints: capacity,
      oooStart: oooStart || undefined, oooEnd: oooEnd || oooStart || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar initials={initials || '?'} color={color} size="lg" />
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-slate-700 scale-110' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
          <input className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
          <input type="email" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
          <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={role} onChange={(e) => setRole(e.target.value as MemberRole)}>
            {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Sprint Capacity (points)</label>
          <input type="number" min={1} max={100} className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">OOO Start Date</label>
          <input type="date" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={oooStart} onChange={(e) => { setOooStart(e.target.value); if (!oooEnd) setOooEnd(e.target.value); }} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">OOO End Date</label>
          <input type="date" className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={oooEnd} min={oooStart} onChange={(e) => setOooEnd(e.target.value)} />
        </div>
      </div>
      {oooStart && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          <span className="flex items-center gap-1.5"><Plane size={12} /> OOO set: {formatOOORange(oooStart, oooEnd || oooStart)}</span>
          <button type="button" onClick={() => { setOooStart(''); setOooEnd(''); }} className="text-amber-500 hover:text-amber-700">Clear</button>
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600">Save Member</button>
      </div>
    </form>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  const { stories, activeSprintId, updateMember, deleteMember } = useScrumStore();
  const [editing, setEditing] = useState(false);
  const [showOOOPicker, setShowOOOPicker] = useState(false);
  const [quickOooStart, setQuickOooStart] = useState('');
  const [quickOooEnd, setQuickOooEnd] = useState('');

  const sprintStories = stories.filter((s) => s.sprintId === activeSprintId && s.assigneeId === member.id);
  const assignedPoints = sprintStories.reduce((sum, s) => sum + s.storyPoints, 0);
  const donePoints = sprintStories.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.storyPoints, 0);
  const capacityPct = Math.min(100, Math.round((assignedPoints / Math.max(1, member.capacityPoints)) * 100));
  const isOvercapacity = assignedPoints > member.capacityPoints;
  const ooo = isOOOToday(member);
  const hasUpcomingOOO = member.oooStart && !ooo && member.oooStart > new Date().toISOString().split('T')[0];

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <MemberForm member={member} onSave={(data) => { updateMember(member.id, data); setEditing(false); }} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow ${ooo ? 'border-amber-300' : 'border-surface-border'}`}>
      {/* Color strip */}
      <div className="h-1.5" style={{ backgroundColor: ooo ? '#F59E0B' : member.avatarColor }} />
      <div className="p-5">
        {/* OOO banner */}
        {ooo && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-xs text-amber-700 font-medium">
            <Plane size={13} />
            <span>Out of Office · {formatOOORange(member.oooStart!, member.oooEnd ?? member.oooStart!)}</span>
            <button onClick={() => updateMember(member.id, { oooStart: undefined, oooEnd: undefined })} className="ml-auto text-amber-400 hover:text-amber-600">
              <X size={12} />
            </button>
          </div>
        )}
        {hasUpcomingOOO && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4 text-xs text-blue-700">
            <CalendarOff size={13} />
            <span>OOO upcoming · {formatOOORange(member.oooStart!, member.oooEnd ?? member.oooStart!)}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar initials={member.avatarInitials} color={ooo ? '#F59E0B' : member.avatarColor} size="lg" />
              {ooo && (
                <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5">
                  <Plane size={8} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{member.name}</h3>
              <Badge variant="role" value={member.role} />
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => { setShowOOOPicker(!showOOOPicker); setQuickOooStart(member.oooStart ?? ''); setQuickOooEnd(member.oooEnd ?? ''); }}
              title="Set Out of Office"
              className={`p-1.5 rounded-lg transition-colors ${ooo ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}>
              <Plane size={14} />
            </button>
            <button onClick={() => setEditing(true)} className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
            <button onClick={() => { if (window.confirm(`Remove ${member.name} from the team?`)) deleteMember(member.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Quick OOO picker */}
        {showOOOPicker && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 space-y-2">
            <p className="text-xs font-medium text-amber-700">Set Out of Office</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">From</label>
                <input type="date" className="w-full border border-surface-border rounded px-2 py-1 text-xs mt-0.5" value={quickOooStart} onChange={(e) => { setQuickOooStart(e.target.value); if (!quickOooEnd) setQuickOooEnd(e.target.value); }} />
              </div>
              <div>
                <label className="text-xs text-slate-500">To</label>
                <input type="date" className="w-full border border-surface-border rounded px-2 py-1 text-xs mt-0.5" value={quickOooEnd} min={quickOooStart} onChange={(e) => setQuickOooEnd(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { updateMember(member.id, { oooStart: undefined, oooEnd: undefined }); setShowOOOPicker(false); }} className="text-xs px-2 py-1 rounded text-slate-500 hover:bg-slate-100">Clear</button>
              <button onClick={() => { if (quickOooStart) updateMember(member.id, { oooStart: quickOooStart, oooEnd: quickOooEnd || quickOooStart }); setShowOOOPicker(false); }} className="text-xs px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600">Save</button>
            </div>
          </div>
        )}

        {/* Email */}
        {member.email && (
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Mail size={12} />
            <span className="truncate">{member.email}</span>
          </div>
        )}

        {/* Capacity */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 font-medium">Sprint Capacity</span>
            <span className={`font-semibold ${isOvercapacity ? 'text-red-500' : 'text-slate-700'}`}>
              {assignedPoints}/{member.capacityPoints}pt
              {isOvercapacity && ' ⚠️'}
            </span>
          </div>
          <ProgressBar value={capacityPct} color={isOvercapacity ? '#EF4444' : member.avatarColor} size="sm" />
          <div className="flex justify-between text-xs text-slate-400">
            <span>{sprintStories.length} stories assigned</span>
            <span>{donePoints}pt done</span>
          </div>
        </div>

        {/* Story status breakdown */}
        {sprintStories.length > 0 && (
          <div className="mt-4 flex gap-1.5 flex-wrap">
            {(['done', 'review', 'in_progress', 'todo'] as const).map((st) => {
              const count = sprintStories.filter((s) => s.status === st).length;
              if (count === 0) return null;
              const colors: Record<string, string> = { done: 'bg-green-100 text-green-700', review: 'bg-amber-100 text-amber-700', in_progress: 'bg-purple-100 text-purple-700', todo: 'bg-blue-100 text-blue-700' };
              const labels: Record<string, string> = { done: 'Done', review: 'Review', in_progress: 'In Progress', todo: 'To Do' };
              return <span key={st} className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[st]}`}>{count} {labels[st]}</span>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function TeamManagement() {
  const { members, addMember, stories, activeSprintId } = useScrumStore();
  const [showForm, setShowForm] = useState(false);

  const totalCapacity = members.reduce((sum, m) => sum + m.capacityPoints, 0);
  const totalAssigned = stories.filter((s) => s.sprintId === activeSprintId).reduce((sum, s) => sum + s.storyPoints, 0);
  const oooToday = members.filter(isOOOToday);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Users size={20} className="text-brand-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Team</h1>
            <p className="text-sm text-slate-500">{members.length} members · {totalCapacity}pt total capacity</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* OOO Today banner */}
      {oooToday.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <Plane size={16} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Out of Office Today</p>
            <p className="text-xs text-amber-700">{oooToday.map(m => m.name).join(', ')} — consider redistributing their stories</p>
          </div>
        </div>
      )}

      {/* Sprint capacity summary */}
      <div className="bg-white rounded-xl border border-surface-border p-5 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-slate-700">Active Sprint Capacity Utilization</h3>
          <span className="text-sm font-bold text-slate-800">{totalAssigned}/{totalCapacity}pt</span>
        </div>
        <ProgressBar value={Math.min(100, Math.round((totalAssigned / Math.max(1, totalCapacity)) * 100))} color="#4F6EF7" size="md" showLabel />
        <div className="flex gap-6 mt-3">
          {members.map((m) => {
            const pts = stories.filter((s) => s.sprintId === activeSprintId && s.assigneeId === m.id).reduce((sum, s) => sum + s.storyPoints, 0);
            return (
              <div key={m.id} className="flex items-center gap-2">
                <Avatar initials={m.avatarInitials} color={m.avatarColor} size="sm" />
                <div>
                  <p className="text-xs font-medium text-slate-700">{m.name.split(' ')[0]}</p>
                  <p className="text-xs text-slate-400">{pts}/{m.capacityPoints}pt</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-brand-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Add Team Member</h3>
          <MemberForm onSave={(data) => { addMember(data); setShowForm(false); }} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Member grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => <MemberCard key={m.id} member={m} />)}
      </div>
    </div>
  );
}
