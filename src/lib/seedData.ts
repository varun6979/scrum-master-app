import { addDays, subDays, format } from 'date-fns';
import {
  AppState, TeamMember, Epic, Story, Sprint, StandupEntry, BurndownSnapshot,
  Milestone, Risk, Dependency, Comment, Decision, RetroItem, Project,
} from '../types';

const today = new Date();
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

// ─── Members ────────────────────────────────────────────────────────────────
const members: TeamMember[] = [
  { id: 'member-1', name: 'Alice Chen', email: 'alice.chen@acme.com', role: 'scrum_master', avatarInitials: 'AC', avatarColor: '#4F6EF7', capacityPoints: 40, createdAt: fmt(subDays(today, 180)) },
  { id: 'member-2', name: 'Bob Martinez', email: 'bob.martinez@acme.com', role: 'developer', avatarInitials: 'BM', avatarColor: '#10B981', capacityPoints: 35, createdAt: fmt(subDays(today, 180)) },
  { id: 'member-3', name: 'Carol Kim', email: 'carol.kim@acme.com', role: 'developer', avatarInitials: 'CK', avatarColor: '#F59E0B', capacityPoints: 35, createdAt: fmt(subDays(today, 120)) },
  { id: 'member-4', name: 'David Lee', email: 'david.lee@acme.com', role: 'qa', avatarInitials: 'DL', avatarColor: '#EF4444', capacityPoints: 25, createdAt: fmt(subDays(today, 90)) },
  { id: 'member-5', name: 'Emma Wilson', email: 'emma.wilson@acme.com', role: 'product_owner', avatarInitials: 'EW', avatarColor: '#8B5CF6', capacityPoints: 20, createdAt: fmt(subDays(today, 180)) },
];

// ─── Epics ───────────────────────────────────────────────────────────────────
const epics: Epic[] = [
  { id: 'epic-1', title: 'User Authentication', description: 'Complete authentication system including OAuth, MFA, and session management.', color: '#4F6EF7', priority: 'critical', ownerId: 'member-5', createdAt: fmt(subDays(today, 90)) },
  { id: 'epic-2', title: 'Dashboard & Reporting', description: 'Analytics dashboard with real-time metrics, custom reports, and data export.', color: '#10B981', priority: 'high', ownerId: 'member-5', createdAt: fmt(subDays(today, 80)) },
  { id: 'epic-3', title: 'API Integration', description: 'REST and GraphQL API layer with third-party service integrations.', color: '#F59E0B', priority: 'medium', ownerId: 'member-5', createdAt: fmt(subDays(today, 70)) },
];

// ─── Sprints ─────────────────────────────────────────────────────────────────
const sprint1Start = fmt(subDays(today, 56));
const sprint1End   = fmt(subDays(today, 43));
const sprint2Start = fmt(subDays(today, 42));
const sprint2End   = fmt(subDays(today, 29));
const sprint3Start = fmt(subDays(today, 14));
const sprint3End   = fmt(addDays(today, 2));
const sprint4Start = fmt(addDays(today, 3));
const sprint4End   = fmt(addDays(today, 16));

const sprints: Sprint[] = [
  { id: 'sprint-1', name: 'Sprint 1', goal: 'Deliver core authentication flows: login, registration, and password reset.', status: 'completed', startDate: sprint1Start, endDate: sprint1End, velocity: 42, createdAt: fmt(subDays(today, 60)), completedAt: sprint1End },
  { id: 'sprint-2', name: 'Sprint 2', goal: 'Complete OAuth integration and set up the foundational dashboard skeleton.', status: 'completed', startDate: sprint2Start, endDate: sprint2End, velocity: 38, createdAt: fmt(subDays(today, 45)), completedAt: sprint2End },
  { id: 'sprint-3', name: 'Sprint 3', goal: 'Ship the analytics dashboard MVP with real-time charts and user activity feeds.', status: 'active', startDate: sprint3Start, endDate: sprint3End, createdAt: fmt(subDays(today, 16)) },
  { id: 'sprint-4', name: 'Sprint 4', goal: 'Integrate third-party APIs (Stripe, Sendgrid) and deliver notification system.', status: 'planning', startDate: sprint4Start, endDate: sprint4End, createdAt: fmt(subDays(today, 2)) },
];

// ─── Story defaults helper ────────────────────────────────────────────────────
const sd = (s: Omit<Story, 'tags' | 'components' | 'deployedTo' | 'externalLinks' | 'watchers' | 'subtaskIds' | 'definitionOfDone' | 'qaStatus' | 'stakeholderIds' | 'successMetrics' | 'blockerFlag' | 'crossTeamDependency' | 'attachments'>): Story => ({
  ...s,
  tags: [], components: [], deployedTo: [], externalLinks: [],
  watchers: [], subtaskIds: [], definitionOfDone: [], qaStatus: 'not_started',
  stakeholderIds: [], successMetrics: [], blockerFlag: false, crossTeamDependency: false,
  attachments: [],
});

