import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Building2, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function OrgSetupPage() {
  const { createOrg, joinOrg, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [orgName, setOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;
    setError(null);
    setLoading(true);
    const err = await createOrg(orgName.trim());
    setLoading(false);
    if (err) setError(err);
    else navigate('/');
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setError(null);
    setLoading(true);
    const err = await joinOrg(inviteCode.trim());
    setLoading(false);
    if (err) setError(err);
    else navigate('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">ScrumBoard Pro</p>
            <p className="text-slate-400 text-xs">Workspace Setup</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-bold text-slate-800 mb-1">Set up your workspace</h1>
          <p className="text-slate-500 text-sm mb-6">
            Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}! Create a new workspace or join an existing one.
          </p>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => { setTab('create'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'create' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 size={14} /> Create workspace
            </button>
            <button
              onClick={() => { setTab('join'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'join' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={14} /> Join workspace
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Workspace name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Corp, My Team"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">This is the name your teammates will see.</p>
              </div>

              <button
                type="submit"
                disabled={loading || !orgName.trim()}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Creating workspace…' : 'Create workspace'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Invite code</label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder="Paste the invite code from your team"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Ask your workspace owner for the invite code (found in Settings → Team).
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !inviteCode.trim()}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Joining…' : 'Join workspace'}
              </button>
            </form>
          )}

          <button
            onClick={() => signOut()}
            className="w-full mt-4 text-sm text-slate-400 hover:text-slate-600 text-center"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
