// ─── Primitives ───────────────────────────────────────────────────────────────
export type StoryStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type SprintStatus = 'planning' | 'active' | 'completed';
export type MemberRole = 'scrum_master' | 'product_owner' | 'developer' | 'designer' | 'qa';

export type MilestoneStatus = 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'missed';
export type RiskProbability = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type RiskImpact = 'negligible' | 'minor' | 'moderate' | 'major' | 'critical';
export type RiskStatus = 'open' | 'mitigated' | 'accepted' | 'closed';
export type DependencyType = 'blocks' | 'blocked_by' | 'relates_to' | 'duplicates';

// ─── Team ─────────────────────────────────────────────────────────────────────
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  avatarInitials: string;
  avatarColor: string;
  capacityPoints: number;
  createdAt: string;
  oooStart?: string;   // ISO date e.g. "2026-05-01"
  oooEnd?: string;     // ISO date e.g. "2026-05-03"
}

// ─── Epic ─────────────────────────────────────────────────────────────────────
export interface Epic {
  id: string;
  title: string;
  description: string;
  color: string;
  priority: Priority;
  ownerId: string;
  createdAt: string;
  completedAt?: string;
}

export type StoryType = 'story' | 'bug' | 'task' | 'spike' | 'tech_debt';
export type StorySeverity = 'blocker' | 'critical' | 'major' | 'minor' | 'trivial';
export type QAStatus = 'not_started' | 'in_qa' | 'passed' | 'failed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type CustomerImpact = 'low' | 'medium' | 'high';
export type BuildStatus = 'passing' | 'failing' | 'pending' | 'unknown';
export type DependencyRiskLevel = 'low' | 'medium' | 'high';
export type StoryResolution = 'done' | 'wont_fix' | 'duplicate' | 'cannot_reproduce';

export interface ActivityLogEntry {
  id: string;
  storyId: string;
  authorId?: string;
  action: string;         // e.g. "Status changed from in_progress to done"
  field?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface DefinitionOfDoneItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface StoryAttachment {
  id: string;
  name: string;
  url: string;
  type: string;          // mime type or 'link'
  size?: number;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface ExternalLink {
  id: string;
  type: 'github_pr' | 'github_issue' | 'azure_devops' | 'confluence' | 'figma' | 'notion' | 'custom';
  url: string;
  title: string;
}

export interface IntegrationConfig {
  github: { repoOwner: string; repoName: string; defaultBranch: string; enabled: boolean };
  slack: { webhookUrl: string; channel: string; enabled: boolean };
  teams: { webhookUrl: string; enabled: boolean };
  devDeploy: { hookUrl: string; label: string; enabled: boolean };
  stagingDeploy: { hookUrl: string; label: string; enabled: boolean };
  prodDeploy: { hookUrl: string; label: string; enabled: boolean };
}

// ─── Story ────────────────────────────────────────────────────────────────────
export interface Story {
  id: string;
  epicId: string;
  sprintId?: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  priority: Priority;
  status: StoryStatus;
  assigneeId?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  order: number;
  storyType?: StoryType;
  severity?: StorySeverity;
  tags: string[];
  components: string[];
  reporterId?: string;
  dueDate?: string;
  businessValue?: number;
  environment?: string;
  fixVersion?: string;
  releaseNotes?: string;
  timeEstimateMins?: number;
  timeSpentMins?: number;
  testNotes?: string;
  branchName?: string;
  pullRequestUrl?: string;
  deployedTo: string[];
  externalLinks: ExternalLink[];
  // Advanced fields from spec
  watchers: string[];                    // member IDs watching this story
  subtaskIds: string[];                  // child story IDs
  parentId?: string;                     // parent story ID (for subtasks)
  definitionOfDone: DefinitionOfDoneItem[];
  qaStatus: QAStatus;
  approvalStatus?: ApprovalStatus;
  stakeholderIds: string[];
  customerImpact?: CustomerImpact;
  revenueImpact?: number;
  okrLink?: string;
  persona?: string;
  problemStatement?: string;
  successMetrics: string[];
  riskScore?: number;                    // 0-100 AI-calculated
  effortConfidenceScore?: number;        // 0-100 percentage
  dependencyRiskLevel?: DependencyRiskLevel;
  blockerFlag: boolean;
  blockerDurationHours?: number;
  crossTeamDependency: boolean;
  buildStatus?: BuildStatus;
  featureFlagStatus?: string;
  resolution?: StoryResolution;
  attachments: StoryAttachment[];
  featureId?: string;            // parent Feature in the hierarchy
}

// ─── Sprint ───────────────────────────────────────────────────────────────────
export interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  velocity?: number;
  createdAt: string;
  completedAt?: string;
}

// ─── Standup ──────────────────────────────────────────────────────────────────
export interface StandupEntry {
  id: string;
  memberId: string;
  sprintId: string;
  date: string;
  yesterday: string;
  today: string;
  blockers: string;
  hasBlocker: boolean;
  createdAt: string;
}

// ─── Burndown ─────────────────────────────────────────────────────────────────
export interface BurndownSnapshot {
  date: string;
  sprintId: string;
  remainingPoints: number;
  completedPoints: number;
  idealPoints: number;
}

// ─── Milestone ────────────────────────────────────────────────────────────────
export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: MilestoneStatus;
  ownerId?: string;
  epicIds: string[];          // linked epics
  sprintId?: string;          // sprint it falls in
  successCriteria: string[];
  completedAt?: string;
  createdAt: string;
}

