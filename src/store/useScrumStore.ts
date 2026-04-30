import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState, Story, StoryStatus, Sprint, TeamMember, Epic,
  StandupEntry, AppSettings, BurndownSnapshot,
  Milestone, Risk, Dependency, Comment, Decision,
  RetroItem, AISuggestion, Project, IntegrationConfig, ActivityLogEntry,
  Initiative, Feature, MemberPermission, FeatureFlag, VacationEntry,
} from '../types';
import { getSeedData } from '../lib/seedData';
import { generateId } from '../lib/idgen';
import { getTodayISO } from '../lib/dateUtils';
import { supabase } from '../lib/supabase';
import { fetchOrgData, storyToDb, sprintToDb, epicToDb, memberToDb, milestoneToDb, riskToDb, decisionToDb } from '../lib/supabaseSync';

interface ScrumActions {
  // Stories
  addStory: (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStory: (id: string, updates: Partial<Story>) => void;
  deleteStory: (id: string) => void;
  moveStory: (id: string, newStatus: StoryStatus, newOrder?: number) => void;
  assignStoryToSprint: (storyId: string, sprintId: string | undefined) => void;

  // Sprints
  addSprint: (sprint: Omit<Sprint, 'id' | 'createdAt'>) => void;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  deleteSprint: (id: string) => void;
  startSprint: (id: string) => void;
  completeSprint: (id: string) => void;

  // Team members
  addMember: (member: Omit<TeamMember, 'id' | 'createdAt'>) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;

  // Epics
  addEpic: (epic: Omit<Epic, 'id' | 'createdAt'>) => void;
  updateEpic: (id: string, updates: Partial<Epic>) => void;
  deleteEpic: (id: string) => void;

  // Standups
  addStandup: (entry: Omit<StandupEntry, 'id' | 'createdAt'>) => void;
  updateStandup: (id: string, updates: Partial<StandupEntry>) => void;
  deleteStandup: (id: string) => void;

  // Burndown
  addBurndownSnapshot: (snapshot: BurndownSnapshot) => void;

  // Milestones
  addMilestone: (m: Omit<Milestone, 'id' | 'createdAt'>) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;

  // Risks
  addRisk: (r: Omit<Risk, 'id' | 'createdAt'>) => void;
  updateRisk: (id: string, updates: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;

  // Dependencies
  addDependency: (d: Omit<Dependency, 'id' | 'createdAt'>) => void;
  deleteDependency: (id: string) => void;

  // Comments
  addComment: (c: Omit<Comment, 'id' | 'createdAt'>) => void;
  updateComment: (id: string, body: string) => void;
  deleteComment: (id: string) => void;

  // Decisions
  addDecision: (d: Omit<Decision, 'id' | 'createdAt'>) => void;
  updateDecision: (id: string, updates: Partial<Decision>) => void;
  deleteDecision: (id: string) => void;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateIntegrations: (updates: Partial<IntegrationConfig>) => void;

  // Activity Log
  addActivityLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;

  // Initiatives
  addInitiative: (i: Omit<Initiative, 'id' | 'createdAt'>) => void;
  updateInitiative: (id: string, updates: Partial<Initiative>) => void;
  deleteInitiative: (id: string) => void;

  // Features
  addFeature: (f: Omit<Feature, 'id' | 'createdAt'>) => void;
  updateFeature: (id: string, updates: Partial<Feature>) => void;
  deleteFeature: (id: string) => void;

  // Permissions
  updatePermission: (memberId: string, updates: Partial<MemberPermission>) => void;

  // Retro Items
  addRetroItem: (item: Omit<RetroItem, 'id' | 'createdAt'>) => void;
  updateRetroItem: (id: string, updates: Partial<RetroItem>) => void;
  deleteRetroItem: (id: string) => void;

  // AI Suggestions
  addAISuggestion: (s: Omit<AISuggestion, 'id' | 'createdAt'>) => void;
  updateAISuggestion: (id: string, updates: Partial<AISuggestion>) => void;
  dismissAISuggestion: (id: string) => void;

  // Projects
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  setActiveProject: (id: string | null) => void;

  // Feature Flags
  addFeatureFlag: (f: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFeatureFlag: (id: string, updates: Partial<FeatureFlag>) => void;
  deleteFeatureFlag: (id: string) => void;

  // Vacations
  addVacation: (v: Omit<VacationEntry, 'id' | 'createdAt'>) => void;
  updateVacation: (id: string, updates: Partial<VacationEntry>) => void;
  deleteVacation: (id: string) => void;

  // Supabase sync
  currentOrgId: string | null;
  setOrgId: (orgId: string) => void;
  loadFromSupabase: (orgId: string) => Promise<void>;
}

type ScrumStore = AppState & ScrumActions;

const defaultIntegrations: IntegrationConfig = {
  github: { repoOwner: '', repoName: '', defaultBranch: 'main', enabled: false },
  slack: { webhookUrl: '', channel: '#standup', enabled: false },
  teams: { webhookUrl: '', enabled: false },
  devDeploy: { hookUrl: '', label: 'Dev', enabled: false },
  stagingDeploy: { hookUrl: '', label: 'Staging', enabled: false },
  prodDeploy: { hookUrl: '', label: 'Production', enabled: false },
};

export const useScrumStore = create<ScrumStore>()(
  persist(
    (set, get) => ({
      ...getSeedData(),
      currentOrgId: null,
      setOrgId: (orgId) => set({ currentOrgId: orgId }),
      loadFromSupabase: async (orgId: string) => {
        try {
          const data = await fetchOrgData(orgId);
          set((state) => ({
            currentOrgId: orgId,
            members: data.members.length ? data.members : state.members,
            epics: data.epics.length ? data.epics : state.epics,
            sprints: data.sprints.length ? data.sprints : state.sprints,
            stories: data.stories.length ? data.stories : state.stories,
            milestones: data.milestones.length ? data.milestones : state.milestones,
            risks: data.risks.length ? data.risks : state.risks,
            decisions: data.decisions.length ? data.decisions : state.decisions,
            ...(data.settings ? { settings: { ...state.settings, ...data.settings } } : {}),
          }));
        } catch (e) {
          console.error('loadFromSupabase failed', e);
        }
      },

      // ── Stories ──────────────────────────────────────────────────────────
      addStory: (story) =>
        set((state) => {
          const defaults = {
            watchers: [] as string[], subtaskIds: [] as string[], definitionOfDone: [] as import('../types').DefinitionOfDoneItem[],
            qaStatus: 'not_started' as import('../types').QAStatus, stakeholderIds: [] as string[],
            successMetrics: [] as string[], blockerFlag: false, crossTeamDependency: false,
            attachments: [] as import('../types').StoryAttachment[],
          };
          const newStory = { ...defaults, ...story, id: generateId(), createdAt: getTodayISO(), updatedAt: getTodayISO() } as Story;
          const orgId = state.currentOrgId;
          if (orgId) supabase.from('stories').insert(storyToDb(newStory, orgId)).then(({ error }) => { if (error) console.error('addStory sync', error); });
          return { stories: [...state.stories, newStory] };
        }),
      updateStory: (id, updates) =>
        set((state) => {
          const prev = state.stories.find((s) => s.id === id);
          const logEntries: ActivityLogEntry[] = [];
          if (prev) {
            const tracked: (keyof Story)[] = ['status', 'priority', 'assigneeId', 'storyPoints', 'sprintId', 'qaStatus', 'approvalStatus'];
            for (const field of tracked) {
              if (updates[field] !== undefined && updates[field] !== prev[field]) {
                logEntries.push({
                  id: `log-${Date.now()}-${field}`,
                  storyId: id,
                  action: `${field} changed`,
                  field,
                  oldValue: String(prev[field] ?? ''),
                  newValue: String(updates[field] ?? ''),
                  timestamp: new Date().toISOString(),
                });
              }
            }
          }
          const orgId = state.currentOrgId;
          const updated = state.stories.map((s) => s.id === id ? { ...s, ...updates, updatedAt: getTodayISO() } : s);
          const updatedStory = updated.find(s => s.id === id);
          if (orgId && updatedStory) supabase.from('stories').update(storyToDb(updatedStory, orgId)).eq('id', id).then(({ error }) => { if (error) console.error('updateStory sync', error); });
          return {
            stories: updated,
            activityLog: [...(state.activityLog ?? []), ...logEntries],
          };
        }),
      deleteStory: (id) =>
        set((state) => {
          const orgId = state.currentOrgId;
          if (orgId) supabase.from('stories').delete().eq('id', id).then(({ error }) => { if (error) console.error('deleteStory sync', error); });
          return {
            stories: state.stories.filter((s) => s.id !== id),
            dependencies: state.dependencies.filter((d) => d.fromStoryId !== id && d.toStoryId !== id),
            comments: state.comments.filter((c) => c.storyId !== id),
          };
        }),
      moveStory: (id, newStatus, newOrder) =>
        set((state) => {
          const story = state.stories.find((s) => s.id === id);
          if (!story) return state;
          const completedAt = newStatus === 'done' && story.status !== 'done'
            ? getTodayISO()
            : newStatus !== 'done' ? undefined : story.completedAt;
          return {
            stories: state.stories.map((s) =>
              s.id === id ? { ...s, status: newStatus, order: newOrder ?? s.order, completedAt, updatedAt: getTodayISO() } : s
            ),
          };
        }),
      assignStoryToSprint: (storyId, sprintId) =>
        set((state) => ({
          stories: state.stories.map((s) =>
            s.id === storyId
              ? { ...s, sprintId, status: sprintId ? (s.status === 'backlog' ? 'todo' : s.status) : 'backlog', updatedAt: getTodayISO() }
              : s
          ),
        })),

      // ── Sprints ───────────────────────────────────────────────────────────
      addSprint: (sprint) =>
        set((state) => {
          const newSprint = { ...sprint, id: generateId(), createdAt: getTodayISO() } as Sprint;
          const orgId = state.currentOrgId;
          if (orgId) supabase.from('sprints').insert(sprintToDb(newSprint, orgId)).then(({ error }) => { if (error) console.error('addSprint sync', error); });
          return { sprints: [...state.sprints, newSprint] };
        }),
      updateSprint: (id, updates) =>
        set((state) => {
          const orgId = state.currentOrgId;
          const updated = state.sprints.map((sp) => sp.id === id ? { ...sp, ...updates } : sp);
          const updatedSprint = updated.find(sp => sp.id === id);
          if (orgId && updatedSprint) supabase.from('sprints').update(sprintToDb(updatedSprint, orgId)).eq('id', id).then(({ error }) => { if (error) console.error('updateSprint sync', error); });
          return { sprints: updated };
        }),
      deleteSprint: (id) =>
        set((state) => {
          const orgId = state.currentOrgId;
          if (orgId) supabase.from('sprints').delete().eq('id', id).then(({ error }) => { if (error) console.error('deleteSprint sync', error); });
          return {
            sprints: state.sprints.filter((sp) => sp.id !== id),
            stories: state.stories.map((s) =>
              s.sprintId === id ? { ...s, sprintId: undefined, status: 'backlog', updatedAt: getTodayISO() } : s
            ),
            activeSprintId: state.activeSprintId === id ? null : state.activeSprintId,
          };
        }),
      startSprint: (id) =>
        set((state) => {
          const alreadyActive = state.sprints.find((sp) => sp.status === 'active');
          if (alreadyActive && alreadyActive.id !== id) return state;
          return {
            sprints: state.sprints.map((sp) => sp.id === id ? { ...sp, status: 'active' } : sp),
            activeSprintId: id,
          };
        }),
      completeSprint: (id) =>
        set((state) => {
          const sprint = state.sprints.find((sp) => sp.id === id);
          if (!sprint) return state;
          const sprintStories = state.stories.filter((s) => s.sprintId === id);
          const completedPoints = sprintStories.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.storyPoints, 0);
          return {
            sprints: state.sprints.map((sp) =>
              sp.id === id ? { ...sp, status: 'completed', velocity: completedPoints, completedAt: getTodayISO() } : sp
            ),
            stories: state.stories.map((s) => {
              if (s.sprintId !== id || s.status === 'done') return s;
              return { ...s, sprintId: undefined, status: 'backlog' as StoryStatus, updatedAt: getTodayISO() };
            }),
            activeSprintId: state.activeSprintId === id ? null : state.activeSprintId,
          };
        }),

      // ── Members ───────────────────────────────────────────────────────────
      addMember: (member) =>
        set((state) => ({
          members: [...state.members, { ...member, id: generateId(), createdAt: getTodayISO() } as TeamMember],
        })),
      updateMember: (id, updates) =>
        set((state) => ({
          members: state.members.map((m) => m.id === id ? { ...m, ...updates } : m),
        })),
      deleteMember: (id) =>
        set((state) => ({ members: state.members.filter((m) => m.id !== id) })),

      // ── Epics ─────────────────────────────────────────────────────────────
      addEpic: (epic) =>
        set((state) => {
          const newEpic = { ...epic, id: generateId(), createdAt: getTodayISO() } as Epic;
          const orgId = state.currentOrgId;
          if (orgId) supabase.from('epics').insert(epicToDb(newEpic, orgId)).then(({ error }) => { if (error) console.error('addEpic sync', error); });
          return { epics: [...state.epics, newEpic] };
        }),
      updateEpic: (id, updates) =>
        set((state) => {
          const orgId = state.currentOrgId;
          const updated = state.epics.map((e) => e.id === id ? { ...e, ...updates } : e);
          const updatedEpic = updated.find(e => e.id === id);
          if (orgId && updatedEpic) supabase.from('epics').update(epicToDb(updatedEpic, orgId)).eq('id', id).then(({ error }) => { if (error) console.error('updateEpic sync', error); });
          return { epics: updated };
        }),
      deleteEpic: (id) =>
        set((state) => {
          const orgId = state.currentOrgId;
          if (orgId) supabase.from('epics').delete().eq('id', id).then(({ error }) => { if (error) console.error('deleteEpic sync', error); });
          return { epics: state.epics.filter((e) => e.id !== id) };
        }),

      // ── Standups ──────────────────────────────────────────────────────────
      addStandup: (entry) =>
        set((state) => ({
          standups: [...state.standups, { ...entry, id: generateId(), createdAt: getTodayISO() } as StandupEntry],
        })),
      updateStandup: (id, updates) =>
        set((state) => ({
          standups: state.standups.map((su) => su.id === id ? { ...su, ...updates } : su),
        })),
      deleteStandup: (id) =>
        set((state) => ({ standups: state.standups.filter((su) => su.id !== id) })),

      // ── Burndown ──────────────────────────────────────────────────────────
      addBurndownSnapshot: (snapshot) =>
        set((state) => ({ burndownSnapshots: [...state.burndownSnapshots, snapshot] })),

      // ── Milestones ────────────────────────────────────────────────────────
      addMilestone: (m) =>
        set((state) => ({
          milestones: [...state.milestones, { ...m, id: generateId(), createdAt: getTodayISO() } as Milestone],
        })),
      updateMilestone: (id, updates) =>
        set((state) => ({
          milestones: state.milestones.map((m) => m.id === id ? { ...m, ...updates } : m),
        })),
      deleteMilestone: (id) =>
        set((state) => ({ milestones: state.milestones.filter((m) => m.id !== id) })),

      // ── Risks ─────────────────────────────────────────────────────────────
      addRisk: (r) =>
        set((state) => ({
          risks: [...state.risks, { ...r, id: generateId(), createdAt: getTodayISO() } as Risk],
        })),
      updateRisk: (id, updates) =>
        set((state) => ({
          risks: state.risks.map((r) => r.id === id ? { ...r, ...updates } : r),
        })),
      deleteRisk: (id) =>
        set((state) => ({ risks: state.risks.filter((r) => r.id !== id) })),

      // ── Dependencies ──────────────────────────────────────────────────────
      addDependency: (d) =>
        set((state) => ({
          dependencies: [...state.dependencies, { ...d, id: generateId(), createdAt: getTodayISO() } as Dependency],
        })),
      deleteDependency: (id) =>
        set((state) => ({ dependencies: state.dependencies.filter((d) => d.id !== id) })),

      // ── Comments ──────────────────────────────────────────────────────────
      addComment: (c) =>
        set((state) => ({
          comments: [...state.comments, { ...c, id: generateId(), createdAt: new Date().toISOString() } as Comment],
        })),
      updateComment: (id, body) =>
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === id ? { ...c, body, updatedAt: new Date().toISOString() } : c
          ),
        })),
      deleteComment: (id) =>
        set((state) => ({ comments: state.comments.filter((c) => c.id !== id) })),

      // ── Decisions ─────────────────────────────────────────────────────────
      addDecision: (d) =>
        set((state) => ({
          decisions: [...state.decisions, { ...d, id: generateId(), createdAt: getTodayISO() } as Decision],
        })),
      updateDecision: (id, updates) =>
        set((state) => ({
          decisions: state.decisions.map((d) => d.id === id ? { ...d, ...updates } : d),
        })),
      deleteDecision: (id) =>
        set((state) => ({ decisions: state.decisions.filter((d) => d.id !== id) })),

      // ── Activity Log ──────────────────────────────────────────────────────
      addActivityLog: (entry) =>
        set((state) => ({
          activityLog: [...(state.activityLog ?? []), { ...entry, id: generateId(), timestamp: new Date().toISOString() } as ActivityLogEntry],
        })),

      // ── Initiatives ───────────────────────────────────────────────────────
      addInitiative: (i) =>
        set((state) => ({
          initiatives: [...(state.initiatives ?? []), { ...i, id: generateId(), createdAt: getTodayISO() } as Initiative],
        })),
      updateInitiative: (id, updates) =>
        set((state) => ({
          initiatives: (state.initiatives ?? []).map((i) => i.id === id ? { ...i, ...updates } : i),
        })),
      deleteInitiative: (id) =>
        set((state) => ({ initiatives: (state.initiatives ?? []).filter((i) => i.id !== id) })),

      // ── Features ──────────────────────────────────────────────────────────
      addFeature: (f) =>
        set((state) => ({
          features: [...(state.features ?? []), { ...f, id: generateId(), createdAt: getTodayISO() } as Feature],
        })),
      updateFeature: (id, updates) =>
        set((state) => ({
          features: (state.features ?? []).map((f) => f.id === id ? { ...f, ...updates } : f),
        })),
      deleteFeature: (id) =>
        set((state) => ({
          features: (state.features ?? []).filter((f) => f.id !== id),
          stories: state.stories.map((s) => s.featureId === id ? { ...s, featureId: undefined } : s),
        })),

      // ── Permissions ───────────────────────────────────────────────────────
      updatePermission: (memberId, updates) =>
        set((state) => {
          const perms = state.settings.permissions ?? [];
          const existing = perms.find((p) => p.memberId === memberId);
          const defaultPerm: MemberPermission = {
            memberId, level: 'member', canCreateStories: true, canEditStories: true,
            canDeleteStories: false, canManageSprints: false, canViewReports: true, canManageTeam: false,
          };
          const updated = existing
            ? perms.map((p) => p.memberId === memberId ? { ...p, ...updates } : p)
            : [...perms, { ...defaultPerm, ...updates }];
          return { settings: { ...state.settings, permissions: updated } };
        }),

      // ── Settings ──────────────────────────────────────────────────────────
      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),
      updateIntegrations: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            integrations: { ...state.settings.integrations, ...updates },
          },
        })),

      // ── Retro Items ───────────────────────────────────────────────────────
      addRetroItem: (item) =>
        set((state) => ({
          retroItems: [...(state.retroItems ?? []), { ...item, id: generateId(), createdAt: new Date().toISOString() } as RetroItem],
        })),
      updateRetroItem: (id, updates) =>
        set((state) => ({
          retroItems: (state.retroItems ?? []).map((r) => r.id === id ? { ...r, ...updates } : r),
        })),
      deleteRetroItem: (id) =>
        set((state) => ({ retroItems: (state.retroItems ?? []).filter((r) => r.id !== id) })),

      // ── AI Suggestions ────────────────────────────────────────────────────
      addAISuggestion: (s) =>
        set((state) => ({
          aiSuggestions: [...(state.aiSuggestions ?? []), { ...s, id: generateId(), createdAt: new Date().toISOString() } as AISuggestion],
        })),
      updateAISuggestion: (id, updates) =>
        set((state) => ({
          aiSuggestions: (state.aiSuggestions ?? []).map((s) => s.id === id ? { ...s, ...updates } : s),
        })),
      dismissAISuggestion: (id) =>
        set((state) => ({
          aiSuggestions: (state.aiSuggestions ?? []).map((s) => s.id === id ? { ...s, dismissed: true } : s),
        })),

      // ── Projects ──────────────────────────────────────────────────────────
      addProject: (p) =>
        set((state) => ({
          projects: [...(state.projects ?? []), { ...p, id: generateId(), createdAt: getTodayISO() } as Project],
        })),
      updateProject: (id, updates) =>
        set((state) => ({
          projects: (state.projects ?? []).map((p) => p.id === id ? { ...p, ...updates } : p),
        })),
      setActiveProject: (id) =>
        set(() => ({ activeProjectId: id })),

      // ── Feature Flags ──────────────────────────────────────────────────────
      addFeatureFlag: (f) =>
        set((state) => ({
          featureFlags: [...(state.featureFlags ?? []), {
            ...f, id: generateId(), createdAt: getTodayISO(), updatedAt: getTodayISO(),
          } as FeatureFlag],
        })),
      updateFeatureFlag: (id, updates) =>
        set((state) => ({
          featureFlags: (state.featureFlags ?? []).map((f) => f.id === id ? { ...f, ...updates, updatedAt: getTodayISO() } : f),
        })),
      deleteFeatureFlag: (id) =>
        set((state) => ({
          featureFlags: (state.featureFlags ?? []).filter((f) => f.id !== id),
        })),

      // ── Vacations ─────────────────────────────────────────────────────────
      addVacation: (v) =>
        set((state) => ({
          vacations: [...(state.vacations ?? []), { ...v, id: generateId(), createdAt: getTodayISO() } as VacationEntry],
        })),
      updateVacation: (id, updates) =>
        set((state) => ({
          vacations: (state.vacations ?? []).map((v) => v.id === id ? { ...v, ...updates } : v),
        })),
      deleteVacation: (id) =>
        set((state) => ({
          vacations: (state.vacations ?? []).filter((v) => v.id !== id),
        })),
    }),
    {
      name: 'scrum-master-store-v2',
      version: 2,
      merge: (persisted, current) => {
        const p = persisted as Partial<ScrumStore>;
        if (p.members && p.members.length > 0) {
          return {
            ...current, ...p,
            milestones: p.milestones ?? (current as AppState).milestones ?? [],
            risks: p.risks ?? (current as AppState).risks ?? [],
            dependencies: p.dependencies ?? (current as AppState).dependencies ?? [],
            comments: p.comments ?? (current as AppState).comments ?? [],
            decisions: p.decisions ?? (current as AppState).decisions ?? [],
            retroItems: p.retroItems ?? (current as AppState).retroItems ?? [],
            statusChanges: p.statusChanges ?? (current as AppState).statusChanges ?? [],
            aiSuggestions: p.aiSuggestions ?? (current as AppState).aiSuggestions ?? [],
            projects: p.projects ?? (current as AppState).projects ?? [],
            activeProjectId: p.activeProjectId ?? (current as AppState).activeProjectId ?? null,
            activityLog: p.activityLog ?? (current as AppState).activityLog ?? [],
            initiatives: p.initiatives ?? (current as AppState).initiatives ?? [],
            features: p.features ?? (current as AppState).features ?? [],
            settings: p.settings
              ? {
                  ...p.settings,
                  integrations: p.settings.integrations ?? defaultIntegrations,
                  permissions: p.settings.permissions ?? [],
                }
              : (current as AppState).settings,
          };
        }
        return current;
      },
    }
  )
);