// ─── Stories ─────────────────────────────────────────────────────────────────
const stories: Story[] = [
  // Sprint 1 – completed
  sd({ id: 'story-1', epicId: 'epic-1', sprintId: 'sprint-1', title: 'Implement JWT-based login endpoint', description: 'Create a POST /auth/login endpoint that validates credentials and returns a signed JWT token.', acceptanceCriteria: ['Returns 200 with JWT on valid credentials', 'Returns 401 on invalid credentials', 'Token expires in 24 hours'], storyPoints: 5, priority: 'critical', status: 'done', assigneeId: 'member-2', labels: ['backend', 'auth'], createdAt: fmt(subDays(today, 58)), updatedAt: fmt(subDays(today, 44)), completedAt: fmt(subDays(today, 44)), order: 0 }),
  sd({ id: 'story-2', epicId: 'epic-1', sprintId: 'sprint-1', title: 'User registration form with validation', description: 'Build the registration UI with email, password, confirm password fields and real-time validation.', acceptanceCriteria: ['Email format validated', 'Password strength indicator shown', 'Passwords must match', 'Success redirects to onboarding'], storyPoints: 8, priority: 'high', status: 'done', assigneeId: 'member-3', labels: ['frontend', 'auth'], createdAt: fmt(subDays(today, 58)), updatedAt: fmt(subDays(today, 45)), completedAt: fmt(subDays(today, 45)), order: 1 }),
  sd({ id: 'story-3', epicId: 'epic-1', sprintId: 'sprint-1', title: 'Password reset via email', description: 'Allow users to reset their password through a secure email link.', acceptanceCriteria: ['Reset link sent within 60 seconds', 'Link expires after 1 hour', 'Old password invalidated on reset'], storyPoints: 5, priority: 'high', status: 'done', assigneeId: 'member-2', labels: ['backend', 'email'], createdAt: fmt(subDays(today, 57)), updatedAt: fmt(subDays(today, 44)), completedAt: fmt(subDays(today, 44)), order: 2 }),
  sd({ id: 'story-4', epicId: 'epic-1', sprintId: 'sprint-1', title: 'Write E2E tests for auth flows', description: 'Create Playwright tests covering login, registration and password reset flows.', acceptanceCriteria: ['Happy path tests pass in CI', 'Edge cases covered'], storyPoints: 8, priority: 'medium', status: 'done', assigneeId: 'member-4', labels: ['testing', 'auth'], createdAt: fmt(subDays(today, 56)), updatedAt: fmt(subDays(today, 43)), completedAt: fmt(subDays(today, 43)), order: 3 }),
  sd({ id: 'story-5', epicId: 'epic-1', sprintId: 'sprint-1', title: 'Session management and logout', description: 'Implement secure session invalidation and logout mechanism.', acceptanceCriteria: ['Logout clears token from storage', 'All active sessions can be revoked'], storyPoints: 3, priority: 'high', status: 'done', assigneeId: 'member-2', labels: ['backend', 'auth'], createdAt: fmt(subDays(today, 56)), updatedAt: fmt(subDays(today, 44)), completedAt: fmt(subDays(today, 44)), order: 4 }),
  sd({ id: 'story-6', epicId: 'epic-1', sprintId: 'sprint-1', title: 'Rate limiting on auth endpoints', description: 'Add brute-force protection by rate-limiting login and registration endpoints.', acceptanceCriteria: ['Max 5 failed logins per minute per IP', 'Lockout message displayed'], storyPoints: 3, priority: 'medium', status: 'done', assigneeId: 'member-2', labels: ['backend', 'security'], createdAt: fmt(subDays(today, 55)), updatedAt: fmt(subDays(today, 44)), completedAt: fmt(subDays(today, 44)), order: 5 }),

  // Sprint 2 – completed
  sd({ id: 'story-7', epicId: 'epic-1', sprintId: 'sprint-2', title: 'Google OAuth 2.0 sign-in', description: 'Integrate Google OAuth so users can sign in with their Google account.', acceptanceCriteria: ['OAuth consent screen configured', 'Tokens stored securely', 'New users auto-provisioned'], storyPoints: 8, priority: 'high', status: 'done', assigneeId: 'member-2', labels: ['backend', 'oauth'], createdAt: fmt(subDays(today, 44)), updatedAt: fmt(subDays(today, 30)), completedAt: fmt(subDays(today, 30)), order: 0 }),
  sd({ id: 'story-8', epicId: 'epic-1', sprintId: 'sprint-2', title: 'GitHub OAuth sign-in', description: 'Allow developers to sign in using their GitHub account.', acceptanceCriteria: ['GitHub app registered', 'Public profile data fetched on first login'], storyPoints: 5, priority: 'medium', status: 'done', assigneeId: 'member-3', labels: ['backend', 'oauth'], createdAt: fmt(subDays(today, 44)), updatedAt: fmt(subDays(today, 31)), completedAt: fmt(subDays(today, 31)), order: 1 }),
  sd({ id: 'story-9', epicId: 'epic-2', sprintId: 'sprint-2', title: 'Dashboard layout skeleton', description: 'Create the base dashboard layout with sidebar, header, and main content area.', acceptanceCriteria: ['Responsive across 1024px+ screens', 'Sidebar collapse on mobile'], storyPoints: 5, priority: 'high', status: 'done', assigneeId: 'member-3', labels: ['frontend', 'layout'], createdAt: fmt(subDays(today, 43)), updatedAt: fmt(subDays(today, 30)), completedAt: fmt(subDays(today, 30)), order: 2 }),
  sd({ id: 'story-10', epicId: 'epic-2', sprintId: 'sprint-2', title: 'KPI metric cards component', description: 'Build reusable metric cards showing key performance indicators with trend indicators.', acceptanceCriteria: ['Shows current value, change %, and trend arrow', 'Supports loading skeleton state'], storyPoints: 3, priority: 'medium', status: 'done', assigneeId: 'member-3', labels: ['frontend', 'components'], createdAt: fmt(subDays(today, 42)), updatedAt: fmt(subDays(today, 30)), completedAt: fmt(subDays(today, 30)), order: 3 }),
  sd({ id: 'story-11', epicId: 'epic-2', sprintId: 'sprint-2', title: 'User activity timeline API', description: 'Create API endpoint returning paginated user activity events.', acceptanceCriteria: ['Returns last 50 events by default', 'Supports cursor-based pagination'], storyPoints: 5, priority: 'medium', status: 'done', assigneeId: 'member-2', labels: ['backend', 'api'], createdAt: fmt(subDays(today, 42)), updatedAt: fmt(subDays(today, 29)), completedAt: fmt(subDays(today, 29)), order: 4 }),
  sd({ id: 'story-12', epicId: 'epic-1', sprintId: 'sprint-2', title: 'MFA TOTP setup and verify', description: 'Allow users to enable time-based one-time passwords for two-factor authentication.', acceptanceCriteria: ['QR code generated for authenticator app', 'Backup codes generated and stored hashed', 'TOTP validated on login when enabled'], storyPoints: 8, priority: 'high', status: 'done', assigneeId: 'member-2', labels: ['backend', 'security', 'mfa'], createdAt: fmt(subDays(today, 41)), updatedAt: fmt(subDays(today, 29)), completedAt: fmt(subDays(today, 29)), order: 5 }),

  // Sprint 3 – active
  sd({ id: 'story-13', epicId: 'epic-2', sprintId: 'sprint-3', title: 'Real-time user activity chart', description: 'Line chart displaying user signups and active sessions over the past 30 days.', acceptanceCriteria: ['Data refreshes every 30 seconds via WebSocket', 'Date range picker to filter data', 'Chart exports as PNG'], storyPoints: 8, priority: 'high', status: 'done', assigneeId: 'member-3', labels: ['frontend', 'charts'], createdAt: fmt(subDays(today, 14)), updatedAt: fmt(subDays(today, 3)), completedAt: fmt(subDays(today, 3)), order: 0 }),
  sd({ id: 'story-14', epicId: 'epic-2', sprintId: 'sprint-3', title: 'Revenue metrics endpoint', description: 'Build an API endpoint aggregating revenue, MRR, ARR and churn data.', acceptanceCriteria: ['Returns monthly breakdown', 'Caches results for 5 minutes'], storyPoints: 5, priority: 'high', status: 'done', assigneeId: 'member-2', labels: ['backend', 'api'], createdAt: fmt(subDays(today, 14)), updatedAt: fmt(subDays(today, 4)), completedAt: fmt(subDays(today, 4)), order: 1 }),
  sd({ id: 'story-15', epicId: 'epic-2', sprintId: 'sprint-3', title: 'Export reports as CSV/PDF', description: 'Add export functionality to generate downloadable CSV and PDF reports.', acceptanceCriteria: ['CSV includes all displayed columns', 'PDF uses branded template', 'Export completes within 5 seconds'], storyPoints: 5, priority: 'medium', status: 'review', assigneeId: 'member-3', labels: ['frontend', 'export'], createdAt: fmt(subDays(today, 13)), updatedAt: fmt(subDays(today, 1)), order: 2 }),
  sd({ id: 'story-16', epicId: 'epic-2', sprintId: 'sprint-3', title: 'Customizable dashboard widgets', description: 'Allow users to rearrange, add, and remove dashboard widgets via drag-and-drop.', acceptanceCriteria: ['Widgets persist layout to user preferences', 'At least 6 widget types available'], storyPoints: 13, priority: 'high', status: 'in_progress', assigneeId: 'member-3', labels: ['frontend', 'ux'], createdAt: fmt(subDays(today, 13)), updatedAt: fmt(subDays(today, 1)), order: 3 }),
  sd({ id: 'story-17', epicId: 'epic-2', sprintId: 'sprint-3', title: 'Automated report scheduling', description: 'Let users schedule reports to be emailed daily, weekly, or monthly.', acceptanceCriteria: ['Cron-based scheduler with timezone support', 'Email with PDF attachment'], storyPoints: 8, priority: 'medium', status: 'in_progress', assigneeId: 'member-2', labels: ['backend', 'email'], createdAt: fmt(subDays(today, 12)), updatedAt: fmt(subDays(today, 1)), order: 4 }),
  sd({ id: 'story-18', epicId: 'epic-2', sprintId: 'sprint-3', title: 'Dashboard QA pass and bug fixes', description: 'Comprehensive quality assurance of the dashboard including cross-browser testing.', acceptanceCriteria: ['No critical bugs in Chrome, Firefox, Safari', 'Accessibility audit score > 90'], storyPoints: 5, priority: 'high', status: 'todo', assigneeId: 'member-4', labels: ['testing', 'qa'], createdAt: fmt(subDays(today, 11)), updatedAt: fmt(subDays(today, 2)), order: 5 }),
  sd({ id: 'story-19', epicId: 'epic-3', sprintId: 'sprint-3', title: 'Stripe payments webhook handler', description: 'Process Stripe webhook events for payment intents and subscription lifecycle.', acceptanceCriteria: ['Signature verification on all webhooks', 'Idempotency key stored per event', 'Failed events retried with exponential backoff'], storyPoints: 8, priority: 'critical', status: 'todo', assigneeId: 'member-2', labels: ['backend', 'payments'], createdAt: fmt(subDays(today, 10)), updatedAt: fmt(subDays(today, 2)), order: 6 }),

  // Sprint 4 – planning
  sd({ id: 'story-20', epicId: 'epic-3', sprintId: 'sprint-4', title: 'Stripe subscription management UI', description: 'Build subscription management page: upgrade, downgrade, cancel, view invoices.', acceptanceCriteria: ['Plan comparison table displayed', 'Immediate plan switch with proration', 'Cancellation confirmation with retention prompt'], storyPoints: 13, priority: 'high', status: 'todo', assigneeId: 'member-3', labels: ['frontend', 'payments'], createdAt: fmt(subDays(today, 5)), updatedAt: fmt(subDays(today, 5)), order: 0 }),
  sd({ id: 'story-21', epicId: 'epic-3', sprintId: 'sprint-4', title: 'SendGrid transactional email system', description: 'Set up templated email delivery for all transactional emails via SendGrid.', acceptanceCriteria: ['Template variables passed via API', 'Delivery status tracked', 'Unsubscribe handled per CAN-SPAM'], storyPoints: 8, priority: 'high', status: 'todo', assigneeId: 'member-2', labels: ['backend', 'email'], createdAt: fmt(subDays(today, 4)), updatedAt: fmt(subDays(today, 4)), order: 1 }),
  sd({ id: 'story-22', epicId: 'epic-3', sprintId: 'sprint-4', title: 'API rate limiting and quotas', description: 'Enforce per-tenant API rate limits and usage quotas with Redis token buckets.', acceptanceCriteria: ['Limits configurable per plan', 'X-RateLimit headers returned', 'Dashboard shows quota consumption'], storyPoints: 8, priority: 'medium', status: 'todo', assigneeId: 'member-2', labels: ['backend', 'api'], createdAt: fmt(subDays(today, 3)), updatedAt: fmt(subDays(today, 3)), order: 2 }),

  // Backlog
  sd({ id: 'story-23', epicId: 'epic-3', title: 'Slack notification integration', description: 'Send configurable Slack alerts for key system events and anomalies.', acceptanceCriteria: ['OAuth app installed per workspace', 'Channel and event filters configurable'], storyPoints: 8, priority: 'medium', status: 'backlog', labels: ['integrations', 'notifications'], createdAt: fmt(subDays(today, 20)), updatedAt: fmt(subDays(today, 20)), order: 0 }),
  sd({ id: 'story-24', epicId: 'epic-1', title: 'SSO via SAML 2.0', description: 'Enterprise single sign-on using SAML 2.0 for corporate identity providers.', acceptanceCriteria: ['Tested with Okta and Azure AD', 'JIT provisioning supported'], storyPoints: 13, priority: 'high', status: 'backlog', labels: ['backend', 'enterprise', 'auth'], createdAt: fmt(subDays(today, 18)), updatedAt: fmt(subDays(today, 18)), order: 1 }),
  sd({ id: 'story-25', epicId: 'epic-2', title: 'Cohort analysis report', description: 'Retention cohort analysis showing how different user groups behave over time.', acceptanceCriteria: ['Weekly and monthly cohort grouping', 'Heatmap visualization'], storyPoints: 13, priority: 'low', status: 'backlog', labels: ['frontend', 'analytics'], createdAt: fmt(subDays(today, 15)), updatedAt: fmt(subDays(today, 15)), order: 2 }),
];

