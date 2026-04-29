import { useState, useEffect } from 'react';
import {
  Plus, X, Trash2, MessageSquare, Send, GitBranch,
  Sparkles, Wand2, ChevronDown, ChevronUp, Bug, Lightbulb, Wrench, Search,
  Copy, CheckCheck, ExternalLink, Code2, Globe, Pen, FileText,
  Rocket, Clock, Tag, Layers, AlertCircle, Link,
  Paperclip, CheckSquare, Square, Image, File as FileIcon,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useScrumStore, useStoryComments, useStoryDependencies } from '../../store/useScrumStore';
import { Story, StoryStatus, Priority, DependencyType, StoryType, StorySeverity, ExternalLink as ExtLink } from '../../types';
import { getTodayISO } from '../../lib/dateUtils';
import { format, parseISO } from 'date-fns';
import { generateId } from '../../lib/idgen';

// ─── Constants ──────────────────────────────────────────────────────────────────

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

const statusOptions: { value: StoryStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'medium', label: 'Medium', color: 'text-amber-500' },
  { value: 'low', label: 'Low', color: 'text-blue-400' },
];

const severityOptions: { value: StorySeverity; label: string }[] = [
  { value: 'blocker', label: 'Blocker' },
  { value: 'critical', label: 'Critical' },
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'trivial', label: 'Trivial' },
];

const STORY_TYPE_OPTIONS: { value: StoryType; label: string; icon: string; color: string }[] = [
  { value: 'story', label: 'Story', icon: '📖', color: 'bg-blue-100 border-blue-300 text-blue-700' },
  { value: 'bug', label: 'Bug', icon: '🐛', color: 'bg-red-100 border-red-300 text-red-700' },
  { value: 'task', label: 'Task', icon: '✅', color: 'bg-green-100 border-green-300 text-green-700' },
  { value: 'spike', label: 'Spike', icon: '🔍', color: 'bg-purple-100 border-purple-300 text-purple-700' },
  { value: 'tech_debt', label: 'Tech Debt', icon: '🔧', color: 'bg-amber-100 border-amber-300 text-amber-700' },
];

const DEP_TYPE_OPTIONS: { value: DependencyType; label: string }[] = [
  { value: 'blocked_by', label: 'Blocked By' },
  { value: 'blocks', label: 'Blocks' },
  { value: 'relates_to', label: 'Relates To' },
  { value: 'duplicates', label: 'Duplicates' },
];

const ENV_OPTIONS = ['Development', 'Staging', 'UAT', 'Pre-production', 'Production'];

const LINK_TYPE_OPTIONS: { value: ExtLink['type']; label: string; icon: React.ReactNode }[] = [
  { value: 'github_pr', label: 'GitHub PR', icon: <Code2 size={12} /> },
  { value: 'github_issue', label: 'GitHub Issue', icon: <Code2 size={12} /> },
  { value: 'azure_devops', label: 'Azure DevOps', icon: <Layers size={12} /> },
  { value: 'confluence', label: 'Confluence', icon: <FileText size={12} /> },
  { value: 'figma', label: 'Figma', icon: <Pen size={12} /> },
  { value: 'notion', label: 'Notion', icon: <FileText size={12} /> },
  { value: 'custom', label: 'Custom Link', icon: <Globe size={12} /> },
];

// ─── Templates ──────────────────────────────────────────────────────────────────

const STORY_TEMPLATES = [
  {
    id: 'feature', label: 'Feature', icon: <Lightbulb size={12} />, color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
    titlePrefix: '', storyType: 'story' as StoryType,
    descTemplate: 'As a [user role], I want to [action/goal], so that [benefit/value].',
    criteriaTemplate: ['Given [context], when [action], then [expected outcome]', 'The feature works across all supported browsers/devices', 'Performance: response time under 2 seconds'],
    priority: 'medium' as Priority, points: 5,
  },
  {
    id: 'bug', label: 'Bug Fix', icon: <Bug size={12} />, color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
    titlePrefix: 'Fix: ', storyType: 'bug' as StoryType,
    descTemplate: 'As a [affected user], I am experiencing [problem] when [steps to reproduce].\n\nSteps to reproduce:\n1. \n2. \n3. \n\nExpected: \nActual: ',
    criteriaTemplate: ['The bug no longer occurs when following the reproduction steps', 'No regression in related functionality', 'Error logs are clean after the fix'],
    priority: 'high' as Priority, points: 3,
  },
  {
    id: 'spike', label: 'Spike', icon: <Search size={12} />, color: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100',
    titlePrefix: 'Spike: ', storyType: 'spike' as StoryType,
    descTemplate: 'Research [topic/technology] to make an informed decision about [problem].\n\nQuestions to answer:\n- \n- \n\nTime-boxed to: [X] days',
    criteriaTemplate: ['A written summary of findings is produced', 'A recommendation with trade-offs is documented in Decision Log', 'Implementation approach is agreed by team'],
    priority: 'medium' as Priority, points: 2,
  },
  {
    id: 'tech_debt', label: 'Tech Debt', icon: <Wrench size={12} />, color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100',
    titlePrefix: 'Refactor: ', storyType: 'tech_debt' as StoryType,
    descTemplate: 'Refactor [component/module] to [benefit: maintainability/performance/testability].\n\nCurrent problem:\n\nProposed approach:',
    criteriaTemplate: ['All existing tests pass after the change', 'Code coverage maintained or improved', 'No user-facing behavior changes', 'Peer review completed'],
    priority: 'low' as Priority, points: 3,
  },
];

// ─── AI Story Generator ─────────────────────────────────────────────────────────

function generateStory(idea: string): { title: string; description: string; criteria: string[] } {
  const raw = idea.trim();
  if (!raw) return { title: '', description: '', criteria: [] };
  const lower = raw.toLowerCase();
  const roleMap: Record<string, string> = { admin: 'an administrator', manager: 'a manager', user: 'a user', customer: 'a customer', developer: 'a developer', guest: 'a guest user' };
  let role = 'a user';
  for (const [k, v] of Object.entries(roleMap)) { if (lower.includes(k)) { role = v; break; } }
  let benefit = 'I can accomplish my goal efficiently';
  if (lower.includes('login') || lower.includes('auth')) benefit = 'I can securely access my account';
  else if (lower.includes('search') || lower.includes('filter')) benefit = 'I can quickly find the information I need';
  else if (lower.includes('export') || lower.includes('download') || lower.includes('pdf')) benefit = 'I can share and use the data in other tools';
  else if (lower.includes('notif') || lower.includes('alert')) benefit = 'I am always informed of important events';
  else if (lower.includes('dashboard') || lower.includes('chart') || lower.includes('report')) benefit = 'I can make data-driven decisions quickly';
  else if (lower.includes('delete') || lower.includes('remove')) benefit = 'I can keep my workspace clean';
  else if (lower.includes('edit') || lower.includes('update')) benefit = 'I can keep information accurate';
  else if (lower.includes('payment') || lower.includes('billing')) benefit = 'I can complete purchases securely';
  const title = raw.charAt(0).toUpperCase() + raw.slice(1, 60);
  const description = `As ${role}, I want to ${raw.toLowerCase()}, so that ${benefit}.\n\n**Background:**\n[Provide relevant context here]\n\n**Notes:**\n[Add implementation notes, design links, or related resources]`;
  const criteria: string[] = [`Given I am logged in, when I perform the action, then the expected result is shown`];
  if (lower.includes('form') || lower.includes('input')) { criteria.push('Given I submit an empty form, then I see clear validation errors'); criteria.push('Given I submit a valid form, then I receive a success confirmation'); }
  if (lower.includes('search')) { criteria.push('Given I enter a search term, results appear within 1 second'); criteria.push('Given no results found, a helpful empty state is shown'); }
  if (lower.includes('delete') || lower.includes('remove')) { criteria.push('Given I trigger delete, a confirmation dialog appears'); criteria.push('Given I confirm, the item is removed and I see a success message'); }
  if (lower.includes('export') || lower.includes('download')) { criteria.push('Given I click Export, a file downloads with correct data'); }
  criteria.push('The feature is accessible (keyboard navigable, screen reader compatible)');
  criteria.push('The feature works on mobile, tablet, and desktop');
  return { title, description, criteria: criteria.slice(0, 6) };
}

