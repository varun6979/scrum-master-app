import { supabase } from './supabase';
import type { Story, Sprint, Epic, TeamMember, Milestone, Risk, Decision, Dependency, Comment, StandupEntry, AppSettings } from '../types';

// ─── Mappers (DB → App) ───────────────────────────────────────────────────────

export function mapMember(row: Record<string, unknown>): TeamMember {
  return {
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string) ?? '',
    role: (row.role as TeamMember['role']) ?? 'developer',
    avatarInitials: (row.avatar_initials as string) ?? 'U',
    avatarColor: (row.avatar_color as string) ?? '#6366F1',
    capacityPoints: (row.capacity_points as number) ?? 40,
    createdAt: (row.joined_at as string) ?? new Date().toISOString(),
  };
}

export function mapEpic(row: Record<string, unknown>): Epic {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    color: (row.color as string) ?? '#6366F1',
    priority: 'medium',
    ownerId: '',
    createdAt: row.created_at as string,
  };
}

export function mapSprint(row: Record<string, unknown>): Sprint {
  return {
    id: row.id as string,
    name: row.name as string,
    goal: (row.goal as string) ?? '',
    status: (row.status as Sprint['status']) ?? 'planning',
    startDate: (row.start_date as string) ?? '',
    endDate: (row.end_date as string) ?? '',
    velocity: row.velocity as number | undefined,
    createdAt: row.created_at as string,
  };
}

export function mapStory(row: Record<string, unknown>): Story {
  return {
    id: row.id as string,
    epicId: (row.epic_id as string) ?? '',
    sprintId: (row.sprint_id as string) ?? undefined,
    title: row.title as string,
    description: (row.description as string) ?? '',
    acceptanceCriteria: [],
    storyPoints: (row.story_points as number) ?? 0,
    priority: (row.priority as Story['priority']) ?? 'medium',
    status: (row.status as Story['status']) ?? 'backlog',
    assigneeId: (row.assignee_id as string) ?? undefined,
    labels: (row.labels as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    order: (row.sort_order as number) ?? 0,
    storyType: (row.type as Story['storyType']) ?? 'story',
    tags: [],
    components: [],
    deployedTo: [],
    externalLinks: [],
    watchers: [],
    subtaskIds: [],
    definitionOfDone: [],
    qaStatus: 'not_started',
    stakeholderIds: [],
    successMetrics: [],
    blockerFlag: (row.is_blocker as boolean) ?? false,
    crossTeamDependency: false,
    attachments: (row.attachments as Story['attachments']) ?? [],
  };
}

export function mapMilestone(row: Record<string, unknown>): Milestone {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    dueDate: (row.due_date as string) ?? '',
    status: (row.status as Milestone['status']) ?? 'not_started',
    ownerId: undefined,
    epicIds: [],
    successCriteria: [],
    createdAt: row.created_at as string,
  };
}

export function mapRisk(row: Record<string, unknown>): Risk {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    category: 'Technical',
    probability: (row.probability as Risk['probability']) ?? 'medium',
    impact: (row.impact as Risk['impact']) ?? 'moderate',
    riskScore: 0,
    status: (row.status as Risk['status']) ?? 'open',
    ownerId: (row.owner_id as string) ?? undefined,
    mitigation: (row.mitigation as string) ?? '',
    contingency: '',
    storyIds: [],
    identifiedDate: row.created_at as string,
    createdAt: row.created_at as string,
  };
}

export function mapDecision(row: Record<string, unknown>): Decision {
  return {
    id: row.id as string,
    title: row.title as string,
    context: (row.context as string) ?? '',
    decision: (row.decision as string) ?? '',
    alternatives: [],
    rationale: '',
    consequences: (row.outcome as string) ?? '',
    ownerId: (row.author_id as string) ?? undefined,
    storyIds: [],
    date: row.created_at as string,
    createdAt: row.created_at as string,
  };
}

// ─── DB Mappers (App → DB) ────────────────────────────────────────────────────

