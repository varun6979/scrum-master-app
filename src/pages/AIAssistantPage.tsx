import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles, Send, AlertTriangle, Clock, Zap, BarChart3,
  ChevronRight, Plus, ArrowRight, CheckCircle2, XCircle,
  Loader2, RefreshCw, BookOpen, Users, Target, TrendingUp,
  Flag, Shield, Calendar, GitBranch, Lightbulb,
} from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { useScrumStore, useActiveSprint } from '../store/useScrumStore';
import { generateId } from '../lib/idgen';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: AgentAction[];
  actionsExecuted?: boolean;
  isError?: boolean;
}

interface AgentAction {
  type: 'CREATE_SPRINT' | 'ASSIGN_STORY_TO_SPRINT' | 'CREATE_STORY' | 'UPDATE_SPRINT' | 'START_SPRINT';
  data: Record<string, unknown>;
  label?: string;
  executed?: boolean;
}

// ─── Prompt suggestions by role ───────────────────────────────────────────────

const QUICK_PROMPTS = {
  'Scrum Master': [
    'Create the next 6 sprints starting from today (2-week sprints)',
    'What should we discuss in our retrospective?',
    'Who is overloaded this sprint?',
    'How do I run an effective PI Planning session?',
    'What are ROAM risks in SAFe?',
    'Create a sprint and assign all backlog stories from the first epic to it',
  ],
  'Product Owner': [
    'How do I prioritize my backlog using WSJF?',
    'Write a user story for a login feature',
    'What is the difference between an Epic, Feature, and Story in SAFe?',
    'How do I write good acceptance criteria in Gherkin format?',
    'What is the Definition of Ready?',
    'How do I run a sprint review?',
  ],
  'Project Manager': [
    'How is our velocity trending?',
    'When will we finish the backlog at current pace?',
    'Explain PI Planning and how it maps to quarterly planning',
    'What are the key SAFe roles and their responsibilities?',
    'How do I calculate WSJF priority?',
    'What metrics should I track for an Agile team?',
  ],
};

const KNOWLEDGE_TOPICS = [
  { icon: <BookOpen size={14} />, label: 'Scrum Ceremonies', q: 'Explain all Scrum ceremonies and best practices for running them' },
  { icon: <Shield size={14} />, label: 'SAFe Framework', q: 'Explain the SAFe framework, its levels, and how PI Planning works' },
  { icon: <Calendar size={14} />, label: 'PI Planning', q: 'Walk me through how to run a 2-day PI Planning event step by step' },
  { icon: <Target size={14} />, label: 'OKRs & Goals', q: 'How do I align sprint goals with OKRs and quarterly business objectives?' },
  { icon: <TrendingUp size={14} />, label: 'Velocity & Metrics', q: 'What Agile metrics should I track and how do I improve team velocity?' },
  { icon: <Users size={14} />, label: 'Team Health', q: 'How do I improve team morale, psychological safety, and Agile maturity?' },
  { icon: <GitBranch size={14} />, label: 'Dependencies', q: 'How do I manage cross-team dependencies in SAFe Agile?' },
  { icon: <Flag size={14} />, label: 'Release Planning', q: 'How do I create a release plan and roadmap in an Agile context?' },
  { icon: <Lightbulb size={14} />, label: 'Story Splitting', q: 'What are the best techniques to split large user stories and epics?' },
];

// ─── Action parser ─────────────────────────────────────────────────────────────