// ─── AI Writer Panel ────────────────────────────────────────────────────────────

function AIWriterPanel({ onApply }: { onApply: (title: string, description: string, criteria: string[]) => void }) {
  const [idea, setIdea] = useState('');
  const [generated, setGenerated] = useState<{ title: string; description: string; criteria: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const handleGenerate = () => {
    if (!idea.trim()) return;
    setLoading(true);
    setTimeout(() => { setGenerated(generateStory(idea)); setLoading(false); }, 600);
  };
  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Wand2 size={14} className="text-purple-600" />
        <span className="text-sm font-semibold text-purple-800">AI Story Writer</span>
        <span className="text-xs text-purple-400 ml-auto">Describe in plain English</span>
      </div>
      <div className="flex gap-2">
        <textarea className="flex-1 px-3 py-2 border border-purple-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none bg-white" rows={2} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder='e.g. "user can reset password via email" or "export sprint report to PDF"' onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }} />
        <button onClick={handleGenerate} disabled={!idea.trim() || loading} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-40 flex items-center gap-1.5 self-start">
          {loading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={13} />}
          {loading ? '…' : 'Generate'}
        </button>
      </div>
      {generated && (
        <div className="space-y-3 border-t border-purple-200 pt-3">
          <div><p className="text-xs font-medium text-slate-500 mb-1">Title</p><p className="text-sm font-semibold bg-white rounded-lg px-3 py-2 border border-purple-100">{generated.title}</p></div>
          <div><p className="text-xs font-medium text-slate-500 mb-1">Description</p><p className="text-xs text-slate-700 bg-white rounded-lg px-3 py-2 border border-purple-100 whitespace-pre-wrap leading-relaxed">{generated.description}</p></div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Acceptance Criteria ({generated.criteria.length})</p>
            <ul className="space-y-1">{generated.criteria.map((c, i) => <li key={i} className="flex gap-2 text-xs"><span className="text-purple-400 font-bold">{i + 1}.</span><span className="bg-white rounded px-2 py-1 border border-purple-100 flex-1">{c}</span></li>)}</ul>
          </div>
          <button onClick={() => onApply(generated.title, generated.description, generated.criteria)} className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center justify-center gap-2"><Plus size={13} /> Apply to Form</button>
        </div>
      )}
    </div>
  );
}

// ─── Tag Input ──────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-surface-border rounded-lg bg-white min-h-[38px]">
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium">
          {t}<button onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-red-500"><X size={10} /></button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[120px] text-xs outline-none bg-transparent placeholder-slate-400"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        placeholder={tags.length === 0 ? (placeholder ?? 'Add tag, press Enter') : '+ add'}
      />
    </div>
  );
}

// ─── Comments Panel ─────────────────────────────────────────────────────────────

