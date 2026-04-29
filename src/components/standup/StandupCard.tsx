import { AlertTriangle } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { StandupEntry } from '../../types';
import { useScrumStore } from '../../store/useScrumStore';
import { formatDate } from '../../lib/dateUtils';

interface StandupCardProps {
  entry: StandupEntry;
}

export function StandupCard({ entry }: StandupCardProps) {
  const { members } = useScrumStore();
  const member = members.find((m) => m.id === entry.memberId);

  if (!member) return null;

  return (
    <div
      className={`bg-white rounded-xl border p-4 space-y-3 ${
        entry.hasBlocker ? 'border-red-200 bg-red-50/30' : 'border-surface-border'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar initials={member.avatarInitials} color={member.avatarColor} size="md" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{member.name}</p>
            <p className="text-xs text-slate-400">{formatDate(entry.date)}</p>
          </div>
        </div>
        {entry.hasBlocker && (
          <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
            <AlertTriangle size={11} /> Blocked
          </span>
        )}
      </div>

      {/* Yesterday */}
      {entry.yesterday && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Yesterday
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{entry.yesterday}</p>
        </div>
      )}

      {/* Today */}
      {entry.today && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Today
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{entry.today}</p>
        </div>
      )}

      {/* Blockers */}
      {entry.blockers && (
        <div className={`rounded-lg p-3 ${entry.hasBlocker ? 'bg-red-100' : 'bg-slate-50'}`}>
          <p
            className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
              entry.hasBlocker ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            {entry.hasBlocker ? 'Blocker' : 'Notes'}
          </p>
          <p
            className={`text-sm leading-relaxed ${
              entry.hasBlocker ? 'text-red-700' : 'text-slate-600'
            }`}
          >
            {entry.blockers}
          </p>
        </div>
      )}
    </div>
  );
}