function parseActions(text: string): AgentAction[] {
  const match = text.match(/```actions\n([\s\S]*?)```/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stripActions(text: string): string {
  return text.replace(/```actions\n[\s\S]*?```/g, '').trim();
}

function actionLabel(action: AgentAction): string {
  switch (action.type) {
    case 'CREATE_SPRINT': return `Create sprint: ${action.data.name}`;
    case 'ASSIGN_STORY_TO_SPRINT': return `Assign story to sprint`;
    case 'CREATE_STORY': return `Create story: ${action.data.title}`;
    case 'UPDATE_SPRINT': return `Update sprint`;
    case 'START_SPRINT': return `Start sprint`;
    default: return action.type;
  }
}

// ─── Local Agile Knowledge Base ────────────────────────────────────────────────

function localAgileKnowledge(q: string, ctx: { stories: any[]; sprints: any[]; epics: any[]; members: any[]; risks: any[]; activeSprint: any }): string | null {
  const text = q.toLowerCase();
  const { stories, sprints, epics, members, risks, activeSprint } = ctx;

  // Sprint creation
  if ((text.includes('create') || text.includes('make') || text.includes('generate')) && text.includes('sprint')) {
    const match = text.match(/(\d+)\s*sprint/);
    const count = match ? parseInt(match[1]) : 6;
    const today = new Date();
    const actions = [];
    let startDate = new Date(today);
    // Start from next Monday if not already Monday
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 1) {
      startDate = addDays(startDate, (8 - dayOfWeek) % 7 || 7);
    }
    const existingCount = sprints.length;
    for (let i = 0; i < count; i++) {
      const endDate = addDays(startDate, 13);
      actions.push({
        type: 'CREATE_SPRINT',
        data: {
          name: `Sprint ${existingCount + i + 1}`,
          goal: `Sprint ${existingCount + i + 1} delivery goal`,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          status: 'planning',
        },
      });
      startDate = addDays(endDate, 1);
    }
    const actionsJson = '```actions\n' + JSON.stringify(actions, null, 2) + '\n```';
    return `I'll create **${count} sprints** for you, each 2 weeks long:\n\n${actions.map((a, i) => `- **${a.data.name}**: ${a.data.startDate} → ${a.data.endDate}`).join('\n')}\n\nClick **Execute All** below to apply them to your board.\n\n${actionsJson}`;
  }

  // Assign stories to sprint by epic
  if (text.includes('assign') || text.includes('move') && text.includes('stor')) {
    const epic = epics.find(e => text.includes(e.title.toLowerCase()));
    const sprint = sprints.find(s => s.status === 'planning') ?? sprints[sprints.length - 1];
    if (epic && sprint) {
      const epicStories = stories.filter(s => s.epicId === epic.id && !s.sprintId);
      if (epicStories.length === 0) return `No unassigned stories found for epic **${epic.title}**.`;
      const actions = epicStories.map(s => ({ type: 'ASSIGN_STORY_TO_SPRINT', data: { storyId: s.id, sprintId: sprint.id, sprintName: sprint.name } }));
      const actionsJson = '```actions\n' + JSON.stringify(actions, null, 2) + '\n```';
      return `Moving **${epicStories.length} stories** from epic **${epic.title}** to **${sprint.name}**:\n\n${epicStories.map(s => `- ${s.title}`).join('\n')}\n\n${actionsJson}`;
    }
  }

  // Sprint status
  if (text.includes('sprint') && (text.includes('status') || text.includes('how') || text.includes('going'))) {
    if (!activeSprint) return 'There is no active sprint. Go to the **Sprints** page to start one.';
    const ss = stories.filter(s => s.sprintId === activeSprint.id);
    const done = ss.filter(s => s.status === 'done');
    const inProg = ss.filter(s => s.status === 'in_progress');
    const blocked = ss.filter(s => s.status === 'blocked');
    const pts = ss.reduce((a, s) => a + s.storyPoints, 0);
    const donePts = done.reduce((a, s) => a + s.storyPoints, 0);
    const pct = pts > 0 ? Math.round((donePts / pts) * 100) : 0;
    return `## ${activeSprint.name} Status\n\n- **Progress**: ${pct}% complete (${donePts}/${pts} pts)\n- ✅ **Done**: ${done.length} stories\n- 🔄 **In Progress**: ${inProg.length} stories\n- 🚨 **Blocked**: ${blocked.length} stories\n- 📋 **Total**: ${ss.length} stories\n\n${pct >= 70 ? '✅ On track for a successful sprint!' : pct >= 40 ? '⚠️ Moderate pace — push through the backlog.' : '🚨 Behind pace — consider reducing scope or pairing up.'}`;
  }

  // PI Planning
  if (text.includes('pi planning') || text.includes('program increment')) {
    return `## PI Planning Guide\n\n**What is PI Planning?**\nA 2-day event where all Agile teams in an ART (Agile Release Train) meet to plan the next Program Increment (PI = 4-6 sprints / 8-12 weeks).\n\n**Day 1 Agenda:**\n- Business context & product vision (Product Management)\n- Architecture vision (System Architect)\n- Team breakouts: draft sprint plans, identify risks & dependencies\n- Draft plan review\n\n**Day 2 Agenda:**\n- Planning adjustments based on day 1 feedback\n- Final plan review per team\n- ROAM risks: **R**esolved, **O**wned, **A**ccepted, **M**itigated\n- Confidence vote (fist-of-five)\n- Commit to PI Objectives\n\n**Key Outputs:**\n- Team PI Objectives (committed + stretch)\n- Program Board (features, dependencies, milestones)\n- ROAM risk register\n- ART confidence vote\n\n**Tips:**\n- Prepare the backlog with Features before PI Planning\n- Involve Business Owners on Day 1\n- Time-box team breakouts to 90 minutes`;
  }

  // SAFe
  if (text.includes('safe') || text.includes('scaled agile')) {
    return `## SAFe (Scaled Agile Framework) Overview\n\n**4 Configurations:**\n- **Essential SAFe**: ART + Team level (minimum viable SAFe)\n- **Large Solution SAFe**: Multiple ARTs + Solution Train\n- **Portfolio SAFe**: Adds Lean Portfolio Management\n- **Full SAFe**: All levels\n\n**Key Roles:**\n- **Release Train Engineer (RTE)**: Agile coach for the ART — runs PI Planning, ART Sync\n- **Product Management**: Owns the Program Backlog (Features)\n- **System Architect**: Technical vision for the ART\n- **Business Owners**: Stakeholders who set business priorities\n\n**Key Ceremonies:**\n- **PI Planning** (quarterly): Full ART alignment\n- **ART Sync** (weekly): Cross-team coordination\n- **PO Sync** (weekly): Product Owner alignment\n- **System Demo** (end of each sprint): Integrated solution demo\n- **Inspect & Adapt** (end of PI): Retrospective + problem solving\n\n**Work Item Hierarchy:**\nEpic → Feature → Story → Task`;
  }

  // WSJF
  if (text.includes('wsjf') || text.includes('weighted shortest')) {
    return `## WSJF (Weighted Shortest Job First)\n\nUsed in SAFe to prioritize Features and Epics.\n\n**Formula:**\n> WSJF = Cost of Delay ÷ Job Duration\n\n**Cost of Delay = User/Business Value + Time Criticality + Risk Reduction/Opportunity Enablement**\n\n**Scoring (Fibonacci: 1, 2, 3, 5, 8, 13, 20):**\n\n| Factor | Question |\n|--------|----------|\n| User/Business Value | How valuable is this to users/business? |\n| Time Criticality | Does value decay over time? Is there a deadline? |\n| Risk Reduction | Does this reduce risk or enable future work? |\n| Job Size | How long will it take? (smaller = better WSJF) |\n\n**Example:**\n- Feature A: (8+5+3) ÷ 8 = **2.0**\n- Feature B: (5+2+1) ÷ 2 = **4.0** ← prioritize this one\n\nHigher WSJF score = higher priority.`;
  }

  // Retrospective
  if (text.includes('retro') || text.includes('retrospective')) {
    const blocked = stories.filter(s => s.status === 'blocked');
    const carried = stories.filter(s => s.sprintId && s.status !== 'done' && sprints.find(sp => sp.id === s.sprintId && sp.status === 'completed'));
    return `## Retrospective Guide\n\n**Popular Formats:**\n\n**1. Start/Stop/Continue**\n- Start: What should we begin doing?\n- Stop: What is hurting the team?\n- Continue: What is working well?\n\n**2. 4Ls**\n- Liked, Learned, Lacked, Longed For\n\n**3. Sailboat**\n- Wind (helping): what's pushing us forward?\n- Anchors (hindering): what's slowing us down?\n- Rocks (risks): what could sink us?\n- Destination: where are we heading?\n\n**Based on your data, discuss:**\n${blocked.length > 0 ? `- 🚨 ${blocked.length} blocked stories — what caused them?\n` : ''}${carried.length > 0 ? `- 📋 ${carried.length} stories carried over — how to prevent this?\n` : ''}- Team velocity trend\n- Process improvements\n- Team morale and collaboration\n\n**Best Practices:**\n- Time-box to 90 minutes\n- Create 2-3 action items max (not 10+)\n- Assign owners and due dates to action items\n- Follow up on previous retro actions first`;
  }

  // Velocity
  if (text.includes('velocity')) {
    const completed = sprints.filter(s => s.status === 'completed' && s.velocity);
    if (completed.length === 0) return 'No completed sprints yet. Velocity is calculated after sprints complete.\n\n**Velocity** = average story points completed per sprint over the last 3-5 sprints. Use it for sprint planning and forecasting.';
    const avg = Math.round(completed.reduce((a, s) => a + (s.velocity ?? 0), 0) / completed.length);
    const last3 = completed.slice(-3);
    const trend = last3.length >= 2 ? (last3[last3.length-1].velocity! > last3[0].velocity! ? '📈 Improving' : '📉 Declining') : '➡️ Stable';
    return `## Your Velocity\n\n- **Average**: ${avg} pts/sprint\n- **Trend**: ${trend}\n- **Sprints analyzed**: ${completed.length}\n\n${completed.slice(-5).map(s => `- ${s.name}: ${s.velocity} pts`).join('\n')}\n\n**Tips to improve velocity:**\n- Reduce WIP (work in progress)\n- Break stories smaller (aim for <5 pts each)\n- Reduce carryover from sprint to sprint\n- Protect team from interruptions`;
  }

  // Overloaded / capacity
  if (text.includes('overload') || text.includes('capacity') || text.includes('who is')) {
    if (!activeSprint) return 'No active sprint to check capacity.';
    const sprintStories = stories.filter(s => s.sprintId === activeSprint.id);
    const loads = members.map(m => {
      const pts = sprintStories.filter(s => s.assigneeId === m.id).reduce((a, s) => a + s.storyPoints, 0);
      return { name: m.name, pts, capacity: m.capacityPoints, pct: m.capacityPoints > 0 ? Math.round((pts / m.capacityPoints) * 100) : 0 };
    });
    return `## Team Capacity — ${activeSprint.name}\n\n${loads.map(l => `- **${l.name}**: ${l.pts}/${l.capacity} pts (${l.pct}%) ${l.pct > 100 ? '🚨 Over capacity' : l.pct === 0 ? '⚪ No work assigned' : l.pct >= 80 ? '✅ Well loaded' : '🔵 Under-loaded'}`).join('\n')}`;
  }

  // Definition of Done
  if (text.includes('definition of done') || text.includes('dod')) {
    return `## Definition of Done (DoD)\n\nA shared agreement on when a story is truly "done".\n\n**Typical DoD checklist:**\n- ✅ Code written and peer-reviewed\n- ✅ Unit tests written and passing\n- ✅ Integration tests passing\n- ✅ Code merged to main branch\n- ✅ No known defects introduced\n- ✅ Acceptance criteria verified by PO\n- ✅ Deployed to staging/test environment\n- ✅ Documentation updated\n- ✅ No increase in technical debt (or logged)\n\n**Why it matters:**\nWithout DoD, "done" means different things to different people, leading to quality issues and rework.\n\n**Tip:** Keep DoD visible in every sprint review and retrospective.`;
  }

  // User story writing
  if (text.includes('user story') || text.includes('acceptance criteria') || text.includes('gherkin')) {
    return `## Writing Great User Stories\n\n**Format:**\n> As a **[type of user]**, I want **[goal]** so that **[reason/value]**\n\n**Example:**\n> As a **Product Owner**, I want to **see velocity trends** so that **I can make accurate sprint commitments**.\n\n**INVEST Criteria:**\n- **I**ndependent — can be developed alone\n- **N**egotiable — not a fixed contract\n- **V**aluable — delivers value to user\n- **E**stimable — team can size it\n- **S**mall — fits in one sprint\n- **T**estable — clear acceptance criteria\n\n**Acceptance Criteria (Gherkin format):**\n\`\`\`\nGiven [context/precondition]\nWhen [action taken]\nThen [expected outcome]\n\`\`\`\n\n**Example:**\n\`\`\`\nGiven I am on the dashboard\nWhen I click the velocity chart\nThen I see the last 5 sprints with points completed\n\`\`\`\n\n**Story Splitting Techniques:**\n- By workflow steps\n- By data variations\n- By user roles\n- By happy/unhappy path`;
  }

  // Scrum ceremonies
  if (text.includes('ceremoni') || text.includes('ceremony') || text.includes('standup') || text.includes('scrum event')) {
    return `## Scrum Ceremonies\n\n**1. Sprint Planning** (start of sprint, 2-4 hrs)\n- What can we deliver? (Sprint Goal)\n- How will we do it? (Task breakdown)\n- Team commits to sprint backlog\n\n**2. Daily Standup / Daily Scrum** (daily, 15 min)\n- What did I do yesterday?\n- What will I do today?\n- Any impediments/blockers?\n- *Tip: Stand up, stay focused, no problem-solving in the meeting*\n\n**3. Sprint Review** (end of sprint, 1-2 hrs)\n- Demo working software to stakeholders\n- Gather feedback\n- Update backlog based on feedback\n\n**4. Sprint Retrospective** (end of sprint, 1-1.5 hrs)\n- What went well?\n- What needs improvement?\n- Action items with owners\n\n**5. Backlog Refinement** (mid-sprint, 1-2 hrs)\n- Groom and estimate upcoming stories\n- Ensure top of backlog is ready for next sprint\n- Split large stories`;
  }

  return null;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AIAssistantPage() {
  const store = useScrumStore();
  const { stories, sprints, epics, members, risks, standups,
    addSprint, updateSprint, assignStoryToSprint, addStory, startSprint } = store;
  const activeSprint = useActiveSprint();

  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'init',
    role: 'assistant',
    content: `# Welcome to your Agile AI Assistant! 🚀

I'm trained on **Agile, Scrum, SAFe, PI Planning, Kanban, Lean** and all major project management frameworks.

**I can answer questions like:**
- How do I run PI Planning?
- What is WSJF prioritization?
- How do I split a large epic into stories?
- What metrics should a Scrum Master track?

**I can also take actions in your board:**
- "Create the next 6 sprints starting today"
- "Create a sprint and move all stories from Epic X to it"
- "Create a story for [description]"

Choose your role below to see suggested prompts, or just ask me anything!`,
    timestamp: new Date().toISOString(),
  }]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<keyof typeof QUICK_PROMPTS>('Scrum Master');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build context for the AI
  const context = useMemo(() => ({
    activeSprint,
    sprints,
    stories: stories.slice(0, 100),
    epics,
    members,
    risks: risks.slice(0, 20),
    today: format(new Date(), 'yyyy-MM-dd'),
  }), [activeSprint, sprints, stories, epics, members, risks]);

  // Convert messages to API format
  function buildApiMessages(msgs: ChatMessage[]) {
    return msgs
      .filter(m => m.id !== 'init')
      .map(m => ({ role: m.role, content: m.content }));
  }

  async function sendMessage(text?: string) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = [...buildApiMessages(messages), { role: 'user', content: trimmed }];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, context }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawText: string = data.text ?? '';
      const actions = parseActions(rawText);
      const displayText = stripActions(rawText);

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: displayText,
        timestamp: new Date().toISOString(),
        actions: actions.length > 0 ? actions : undefined,
        actionsExecuted: false,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      // Fallback to local knowledge base when API is unavailable
      const localAnswer = localAgileKnowledge(trimmed, { stories, sprints, epics, members, risks, activeSprint });
      if (localAnswer) {
        const actions = parseActions(localAnswer);
        const displayText = stripActions(localAnswer);
        setMessages(prev => [...prev, {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: displayText + '\n\n*— Local knowledge base (API unavailable)*',
          timestamp: new Date().toISOString(),
          actions: actions.length > 0 ? actions : undefined,
          actionsExecuted: false,
        }]);
      } else {
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **API unavailable**: ${err instanceof Error ? err.message : 'Unknown error'}\n\nYou can still use the quick prompts and knowledge topics on the left — they use the local knowledge base.`,
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setLoading(false);
    }
  }

  // Execute actions from AI response
  function executeActions(msgId: string, actions: AgentAction[]) {
    const results: string[] = [];

    // We need access to latest sprint IDs that may have been created in earlier actions
    const createdSprintIds: Record<string, string> = {};

    actions.forEach(action => {
      try {
        switch (action.type) {
          case 'CREATE_SPRINT': {
            const d = action.data;
            const id = generateId();
            createdSprintIds[d.name as string] = id;
            addSprint({
              name: d.name as string,
              goal: (d.goal as string) ?? '',
              startDate: d.startDate as string,
              endDate: d.endDate as string,
              status: (d.status as 'planning' | 'active' | 'completed') ?? 'planning',
            });
            results.push(`✅ Created sprint: **${d.name}**`);
            break;
          }
          case 'ASSIGN_STORY_TO_SPRINT': {
            const d = action.data;
            const storyId = d.storyId as string;
            const sprintId = d.sprintId as string;
            // Find actual sprint (may be newly created, so search by name too)
            const targetSprint = sprints.find(sp => sp.id === sprintId) ??
              sprints.find(sp => sp.name === d.sprintName);
            if (targetSprint) {
              assignStoryToSprint(storyId, targetSprint.id);
              const story = stories.find(s => s.id === storyId);
              results.push(`✅ Moved story **${story?.title ?? storyId}** to **${targetSprint.name}**`);
            } else {
              results.push(`⚠️ Sprint not found for story ${storyId}`);
            }
            break;
          }
          case 'CREATE_STORY': {
            const d = action.data;
            addStory({
              title: d.title as string,
              description: (d.description as string) ?? '',
              acceptanceCriteria: [],
              priority: (d.priority as 'critical' | 'high' | 'medium' | 'low') ?? 'medium',
              storyPoints: (d.storyPoints as number) ?? 3,
              storyType: (d.storyType as 'story' | 'bug' | 'task' | 'spike') ?? 'story',
              epicId: (d.epicId as string) ?? '',
              sprintId: d.sprintId as string | undefined,
              status: 'backlog',
              assigneeId: undefined,
              labels: [],
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
              blockerFlag: false,
              crossTeamDependency: false,
              attachments: [],
              order: 0,
            });
            results.push(`✅ Created story: **${d.title}**`);
            break;
          }
          case 'START_SPRINT': {
            const d = action.data;
            const sp = sprints.find(s => s.id === d.sprintId || s.name === d.sprintName);
            if (sp) {
              startSprint(sp.id);
              results.push(`✅ Started sprint: **${sp.name}**`);
            }
            break;
          }
          default:
            results.push(`⚠️ Unknown action: ${action.type}`);
        }
      } catch (e) {
        results.push(`❌ Failed: ${action.type} — ${e instanceof Error ? e.message : String(e)}`);
      }
    });

    // Add result message
    const resultMsg: ChatMessage = {
      id: `result-${Date.now()}`,
      role: 'assistant',
      content: `**Actions completed:**\n\n${results.join('\n')}`,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [
      ...prev.map(m => m.id === msgId ? { ...m, actionsExecuted: true } : m),
      resultMsg,
    ]);
  }

  function clearChat() {
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: messages[0].content,
      timestamp: new Date().toISOString(),
    }]);
  }

  // Render markdown-ish text
  function renderText(text: string) {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Heading
      if (line.startsWith('# ')) return <h2 key={i} className="text-base font-bold text-slate-900 mt-2 mb-1">{line.slice(2)}</h2>;
      if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-slate-800 mt-2 mb-0.5">{line.slice(3)}</h3>;
      if (line.startsWith('### ')) return <h4 key={i} className="text-xs font-bold text-slate-700 mt-1">{line.slice(4)}</h4>;
      // Bullet
      if (line.startsWith('- ') || line.startsWith('• ')) {
        const content = line.slice(2);
        return <div key={i} className="flex gap-1.5 text-sm text-slate-700 leading-relaxed"><span className="mt-1 text-brand-400 flex-shrink-0">•</span><span dangerouslySetInnerHTML={{ __html: boldify(content) }} /></div>;
      }
      // Numbered
      const numbered = line.match(/^(\d+)\. (.+)/);
      if (numbered) return <div key={i} className="flex gap-1.5 text-sm text-slate-700 leading-relaxed"><span className="text-brand-500 font-semibold flex-shrink-0">{numbered[1]}.</span><span dangerouslySetInnerHTML={{ __html: boldify(numbered[2]) }} /></div>;
      // Empty
      if (!line.trim()) return <div key={i} className="h-1.5" />;
      // Normal
      return <p key={i} className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
    });
  }

  function boldify(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code class="bg-slate-100 text-brand-700 px-1 rounded text-xs font-mono">$1</code>');
  }

  const sprintStats = useMemo(() => {
    if (!activeSprint) return null;
    const ss = stories.filter(s => s.sprintId === activeSprint.id);
    const done = ss.filter(s => s.status === 'done');
    const pts = done.reduce((a, s) => a + s.storyPoints, 0);
    const totalPts = ss.reduce((a, s) => a + s.storyPoints, 0);
    return { total: ss.length, done: done.length, pts, totalPts, pct: totalPts > 0 ? Math.round((pts / totalPts) * 100) : 0 };
  }, [activeSprint, stories]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">Agile AI Assistant</h1>
              <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full border border-brand-200">GPT-4o mini</span>
            </div>
            <p className="text-slate-500 text-sm">Expert in Agile · Scrum · SAFe · PI Planning · Project Management</p>
          </div>
        </div>
        <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
          <RefreshCw size={13} /> New Chat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* LEFT SIDEBAR — role picker + quick prompts + knowledge topics */}
        <div className="space-y-4">
          {/* Role selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Your Role</p>
            <div className="space-y-1">
              {(Object.keys(QUICK_PROMPTS) as Array<keyof typeof QUICK_PROMPTS>).map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors font-medium ${selectedRole === role ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Quick prompts */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Prompts</p>
            <div className="space-y-1.5">
              {QUICK_PROMPTS[selectedRole].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                  className="w-full text-left text-xs text-slate-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1.5 rounded-lg transition-colors border border-transparent hover:border-brand-100 flex items-start gap-1.5"
                >
                  <ChevronRight size={11} className="mt-0.5 flex-shrink-0 text-brand-400" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Knowledge topics */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Knowledge Base</p>
            <div className="space-y-1">
              {KNOWLEDGE_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(topic.q)}
                  disabled={loading}
                  className="w-full text-left flex items-center gap-2 text-xs text-slate-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <span className="text-brand-500">{topic.icon}</span>
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sprint snapshot */}
          {activeSprint && sprintStats && (
            <div className="bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-2">Active Sprint</p>
              <p className="text-sm font-bold truncate">{activeSprint.name}</p>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                <div className="bg-white h-1.5 rounded-full" style={{ width: `${sprintStats.pct}%` }} />
              </div>
              <p className="text-xs opacity-80 mt-1">{sprintStats.done}/{sprintStats.total} stories · {sprintStats.pts}/{sprintStats.totalPts} pts · {sprintStats.pct}%</p>
            </div>
          )}
        </div>

        {/* CENTER — Chat */}
        <div className="lg:col-span-3 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ height: '680px' }}>
          {/* Chat header */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-semibold text-slate-700">Agile AI · Expert Mode</span>
            <span className="ml-auto text-xs text-slate-400">{messages.length - 1} messages</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={13} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-sm'
                      : msg.isError
                        ? 'bg-red-50 border border-red-200 rounded-bl-sm'
                        : 'bg-slate-50 border border-slate-200 rounded-bl-sm'
                  }`}>
                    {msg.role === 'user'
                      ? <p className="text-sm text-white">{msg.content}</p>
                      : <div className="space-y-0.5">{renderText(msg.content)}</div>
                    }
                  </div>

                  {/* Actions panel */}
                  {msg.actions && msg.actions.length > 0 && !msg.actionsExecuted && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                        <Zap size={12} /> {msg.actions.length} action{msg.actions.length > 1 ? 's' : ''} ready to execute
                      </p>
                      <div className="space-y-1 mb-3">
                        {msg.actions.map((action, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-amber-700">
                            <ArrowRight size={11} className="flex-shrink-0" />
                            {actionLabel(action)}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => executeActions(msg.id, msg.actions!)}
                          className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          <CheckCircle2 size={12} /> Execute All
                        </button>
                        <button
                          onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, actionsExecuted: true } : m))}
                          className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-50"
                        >
                          <XCircle size={12} /> Skip
                        </button>
                      </div>
                    </div>
                  )}
                  {msg.actionsExecuted && msg.actions && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 size={11} /> Actions executed</p>
                  )}

                  <p className="text-xs text-slate-400 mt-1 px-1">
                    {format(new Date(msg.timestamp), 'h:mm a')}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={13} className="text-white" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 size={14} className="animate-spin text-brand-500" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-slate-100 bg-white">
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask anything about Agile, SAFe, PI Planning... or say 'Create next 6 sprints'"
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="bg-gradient-to-br from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white rounded-xl px-4 disabled:opacity-40 transition-all flex-shrink-0 self-end py-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 px-1">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  );
}
