import { useState, useMemo } from 'react';
import { Bell, X, ShieldAlert, Flag, AlertTriangle, CheckCircle2, Zap, ExternalLink } from 'lucide-react';
import { useScrumStore } from '../../store/useScrumStore';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';

interface Notification {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  body: string;
  link?: string;
  icon: React.ElementType;
}

const TYPE_STYLES: Record<Notification['type'], { bg: string; border: string; iconColor: string; dot: string }> = {
  danger: { bg: 'bg-red-50', border: 'border-red-200', iconColor: 'text-red-500', dot: 'bg-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', iconColor: 'text-amber-500', dot: 'bg-amber-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', iconColor: 'text-blue-500', dot: 'bg-blue-500' },
  success: { bg: 'bg-green-50', border: 'border-green-200', iconColor: 'text-green-500', dot: 'bg-green-500' },
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { stories, risks, milestones, sprints, activeSprintId } = useScrumStore();

  const allNotifications = useMemo<Notification[]>(() => {
    const notifs: Notification[] = [];

    // Blocked stories
    const blockedStories = stories.filter(s => s.status === 'blocked');
    if (blockedStories.length > 0) {
      notifs.push({
        id: 'blocked-stories',
        type: 'danger',
        title: `${blockedStories.length} blocked ${blockedStories.length === 1 ? 'story' : 'stories'}`,
        body: blockedStories.slice(0, 2).map(s => s.title).join(', ') + (blockedStories.length > 2 ? ` +${blockedStories.length - 2} more` : ''),
        link: '/board',
        icon: AlertTriangle,
      });
    }

    // Stories flagged as blockers
    const blockerFlagged = stories.filter(s => s.blockerFlag && s.status !== 'done');
    if (blockerFlagged.length > 0) {
      notifs.push({
        id: 'blocker-flags',
        type: 'warning',
        title: `${blockerFlagged.length} stories flagged as blockers`,
        body: blockerFlagged.slice(0, 2).map(s => s.title).join(', '),
        link: '/board',
        icon: Flag,
      });
    }

    // Open risks
    const openRisks = risks.filter(r => r.status === 'open');
    if (openRisks.length > 0) {
      notifs.push({
        id: 'open-risks',
        type: openRisks.some(r => r.impact === 'critical' || r.impact === 'major') ? 'danger' : 'warning',
        title: `${openRisks.length} open risk${openRisks.length === 1 ? '' : 's'}`,
        body: openRisks.slice(0, 2).map(r => r.title).join(', '),
        link: '/risks',
        icon: ShieldAlert,
      });
    }

    // At-risk milestones
    const atRiskMilestones = milestones.filter(m => m.status === 'at_risk');
    if (atRiskMilestones.length > 0) {
      notifs.push({
        id: 'at-risk-milestones',
        type: 'warning',
        title: `${atRiskMilestones.length} milestone${atRiskMilestones.length === 1 ? '' : 's'} at risk`,
        body: atRiskMilestones.slice(0, 2).map(m => m.title).join(', '),
        link: '/milestones',
        icon: Flag,
      });
    }

    // Sprint ending soon
    const activeSprint = sprints.find(sp => sp.id === activeSprintId);
    if (activeSprint) {
      const daysLeft = differenceInDays(parseISO(activeSprint.endDate), new Date());
      if (daysLeft <= 3 && daysLeft >= 0) {
        notifs.push({
          id: 'sprint-ending',
          type: daysLeft <= 1 ? 'danger' : 'warning',
          title: `Sprint ends in ${daysLeft === 0 ? 'today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`}`,
          body: `"${activeSprint.name}" — review remaining stories`,
          link: '/board',
          icon: Zap,
        });
      }
    }

    // Unestimated stories in active sprint
    if (activeSprint) {
      const activeStories = stories.filter(s => s.sprintId === activeSprint.id);
      const unestimated = activeStories.filter(s => !s.storyPoints || s.storyPoints === 0);
      if (unestimated.length > 0) {
        notifs.push({
          id: 'unestimated',
          type: 'info',
          title: `${unestimated.length} unestimated stories in sprint`,
          body: 'Point planning needed before sprint completion',
          link: '/board',
          icon: CheckCircle2,
        });
      }
    }

    return notifs;
  }, [stories, risks, milestones, sprints, activeSprintId]);

  const visible = allNotifications.filter(n => !dismissed.has(n.id));
  const unreadCount = visible.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <p className="text-sm font-semibold text-slate-800">Notifications</p>
                <p className="text-xs text-slate-400">{unreadCount} active alerts</p>
              </div>
              {dismissed.size > 0 && (
                <button onClick={() => setDismissed(new Set())} className="text-xs text-brand-500 hover:text-brand-700 font-medium">
                  Restore all
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {visible.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 size={28} className="text-green-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">All clear!</p>
                  <p className="text-xs text-slate-400 mt-0.5">No active alerts right now.</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {visible.map(n => {
                    const styles = TYPE_STYLES[n.type];
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl border ${styles.bg} ${styles.border}`}>
                        <div className={`w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border ${styles.border}`}>
                          <Icon size={14} className={styles.iconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-800 leading-tight">{n.title}</p>
                            <button onClick={() => setDismissed(prev => new Set([...prev, n.id]))} className="text-slate-400 hover:text-slate-600 flex-shrink-0 -mt-0.5">
                              <X size={11} />
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                          {n.link && (
                            <button
                              onClick={() => { navigate(n.link!); setOpen(false); }}
                              className="flex items-center gap-1 mt-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
                            >
                              <ExternalLink size={10} /> View
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-400">Alerts update automatically based on project state.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
