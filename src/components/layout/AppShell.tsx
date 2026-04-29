import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '../CommandPalette';
import { NotificationCenter } from '../ui/NotificationCenter';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';

export function AppShell() {
  return (
    <div className="flex min-h-screen w-full bg-surface">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-end gap-2 px-8 py-3 bg-white border-b border-surface-border">
          <NotificationCenter />
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
