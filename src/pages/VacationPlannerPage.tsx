import { useState, useMemo } from 'react';
import {
  Plane, Plus, Trash2, Edit2, X, ChevronLeft, ChevronRight,
  Users, Calendar, TrendingDown, CheckCircle2, AlertTriangle, Info,
} from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { VacationEntry, TeamMember, Sprint } from '../types';
import { Avatar } from '../components/ui/Avatar';
import { generateId } from '../lib/idgen';

// ─── Date helpers ───────────────────────────────────────────────────────────

function parseDate(s: string) { return new Date(s + 'T00:00:00'); }

function isWeekend(d: Date) { const day = d.getDay(); return day === 0 || day === 6; }

/** Count working days (Mon–Fri) between two ISO dates, inclusive */
function workingDaysBetween(startISO: string, endISO: string): number {
  const start = parseDate(startISO);
  const end = parseDate(endISO);
  if (start > end) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (!isWeekend(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Working days in a sprint */
function sprintWorkingDays(sprint: Sprint) {
  return workingDaysBetween(sprint.startDate, sprint.endDate);
}

/** Working days a vacation overlaps with a sprint */
function vacationOverlapDays(vacation: VacationEntry, sprint: Sprint): number {
  const start = vacation.startDate > sprint.startDate ? vacation.startDate : sprint.startDate;
  const end = vacation.endDate < sprint.endDate ? vacation.endDate : sprint.endDate;
  if (start > end) return 0;
  return workingDaysBetween(start, end);
}

/** Adjusted capacity for a member in a sprint given their vacations */
function adjustedCapacity(member: TeamMember, sprint: Sprint, vacations: VacationEntry[]): number {
  const totalWorkDays = sprintWorkingDays(sprint);
  if (totalWorkDays === 0) return 0;
  const memberVacations = vacations.filter((v) => v.memberId === member.id);
  const daysOff = memberVacations.reduce((sum, v) => sum + vacationOverlapDays(v, sprint), 0);
  const effectiveDays = Math.max(0, totalWorkDays - daysOff);
  return Math.round((member.capacityPoints * effectiveDays) / totalWorkDays);
}

function fmt(iso: string) {
  return parseDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtShort(iso: string) {
  return parseDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const VACATION_REASONS = ['PTO', 'Holiday', 'Sick Leave', 'Personal', 'Conference', 'Other'];

// ─── Mini calendar ───────────────────────────────────────────────────────────

function MiniCalendar({
  year, month, vacations, sprints, onDayClick,
}: {
  year: number;
  month: number; // 0-based
  vacations: VacationEntry[];
  sprints: Sprint[];
  onDayClick?: (iso: string) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const totalCells = startPad + lastDay.getDate();
  const weeks = Math.ceil(totalCells / 7);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));

  const toISO = (d: Date) => d.toISOString().split('T')[0];

  const isVacationDay = (iso: string) =>
    vacations.some((v) => iso >= v.startDate && iso <= v.endDate);

  const isSprintDay = (iso: string) =>
    sprints.some((s) => iso >= s.startDate && iso <= s.endDate);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="select-none">
      <div className="grid grid-cols-7 text-center mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: weeks * 7 }).map((_, i) => {
          const date = cells[i] ?? null;
          if (!date) return <div key={i} />;
          const iso = toISO(date);
          const weekend = isWeekend(date);
          const vacation = isVacationDay(iso);
          const sprint = isSprintDay(iso);
          const isToday = iso === today;

          return (
            <div
              key={i}
              onClick={() => onDayClick?.(iso)}
              className={`
                text-xs text-center py-1 rounded cursor-pointer transition-colors
                ${isToday ? 'ring-2 ring-brand-500 font-bold' : ''}
                ${vacation ? 'bg-amber-200 text-amber-900' : sprint ? 'bg-blue-50 text-blue-700' : ''}
                ${weekend ? 'text-slate-400' : 'text-slate-700'}
                ${!vacation && !sprint ? 'hover:bg-slate-100' : 'hover:opacity-80'}
              `}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vacation Form ───────────────────────────────────────────────────────────

function VacationForm({
  members,
  initial,
  onSave,
  onCancel,
}: {
  members: TeamMember[];
  initial?: Partial<VacationEntry>;
  onSave: (v: Omit<VacationEntry, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [memberId, setMemberId] = useState(initial?.memberId ?? members[0]?.id ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [endDate, setEndDate] = useState(initial?.endDate ?? today);
  const [reason, setReason] = useState(initial?.reason ?? 'PTO');

  const workDays = workingDaysBetween(startDate, endDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !startDate || !endDate) return;
    onSave({ memberId, startDate, endDate, reason });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Team Member</label>
        <select
          className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          required
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
          <input
            type="date"
            className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value); }}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
          <input
            type="date"
            className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Reason</label>
        <select
          className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {VACATION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      {workDays > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
          <Plane size={12} />
          <span>{workDays} working day{workDays !== 1 ? 's' : ''} off · {fmtShort(startDate)} – {fmtShort(endDate)}</span>
        </div>
      )}
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600">Save Vacation</button>
      </div>
    </form>
  );
}

// ─── Sprint Capacity Card ────────────────────────────────────────────────────

function SprintCapacityCard({ sprint, members, vacations }: {
  sprint: Sprint;
  members: TeamMember[];
  vacations: VacationEntry[];
}) {
  const totalBase = members.reduce((s, m) => s + m.capacityPoints, 0);
  const totalAdjusted = members.reduce((s, m) => s + adjustedCapacity(m, sprint, vacations), 0);
  const lost = totalBase - totalAdjusted;
  const pct = totalBase > 0 ? Math.round((totalAdjusted / totalBase) * 100) : 100;
  const workDays = sprintWorkingDays(sprint);

  const affectedMembers = members.filter((m) => {
    const adj = adjustedCapacity(m, sprint, vacations);
    return adj < m.capacityPoints;
  });

  const statusColor = pct >= 90 ? 'green' : pct >= 70 ? 'amber' : 'red';
  const statusBg = { green: 'bg-green-50 border-green-200', amber: 'bg-amber-50 border-amber-200', red: 'bg-red-50 border-red-200' }[statusColor];
  const barColor = { green: 'bg-green-500', amber: 'bg-amber-400', red: 'bg-red-500' }[statusColor];
  const textColor = { green: 'text-green-700', amber: 'text-amber-700', red: 'text-red-700' }[statusColor];

  return (
    <div className={`rounded-xl border p-4 ${statusBg}`}>
      {/* Sprint header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{sprint.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{fmtShort(sprint.startDate)} – {fmtShort(sprint.endDate)} · {workDays} work days</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor === 'green' ? 'bg-green-100 text-green-700' : statusColor === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
          {pct}% capacity
        </span>
      </div>

      {/* Capacity bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Available capacity</span>
          <span className={`font-semibold ${textColor}`}>{totalAdjusted}pt <span className="text-slate-400 font-normal">/ {totalBase}pt base</span></span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
        </div>
        {lost > 0 && (
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <TrendingDown size={11} className="text-red-400" />
            {lost}pt lost to vacation time
          </p>
        )}
      </div>

      {/* Per-member breakdown */}
      <div className="space-y-2">
        {members.map((m) => {
          const adj = adjustedCapacity(m, sprint, vacations);
          const memberVacDays = vacations
            .filter((v) => v.memberId === m.id)
            .reduce((s, v) => s + vacationOverlapDays(v, sprint), 0);
          const isAffected = adj < m.capacityPoints;

          return (
            <div key={m.id} className="flex items-center gap-2">
              <div className="relative shrink-0">
                <Avatar initials={m.avatarInitials} color={m.avatarColor} size="sm" />
                {isAffected && (
                  <div className="absolute -top-0.5 -right-0.5 bg-amber-400 rounded-full w-2.5 h-2.5 flex items-center justify-center">
                    <Plane size={6} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 truncate">{m.name.split(' ')[0]}</span>
                  <span className={`text-xs font-semibold ${isAffected ? 'text-amber-600' : 'text-slate-600'}`}>
                    {adj}pt {isAffected && <span className="text-slate-400 font-normal">/ {m.capacityPoints}pt</span>}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1 mt-0.5">
                  <div
                    className={`h-1 rounded-full ${isAffected ? 'bg-amber-400' : 'bg-brand-400'}`}
                    style={{ width: `${m.capacityPoints > 0 ? Math.round((adj / m.capacityPoints) * 100) : 100}%` }}
                  />
                </div>
                {memberVacDays > 0 && (
                  <p className="text-xs text-amber-600 mt-0.5">{memberVacDays} day{memberVacDays !== 1 ? 's' : ''} OOO this sprint</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      {affectedMembers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-600 flex items-start gap-1.5">
            <Info size={12} className="text-brand-400 mt-0.5 shrink-0" />
            Plan ~{totalAdjusted}pt of stories for this sprint. {affectedMembers.length > 0 && `${affectedMembers.map(m => m.name.split(' ')[0]).join(', ')} ${affectedMembers.length === 1 ? 'is' : 'are'} partially OOO.`}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function VacationPlannerPage() {
  const { members, sprints, vacations = [], addVacation, updateVacation, deleteVacation } = useScrumStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');

  // Only show upcoming/active sprints for capacity planning
  const relevantSprints = useMemo(() =>
    sprints
      .filter((s) => s.status !== 'completed')
      .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [sprints]
  );

  const filteredVacations = filterMemberId === 'all'
    ? vacations
    : vacations.filter((v) => v.memberId === filterMemberId);

  const calVacations = activeTab === 'calendar' ? filteredVacations : [];

  const prevMonth = () => setCalMonth(({ year, month }) =>
    month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
  );
  const nextMonth = () => setCalMonth(({ year, month }) =>
    month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
  );

  const monthLabel = new Date(calMonth.year, calMonth.month, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const editingVacation = editingId ? vacations.find((v) => v.id === editingId) : null;

  const totalVacDays = vacations.reduce((s, v) => s + workingDaysBetween(v.startDate, v.endDate), 0);
  const oooToday = vacations.filter((v) => {
    const today = new Date().toISOString().split('T')[0];
    return today >= v.startDate && today <= v.endDate;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <Plane size={20} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Team Vacation Planner</h1>
            <p className="text-sm text-slate-500">
              {vacations.length} vacation{vacations.length !== 1 ? 's' : ''} · {totalVacDays} total working days off
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} /> Add Vacation
        </button>
      </div>

      {/* OOO today banner */}
      {oooToday.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <Plane size={16} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Out of Office Today</p>
            <p className="text-xs text-amber-700">
              {oooToday.map((v) => {
                const m = members.find((x) => x.id === v.memberId);
                return m?.name;
              }).filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      {(showForm || editingId) && (
        <div className="bg-white rounded-xl border border-brand-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">{editingId ? 'Edit Vacation' : 'Add Vacation'}</h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <VacationForm
            members={members}
            initial={editingVacation ?? undefined}
            onSave={(data) => {
              if (editingId) {
                updateVacation(editingId, data);
                setEditingId(null);
              } else {
                addVacation(data);
                setShowForm(false);
              }
            }}
            onCancel={() => { setShowForm(false); setEditingId(null); }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: Calendar + Vacation List */}
        <div className="xl:col-span-2 space-y-6">

          {/* Filter + Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-surface-border overflow-hidden">
              {(['calendar', 'list'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-brand-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {tab === 'calendar' ? '📅 Calendar' : '📋 List'}
                </button>
              ))}
            </div>
            <select
              className="border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={filterMemberId}
              onChange={(e) => setFilterMemberId(e.target.value)}
            >
              <option value="all">All Members</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* Calendar view */}
          {activeTab === 'calendar' && (
            <div className="bg-white rounded-xl border border-surface-border p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeft size={16} /></button>
                <h3 className="text-sm font-semibold text-slate-800">{monthLabel}</h3>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronRight size={16} /></button>
              </div>
              <MiniCalendar
                year={calMonth.year}
                month={calMonth.month}
                vacations={calVacations}
                sprints={relevantSprints}
              />
              <div className="flex gap-4 mt-4 pt-3 border-t border-surface-border">
                <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-3 h-3 rounded bg-amber-200" /> Vacation</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-3 h-3 rounded bg-blue-50 border border-blue-200" /> Sprint</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-3 h-3 rounded ring-2 ring-brand-500" /> Today</div>
              </div>
            </div>
          )}

          {/* List view */}
          {activeTab === 'list' && (
            <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
              {filteredVacations.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Plane size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No vacations planned</p>
                  <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-brand-500 hover:underline">Add one</button>
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {filteredVacations
                    .sort((a, b) => a.startDate.localeCompare(b.startDate))
                    .map((v) => {
                      const member = members.find((m) => m.id === v.memberId);
                      const days = workingDaysBetween(v.startDate, v.endDate);
                      const today = new Date().toISOString().split('T')[0];
                      const isActive = today >= v.startDate && today <= v.endDate;
                      const isPast = v.endDate < today;

                      return (
                        <div key={v.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 ${isPast ? 'opacity-60' : ''}`}>
                          {member && <Avatar initials={member.avatarInitials} color={member.avatarColor} size="sm" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800">{member?.name ?? 'Unknown'}</span>
                              {isActive && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">OOO Now</span>}
                              {isPast && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Past</span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {fmt(v.startDate)} – {fmt(v.endDate)} · {days} working day{days !== 1 ? 's' : ''}
                              {v.reason && ` · ${v.reason}`}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => { setEditingId(v.id); setShowForm(false); }}
                              className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => { if (window.confirm('Delete this vacation?')) deleteVacation(v.id); }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Per-member vacation summary */}
          <div className="bg-white rounded-xl border border-surface-border p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Users size={15} className="text-brand-400" /> Team Vacation Summary
            </h3>
            <div className="space-y-3">
              {members.map((m) => {
                const memberVacs = vacations.filter((v) => v.memberId === m.id);
                const totalDays = memberVacs.reduce((s, v) => s + workingDaysBetween(v.startDate, v.endDate), 0);
                const upcoming = memberVacs.filter((v) => v.endDate >= new Date().toISOString().split('T')[0]);
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar initials={m.avatarInitials} color={m.avatarColor} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{m.name}</span>
                        <span className="text-xs text-slate-500">{totalDays} day{totalDays !== 1 ? 's' : ''} planned</span>
                      </div>
                      {upcoming.length > 0 && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          Next: {fmtShort(upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate))[0].startDate)}
                        </p>
                      )}
                      {upcoming.length === 0 && (
                        <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                          <CheckCircle2 size={10} /> No upcoming time off
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Sprint Capacity Impact */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-slate-700">Sprint Capacity Impact</h2>
          </div>

          {relevantSprints.length === 0 ? (
            <div className="bg-white rounded-xl border border-surface-border p-8 text-center text-slate-400">
              <Calendar size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active or upcoming sprints</p>
            </div>
          ) : (
            relevantSprints.map((sprint) => (
              <SprintCapacityCard
                key={sprint.id}
                sprint={sprint}
                members={members}
                vacations={vacations}
              />
            ))
          )}

          {/* Legend */}
          <div className="bg-slate-50 rounded-xl border border-surface-border p-4 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-700">How capacity is calculated</p>
            <p>Base capacity × (working days available / total sprint working days)</p>
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span>≥ 90% capacity — fully staffed</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400" /><span>70–89% — moderate impact</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /><span>&lt; 70% — significant reduction</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
