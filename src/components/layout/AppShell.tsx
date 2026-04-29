import { Outlet } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, User, Copy, Check } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '../CommandPalette';
import { NotificationCenter } from '../ui/NotificationCenter';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';
import { useAuth } from '../../contexts/AuthContext';

function UserMenu() {
  const { user, orgMember, organization, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const initials = orgMember?.avatarInitials ?? user?.email?.[0]?.toUpperCase() ?? 'U';
  const name = orgMember?.name ?? user?.email ?? 'User';
  const orgName = organization?.name ?? 'No workspace';
  const inviteCode = organization?.slug ?? '';

  function copyInviteCode() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: orgMember?.avatarColor ?? '#6366F1' }}
        >
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-semibold text-slate-700 leading-none">{name}</p>
          <p className="text-xs text-slate-400 leading-tight mt-0.5">{orgName}</p>
        </div>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          {/* User info */}
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-800">{name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>

          {/* Invite code */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-1">Workspace invite code</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded flex-1 truncate font-mono">
                {inviteCode}
              </code>
              <button
                onClick={copyInviteCode}
                className="p-1.5 text-slate-400 hover:text-brand-500 rounded hover:bg-slate-100 transition-colors flex-shrink-0"
                title="Copy invite code"
              >
                {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Share with teammates to join your workspace</p>
          </div>

          {/* Profile link */}
          <button
            onClick={() => { setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <User size={14} className="text-slate-400" />
            Profile
          </button>

          {/* Sign out */}
          <button
            onClick={() => { setOpen(false); signOut(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  return (
    <div className="flex min-h-screen w-full bg-surface">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 px-8 py-3 bg-white border-b border-surface-border">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
      <OnboardingFlow />
    </div>
  );
}