// ── Selector helpers ───────────────────────────────────────────────────────────
export const useActiveSprint = () => {
  const { sprints, activeSprintId } = useScrumStore();
  return sprints.find((sp) => sp.id === activeSprintId) ?? null;
};

export const useSprintStories = (sprintId: string | null) => {
  const { stories } = useScrumStore();
  if (!sprintId) return [];
  return stories.filter((s) => s.sprintId === sprintId);
};

export const useBacklogStories = () => {
  const { stories } = useScrumStore();
  return stories.filter((s) => !s.sprintId || s.status === 'backlog');
};

export const useBurndown = (sprintId: string | null) => {
  const { burndownSnapshots, sprints, stories } = useScrumStore();
  if (!sprintId) return { snapshots: [], sprint: null };
  const sprint = sprints.find((sp) => sp.id === sprintId) ?? null;
  const snapshots = [...burndownSnapshots.filter((b) => b.sprintId === sprintId)];

  if (sprint?.status === 'active') {
    const today = getTodayISO();
    const hasToday = snapshots.some((s) => s.date === today);
    if (!hasToday) {
      const sprintStories = stories.filter((s) => s.sprintId === sprintId);
      const total = sprintStories.reduce((sum, s) => sum + s.storyPoints, 0);
      const completed = sprintStories.filter((s) => s.status === 'done').reduce((sum, s) => sum + s.storyPoints, 0);
      snapshots.push({ date: today, sprintId, remainingPoints: total - completed, completedPoints: completed, idealPoints: 0 });
    }
  }
  return { snapshots, sprint };
};

export const useStoryDependencies = (storyId: string) => {
  const { dependencies, stories } = useScrumStore();
  const deps = dependencies.filter((d) => d.fromStoryId === storyId || d.toStoryId === storyId);
  return deps.map((d) => {
    const isFrom = d.fromStoryId === storyId;
    const otherStoryId = isFrom ? d.toStoryId : d.fromStoryId;
    const otherStory = stories.find((s) => s.id === otherStoryId);
    return { ...d, otherStory, direction: isFrom ? 'from' : 'to' as 'from' | 'to' };
  });
};

export const useStoryComments = (storyId: string) => {
  const { comments } = useScrumStore();
  return comments.filter((c) => c.storyId === storyId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};