// ─── Standup Entries ─────────────────────────────────────────────────────────
const standupDays = [fmt(subDays(today, 4)), fmt(subDays(today, 3)), fmt(subDays(today, 2)), fmt(subDays(today, 1)), fmt(today)];
const standups: StandupEntry[] = [
  { id: 'su-1', memberId: 'member-1', sprintId: 'sprint-3', date: standupDays[0], yesterday: 'Facilitated sprint planning and reviewed upcoming stories with the team.', today: 'Running retrospective for Sprint 2 and updating sprint board.', blockers: '', hasBlocker: false, createdAt: standupDays[0] },
  { id: 'su-2', memberId: 'member-2', sprintId: 'sprint-3', date: standupDays[0], yesterday: 'Finished revenue metrics endpoint with caching layer.', today: 'Starting Stripe webhook handler implementation.', blockers: 'Waiting on Stripe test credentials from DevOps. Blocking work on payments integration.', hasBlocker: true, createdAt: standupDays[0] },
  { id: 'su-3', memberId: 'member-3', sprintId: 'sprint-3', date: standupDays[0], yesterday: 'Completed the real-time user activity chart.', today: 'Working on CSV/PDF export feature.', blockers: '', hasBlocker: false, createdAt: standupDays[0] },
  { id: 'su-4', memberId: 'member-1', sprintId: 'sprint-3', date: standupDays[1], yesterday: 'Updated project documentation.', today: 'Stakeholder sync and backlog grooming for Sprint 4.', blockers: '', hasBlocker: false, createdAt: standupDays[1] },
  { id: 'su-5', memberId: 'member-2', sprintId: 'sprint-3', date: standupDays[1], yesterday: 'Received Stripe credentials, started webhook handler.', today: 'Finishing webhook signature verification and idempotency.', blockers: '', hasBlocker: false, createdAt: standupDays[1] },
  { id: 'su-6', memberId: 'member-3', sprintId: 'sprint-3', date: standupDays[1], yesterday: 'PDF export feature in progress.', today: 'Starting drag-and-drop widgets feature.', blockers: 'PDF library has a known issue with custom fonts. Investigating workaround.', hasBlocker: true, createdAt: standupDays[1] },
  { id: 'su-7', memberId: 'member-2', sprintId: 'sprint-3', date: standupDays[2], yesterday: 'Webhook handler almost done, writing tests.', today: 'Finalizing webhook tests and opening PR.', blockers: '', hasBlocker: false, createdAt: standupDays[2] },
  { id: 'su-8', memberId: 'member-4', sprintId: 'sprint-3', date: standupDays[2], yesterday: 'Set up cross-browser test harness.', today: 'Running dashboard QA across Chrome, Firefox, Safari.', blockers: 'Safari has a CSS flexbox bug with the chart layout. Assigned to Carol.', hasBlocker: true, createdAt: standupDays[2] },
  { id: 'su-9', memberId: 'member-1', sprintId: 'sprint-3', date: standupDays[3], yesterday: 'Groomed Sprint 4 backlog with Emma.', today: 'Preparing sprint completion report.', blockers: '', hasBlocker: false, createdAt: standupDays[3] },
  { id: 'su-10', memberId: 'member-3', sprintId: 'sprint-3', date: standupDays[3], yesterday: 'Resolved PDF font issue.', today: 'Export feature in review, starting widget drag-and-drop.', blockers: '', hasBlocker: false, createdAt: standupDays[3] },
  { id: 'su-11', memberId: 'member-5', sprintId: 'sprint-3', date: standupDays[3], yesterday: 'Reviewed PRDs for Sprint 4 stories with stakeholders.', today: 'Writing acceptance criteria for API rate limiting story.', blockers: '', hasBlocker: false, createdAt: standupDays[3] },
  { id: 'su-12', memberId: 'member-1', sprintId: 'sprint-3', date: standupDays[4], yesterday: 'Prepared sprint completion metrics.', today: 'Running sprint review meeting.', blockers: '', hasBlocker: false, createdAt: standupDays[4] },
  { id: 'su-13', memberId: 'member-2', sprintId: 'sprint-3', date: standupDays[4], yesterday: 'Merged webhook handler PR after review.', today: 'Starting report scheduling feature.', blockers: 'Redis cluster in staging is flapping. Blocking scheduler testing.', hasBlocker: true, createdAt: standupDays[4] },
  { id: 'su-14', memberId: 'member-4', sprintId: 'sprint-3', date: standupDays[4], yesterday: 'Completed cross-browser QA pass.', today: 'Writing final QA report and closing tickets.', blockers: '', hasBlocker: false, createdAt: standupDays[4] },
];