function CommentsPanel({ storyId, memberId }: { storyId: string; memberId: string }) {
  const comments = useStoryComments(storyId);
  const { members, addComment, deleteComment } = useScrumStore();
  const [body, setBody] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState(memberId);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addComment({ storyId, authorId: selectedAuthor, body: body.trim() });
    setBody('');
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-8"><MessageSquare size={28} className="text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No comments yet.</p></div>
        ) : comments.map((c) => {
          const author = members.find((m) => m.id === c.authorId);
          return (
            <div key={c.id} className="flex gap-3">
              {author && <Avatar initials={author.avatarInitials} color={author.avatarColor} size="sm" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-700">{author?.name ?? 'Unknown'}</span>
                  <span className="text-xs text-slate-400">{format(parseISO(c.createdAt), 'MMM d, h:mm a')}</span>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-700 leading-relaxed group relative">
                  {c.body}
                  <button onClick={() => deleteComment(c.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500"><X size={11} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-surface-border pt-3">
        <div className="flex gap-2 mb-2">
          <select className="border border-surface-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" value={selectedAuthor} onChange={(e) => setSelectedAuthor(e.target.value)}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <textarea className="flex-1 border border-surface-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment..." onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }} />
          <button type="submit" disabled={!body.trim()} className="self-end px-3 py-2 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 disabled:opacity-40 flex items-center gap-1.5"><Send size={12} /> Post</button>
        </div>
      </form>
    </div>
  );
}

// ─── Dependencies Panel ─────────────────────────────────────────────────────────

function DependenciesPanel({ storyId }: { storyId: string }) {
  const deps = useStoryDependencies(storyId);
  const { stories, addDependency, deleteDependency } = useScrumStore();
  const [depType, setDepType] = useState<DependencyType>('blocked_by');
  const [targetStoryId, setTargetStoryId] = useState('');
  const [note, setNote] = useState('');
  const otherStories = stories.filter((s) => s.id !== storyId);
  const DEP_COLORS: Record<DependencyType, string> = { blocked_by: 'text-orange-600 bg-orange-50', blocks: 'text-red-600 bg-red-50', relates_to: 'text-blue-600 bg-blue-50', duplicates: 'text-slate-600 bg-slate-100' };
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStoryId) return;
    addDependency({ fromStoryId: storyId, toStoryId: targetStoryId, type: depType, description: note || undefined });
    setTargetStoryId(''); setNote('');
  };
  return (
    <div className="space-y-4">
      {deps.length === 0 ? <div className="text-center py-6"><GitBranch size={24} className="text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No dependencies linked.</p></div> : (
        <div className="space-y-2">{deps.map((d) => (
          <div key={d.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DEP_COLORS[d.type]}`}>{d.direction === 'from' ? DEP_TYPE_OPTIONS.find(o => o.value === d.type)?.label : `← ${d.type.replace('_', ' ')}`}</span>
            <span className="text-xs text-slate-700 flex-1 truncate">{d.otherStory?.title ?? 'Unknown'}</span>
            <button onClick={() => deleteDependency(d.id)} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
          </div>
        ))}</div>
      )}
      <form onSubmit={handleAdd} className="border-t border-surface-border pt-3 space-y-2">
        <p className="text-xs font-medium text-slate-600">Add Dependency</p>
        <div className="grid grid-cols-2 gap-2">
          <select className="border border-surface-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" value={depType} onChange={(e) => setDepType(e.target.value as DependencyType)}>
            {DEP_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="border border-surface-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" value={targetStoryId} onChange={(e) => setTargetStoryId(e.target.value)} required>
            <option value="">Select story...</option>
            {otherStories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <input className="w-full border border-surface-border rounded-lg px-2 py-1.5 text-xs" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
        <button type="submit" disabled={!targetStoryId} className="w-full py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 disabled:opacity-40">Link Dependency</button>
      </form>
    </div>
  );
}

// ─── Activity Log Panel ─────────────────────────────────────────────────────────

function ActivityLogPanel({ storyId }: { storyId: string }) {
  const { activityLog, members } = useScrumStore();
  const entries = (activityLog ?? []).filter((e) => e.storyId === storyId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {entries.length === 0 ? (
        <div className="text-center py-10">
          <Clock size={28} className="text-slate-200 mx-auto mb-2" />
          <p className="text-xs text-slate-400">No activity recorded yet. Changes to this story will appear here.</p>
        </div>
      ) : entries.map((entry) => {
        const author = members.find(m => m.id === entry.authorId);
        return (
          <div key={entry.id} className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-brand-600">{author?.avatarInitials ?? '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700">
                <span className="font-medium">{author?.name ?? 'System'}</span>
                {' '}<span className="text-slate-500">{entry.action}</span>
                {entry.oldValue && entry.newValue && (
                  <span className="text-slate-400"> (<span className="line-through">{entry.oldValue}</span> → <span className="text-brand-600 font-medium">{entry.newValue}</span>)</span>
                )}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{format(parseISO(entry.timestamp), 'MMM d, yyyy h:mm a')}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Modal Props ───────────────────────────────────────────────────────────

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  story?: Story | null;
  defaultSprintId?: string;
  defaultStatus?: StoryStatus;
}

type Tab = 'details' | 'description' | 'dev' | 'release' | 'context' | 'quality' | 'comments' | 'dependencies' | 'activity' | 'attachments';

// ─── Main Modal ─────────────────────────────────────────────────────────────────

export function StoryModal({ isOpen, onClose, story, defaultSprintId, defaultStatus = 'backlog' }: StoryModalProps) {
  const { epics, sprints, members, addStory, updateStory, deleteStory, stories, settings } = useScrumStore();
  const integrations = settings.integrations;

  const [tab, setTab] = useState<Tab>('details');

  // ── Overview fields ──────────────────────────────────────────────────────────
  const [storyType, setStoryType] = useState<StoryType>('story');
  const [title, setTitle] = useState('');
  const [epicId, setEpicId] = useState('');
  const [sprintId, setSprintId] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [reporterId, setReporterId] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [severity, setSeverity] = useState<StorySeverity | ''>('');
  const [storyPoints, setStoryPoints] = useState(3);
  const [businessValue, setBusinessValue] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<StoryStatus>(defaultStatus);

  // ── Description fields ───────────────────────────────────────────────────────
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<string[]>(['']);
  const [newCriterion, setNewCriterion] = useState('');
  const [testNotes, setTestNotes] = useState('');
  const [showWriter, setShowWriter] = useState(false);

  // ── Dev & Deploy fields ──────────────────────────────────────────────────────
  const [branchName, setBranchName] = useState('');
  const [pullRequestUrl, setPullRequestUrl] = useState('');
  const [deployedTo, setDeployedTo] = useState<string[]>([]);
  const [externalLinks, setExternalLinks] = useState<ExtLink[]>([]);
  const [newLinkType, setNewLinkType] = useState<ExtLink['type']>('github_pr');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [copiedBranch, setCopiedBranch] = useState(false);

  // ── Release fields ───────────────────────────────────────────────────────────
  const [tags, setTags] = useState<string[]>([]);
  const [components, setComponents] = useState<string[]>([]);
  const [environment, setEnvironment] = useState('');
  const [fixVersion, setFixVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [timeEstimateMins, setTimeEstimateMins] = useState<number | ''>('');
  const [timeSpentMins, setTimeSpentMins] = useState<number | ''>('');

  // ── Advanced / Context fields ─────────────────────────────────────────────────
  const [watchers, setWatchers] = useState<string[]>([]);
  const [definitionOfDone, setDefinitionOfDone] = useState<import('../../types').DefinitionOfDoneItem[]>([]);
  const [qaStatus, setQaStatus] = useState<import('../../types').QAStatus>('not_started');
  const [approvalStatus, setApprovalStatus] = useState<import('../../types').ApprovalStatus | ''>('');
  const [stakeholderIds, setStakeholderIds] = useState<string[]>([]);
  const [customerImpact, setCustomerImpact] = useState<import('../../types').CustomerImpact | ''>('');
  const [revenueImpact, setRevenueImpact] = useState<number | ''>('');
  const [okrLink, setOkrLink] = useState('');
  const [persona, setPersona] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [successMetrics, setSuccessMetrics] = useState<string[]>([]);
  const [effortConfidenceScore, setEffortConfidenceScore] = useState<number | ''>('');
  const [dependencyRiskLevel, setDependencyRiskLevel] = useState<import('../../types').DependencyRiskLevel | ''>('');
  const [blockerFlag, setBlockerFlag] = useState(false);
  const [crossTeamDependency, setCrossTeamDependency] = useState(false);
  const [buildStatus, setBuildStatus] = useState<import('../../types').BuildStatus | ''>('');
  const [featureFlagStatus, setFeatureFlagStatus] = useState('');
  const [resolution, setResolution] = useState<import('../../types').StoryResolution | ''>('');
  const [newDodItem, setNewDodItem] = useState('');
  const [attachments, setAttachments] = useState<import('../../types').StoryAttachment[]>([]);
  const [newLinkAttachUrl, setNewLinkAttachUrl] = useState('');
  const [newLinkAttachTitle, setNewLinkAttachTitle] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const isEdit = !!story;
  const storyComments = useStoryComments(story?.id ?? '');
  const storyDeps = useStoryDependencies(story?.id ?? '');
  const defaultMemberId = members[0]?.id ?? '';

  // Auto-suggest branch name
  const suggestedBranch = title
    ? `feature/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`
    : '';

  useEffect(() => {
    setTab('details');
    setShowWriter(false);
    if (story) {
      setStoryType(story.storyType ?? 'story');
      setTitle(story.title);
      setDescription(story.description);
      setEpicId(story.epicId);
      setSprintId(story.sprintId ?? '');
      setStoryPoints(story.storyPoints);
      setPriority(story.priority);
      setSeverity(story.severity ?? '');
      setStatus(story.status);
      setAssigneeId(story.assigneeId ?? '');
      setReporterId(story.reporterId ?? '');
      setBusinessValue(story.businessValue ?? '');
      setDueDate(story.dueDate ?? '');
      setCriteria(story.acceptanceCriteria.length ? story.acceptanceCriteria : ['']);
      setTestNotes(story.testNotes ?? '');
      setBranchName(story.branchName ?? '');
      setPullRequestUrl(story.pullRequestUrl ?? '');
      setDeployedTo(story.deployedTo ?? []);
      setExternalLinks(story.externalLinks ?? []);
      setTags(story.tags ?? []);
      setComponents(story.components ?? []);
      setEnvironment(story.environment ?? '');
      setFixVersion(story.fixVersion ?? '');
      setReleaseNotes(story.releaseNotes ?? '');
      setTimeEstimateMins(story.timeEstimateMins ?? '');
      setTimeSpentMins(story.timeSpentMins ?? '');
      // Advanced fields
      setWatchers(story.watchers ?? []);
      setDefinitionOfDone(story.definitionOfDone ?? []);
      setQaStatus(story.qaStatus ?? 'not_started');
      setApprovalStatus(story.approvalStatus ?? '');
      setStakeholderIds(story.stakeholderIds ?? []);
      setCustomerImpact(story.customerImpact ?? '');
      setRevenueImpact(story.revenueImpact ?? '');
      setOkrLink(story.okrLink ?? '');
      setPersona(story.persona ?? '');
      setProblemStatement(story.problemStatement ?? '');
      setSuccessMetrics(story.successMetrics ?? []);
      setEffortConfidenceScore(story.effortConfidenceScore ?? '');
      setDependencyRiskLevel(story.dependencyRiskLevel ?? '');
      setBlockerFlag(story.blockerFlag ?? false);
      setCrossTeamDependency(story.crossTeamDependency ?? false);
      setBuildStatus(story.buildStatus ?? '');
      setFeatureFlagStatus(story.featureFlagStatus ?? '');
      setResolution(story.resolution ?? '');
      setAttachments(story.attachments ?? []);
    } else {
      setStoryType('story');
      setTitle('');
      setDescription('');
      setEpicId(epics[0]?.id ?? '');
      setSprintId(defaultSprintId ?? '');
      setStoryPoints(3);
      setPriority('medium');
      setSeverity('');
      setStatus(defaultStatus);
      setAssigneeId('');
      setReporterId('');
      setBusinessValue('');
      setDueDate('');
      setCriteria(['']);
      setTestNotes('');
      setBranchName('');
      setPullRequestUrl('');
      setDeployedTo([]);
      setExternalLinks([]);
      setTags([]);
      setComponents([]);
      setEnvironment('');
      setFixVersion('');
      setReleaseNotes('');
      setTimeEstimateMins('');
      setTimeSpentMins('');
      // Advanced fields reset
      setWatchers([]);
      setDefinitionOfDone([]);
      setQaStatus('not_started');
      setApprovalStatus('');
      setStakeholderIds([]);
      setCustomerImpact('');
      setRevenueImpact('');
      setOkrLink('');
      setPersona('');
      setProblemStatement('');
      setSuccessMetrics([]);
      setEffortConfidenceScore('');
      setDependencyRiskLevel('');
      setBlockerFlag(false);
      setCrossTeamDependency(false);
      setBuildStatus('');
      setFeatureFlagStatus('');
      setResolution('');
      setAttachments([]);
    }
    setNewCriterion('');
    setNewLinkAttachUrl('');
    setNewLinkAttachTitle('');
    setNewSubtaskTitle('');
  }, [story, isOpen, defaultSprintId, defaultStatus, epics]);

  const collectStory = () => ({
    title: title.trim(),
    description,
    epicId,
    sprintId: sprintId || undefined,
    storyPoints,
    priority,
    status,
    assigneeId: assigneeId || undefined,
    acceptanceCriteria: criteria.filter(c => c.trim()),
    labels: tags,
    storyType,
    severity: severity || undefined,
    tags,
    components,
    reporterId: reporterId || undefined,
    dueDate: dueDate || undefined,
    businessValue: businessValue !== '' ? Number(businessValue) : undefined,
    environment: environment || undefined,
    fixVersion: fixVersion || undefined,
    releaseNotes: releaseNotes || undefined,
    timeEstimateMins: timeEstimateMins !== '' ? Number(timeEstimateMins) : undefined,
    timeSpentMins: timeSpentMins !== '' ? Number(timeSpentMins) : undefined,
    testNotes: testNotes || undefined,
    branchName: branchName || undefined,
    pullRequestUrl: pullRequestUrl || undefined,
    deployedTo,
    externalLinks,
    // Advanced fields
    watchers,
    subtaskIds: story?.subtaskIds ?? [],
    parentId: story?.parentId,
    definitionOfDone,
    qaStatus,
    approvalStatus: approvalStatus || undefined,
    stakeholderIds,
    customerImpact: customerImpact || undefined,
    revenueImpact: revenueImpact !== '' ? Number(revenueImpact) : undefined,
    okrLink: okrLink || undefined,
    persona: persona || undefined,
    problemStatement: problemStatement || undefined,
    successMetrics,
    riskScore: story?.riskScore,
    effortConfidenceScore: effortConfidenceScore !== '' ? Number(effortConfidenceScore) : undefined,
    dependencyRiskLevel: dependencyRiskLevel || undefined,
    blockerFlag,
    crossTeamDependency,
    buildStatus: buildStatus || undefined,
    featureFlagStatus: featureFlagStatus || undefined,
    resolution: resolution || undefined,
    attachments,
  });

  const handleSave = () => {
    if (!title.trim()) return;
    const data = collectStory();
    const maxOrder = Math.max(0, ...stories.map(s => s.order)) + 1;
    if (isEdit && story) {
      updateStory(story.id, { ...data, completedAt: data.status === 'done' && !story.completedAt ? getTodayISO() : story.completedAt });
    } else {
      addStory({ ...data, order: maxOrder });
    }
    onClose();
  };

  const handleDelete = () => {
    if (story && window.confirm('Delete this story? This cannot be undone.')) { deleteStory(story.id); onClose(); }
  };

  const applyTemplate = (tpl: typeof STORY_TEMPLATES[0]) => {
    if (!title) setTitle(tpl.titlePrefix);
    setStoryType(tpl.storyType);
    setDescription(tpl.descTemplate);
    setCriteria(tpl.criteriaTemplate);
    setPriority(tpl.priority);
    setStoryPoints(tpl.points);
  };

  const applyGenerated = (genTitle: string, genDesc: string, genCriteria: string[]) => {
    setTitle(genTitle);
    setDescription(genDesc);
    setCriteria(genCriteria);
    setShowWriter(false);
  };

  const addCriterion = () => {
    if (newCriterion.trim()) { setCriteria([...criteria, newCriterion.trim()]); setNewCriterion(''); }
  };

  const addExternalLink = () => {
    if (!newLinkUrl.trim()) return;
    setExternalLinks([...externalLinks, { id: generateId(), type: newLinkType, url: newLinkUrl.trim(), title: newLinkTitle.trim() || newLinkUrl.trim() }]);
    setNewLinkUrl(''); setNewLinkTitle('');
  };

  const toggleDeploy = (env: string) => {
    setDeployedTo(prev => prev.includes(env) ? prev.filter(e => e !== env) : [...prev, env]);
  };

  const triggerDeploy = async (envKey: 'devDeploy' | 'stagingDeploy' | 'prodDeploy', envName: string) => {
    const cfg = integrations?.[envKey];
    if (!cfg?.hookUrl) { alert(`No deploy hook configured for ${envName}. Add it in Settings → Integrations.`); return; }
    try {
      await fetch(cfg.hookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ story: title, branch: branchName || suggestedBranch, env: envName }) });
      toggleDeploy(envName);
      alert(`Deploy triggered for ${envName}!`);
    } catch { alert(`Deploy failed for ${envName}. Check the hook URL.`); }
  };

  const copyBranch = () => {
    navigator.clipboard.writeText(branchName || suggestedBranch);
    setCopiedBranch(true);
    setTimeout(() => setCopiedBranch(false), 2000);
  };

  const openGitHubBranch = () => {
    if (integrations?.github?.repoOwner && integrations.github.repoName) {
      window.open(`https://github.com/${integrations.github.repoOwner}/${integrations.github.repoName}/tree/${branchName || suggestedBranch}`, '_blank');
    } else {
      window.open(`https://github.com/new?name=${encodeURIComponent(branchName || suggestedBranch)}`, '_blank');
    }
  };

  const activeSprints = sprints.filter(sp => sp.status !== 'completed');
  const subtasks = story ? stories.filter(s => s.parentId === story.id) : [];
  const subtasksDone = subtasks.filter(s => s.status === 'done').length;

  const addSubtask = () => {
    if (!newSubtaskTitle.trim() || !story) return;
    const maxOrder = Math.max(0, ...stories.map(s => s.order)) + 1;
    addStory({
      title: newSubtaskTitle.trim(),
      description: '',
      epicId: epicId,
      sprintId: sprintId || undefined,
      storyPoints: 1,
      priority: 'medium',
      status: 'backlog',
      labels: [],
      storyType: 'task',
      tags: [],
      components: [],
      deployedTo: [],
      externalLinks: [],
      watchers: [],
      subtaskIds: [],
      parentId: story.id,
      definitionOfDone: [],
      qaStatus: 'not_started',
      stakeholderIds: [],
      successMetrics: [],
      blockerFlag: false,
      crossTeamDependency: false,
      attachments: [],
      acceptanceCriteria: [],
      order: maxOrder,
    });
    setNewSubtaskTitle('');
  };

  const addFileAttachment = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const attachment: import('../../types').StoryAttachment = {
        id: generateId(),
        name: file.name,
        url,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };
      setAttachments(prev => [...prev, attachment]);
    };
    reader.readAsDataURL(file);
  };

  const addLinkAttachment = () => {
    if (!newLinkAttachUrl.trim()) return;
    const attachment: import('../../types').StoryAttachment = {
      id: generateId(),
      name: newLinkAttachTitle.trim() || newLinkAttachUrl.trim(),
      url: newLinkAttachUrl.trim(),
      type: 'link',
      uploadedAt: new Date().toISOString(),
    };
    setAttachments(prev => [...prev, attachment]);
    setNewLinkAttachUrl('');
    setNewLinkAttachTitle('');
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'details', label: 'Details' },
    { id: 'description', label: 'Description' },
    { id: 'dev', label: 'Dev & Deploy' },
    { id: 'release', label: 'Release' },
    { id: 'context', label: 'Business Context' },
    { id: 'quality', label: 'Quality' },
    ...(isEdit ? [
      { id: 'attachments' as Tab, label: 'Attachments', count: attachments.length || undefined },
      { id: 'comments' as Tab, label: 'Comments', count: storyComments.length },
      { id: 'dependencies' as Tab, label: 'Dependencies', count: storyDeps.length },
      { id: 'activity' as Tab, label: 'Activity' },
    ] : []),
  ];

  const inputCls = 'w-full px-3 py-2 border border-surface-border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500';
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? `Edit: ${story?.title?.slice(0, 40) ?? ''}` : 'Create Story'} size="lg">
      {/* Tabs */}
      <div className="flex border-b border-surface-border mb-5 -mt-1 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${tab === t.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
            {t.count !== undefined && t.count > 0 && <span className="bg-brand-100 text-brand-600 text-xs px-1.5 py-0.5 rounded-full font-semibold">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── DETAILS TAB ───────────────────────────────────────────────────────── */}
      {tab === 'details' && (
        <div className="space-y-5">
          {/* Story Type selector */}
          <div>
            <label className={labelCls}>Story Type</label>
            <div className="flex flex-wrap gap-2">
              {STORY_TYPE_OPTIONS.map(t => (
                <button key={t.value} onClick={() => setStoryType(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${storyType === t.value ? t.color + ' ring-2 ring-offset-1 ring-brand-400' : 'bg-white border-surface-border text-slate-500 hover:border-brand-300'}`}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={labelCls}>Title <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter story title..." className={inputCls} />
          </div>

          {/* Quick Templates (create only) */}
          {!isEdit && (
            <div>
              <label className={labelCls}>Quick Templates</label>
              <div className="flex flex-wrap gap-2">
                {STORY_TEMPLATES.map(tpl => (
                  <button key={tpl.id} onClick={() => applyTemplate(tpl)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${tpl.color}`}>
                    {tpl.icon} {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Epic + Sprint */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Epic</label>
              <select value={epicId} onChange={(e) => setEpicId(e.target.value)} className={inputCls}>
                <option value="">No epic</option>
                {epics.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Sprint</label>
              <select value={sprintId} onChange={(e) => setSprintId(e.target.value)} className={inputCls}>
                <option value="">Backlog</option>
                {activeSprints.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
              </select>
            </div>
          </div>

          {/* Assignee + Reporter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Assignee</label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={inputCls}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Reporter</label>
              <select value={reporterId} onChange={(e) => setReporterId(e.target.value)} className={inputCls}>
                <option value="">None</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Priority + Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputCls}>
                {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Severity <span className="text-slate-400">(bugs)</span></label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value as StorySeverity | '')} className={inputCls}>
                <option value="">Not set</option>
                {severityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Status + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as StoryStatus)} className={inputCls}>
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Business Value */}
          <div>
            <label className={labelCls}>Business Value (1–10) {businessValue !== '' && <span className="text-brand-600 font-bold ml-1">{businessValue}</span>}</label>
            <input type="range" min={1} max={10} value={businessValue !== '' ? businessValue : 5} onChange={(e) => setBusinessValue(Number(e.target.value))} className="w-full accent-brand-500" />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>Low</span><span>High</span></div>
          </div>

          {/* Story Points */}
          <div>
            <label className={labelCls}>Story Points</label>
            <div className="flex gap-2 flex-wrap">
              {FIBONACCI.map(pt => (
                <button key={pt} type="button" onClick={() => setStoryPoints(pt)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold border-2 transition-colors ${storyPoints === pt ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-surface-border text-slate-600 hover:border-brand-300'}`}>
                  {pt}
                </button>
              ))}
            </div>
          </div>

          {/* Attachments (inline in Details tab) */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5"><Paperclip size={12} /> Attachments</span>
            </label>
            {/* Existing attachments */}
            {attachments.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {attachments.map(att => {
                  const isImg = att.type.startsWith('image/');
                  const isLink = att.type === 'link';
                  const sizeKB = att.size ? Math.round(att.size / 1024) : null;
                  return (
                    <div key={att.id} className="flex items-center gap-2 bg-slate-50 border border-surface-border rounded-lg px-3 py-2 group">
                      {isImg ? <Image size={13} className="text-brand-500 flex-shrink-0" /> : isLink ? <Globe size={13} className="text-blue-500 flex-shrink-0" /> : <FileIcon size={13} className="text-slate-400 flex-shrink-0" />}
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs text-slate-700 hover:text-brand-600 truncate">{att.name}</a>
                      {sizeKB && <span className="text-xs text-slate-400">{sizeKB}KB</span>}
                      <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 flex-shrink-0"><X size={12} /></button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Upload row */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => document.getElementById('details-file-input')?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
              >
                <Paperclip size={12} /> Upload file
              </button>
              <input
                id="details-file-input"
                type="file"
                multiple
                className="hidden"
                onChange={e => { Array.from(e.target.files ?? []).forEach(addFileAttachment); e.target.value = ''; }}
              />
              <div className="flex gap-1.5 flex-1">
                <input
                  value={newLinkAttachUrl}
                  onChange={e => setNewLinkAttachUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addLinkAttachment(); }}
                  placeholder="Or paste a URL..."
                  className="flex-1 px-2.5 py-1.5 border border-surface-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {newLinkAttachUrl.trim() && (
                  <button onClick={addLinkAttachment} className="px-2.5 py-1.5 bg-brand-500 text-white rounded-lg text-xs hover:bg-brand-600 flex items-center gap-1"><Plus size={11} /> Add</button>
                )}
              </div>
            </div>
          </div>

          {/* Subtasks */}
          {isEdit && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls}>
                  <span className="flex items-center gap-1.5"><CheckSquare size={12} /> Subtasks</span>
                </label>
                <span className="text-xs text-slate-400">{subtasksDone}/{subtasks.length} done</span>
              </div>
              {subtasks.length > 0 && (
                <>
                  <div className="h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: subtasks.length ? `${(subtasksDone / subtasks.length) * 100}%` : '0%' }} />
                  </div>
                  <div className="space-y-1.5 mb-2">
                    {subtasks.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2 group p-1.5 rounded-lg hover:bg-slate-50">
                        <button onClick={() => updateStory(sub.id, { status: sub.status === 'done' ? 'todo' : 'done' })} className="text-slate-400 hover:text-brand-500 flex-shrink-0">
                          {sub.status === 'done' ? <CheckSquare size={14} className="text-green-500" /> : <Square size={14} />}
                        </button>
                        <span className={`flex-1 text-xs truncate ${sub.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{sub.title}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${sub.status === 'done' ? 'bg-green-100 text-green-700' : sub.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{sub.status.replace('_', ' ')}</span>
                        <button onClick={() => deleteStory(sub.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><X size={11} /></button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <input value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addSubtask(); }} placeholder="Add subtask, press Enter..." className="flex-1 px-3 py-1.5 border border-surface-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <button onClick={addSubtask} disabled={!newSubtaskTitle.trim()} className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 disabled:opacity-40 flex items-center gap-1"><Plus size={12} /> Add</button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-surface-border">
            <div>{isEdit && <Button variant="danger" size="sm" onClick={handleDelete}><Trash2 size={14} /> Delete</Button>}</div>
            <div className="flex gap-3">
              <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleSave} disabled={!title.trim()}>{isEdit ? 'Save Changes' : 'Create Story'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── DESCRIPTION TAB ───────────────────────────────────────────────────── */}
      {tab === 'description' && (
        <div className="space-y-5">
          {/* AI Writer */}
          <button onClick={() => setShowWriter(v => !v)} className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium transition-colors">
            <Wand2 size={14} /><span>AI Story Writer — describe your idea, generate the full story</span>
            <span className="ml-auto">{showWriter ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
          </button>
          {showWriter && <AIWriterPanel onApply={applyGenerated} />}

          {/* Quick templates */}
          {!isEdit && (
            <div>
              <label className={labelCls}>Quick Templates</label>
              <div className="flex flex-wrap gap-2">
                {STORY_TEMPLATES.map(tpl => (
                  <button key={tpl.id} onClick={() => applyTemplate(tpl)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${tpl.color}`}>{tpl.icon} {tpl.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Description</label>
              {!description && <button onClick={() => setDescription('As a [user role], I want to [action], so that [benefit].')} className="text-xs text-brand-500 hover:text-brand-700 font-medium">+ User story format</button>}
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder={'As a [user role], I want to [goal], so that [benefit].\n\nOr describe what needs to be done...'} className={inputCls + ' resize-none'} />
          </div>

          {/* Acceptance Criteria */}
          <div>
            <label className={labelCls}>Acceptance Criteria</label>
            <div className="space-y-2 mb-2">
              {criteria.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs w-4 text-right">{idx + 1}.</span>
                  <input type="text" value={c} onChange={(e) => { const u = [...criteria]; u[idx] = e.target.value; setCriteria(u); }} placeholder="Criterion..." className="flex-1 px-3 py-1.5 border border-surface-border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <button onClick={() => setCriteria(criteria.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newCriterion} onChange={(e) => setNewCriterion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCriterion()} placeholder="Add criterion, press Enter..." className="flex-1 px-3 py-1.5 border border-surface-border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <Button variant="secondary" size="sm" onClick={addCriterion}><Plus size={14} /> Add</Button>
            </div>
          </div>

          {/* Test Notes */}
          <div>
            <label className={labelCls}>Test Notes / QA Plan</label>
            <textarea value={testNotes} onChange={(e) => setTestNotes(e.target.value)} rows={3} placeholder="Describe test cases, QA notes, or test plan link..." className={inputCls + ' resize-none'} />
          </div>

          <div className="flex justify-end pt-2 border-t border-surface-border">
            <div className="flex gap-3">
              <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleSave} disabled={!title.trim()}>{isEdit ? 'Save Changes' : 'Create Story'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── DEV & DEPLOY TAB ─────────────────────────────────────────────────── */}
      {tab === 'dev' && (
        <div className="space-y-5">
          {/* GitHub Branch */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5"><Code2 size={12} /> Branch Name</span>
            </label>
            <div className="flex gap-2">
              <input value={branchName || suggestedBranch} onChange={(e) => setBranchName(e.target.value)} placeholder={suggestedBranch || 'feature/my-branch'} className={inputCls} />
              <button onClick={copyBranch} title="Copy" className="px-3 py-2 border border-surface-border rounded-lg text-slate-500 hover:bg-slate-50 flex items-center gap-1 text-xs">
                {copiedBranch ? <CheckCheck size={13} className="text-green-500" /> : <Copy size={13} />}
              </button>
              <button onClick={openGitHubBranch} title="Open on GitHub" className="px-3 py-2 border border-surface-border rounded-lg text-slate-500 hover:bg-slate-50">
                <ExternalLink size={13} />
              </button>
            </div>
            {integrations?.github?.repoOwner && integrations.github.repoName && (
              <p className="text-xs text-slate-400 mt-1">Repo: {integrations.github.repoOwner}/{integrations.github.repoName}</p>
            )}
          </div>

          {/* Pull Request URL */}
          <div>
            <label className={labelCls}><span className="flex items-center gap-1.5"><GitBranch size={12} /> Pull Request URL</span></label>
            <div className="flex gap-2">
              <input value={pullRequestUrl} onChange={(e) => setPullRequestUrl(e.target.value)} placeholder="https://github.com/org/repo/pull/123" className={inputCls} />
              {pullRequestUrl && (
                <a href={pullRequestUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-surface-border rounded-lg text-slate-500 hover:bg-slate-50 flex items-center">
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>

          {/* Deploy to Environment */}
          <div>
            <label className={labelCls}><span className="flex items-center gap-1.5"><Rocket size={12} /> Deploy to Environment</span></label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'devDeploy' as const, label: 'Dev', color: 'bg-blue-500 hover:bg-blue-600', deployedColor: 'bg-blue-100 border-blue-300 text-blue-700' },
                { key: 'stagingDeploy' as const, label: 'Staging', color: 'bg-amber-500 hover:bg-amber-600', deployedColor: 'bg-amber-100 border-amber-300 text-amber-700' },
                { key: 'prodDeploy' as const, label: 'Production', color: 'bg-red-500 hover:bg-red-600', deployedColor: 'bg-red-100 border-red-300 text-red-700' },
              ]).map(({ key, label, color, deployedColor }) => {
                const isDeployed = deployedTo.includes(label);
                return (
                  <div key={key} className={`rounded-xl border p-3 text-center ${isDeployed ? deployedColor : 'border-surface-border bg-white'}`}>
                    <p className={`text-xs font-semibold mb-2 ${isDeployed ? '' : 'text-slate-600'}`}>{label}</p>
                    {isDeployed
                      ? <div className="flex flex-col gap-1.5">
                          <span className="text-xs flex items-center justify-center gap-1"><CheckCheck size={11} /> Deployed</span>
                          <button onClick={() => toggleDeploy(label)} className="text-xs underline opacity-60 hover:opacity-100">Undo</button>
                        </div>
                      : <button onClick={() => triggerDeploy(key, label)} className={`w-full py-1.5 rounded-lg text-white text-xs font-medium flex items-center justify-center gap-1 ${color}`}>
                          <Rocket size={11} /> Deploy
                        </button>
                    }
                  </div>
                );
              })}
            </div>
            {(!integrations?.devDeploy?.hookUrl && !integrations?.stagingDeploy?.hookUrl) && (
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><AlertCircle size={11} /> Configure deploy webhooks in Settings → Integrations to trigger real deploys.</p>
            )}
          </div>

          {/* External Links */}
          <div>
            <label className={labelCls}><span className="flex items-center gap-1.5"><Link size={12} /> External Links</span></label>
            {externalLinks.length > 0 && (
              <div className="space-y-2 mb-3">
                {externalLinks.map(link => {
                  const linkType = LINK_TYPE_OPTIONS.find(l => l.value === link.type);
                  return (
                    <div key={link.id} className="flex items-center gap-2 bg-slate-50 border border-surface-border rounded-lg px-3 py-2">
                      <span className="text-slate-500">{linkType?.icon}</span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline flex-1 truncate">{link.title}</a>
                      <span className="text-xs text-slate-400">{linkType?.label}</span>
                      <button onClick={() => setExternalLinks(externalLinks.filter(l => l.id !== link.id))} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="space-y-2 bg-slate-50 rounded-xl p-3 border border-surface-border">
              <div className="grid grid-cols-2 gap-2">
                <select value={newLinkType} onChange={(e) => setNewLinkType(e.target.value as ExtLink['type'])} className="border border-surface-border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {LINK_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} placeholder="Label (optional)" className="border border-surface-border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex gap-2">
                <input value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addExternalLink()} placeholder="https://..." className="flex-1 border border-surface-border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <button onClick={addExternalLink} disabled={!newLinkUrl.trim()} className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 disabled:opacity-40 flex items-center gap-1"><Plus size={12} /> Add</button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-surface-border">
            <div className="flex gap-3">
              <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleSave} disabled={!title.trim()}>{isEdit ? 'Save Changes' : 'Create Story'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── RELEASE TAB ──────────────────────────────────────────────────────── */}
      {tab === 'release' && (
        <div className="space-y-5">
          {/* Tags */}
          <div>
            <label className={labelCls}><span className="flex items-center gap-1.5"><Tag size={12} /> Tags / Labels</span></label>
            <TagInput tags={tags} onChange={setTags} placeholder="Add tag, press Enter (e.g. ui, backend, api)" />
          </div>

          {/* Components */}
          <div>
            <label className={labelCls}><span className="flex items-center gap-1.5"><Layers size={12} /> Components</span></label>
            <TagInput tags={components} onChange={setComponents} placeholder="Add component (e.g. Auth, Dashboard, API)" />
          </div>

          {/* Environment + Fix Version */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Environment</label>
              <select value={environment} onChange={(e) => setEnvironment(e.target.value)} className={inputCls}>
                <option value="">Not specified</option>
                {ENV_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Fix Version / Release</label>
              <input value={fixVersion} onChange={(e) => setFixVersion(e.target.value)} placeholder="e.g. v2.4.0, Sprint 5 Release" className={inputCls} />
            </div>
          </div>

          {/* Time Estimate + Spent */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><Clock size={12} /> Time Estimate (hours)</span></label>
              <input type="number" min={0} step={0.5} value={timeEstimateMins !== '' ? timeEstimateMins / 60 : ''} onChange={(e) => setTimeEstimateMins(e.target.value ? Math.round(Number(e.target.value) * 60) : '')} placeholder="e.g. 4" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}><span className="flex items-center gap-1.5"><Clock size={12} /> Time Logged (hours)</span></label>
              <input type="number" min={0} step={0.5} value={timeSpentMins !== '' ? timeSpentMins / 60 : ''} onChange={(e) => setTimeSpentMins(e.target.value ? Math.round(Number(e.target.value) * 60) : '')} placeholder="e.g. 2.5" className={inputCls} />
            </div>
          </div>

          {/* Progress bar for time */}
          {timeEstimateMins !== '' && timeSpentMins !== '' && timeEstimateMins > 0 && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Time Progress</span>
                <span>{Math.round((Number(timeSpentMins) / Number(timeEstimateMins)) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${Number(timeSpentMins) > Number(timeEstimateMins) ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (Number(timeSpentMins) / Number(timeEstimateMins)) * 100)}%` }} />
              </div>
            </div>
          )}

          {/* Release Notes */}
          <div>
            <label className={labelCls}>Release Notes</label>
            <textarea value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)} rows={4} placeholder="What does this change do? What should users know? What changed in this release..." className={inputCls + ' resize-none'} />
          </div>

          <div className="flex justify-end pt-2 border-t border-surface-border">
            <div className="flex gap-3">
              <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleSave} disabled={!title.trim()}>{isEdit ? 'Save Changes' : 'Create Story'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTEXT TAB ──────────────────────────────────────────────────────── */}
      {tab === 'context' && (
        <div className="space-y-5">
          {/* Customer & Revenue Impact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Customer Impact</label>
              <select value={customerImpact} onChange={(e) => setCustomerImpact(e.target.value as import('../../types').CustomerImpact | '')} className={inputCls}>
                <option value="">Not set</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Revenue Impact ($)</label>
              <input type="number" min={0} value={revenueImpact} onChange={(e) => setRevenueImpact(e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 50000" className={inputCls} />
            </div>
          </div>

          {/* OKR Link */}
          <div>
            <label className={labelCls}>OKR / Objective Link</label>
            <input value={okrLink} onChange={(e) => setOkrLink(e.target.value)} placeholder="e.g. OKR-Q3-2: Improve user retention by 20%" className={inputCls} />
          </div>

          {/* Persona */}
          <div>
            <label className={labelCls}>User Persona</label>
            <input value={persona} onChange={(e) => setPersona(e.target.value)} placeholder="e.g. Marketing Manager, SMB Owner, Power User" className={inputCls} />
          </div>

          {/* Problem Statement */}
          <div>
            <label className={labelCls}>Problem Statement</label>
            <textarea value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} rows={3} placeholder="What specific problem does this story solve? Describe the user pain point..." className={inputCls + ' resize-none'} />
          </div>

          {/* Success Metrics */}
          <div>
            <label className={labelCls}>Success Metrics / KPIs</label>
            <TagInput tags={successMetrics} onChange={setSuccessMetrics} placeholder="Add metric (e.g. +10% CTR, reduce churn by 5%)" />
          </div>

          {/* Stakeholders */}
          <div>
            <label className={labelCls}>Stakeholders</label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button key={m.id} onClick={() => setStakeholderIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-colors ${stakeholderIds.includes(m.id) ? 'bg-brand-100 border-brand-300 text-brand-700' : 'bg-white border-surface-border text-slate-500 hover:border-brand-300'}`}>
                  {m.avatarInitials} {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Watchers */}
          <div>
            <label className={labelCls}>Watchers</label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button key={m.id} onClick={() => setWatchers(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-colors ${watchers.includes(m.id) ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-surface-border text-slate-500 hover:border-amber-300'}`}>
                  {m.avatarInitials} {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Effort Confidence */}
          <div>
            <label className={labelCls}>Effort Confidence Score {effortConfidenceScore !== '' && <span className="text-brand-600 font-bold ml-1">{effortConfidenceScore}%</span>}</label>
            <input type="range" min={0} max={100} step={5} value={effortConfidenceScore !== '' ? effortConfidenceScore : 50} onChange={(e) => setEffortConfidenceScore(Number(e.target.value))} className="w-full accent-brand-500" />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>Low confidence</span><span>High confidence</span></div>
          </div>

          <div className="flex justify-end pt-2 border-t border-surface-border">
            <div className="flex gap-3">
              <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleSave} disabled={!title.trim()}>{isEdit ? 'Save Changes' : 'Create Story'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUALITY TAB ───────────────────────────────────────────────────────── */}
      {tab === 'quality' && (
        <div className="space-y-5">
          {/* QA Status + Approval */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>QA Status</label>
              <select value={qaStatus} onChange={(e) => setQaStatus(e.target.value as import('../../types').QAStatus)} className={inputCls}>
                <option value="not_started">Not Started</option>
                <option value="in_qa">In QA</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Approval Status</label>
              <select value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value as import('../../types').ApprovalStatus | '')} className={inputCls}>
                <option value="">Not required</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Resolution + Build Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Resolution</label>
              <select value={resolution} onChange={(e) => setResolution(e.target.value as import('../../types').StoryResolution | '')} className={inputCls}>
                <option value="">Not resolved</option>
                <option value="done">Done</option>
                <option value="wont_fix">Won't Fix</option>
                <option value="duplicate">Duplicate</option>
                <option value="cannot_reproduce">Cannot Reproduce</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Build Status</label>
              <select value={buildStatus} onChange={(e) => setBuildStatus(e.target.value as import('../../types').BuildStatus | '')} className={inputCls}>
                <option value="">Unknown</option>
                <option value="passing">Passing</option>
                <option value="failing">Failing</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Flags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Flags</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={blockerFlag} onChange={(e) => setBlockerFlag(e.target.checked)} className="rounded border-slate-300 text-red-500 focus:ring-red-400" />
                  <span className="text-sm text-slate-700">Blocker</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={crossTeamDependency} onChange={(e) => setCrossTeamDependency(e.target.checked)} className="rounded border-slate-300 text-amber-500 focus:ring-amber-400" />
                  <span className="text-sm text-slate-700">Cross-Team Dependency</span>
                </label>
              </div>
            </div>
            <div>
              <label className={labelCls}>Dependency Risk Level</label>
              <select value={dependencyRiskLevel} onChange={(e) => setDependencyRiskLevel(e.target.value as import('../../types').DependencyRiskLevel | '')} className={inputCls}>
                <option value="">Not assessed</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Feature Flag */}
          <div>
            <label className={labelCls}>Feature Flag Name</label>
            <input value={featureFlagStatus} onChange={(e) => setFeatureFlagStatus(e.target.value)} placeholder="e.g. feature_new_dashboard, enable_stripe_v2" className={inputCls} />
          </div>

          {/* Definition of Done */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Definition of Done</label>
              <span className="text-xs text-slate-400">{definitionOfDone.filter(d => d.checked).length}/{definitionOfDone.length} complete</span>
            </div>
            {definitionOfDone.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {definitionOfDone.map(item => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <input type="checkbox" checked={item.checked} onChange={(e) => setDefinitionOfDone(prev => prev.map(d => d.id === item.id ? { ...d, checked: e.target.checked } : d))} className="rounded border-slate-300 text-brand-500 focus:ring-brand-400" />
                    <span className={`flex-1 text-sm ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                    <button onClick={() => setDefinitionOfDone(prev => prev.filter(d => d.id !== item.id))} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input value={newDodItem} onChange={(e) => setNewDodItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newDodItem.trim()) { setDefinitionOfDone(prev => [...prev, { id: generateId(), text: newDodItem.trim(), checked: false }]); setNewDodItem(''); } }} placeholder="Add DoD criterion (press Enter)..." className="flex-1 px-3 py-1.5 border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <Button variant="secondary" size="sm" onClick={() => { if (newDodItem.trim()) { setDefinitionOfDone(prev => [...prev, { id: generateId(), text: newDodItem.trim(), checked: false }]); setNewDodItem(''); } }}><Plus size={14} /></Button>
            </div>
            {definitionOfDone.length === 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Code reviewed', 'Tests written', 'QA passed', 'Docs updated', 'Design approved', 'Deployed to staging'].map(preset => (
                  <button key={preset} onClick={() => setDefinitionOfDone(prev => [...prev, { id: generateId(), text: preset, checked: false }])} className="text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 transition-colors">+ {preset}</button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-surface-border">
            <div className="flex gap-3">
              <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleSave} disabled={!title.trim()}>{isEdit ? 'Save Changes' : 'Create Story'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── COMMENTS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'comments' && story && <CommentsPanel storyId={story.id} memberId={defaultMemberId} />}

      {/* ── DEPENDENCIES TAB ─────────────────────────────────────────────────── */}
      {tab === 'dependencies' && story && <DependenciesPanel storyId={story.id} />}

      {/* ── ACTIVITY TAB ─────────────────────────────────────────────────────── */}
      {tab === 'activity' && story && <ActivityLogPanel storyId={story.id} />}

      {/* ── ATTACHMENTS TAB ──────────────────────────────────────────────────── */}
      {tab === 'attachments' && (
        <div className="space-y-5">
          {/* File upload drop zone */}
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-300 transition-colors cursor-pointer"
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-brand-400', 'bg-brand-50'); }}
            onDragLeave={e => { e.currentTarget.classList.remove('border-brand-400', 'bg-brand-50'); }}
            onDrop={e => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-brand-400', 'bg-brand-50');
              Array.from(e.dataTransfer.files).forEach(addFileAttachment);
            }}
            onClick={() => document.getElementById('story-file-input')?.click()}
          >
            <Paperclip size={24} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500">Drop files here or click to upload</p>
            <p className="text-xs text-slate-400 mt-1">Images, PDFs, documents (max 5MB each)</p>
            <input id="story-file-input" type="file" multiple className="hidden" onChange={e => { Array.from(e.target.files ?? []).forEach(addFileAttachment); e.target.value = ''; }} />
          </div>

          {/* Add link */}
          <div className="bg-slate-50 rounded-xl p-3 border border-surface-border space-y-2">
            <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5"><Link size={12} /> Add Link</p>
            <div className="grid grid-cols-2 gap-2">
              <input value={newLinkAttachTitle} onChange={e => setNewLinkAttachTitle(e.target.value)} placeholder="Label (optional)" className="border border-surface-border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <input value={newLinkAttachUrl} onChange={e => setNewLinkAttachUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLinkAttachment(); }} placeholder="https://..." className="border border-surface-border rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <button onClick={addLinkAttachment} disabled={!newLinkAttachUrl.trim()} className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 disabled:opacity-40 flex items-center gap-1"><Plus size={12} /> Add Link</button>
          </div>

          {/* Attachments list */}
          {attachments.length === 0 ? (
            <div className="text-center py-8"><Paperclip size={28} className="text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No attachments yet.</p></div>
          ) : (
            <div className="space-y-2">
              {attachments.map(att => {
                const isImage = att.type.startsWith('image/');
                const isLink = att.type === 'link';
                const sizeKB = att.size ? Math.round(att.size / 1024) : null;
                return (
                  <div key={att.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-surface-border rounded-lg group">
                    <div className="w-9 h-9 rounded-lg bg-white border border-surface-border flex items-center justify-center flex-shrink-0">
                      {isImage ? <Image size={16} className="text-brand-500" /> : isLink ? <Globe size={16} className="text-blue-500" /> : <FileIcon size={16} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-slate-700 hover:text-brand-600 truncate block">{att.name}</a>
                      <p className="text-xs text-slate-400">{isLink ? 'Link' : att.type.split('/')[1]?.toUpperCase() ?? 'File'}{sizeKB ? ` · ${sizeKB}KB` : ''}</p>
                    </div>
                    <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><X size={14} /></button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-surface-border">
            <div className="flex gap-3">
              <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleSave} disabled={!title.trim()}>{isEdit ? 'Save Changes' : 'Create Story'}</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