// ─── Risk ─────────────────────────────────────────────────────────────────────
export interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;           // e.g. "Technical", "Resource", "Schedule", "Scope"
  probability: RiskProbability;
  impact: RiskImpact;
  riskScore: number;          // computed: probability_index * impact_index (1-25)
  status: RiskStatus;
  ownerId?: string;
  mitigation: string;         // mitigation plan
  contingency: string;        // contingency plan if risk occurs
  storyIds: string[];         // affected stories
  identifiedDate: string;
  reviewDate?: string;
  closedAt?: string;
  createdAt: string;
}

// ─── Dependency ───────────────────────────────────────────────────────────────
export interface Dependency {
  id: string;
  fromStoryId: string;        // the story that has the dependency
  toStoryId: string;          // the story it depends on / is related to
  type: DependencyType;       // "blocks" | "blocked_by" | "relates_to" | "duplicates"
  description?: string;
  createdAt: string;
}

// ─── Comment ──────────────────────────────────────────────────────────────────
export interface Comment {
  id: string;
  storyId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Decision Log ─────────────────────────────────────────────────────────────
export interface Decision {
  id: string;
  title: string;
  context: string;            // why the decision was needed
  decision: string;           // what was decided
  alternatives: string[];     // other options considered
  rationale: string;          // why this option was chosen
  consequences: string;       // expected outcomes / trade-offs
  ownerId?: string;
  storyIds: string[];
  sprintId?: string;
  date: string;
  createdAt: string;
}

// ─── Initiative ───────────────────────────────────────────────────────────────
// Top of the hierarchy: Initiative → Epic → Feature → Story → Subtask
export type InitiativeStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Initiative {
  id: string;
  title: string;
  description: string;
  color: string;
  status: InitiativeStatus;
  ownerId?: string;
  startDate?: string;
  endDate?: string;
  epicIds: string[];
  createdAt: string;
}

// ─── Feature ──────────────────────────────────────────────────────────────────
// Sits between Epic and Story: Initiative → Epic → Feature → Story
export type FeatureStatus = 'backlog' | 'in_progress' | 'done' | 'cancelled';

export interface Feature {
  id: string;
  title: string;
  description: string;
  epicId: string;
  ownerId?: string;
  status: FeatureStatus;
  priority: Priority;
  storyIds: string[];
  targetSprintId?: string;
  createdAt: string;
}

// ─── Permission ───────────────────────────────────────────────────────────────
export type PermissionLevel = 'admin' | 'member' | 'viewer' | 'guest';

export interface MemberPermission {
  memberId: string;
  level: PermissionLevel;
  canCreateStories: boolean;
  canEditStories: boolean;
  canDeleteStories: boolean;
  canManageSprints: boolean;
  canViewReports: boolean;
  canManageTeam: boolean;
}

// ─── App Settings ─────────────────────────────────────────────────────────────
export interface AppSettings {
  projectName: string;
  sprintLengthDays: number;
  workingDays: number[];
  integrations: IntegrationConfig;
  permissions: MemberPermission[];
}

// ─── App State ────────────────────────────────────────────────────────────────
export interface AppState {
  members: TeamMember[];
  epics: Epic[];
  stories: Story[];
  sprints: Sprint[];
  standups: StandupEntry[];
  burndownSnapshots: BurndownSnapshot[];
  milestones: Milestone[];
  risks: Risk[];
  dependencies: Dependency[];
  comments: Comment[];
  decisions: Decision[];
  activeSprintId: string | null;
  settings: AppSettings;
  retroItems: RetroItem[];
  statusChanges: StoryStatusChange[];
  aiSuggestions: AISuggestion[];
  projects: Project[];
  activeProjectId: string | null;
  activityLog: ActivityLogEntry[];
  initiatives: Initiative[];
  features: Feature[];
  featureFlags: FeatureFlag[];
  vacations: VacationEntry[];
}

// ─── Retrospective ────────────────────────────────────────────────────────────
export type RetroCategory = 'went_well' | 'improvement' | 'action_item';
export type RetroItemStatus = 'open' | 'in_progress' | 'done';

export interface RetroItem {
  id: string;
  sprintId: string;
  category: RetroCategory;
  text: string;
  authorId?: string;
  votes: number;
  actionItem?: string;   // if category=action_item, the concrete next step
  assigneeId?: string;
  status: RetroItemStatus;
  linkedStoryId?: string;
  createdAt: string;
}

// ─── Cycle Time ───────────────────────────────────────────────────────────────
export interface StoryStatusChange {
  storyId: string;
  fromStatus: StoryStatus;
  toStatus: StoryStatus;
  changedAt: string;
}

// ─── Story Cycle Record (computed, not stored) ────────────────────────────────
export interface StoryCycleRecord {
  storyId: string;
  storyTitle: string;
  storyPoints: number;
  epicId: string;
  sprintId?: string;
  timeInBacklog: number;    // hours
  timeInTodo: number;
  timeInProgress: number;
  timeInReview: number;
  totalLeadTime: number;    // backlog → done (hours)
  totalCycleTime: number;   // in_progress → done (hours)
  completedAt?: string;
}

// ─── Project ──────────────────────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  archivedAt?: string;
}