// ─── Burndown ─────────────────────────────────────────────────────────────────
function generateBurndown(sprintId: string, startDate: string, endDate: string, totalPoints: number): BurndownSnapshot[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const snapshots: BurndownSnapshot[] = [];
  let currentDate = new Date(start);
  let remaining = totalPoints;
  const dayCount = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const dailyIdeal = totalPoints / Math.max(1, dayCount - 1);
  let dayIndex = 0;

  while (currentDate <= end) {
    const dow = currentDate.getDay();
    if (dow !== 0 && dow !== 6) {
      const idealPoints = Math.max(0, totalPoints - dailyIdeal * dayIndex);
      remaining = Math.max(0, remaining - (dailyIdeal * 0.9 + (Math.random() - 0.4) * 3));
      snapshots.push({ date: fmt(currentDate), sprintId, remainingPoints: Math.round(remaining), completedPoints: Math.round(totalPoints - remaining), idealPoints: Math.round(idealPoints) });
    }
    currentDate = addDays(currentDate, 1);
    dayIndex++;
  }
  if (snapshots.length > 0) {
    snapshots[snapshots.length - 1].remainingPoints = 0;
    snapshots[snapshots.length - 1].completedPoints = totalPoints;
  }
  return snapshots;
}

function generateActiveBurndown(sprintId: string, startDate: string, endDate: string, totalPoints: number): BurndownSnapshot[] {
  const start = new Date(startDate);
  const now = new Date();
  const end = new Date(endDate);
  const snapshots: BurndownSnapshot[] = [];
  let currentDate = new Date(start);
  let remaining = totalPoints;
  const dayCount = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const dailyIdeal = totalPoints / Math.max(1, dayCount - 1);
  let dayIndex = 0;

  while (currentDate <= now && currentDate <= end) {
    const dow = currentDate.getDay();
    if (dow !== 0 && dow !== 6) {
      const idealPoints = Math.max(0, totalPoints - dailyIdeal * dayIndex);
      remaining = Math.max(0, remaining - (dailyIdeal * 0.85 + (Math.random() - 0.3) * 2));
      snapshots.push({ date: fmt(currentDate), sprintId, remainingPoints: Math.round(remaining), completedPoints: Math.round(totalPoints - remaining), idealPoints: Math.round(idealPoints) });
    }
    currentDate = addDays(currentDate, 1);
    dayIndex++;
  }
  return snapshots;
}

