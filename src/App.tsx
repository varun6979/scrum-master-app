import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useScrumStore } from './store/useScrumStore';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { OrgSetupPage } from './pages/auth/OrgSetupPage';
import { Dashboard } from './pages/Dashboard';
import { SprintBoard } from './pages/SprintBoard';
import { Backlog } from './pages/Backlog';
import { SprintManagement } from './pages/SprintManagement';
import { TeamManagement } from './pages/TeamManagement';
import { BurndownPage } from './pages/BurndownPage';
import { StandupPage } from './pages/StandupPage';
import { ReportsPage } from './pages/ReportsPage';
import { MilestonesPage } from './pages/MilestonesPage';
import { RisksPage } from './pages/RisksPage';
import { DependenciesPage } from './pages/DependenciesPage';
import { TimelinePage } from './pages/TimelinePage';
import { DecisionsPage } from './pages/DecisionsPage';
import { MarketComparisonPage } from './pages/MarketComparisonPage';
import RetrospectivePage from './pages/RetrospectivePage';
import HealthScorePage from './pages/HealthScorePage';
import { MetricsPage } from './pages/MetricsPage';
import { ForecastPage } from './pages/ForecastPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ImportPage } from './pages/ImportPage';
import { StoryComparePage } from './pages/StoryComparePage';
import { HierarchyPage } from './pages/HierarchyPage';
import { TimeReportPage } from './pages/TimeReportPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { QueryPage } from './pages/QueryPage';
import { CustomDashboardPage } from './pages/CustomDashboardPage';
import { StoryMapPage } from './pages/StoryMapPage';
import { CeremonyBoardPage } from './pages/CeremonyBoardPage';
import { LandingPage } from './pages/LandingPage';
import { LaunchHubPage } from './pages/LaunchHubPage';
import { EpicDetailPage } from './pages/EpicDetailPage';
import { FeatureFlagsPage } from './pages/FeatureFlagsPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { VelocityPage } from './pages/VelocityPage';
import { WorkloadPage } from './pages/WorkloadPage';
import { ReleasesPage } from './pages/ReleasesPage';

// Loads org data into the store once we know the org
function OrgDataLoader({ children }: { children: React.ReactNode }) {
  const { orgMember } = useAuth();
  const loadFromSupabase = useScrumStore(s => s.loadFromSupabase);

  useEffect(() => {
    if (orgMember?.orgId) {
      loadFromSupabase(orgMember.orgId);
    }
  }, [orgMember?.orgId]);

  return <>{children}</>;
}

// Redirect logged-in users away from auth pages; redirect logged-out users away from app
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, orgMember, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!orgMember) return <Navigate to="/org-setup" replace />;
  return <>{children}</>;
}

function RequireNoAuth({ children }: { children: React.ReactNode }) {
  const { user, orgMember, loading } = useAuth();
  if (loading) return null;
  if (user && orgMember) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<RequireNoAuth><LoginPage /></RequireNoAuth>} />
          <Route path="/signup" element={<RequireNoAuth><SignupPage /></RequireNoAuth>} />
          <Route path="/org-setup" element={<OrgSetupPage />} />

          {/* Protected app routes */}
          <Route element={
            <RequireAuth>
              <OrgDataLoader>
                <AppShell />
              </OrgDataLoader>
            </RequireAuth>
          }>
            <Route index element={<Dashboard />} />
            <Route path="board" element={<SprintBoard />} />
            <Route path="backlog" element={<Backlog />} />
            <Route path="sprints" element={<SprintManagement />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="burndown" element={<BurndownPage />} />
            <Route path="standup" element={<StandupPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="milestones" element={<MilestonesPage />} />
            <Route path="risks" element={<RisksPage />} />
            <Route path="dependencies" element={<DependenciesPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="decisions" element={<DecisionsPage />} />
            <Route path="market-comparison" element={<MarketComparisonPage />} />
            <Route path="retrospective" element={<RetrospectivePage />} />
            <Route path="health" element={<HealthScorePage />} />
            <Route path="metrics" element={<MetricsPage />} />
            <Route path="forecast" element={<ForecastPage />} />
            <Route path="ai" element={<AIAssistantPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="compare" element={<StoryComparePage />} />
            <Route path="hierarchy" element={<HierarchyPage />} />
            <Route path="time-report" element={<TimeReportPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="permissions" element={<PermissionsPage />} />
            <Route path="query" element={<QueryPage />} />
            <Route path="custom-dashboard" element={<CustomDashboardPage />} />
            <Route path="story-map" element={<StoryMapPage />} />
            <Route path="ceremony" element={<CeremonyBoardPage />} />
            <Route path="landing" element={<LandingPage />} />
            <Route path="launch-hub" element={<LaunchHubPage />} />
            <Route path="epics/:epicId" element={<EpicDetailPage />} />
            <Route path="feature-flags" element={<FeatureFlagsPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="velocity" element={<VelocityPage />} />
            <Route path="workload" element={<WorkloadPage />} />
            <Route path="releases" element={<ReleasesPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
