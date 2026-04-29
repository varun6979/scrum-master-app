import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useScrumStore } from '../../store/useScrumStore';
import { getTodayISO } from '../../lib/dateUtils';

export function StandupForm() {
  const { members, standups, activeSprintId, addStandup, updateStandup } = useScrumStore();

  const [memberId, setMemberId] = useState(members[0]?.id ?? '');
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [hasBlocker, setHasBlocker] = useState(false);

  const todayStr = getTodayISO();

  const existingEntry = standups.find(
    (s) => s.memberId === memberId && s.date === todayStr
  );

  useEffect(() => {
    if (existingEntry) {
      setYesterday(existingEntry.yesterday);
      setToday(existingEntry.today);
      setBlockers(existingEntry.blockers);
      setHasBlocker(existingEntry.hasBlocker);
    } else {
      setYesterday('');
      setToday('');
      setBlockers('');
      setHasBlocker(false);
    }
  }, [memberId, existingEntry?.id]);

  const selectedMember = members.find((m) => m.id === memberId);

  const handleSubmit = () => {
    if (!yesterday.trim() && !today.trim()) return;
    if (!activeSprintId) return;

    if (existingEntry) {
      updateStandup(existingEntry.id, {
        yesterday,
        today,
        blockers,
        hasBlocker,
      });
    } else {
      addStandup({
        memberId,
        sprintId: activeSprintId,
        date: todayStr,
        yesterday,
        today,
        blockers,
        hasBlocker,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-border p-6 space-y-5">
      <h2 className="text-base font-semibold text-slate-800">Submit Today's Standup</h2>

      {/* Member selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Team Member</label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const hasSubmitted = standups.some((s) => s.memberId === m.id && s.date === todayStr);
            return (
              <button
                key={m.id}
                onClick={() => setMemberId(m.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                  memberId === m.id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-surface-border hover:border-slate-300'
                }`}
              >
                <Avatar initials={m.avatarInitials} color={m.avatarColor} size="sm" />
                <span className="text-sm font-medium text-slate-700">{m.name.split(' ')[0]}</span>
                {hasSubmitted && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedMember && (
        <>
          {/* Yesterday */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              What did you do yesterday?
            </label>
            <textarea
              value={yesterday}
              onChange={(e) => setYesterday(e.target.value)}
              rows={3}
              placeholder="Describe what you completed..."
              className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Today */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              What will you do today?
            </label>
            <textarea
              value={today}
              onChange={(e) => setToday(e.target.value)}
              rows={3}
              placeholder="Describe your plan for today..."
              className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Blockers */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <label className="block text-sm font-medium text-slate-700">Blockers</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBlocker}
                  onChange={(e) => setHasBlocker(e.target.checked)}
                  className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-500">Has blocker</span>
              </label>
            </div>
            <textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              rows={2}
              placeholder={hasBlocker ? 'Describe the blocker in detail...' : 'No blockers (optional notes)'}
              className={`w-full px-3 py-2 border rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 resize-none ${
                hasBlocker
                  ? 'border-red-300 bg-red-50 text-red-800 focus:ring-red-400'
                  : 'border-surface-border text-slate-800 focus:ring-brand-500'
              }`}
            />
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!yesterday.trim() && !today.trim()}
            className="w-full justify-center"
          >
            <Send size={15} />
            {existingEntry ? 'Update Standup' : 'Submit Standup'}
          </Button>
        </>
      )}
    </div>
  );
}