const sprint3Total = stories.filter((s) => s.sprintId === 'sprint-3').reduce((sum, s) => sum + s.storyPoints, 0);
const burndownSnapshots: BurndownSnapshot[] = [
  ...generateBurndown('sprint-1', sprint1Start, sprint1End, 42),
  ...generateBurndown('sprint-2', sprint2Start, sprint2End, 38),
  ...generateActiveBurndown('sprint-3', sprint3Start, sprint3End, sprint3Total),
];

// ─── Milestones ───────────────────────────────────────────────────────────────
const milestones: Milestone[] = [
  {
    id: 'ms-1',
    title: 'Auth System Go-Live',
    description: 'All authentication features (login, OAuth, MFA) are production-ready and security-audited.',
    dueDate: sprint2End,
    status: 'completed',
    ownerId: 'member-5',
    epicIds: ['epic-1'],
    sprintId: 'sprint-2',
    successCriteria: ['Security audit passed', 'Penetration test completed', 'All auth flows tested', 'On-call runbook written'],
    completedAt: sprint2End,
    createdAt: fmt(subDays(today, 90)),
  },
  {
    id: 'ms-2',
    title: 'Dashboard MVP Release',
    description: 'Core analytics dashboard shipped to beta users with real-time charts and export capabilities.',
    dueDate: sprint3End,
    status: 'at_risk',
    ownerId: 'member-5',
    epicIds: ['epic-2'],
    sprintId: 'sprint-3',
    successCriteria: ['Real-time charts operational', 'CSV and PDF export working', 'Performance < 2s load time', '10 beta users onboarded'],
    createdAt: fmt(subDays(today, 80)),
  },
  {
    id: 'ms-3',
    title: 'Payments Integration Complete',
    description: 'Stripe billing, subscription management, and email notifications fully integrated.',
    dueDate: sprint4End,
    status: 'not_started',
    ownerId: 'member-5',
    epicIds: ['epic-3'],
    sprintId: 'sprint-4',
    successCriteria: ['Stripe webhooks processing correctly', 'Subscriptions can be created/cancelled', 'Transactional emails delivered', 'Load tested at 1000 req/min'],
    createdAt: fmt(subDays(today, 30)),
  },
  {
    id: 'ms-4',
    title: 'Enterprise SSO Launch',
    description: 'SAML 2.0 SSO available for enterprise customers, tested with Okta and Azure AD.',
    dueDate: fmt(addDays(today, 45)),
    status: 'not_started',
    ownerId: 'member-5',
    epicIds: ['epic-1'],
    successCriteria: ['SAML 2.0 spec compliance verified', 'Okta integration tested', 'Azure AD integration tested', 'JIT provisioning working'],
    createdAt: fmt(subDays(today, 20)),
  },
];

