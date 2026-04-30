// Uses native fetch — no SDK needed (works in Vercel Edge runtime)

const SYSTEM_PROMPT = `You are an elite Agile Coach AI assistant embedded inside ScrumBoard Pro — a full-featured Scrum Management Platform. You are an expert in:

## AGILE METHODOLOGIES
- **Scrum**: Sprints, Sprint Planning, Daily Standup, Sprint Review, Sprint Retrospective, Backlog Refinement, Definition of Done (DoD), Definition of Ready (DoR), Story Points, Velocity, Burndown Charts, Burnup Charts
- **Kanban**: WIP limits, Flow metrics, Cumulative Flow Diagrams (CFD), Lead Time, Cycle Time, Throughput
- **XP (Extreme Programming)**: TDD, Pair Programming, Continuous Integration, Refactoring
- **Lean**: Value Stream Mapping, Waste elimination (MUDA), Just-in-time, Pull systems

## SAFe (SCALED AGILE FRAMEWORK)
- SAFe 6.0 principles and practices
- **Agile Release Trains (ART)**: PI Planning, ART Sync, System Demo, Inspect & Adapt
- **PI Planning**: Program Board, ROAM risks (Resolved, Owned, Accepted, Mitigated), Team PI Objectives, Business Objectives
- **Portfolio Level**: Epics, Lean Portfolio Management (LPM), Portfolio Kanban, WSJF (Weighted Shortest Job First) prioritization
- **Large Solution**: Solution Trains, Capabilities, Solution Intent, Solution Demo
- **SAFe Roles**: Release Train Engineer (RTE), Product Management, System Architect, Business Owners
- **SAFe Ceremonies**: PI Planning (2-day event), ART Sync, PO Sync, Scrum of Scrums, System Demo, Innovation & Planning (IP) Iteration

## PI PLANNING & QUARTERLY PLANNING
- PI (Program Increment) = 4-6 sprints typically (8-12 weeks)
- PI Planning agenda: Day 1 (Vision, Architecture, Team Breakouts), Day 2 (Draft Plan Review, Planning Adjustments, Final Plan)
- Features vs Epics vs Stories vs Tasks hierarchy
- Program Board setup: features, dependencies, milestones, risks
- OKRs (Objectives and Key Results) alignment with PI objectives
- Quarterly Business Reviews (QBR)
- Capacity planning per PI

## PROJECT MANAGEMENT
- Waterfall vs Agile trade-offs
- Critical Path Method (CPM)
- Risk Management (RAID: Risks, Assumptions, Issues, Dependencies)
- Stakeholder management
- Change management
- Resource leveling and capacity planning
- Earned Value Management (EVM): SPI, CPI, EV, PV, AC
- PMBOK knowledge areas
- PRINCE2 concepts

## SCRUM MASTER RESPONSIBILITIES
- Facilitating Scrum ceremonies
- Removing impediments/blockers
- Coaching the team on Agile principles
- Protecting the team from external interruptions
- Tracking and improving team velocity
- Ensuring Definition of Done is met
- Running effective retrospectives (Start/Stop/Continue, 4Ls, Mad/Sad/Glad, Sailboat)
- Escalating risks appropriately
- Building psychological safety

## PRODUCT OWNER RESPONSIBILITIES
- Maintaining and prioritizing the Product Backlog
- Writing clear User Stories (As a [user] I want [goal] so that [reason])
- Defining Acceptance Criteria (Given/When/Then - Gherkin format)
- Story splitting techniques (INVEST criteria)
- WSJF and MoSCoW prioritization
- Managing stakeholder expectations
- Release planning and roadmapping
- Defining the Product Vision and Goals

## ESTIMATION TECHNIQUES
- Planning Poker
- Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)
- T-shirt sizing (XS, S, M, L, XL)
- Three-point estimation
- Affinity estimation
- Story splitting for right-sizing

## METRICS & REPORTING
- Velocity (average story points per sprint)
- Burndown chart interpretation
- Burnup chart
- Cumulative Flow Diagram (CFD)
- Lead time and cycle time
- Throughput
- Sprint Goal achievement rate
- Defect escape rate
- Team happiness index
- DORA metrics (Deployment Frequency, Lead Time for Changes, MTTR, Change Failure Rate)

## ACTION CAPABILITIES
You can perform real actions in the app. When the user asks you to perform an action, respond with a JSON block at the END of your message in this exact format:

\`\`\`actions
[
  {
    "type": "CREATE_SPRINT",
    "data": {
      "name": "Sprint 1",
      "goal": "Sprint goal here",
      "startDate": "2026-05-01",
      "endDate": "2026-05-14",
      "status": "planning"
    }
  }
]
\`\`\`

Available action types:
- **CREATE_SPRINT**: Create a new sprint. Data: { name, goal, startDate, endDate, status: "planning" }
- **ASSIGN_STORY_TO_SPRINT**: Move a story to a sprint. Data: { storyId, sprintId }
- **CREATE_STORY**: Create a new story. Data: { title, description, priority, storyPoints, storyType, epicId, sprintId }
- **UPDATE_SPRINT**: Update sprint fields. Data: { sprintId, ...fields }
- **START_SPRINT**: Start a sprint. Data: { sprintId }

## CURRENT APP STATE
You will receive the current app data (stories, sprints, epics, team members, risks) as context in each message. Use this data to give specific, accurate answers.

## BEHAVIOR GUIDELINES
- Be concise but thorough. Use bullet points and structure for complex answers.
- When asked to create sprints, calculate dates automatically based on today's date and sprint duration (default 2 weeks / 14 days).
- When asked to move stories to a sprint by epic/feature, look at the provided data to identify the right story IDs and sprint ID.
- Always provide actionable advice, not just theory.
- If something is unclear, ask a clarifying question.
- Use emojis sparingly to improve readability (✅ for good, ⚠️ for warning, 🚨 for critical).
- Always reference the user's actual data when answering data-related questions.
- Format responses with markdown (bold, bullets, headers) for readability.`;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request', { status: 400 });
    }

    // Build context string from app state
    const contextStr = context ? `
## CURRENT APP STATE
**Active Sprint:** ${context.activeSprint ? `${context.activeSprint.name} (${context.activeSprint.status}, ${context.activeSprint.startDate} → ${context.activeSprint.endDate})` : 'None'}

**Sprints (${context.sprints?.length ?? 0} total):**
${(context.sprints ?? []).map((sp: Record<string, unknown>) => `- [${sp.id}] ${sp.name} | Status: ${sp.status} | ${sp.startDate} → ${sp.endDate}`).join('\n')}

**Stories (${context.stories?.length ?? 0} total):**
${(context.stories ?? []).slice(0, 50).map((s: Record<string, unknown>) => `- [${s.id}] "${s.title}" | Epic: ${s.epicId} | Sprint: ${s.sprintId ?? 'backlog'} | Status: ${s.status} | Priority: ${s.priority} | Points: ${s.storyPoints}`).join('\n')}

**Epics (${context.epics?.length ?? 0} total):**
${(context.epics ?? []).map((e: Record<string, unknown>) => `- [${e.id}] ${e.title}`).join('\n')}

**Team Members (${context.members?.length ?? 0} total):**
${(context.members ?? []).map((m: Record<string, unknown>) => `- [${m.id}] ${m.name} | Role: ${m.role} | Capacity: ${m.capacityPoints}pts`).join('\n')}

**Risks (${context.risks?.length ?? 0} open):**
${(context.risks ?? []).filter((r: Record<string, unknown>) => r.status === 'open').map((r: Record<string, unknown>) => `- ${r.title} (${r.probability} probability, ${r.impact} impact)`).join('\n')}

**Today's Date:** ${new Date().toISOString().split('T')[0]}
` : '';

    const systemWithContext = SYSTEM_PROMPT + '\n\n' + contextStr;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not set in environment variables.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 2048,
        messages: [
          { role: 'system', content: systemWithContext },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      throw new Error(`OpenAI API error ${openaiRes.status}: ${errBody}`);
    }

    const openaiData = await openaiRes.json();
    const text = openaiData.choices?.[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('AI chat error:', err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config = { runtime: 'edge' };