// ─── Feature Flag ─────────────────────────────────────────────────────────────
export type FlagEnvironment = 'development' | 'staging' | 'production';
export type FlagStatus = 'enabled' | 'disabled' | 'rollout';

export interface FeatureFlag {
  id: string;
  name: string;                // e.g. "enable_new_dashboard"
  description: string;
  status: FlagStatus;
  environments: Record<FlagEnvironment, boolean>;
  rolloutPercentage?: number;  // 0-100 for gradual rollout
  linkedStoryId?: string;
  ownerId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Vacation ─────────────────────────────────────────────────────────────────
export interface VacationEntry {
  id: string;
  memberId: string;
  startDate: string;   // ISO date "YYYY-MM-DD"
  endDate: string;     // ISO date "YYYY-MM-DD"
  reason?: string;     // "PTO", "Holiday", "Sick", etc.
  createdAt: string;
}

// ─── AI Suggestion ────────────────────────────────────────────────────────────
export type AISuggestionType = 'story_points' | 'risk_detected' | 'sprint_health' | 'retro_summary' | 'forecast';

export interface AISuggestion {
  id: string;
  type: AISuggestionType;
  title: string;
  body: string;
  confidence: number;      // 0-1
  relatedId?: string;      // storyId, sprintId, etc.
  accepted?: boolean;
  dismissed?: boolean;
  createdAt: string;
}