// ─── Risks ────────────────────────────────────────────────────────────────────
const risks: Risk[] = [
  {
    id: 'risk-1',
    title: 'Third-party Stripe API changes breaking payments',
    description: 'Stripe occasionally deprecates API versions with short notice. Our integration could break during a version migration.',
    category: 'Technical',
    probability: 'medium',
    impact: 'major',
    riskScore: 12,
    status: 'open',
    ownerId: 'member-2',
    mitigation: 'Pin Stripe API version in configuration. Subscribe to Stripe changelog. Add integration tests that run nightly against Stripe sandbox.',
    contingency: 'Maintain fallback to previous API version. Have emergency hotfix process documented.',
    storyIds: ['story-19', 'story-20'],
    identifiedDate: fmt(subDays(today, 15)),
    reviewDate: fmt(addDays(today, 7)),
    createdAt: fmt(subDays(today, 15)),
  },
  {
    id: 'risk-2',
    title: 'Key developer unavailability mid-sprint',
    description: 'Bob Martinez is the sole backend expert. His absence would block critical API and payment stories.',
    category: 'Resource',
    probability: 'low',
    impact: 'critical',
    riskScore: 10,
    status: 'mitigated',
    ownerId: 'member-1',
    mitigation: 'Cross-train Carol Kim on backend stack. Document all backend architecture decisions. Pair program on critical paths.',
    contingency: 'Descope lower-priority stories. Bring in contractor from approved vendor list.',
    storyIds: ['story-17', 'story-19', 'story-21', 'story-22'],
    identifiedDate: fmt(subDays(today, 30)),
    reviewDate: fmt(addDays(today, 14)),
    createdAt: fmt(subDays(today, 30)),
  },
  {
    id: 'risk-3',
    title: 'Dashboard performance degradation at scale',
    description: 'Real-time charts and aggregation queries may cause unacceptable load times when user base exceeds 10k.',
    category: 'Technical',
    probability: 'high',
    impact: 'moderate',
    riskScore: 12,
    status: 'open',
    ownerId: 'member-2',
    mitigation: 'Implement query result caching with Redis. Add database indexes on aggregation columns. Load test before each release.',
    contingency: 'Introduce data sampling for large datasets. Switch to async report generation with email delivery.',
    storyIds: ['story-13', 'story-14', 'story-15'],
    identifiedDate: fmt(subDays(today, 10)),
    reviewDate: fmt(addDays(today, 5)),
    createdAt: fmt(subDays(today, 10)),
  },
  {
    id: 'risk-4',
    title: 'Scope creep from stakeholder feature requests',
    description: 'Product stakeholders are adding new requirements after sprint planning, threatening sprint goals.',
    category: 'Scope',
    probability: 'high',
    impact: 'moderate',
    riskScore: 12,
    status: 'open',
    ownerId: 'member-5',
    mitigation: 'Strict change control process: all new requests go to backlog. Sprint scope frozen after planning. Weekly stakeholder alignment meetings.',
    contingency: 'If critical feature is added, explicitly descope another story of equal size.',
    storyIds: [],
    identifiedDate: fmt(subDays(today, 20)),
    reviewDate: fmt(addDays(today, 7)),
    createdAt: fmt(subDays(today, 20)),
  },
  {
    id: 'risk-5',
    title: 'Redis infrastructure instability in staging',
    description: 'Staging Redis cluster has been flapping. If this affects production, report scheduling and rate limiting will fail.',
    category: 'Infrastructure',
    probability: 'medium',
    impact: 'major',
    riskScore: 12,
    status: 'open',
    ownerId: 'member-1',
    mitigation: 'Escalate to DevOps for immediate investigation. Implement graceful degradation if Redis is unavailable.',
    contingency: 'Temporarily disable features dependent on Redis. Fall back to database-backed queuing.',
    storyIds: ['story-17', 'story-22'],
    identifiedDate: fmt(today),
    reviewDate: fmt(addDays(today, 2)),
    createdAt: fmt(today),
  },
];

// ─── Dependencies ─────────────────────────────────────────────────────────────
const dependencies: Dependency[] = [
  { id: 'dep-1', fromStoryId: 'story-19', toStoryId: 'story-14', type: 'blocked_by', description: 'Webhook handler needs revenue metrics endpoint to validate subscription data.', createdAt: fmt(subDays(today, 10)) },
  { id: 'dep-2', fromStoryId: 'story-20', toStoryId: 'story-19', type: 'blocked_by', description: 'Subscription UI requires webhook handler to be functional to process plan changes.', createdAt: fmt(subDays(today, 5)) },
  { id: 'dep-3', fromStoryId: 'story-17', toStoryId: 'story-15', type: 'blocked_by', description: 'Report scheduling depends on PDF export feature being production-ready.', createdAt: fmt(subDays(today, 8)) },
  { id: 'dep-4', fromStoryId: 'story-21', toStoryId: 'story-17', type: 'relates_to', description: 'SendGrid system and report scheduling both use email delivery. Coordinate templates.', createdAt: fmt(subDays(today, 4)) },
  { id: 'dep-5', fromStoryId: 'story-22', toStoryId: 'story-19', type: 'relates_to', description: 'Rate limiting and payment webhooks both use Redis. Ensure no resource contention.', createdAt: fmt(subDays(today, 3)) },
  { id: 'dep-6', fromStoryId: 'story-16', toStoryId: 'story-13', type: 'blocked_by', description: 'Widget system must include the activity chart component as a widget type.', createdAt: fmt(subDays(today, 7)) },
  { id: 'dep-7', fromStoryId: 'story-24', toStoryId: 'story-7', type: 'blocked_by', description: 'SAML SSO requires the OAuth system foundation to be in place.', createdAt: fmt(subDays(today, 18)) },
];