export function storyToDb(story: Story, orgId: string) {
  return {
    id: story.id,
    org_id: orgId,
    title: story.title,
    description: story.description ?? '',
    type: story.storyType ?? 'story',
    status: story.status,
    priority: story.priority,
    story_points: story.storyPoints,
    epic_id: story.epicId || null,
    sprint_id: story.sprintId || null,
    assignee_id: story.assigneeId || null,
    labels: story.labels ?? [],
    acceptance_criteria: Array.isArray(story.acceptanceCriteria)
      ? story.acceptanceCriteria.join('\n')
      : story.acceptanceCriteria ?? '',
    sort_order: story.order ?? 0,
    is_blocker: story.blockerFlag ?? false,
    attachments: story.attachments ?? [],
    updated_at: new Date().toISOString(),
  };
}

export function sprintToDb(sprint: Sprint, orgId: string) {
  return {
    id: sprint.id,
    org_id: orgId,
    name: sprint.name,
    goal: sprint.goal ?? '',
    start_date: sprint.startDate,
    end_date: sprint.endDate,
    status: sprint.status,
    velocity: sprint.velocity ?? null,
  };
}

export function epicToDb(epic: Epic, orgId: string) {
  return {
    id: epic.id,
    org_id: orgId,
    title: epic.title,
    description: epic.description ?? '',
    color: epic.color ?? '#6366F1',
    status: 'active',
  };
}

export function memberToDb(member: TeamMember, orgId: string) {
  return {
    id: member.id,
    org_id: orgId,
    name: member.name,
    email: member.email ?? '',
    role: member.role,
    avatar_initials: member.avatarInitials,
    avatar_color: member.avatarColor,
    capacity_points: member.capacityPoints,
  };
}

export function milestoneToDb(m: Milestone, orgId: string) {
  return {
    id: m.id,
    org_id: orgId,
    title: m.title,
    description: m.description ?? '',
    due_date: m.dueDate,
    status: m.status,
    epic_id: m.epicIds?.[0] || null,
  };
}

export function riskToDb(r: Risk, orgId: string) {
  return {
    id: r.id,
    org_id: orgId,
    title: r.title,
    description: r.description ?? '',
    probability: r.probability,
    impact: r.impact,
    status: r.status,
    mitigation: r.mitigation ?? '',
    owner_id: r.ownerId || null,
  };
}

export function decisionToDb(d: Decision, orgId: string) {
  return {
    id: d.id,
    org_id: orgId,
    title: d.title,
    context: d.context ?? '',
    decision: d.decision ?? '',
    outcome: d.consequences ?? '',
    status: 'proposed',
    author_id: d.ownerId || null,
  };
}

// ─── Fetch all org data ───────────────────────────────────────────────────────

export async function fetchOrgData(orgId: string) {
  const [members, epics, sprints, stories, milestones, risks, decisions, settings] =
    await Promise.all([
      supabase.from('org_members').select('*').eq('org_id', orgId),
      supabase.from('epics').select('*').eq('org_id', orgId),
      supabase.from('sprints').select('*').eq('org_id', orgId),
      supabase.from('stories').select('*').eq('org_id', orgId).order('sort_order'),
      supabase.from('milestones').select('*').eq('org_id', orgId),
      supabase.from('risks').select('*').eq('org_id', orgId),
      supabase.from('decisions').select('*').eq('org_id', orgId),
      supabase.from('org_settings').select('*').eq('org_id', orgId).single(),
    ]);

  return {
    members: (members.data ?? []).map(mapMember),
    epics: (epics.data ?? []).map(mapEpic),
    sprints: (sprints.data ?? []).map(mapSprint),
    stories: (stories.data ?? []).map(mapStory),
    milestones: (milestones.data ?? []).map(mapMilestone),
    risks: (risks.data ?? []).map(mapRisk),
    decisions: (decisions.data ?? []).map(mapDecision),
    settings: settings.data
      ? ({
          projectName: settings.data.project_name ?? 'My Project',
          sprintLengthDays: settings.data.sprint_duration ?? 14,
        } as Partial<AppSettings>)
      : null,
  };
}
