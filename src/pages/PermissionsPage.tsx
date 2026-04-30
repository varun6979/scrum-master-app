import { useMemo } from 'react';
import { ShieldCheck, Check, X } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { PermissionLevel, MemberPermission } from '../types';

const LEVELS: PermissionLevel[] = ['admin', 'member', 'viewer', 'guest'];

const LEVEL_DEFAULTS: Record<PermissionLevel, Omit<MemberPermission, 'memberId' | 'level'>> = {
  admin:  { canCreateStories: true,  canEditStories: true,  canDeleteStories: true,  canManageSprints: true,  canViewReports: true,  canManageTeam: true  },
  member: { canCreateStories: true,  canEditStories: true,  canDeleteStories: false, canManageSprints: false, canViewReports: true,  canManageTeam: false },
  viewer: { canCreateStories: false, canEditStories: false, canDeleteStories: false, canManageSprints: false, canViewReports: true,  canManageTeam: false },
  guest:  { canCreateStories: false, canEditStories: false, canDeleteStories: false, canManageSprints: false, canViewReports: false, canManageTeam: false },
};

const LEVEL_COLORS: Record<PermissionLevel, string> = {
  admin:  'bg-red-100 text-red-700 border-red-200',
  member: 'bg-blue-100 text-blue-700 border-blue-200',
  viewer: 'bg-slate-100 text-slate-600 border-slate-200',
  guest:  'bg-amber-100 text-amber-700 border-amber-200',
};

const PERMISSIONS: { key: keyof Omit<MemberPermission, 'memberId' | 'level'>; label: string; description: string }[] = [
  { key: 'canCreateStories',  label: 'Create Stories',  description: 'Add new stories to the backlog' },
  { key: 'canEditStories',    label: 'Edit Stories',    description: 'Modify story fields and details' },
  { key: 'canDeleteStories',  label: 'Delete Stories',  description: 'Permanently remove stories' },
  { key: 'canManageSprints',  label: 'Manage Sprints',  description: 'Start, complete, and edit sprints' },
  { key: 'canViewReports',    label: 'View Reports',    description: 'Access analytics, burndown, and metrics' },
  { key: 'canManageTeam',     label: 'Manage Team',     description: 'Add/remove members and change roles' },
];

function BoolCell({ value }: { value: boolean }) {
  return value
    ? <div className="flex justify-center"><Check size={15} className="text-green-500" /></div>
    : <div className="flex justify-center"><X size={15} className="text-slate-200" /></div>;
}

export function PermissionsPage() {
  const { members, settings, updatePermission } = useScrumStore();

  const permsMap = useMemo(() => {
    const map = new Map<string, MemberPermission>();
    for (const p of (settings.permissions ?? [])) map.set(p.memberId, p);
    return map;
  }, [settings.permissions]);

  const getPerm = (memberId: string): MemberPermission => {
    if (permsMap.has(memberId)) return permsMap.get(memberId)!;
    const member = members.find((m) => m.id === memberId);
    const level: PermissionLevel = member?.role === 'scrum_master' || member?.role === 'product_owner' ? 'admin' : 'member';
    return { memberId, level, ...LEVEL_DEFAULTS[level] };
  };

  const handleLevelChange = (memberId: string, level: PermissionLevel) => {
    updatePermission(memberId, { level, ...LEVEL_DEFAULTS[level] });
  };

  const handleToggle = (memberId: string, key: keyof Omit<MemberPermission, 'memberId' | 'level'>) => {
    const current = getPerm(memberId);
    updatePermission(memberId, { [key]: !current[key] });
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <ShieldCheck size={20} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Permissions</h1>
          <p className="text-sm text-slate-500">Granular control over what each team member can do</p>
        </div>
      </div>

      {/* Role presets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {LEVELS.map((level) => (
          <div key={level} className={`rounded-xl border px-4 py-3 ${LEVEL_COLORS[level]}`}>
            <p className="text-sm font-bold capitalize mb-2">{level}</p>
            <ul className="space-y-1">
              {PERMISSIONS.map((p) => (
                <li key={p.key} className="flex items-center gap-1.5 text-xs">
                  {LEVEL_DEFAULTS[level][p.key]
                    ? <Check size={10} />
                    : <X size={10} className="opacity-30" />}
                  {p.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Per-member table */}
      <div className="bg-white rounded-2xl border border-surface-border overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-surface-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Member</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role preset</th>
              {PERMISSIONS.map((p) => (
                <th key={p.key} className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider" title={p.description}>
                  {p.label.split(' ')[0]}<br />{p.label.split(' ').slice(1).join(' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {members.map((member) => {
              const perm = getPerm(member.id);
              return (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: member.avatarColor }}>
                        {member.avatarInitials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{member.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={perm.level}
                      onChange={(e) => handleLevelChange(member.id, e.target.value as PermissionLevel)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border outline-none cursor-pointer ${LEVEL_COLORS[perm.level]}`}
                    >
                      {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </td>
                  {PERMISSIONS.map((p) => (
                    <td key={p.key} className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleToggle(member.id, p.key)}
                        className="rounded hover:bg-slate-100 p-1 transition-colors"
                        title={`Toggle: ${p.label}`}
                      >
                        <BoolCell value={perm[p.key]} />
                      </button>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-3 text-center">
        Click any permission cell to toggle it individually, or use the role preset to apply defaults.
      </p>
    </div>
  );
}