// ─── Comments ─────────────────────────────────────────────────────────────────
const comments: Comment[] = [
  { id: 'com-1', storyId: 'story-16', authorId: 'member-5', body: 'Make sure the widget layout is persisted per-user and not globally. Each user should have their own configuration.', createdAt: fmt(subDays(today, 5)) },
  { id: 'com-2', storyId: 'story-16', authorId: 'member-3', body: 'Understood. Using user preferences table in DB. Will need a migration — flagging for Bob.', createdAt: fmt(subDays(today, 5)) },
  { id: 'com-3', storyId: 'story-16', authorId: 'member-2', body: 'Migration script drafted. Will run in Sprint 3 deployment window. No downtime expected.', createdAt: fmt(subDays(today, 4)) },
  { id: 'com-4', storyId: 'story-19', authorId: 'member-1', body: 'Stripe credentials have been provided by DevOps. Unblocked as of yesterday.', createdAt: fmt(subDays(today, 3)) },
  { id: 'com-5', storyId: 'story-19', authorId: 'member-2', body: 'Started implementation. Idempotency keys using UUID stored in Redis with 24h TTL.', createdAt: fmt(subDays(today, 2)) },
  { id: 'com-6', storyId: 'story-15', authorId: 'member-4', body: 'PDF export tested on Safari — there is a rendering difference with table borders. Minor issue, does not block release.', createdAt: fmt(subDays(today, 1)) },
  { id: 'com-7', storyId: 'story-15', authorId: 'member-3', body: 'Will fix the Safari table border issue as part of this story before marking done.', createdAt: fmt(today) },
];

// ─── Decisions ────────────────────────────────────────────────────────────────
const decisions: Decision[] = [
  {
    id: 'dec-1',
    title: 'Use JWT over session cookies for authentication',
    context: 'Team debated stateless JWT tokens vs server-side sessions for the auth system architecture.',
    decision: 'Use short-lived JWT access tokens (15 min) paired with HTTP-only refresh tokens (7 days).',
    alternatives: ['Server-side session storage with Redis', 'Opaque tokens with database lookup'],
    rationale: 'JWTs enable stateless horizontal scaling. Refresh token rotation provides security comparable to server sessions. Reduces database load on every request.',
    consequences: 'Cannot immediately revoke tokens before expiry. Must maintain a token blocklist for logout and compromised accounts.',
    ownerId: 'member-2',
    storyIds: ['story-1', 'story-5'],
    sprintId: 'sprint-1',
    date: fmt(subDays(today, 58)),
    createdAt: fmt(subDays(today, 58)),
  },
  {
    id: 'dec-2',
    title: 'Recharts over Chart.js for dashboard visualizations',
    context: 'Evaluated charting libraries for the analytics dashboard. Key criteria: React native, TypeScript support, bundle size, customization.',
    decision: 'Adopt Recharts as the primary charting library.',
    alternatives: ['Chart.js + react-chartjs-2', 'Victory Charts', 'Nivo', 'Observable Plot'],
    rationale: 'Recharts is built as React components (not a wrapper). Best TypeScript types. Declarative API aligns with our codebase style. 400KB gzipped — acceptable.',
    consequences: 'Recharts has limited animation options. Very complex visualizations (e.g., chord diagrams) may need a supplementary library.',
    ownerId: 'member-3',
    storyIds: ['story-13'],
    sprintId: 'sprint-3',
    date: fmt(subDays(today, 13)),
    createdAt: fmt(subDays(today, 13)),
  },
  {
    id: 'dec-3',
    title: 'Stripe as sole payment processor (ruling out Braintree)',
    context: 'Product and engineering evaluated Stripe vs Braintree vs PayPal for the subscription billing system.',
    decision: 'Use Stripe exclusively for all payment processing.',
    alternatives: ['Braintree (PayPal subsidiary)', 'Custom payment orchestration with multiple processors'],
    rationale: 'Stripe has superior developer experience, better webhook reliability, and Stripe Billing covers all our subscription use cases out-of-the-box. Team already familiar.',
    consequences: 'Single-vendor dependency. Stripe outage impacts all payments. Mitigation: implement graceful degradation and monitoring.',
    ownerId: 'member-5',
    storyIds: ['story-19', 'story-20'],
    sprintId: 'sprint-4',
    date: fmt(subDays(today, 5)),
    createdAt: fmt(subDays(today, 5)),
  },
];

// ─── Retro Items ──────────────────────────────────────────────────────────────
const retroItems: RetroItem[] = [
  { id: 'retro-1', sprintId: 'sprint-2', category: 'went_well', text: 'OAuth integration went smoothly with great cross-team collaboration.', authorId: 'member-1', votes: 4, status: 'open', createdAt: fmt(subDays(today, 29)) },
  { id: 'retro-2', sprintId: 'sprint-2', category: 'went_well', text: 'Daily standups were focused and under 15 minutes every day.', authorId: 'member-3', votes: 3, status: 'open', createdAt: fmt(subDays(today, 29)) },
  { id: 'retro-3', sprintId: 'sprint-2', category: 'went_well', text: 'MFA implementation was well-documented and easy to review.', authorId: 'member-4', votes: 2, status: 'open', createdAt: fmt(subDays(today, 29)) },
  { id: 'retro-4', sprintId: 'sprint-2', category: 'improvement', text: 'PR review turnaround was slow — some PRs sat for 2+ days.', authorId: 'member-2', votes: 5, status: 'open', createdAt: fmt(subDays(today, 29)) },
  { id: 'retro-5', sprintId: 'sprint-2', category: 'improvement', text: 'Acceptance criteria were vague on the dashboard stories.', authorId: 'member-4', votes: 3, status: 'open', createdAt: fmt(subDays(today, 29)) },
  { id: 'retro-6', sprintId: 'sprint-2', category: 'action_item', text: 'Set a 24-hour PR review SLA and add it to the team agreement.', authorId: 'member-1', votes: 4, actionItem: 'Update team working agreement doc with 24h PR review SLA', assigneeId: 'member-1', status: 'in_progress', createdAt: fmt(subDays(today, 29)) },
  { id: 'retro-7', sprintId: 'sprint-2', category: 'action_item', text: 'Run a story refinement session before sprint planning for Sprint 3.', authorId: 'member-5', votes: 3, actionItem: 'Schedule 1h refinement session 2 days before sprint planning', assigneeId: 'member-5', status: 'done', createdAt: fmt(subDays(today, 29)) },
];

// ─── Projects ─────────────────────────────────────────────────────────────────
const projects: Project[] = [
  { id: 'project-1', name: 'ScrumBoard Pro', description: 'Main product development project.', color: '#4F6EF7', createdAt: fmt(subDays(today, 180)) },
];

// ─── Export ───────────────────────────────────────────────────────────────────
export function getSeedData(): AppState {
  return {
    members, epics, stories, sprints, standups, burndownSnapshots,
    milestones, risks, dependencies, comments, decisions,
    activeSprintId: 'sprint-3',
    settings: {
      projectName: 'ScrumBoard Pro',
      sprintLengthDays: 14,
      workingDays: [1, 2, 3, 4, 5],
      integrations: {
        github: { repoOwner: '', repoName: '', defaultBranch: 'main', enabled: false },
        slack: { webhookUrl: '', channel: '#standup', enabled: false },
        teams: { webhookUrl: '', enabled: false },
        devDeploy: { hookUrl: '', label: 'Dev', enabled: false },
        stagingDeploy: { hookUrl: '', label: 'Staging', enabled: false },
        prodDeploy: { hookUrl: '', label: 'Production', enabled: false },
      },
      permissions: [],
    },
    retroItems,
    statusChanges: [],
    aiSuggestions: [],
    projects,
    activeProjectId: 'project-1',
    activityLog: [],
    initiatives: [
      {
        id: 'init-1', title: 'Platform Modernisation', description: 'Migrate from legacy monolith to microservices with modern auth and analytics.',
        color: '#8B5CF6', status: 'active', ownerId: 'member-5',
        startDate: fmt(subDays(today, 90)), endDate: fmt(addDays(today, 90)),
        epicIds: ['epic-1', 'epic-2', 'epic-3'], createdAt: fmt(subDays(today, 90)),
      },
    ],
    features: [
      {
        id: 'feat-1', title: 'OAuth 2.0 Login', description: 'Social login via Google, GitHub, and Microsoft.', epicId: 'epic-1',
        ownerId: 'member-2', status: 'done', priority: 'critical', storyIds: ['story-7', 'story-8'],
        targetSprintId: 'sprint-2', createdAt: fmt(subDays(today, 70)),
      },
      {
        id: 'feat-2', title: 'Multi-Factor Authentication', description: 'TOTP and SMS-based MFA.', epicId: 'epic-1',
        ownerId: 'member-2', status: 'done', priority: 'high', storyIds: ['story-9'],
        targetSprintId: 'sprint-2', createdAt: fmt(subDays(today, 65)),
      },
      {
        id: 'feat-3', title: 'Analytics Dashboard', description: 'Real-time charts and KPI widgets.', epicId: 'epic-2',
        ownerId: 'member-3', status: 'in_progress', priority: 'high', storyIds: ['story-13', 'story-14', 'story-15'],
        targetSprintId: 'sprint-3', createdAt: fmt(subDays(today, 50)),
      },
      {
        id: 'feat-4', title: 'Stripe Billing Integration', description: 'Subscription plans and payment processing.', epicId: 'epic-3',
        ownerId: 'member-2', status: 'in_progress', priority: 'critical', storyIds: ['story-19', 'story-20'],
        targetSprintId: 'sprint-4', createdAt: fmt(subDays(today, 30)),
      },
    ],
    featureFlags: [
      {
        id: 'flag-1', name: 'enable_new_dashboard', description: 'Rolls out the redesigned analytics dashboard to users.',
        status: 'rollout' as import('../types').FlagStatus,
        environments: { development: true, staging: true, production: false },
        rolloutPercentage: 25, linkedStoryId: 'story-13', ownerId: 'member-3', tags: ['ui', 'dashboard'],
        createdAt: fmt(subDays(today, 14)), updatedAt: fmt(subDays(today, 2)),
      },
      {
        id: 'flag-2', name: 'stripe_v2_checkout', description: 'New Stripe Checkout integration replacing legacy billing flow.',
        status: 'enabled' as import('../types').FlagStatus,
        environments: { development: true, staging: true, production: false },
        rolloutPercentage: undefined, linkedStoryId: 'story-19', ownerId: 'member-2', tags: ['billing', 'payments'],
        createdAt: fmt(subDays(today, 7)), updatedAt: fmt(subDays(today, 1)),
      },
      {
        id: 'flag-3', name: 'mfa_totp_enforcement', description: 'Enforce MFA for all admin accounts.',
        status: 'disabled' as import('../types').FlagStatus,
        environments: { development: false, staging: false, production: false },
        rolloutPercentage: undefined, ownerId: 'member-2', tags: ['security', 'auth'],
        createdAt: fmt(subDays(today, 21)), updatedAt: fmt(subDays(today, 21)),
      },
    ],
    vacations: [],
  };
}
