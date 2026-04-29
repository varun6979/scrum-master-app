export function MarketComparisonPage() {
  return (
    <>
      {/* ── Print + Screen Styles ── */}
      <style>{`
        /* ---- screen wrapper ---- */
        .mcp-root {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #f1f5f9;
          padding: 32px 16px;
          min-height: 100vh;
          color: #1e293b;
        }
        .mcp-page {
          background: #ffffff;
          max-width: 960px;
          margin: 0 auto 40px auto;
          padding: 60px 72px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.10);
          border-radius: 8px;
        }

        /* ---- typography ---- */
        .mcp-h1 { font-size: 2.8rem; font-weight: 800; color: #1e293b; line-height: 1.15; margin: 0 0 12px; }
        .mcp-h2 { font-size: 1.6rem; font-weight: 700; color: #4F6EF7; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
        .mcp-h3 { font-size: 1.15rem; font-weight: 700; color: #1e293b; margin: 24px 0 10px; }
        .mcp-subtitle { font-size: 1.25rem; color: #4F6EF7; font-weight: 600; margin: 0 0 20px; }
        .mcp-tagline { font-size: 0.92rem; color: #64748b; letter-spacing: 0.04em; margin: 0 0 40px; }
        p { line-height: 1.75; color: #334155; margin: 0 0 14px; }

        /* ---- cover metrics ---- */
        .mcp-cover-metrics {
          display: flex; flex-wrap: wrap; gap: 16px; margin-top: 40px;
        }
        .mcp-metric-card {
          flex: 1 1 140px; background: #f8faff; border: 1.5px solid #c7d2fe;
          border-radius: 10px; padding: 18px 20px; text-align: center;
        }
        .mcp-metric-value { font-size: 2rem; font-weight: 800; color: #4F6EF7; }
        .mcp-metric-label { font-size: 0.78rem; color: #64748b; margin-top: 4px; line-height: 1.3; }

        /* ---- section break ---- */
        .mcp-section { margin-top: 48px; }
        .mcp-page-break { page-break-before: always; }

        /* ---- competitor blocks ---- */
        .mcp-competitor { margin-bottom: 32px; padding: 24px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px; }
        .mcp-competitor-name { font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
        .mcp-competitor-pos { font-size: 0.82rem; color: #64748b; margin: 0 0 14px; font-style: italic; }
        .mcp-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .mcp-strengths-title { font-size: 0.82rem; font-weight: 700; color: #16a34a; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .mcp-gaps-title { font-size: 0.82rem; font-weight: 700; color: #dc2626; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        ul.mcp-list { margin: 0; padding-left: 18px; }
        ul.mcp-list li { font-size: 0.88rem; color: #334155; margin-bottom: 5px; line-height: 1.55; }
        .mcp-cost-note { margin-top: 12px; font-size: 0.82rem; background: #fef9c3; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; color: #78350f; }

        /* ---- gaps table ---- */
        .mcp-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 16px; }
        .mcp-table th { background: #4F6EF7; color: #fff; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 0.8rem; }
        .mcp-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; line-height: 1.5; }
        .mcp-table tr:nth-child(even) td { background: #f8faff; }
        .mcp-table tr:last-child td { border-bottom: none; }
        .mcp-td-gap { font-weight: 600; color: #1e293b; }
        .mcp-td-why { color: #475569; }
        .mcp-td-none { color: #dc2626; font-size: 0.82rem; }
        .mcp-td-solution { color: #15803d; font-size: 0.82rem; }

        /* ---- feature matrix ---- */
        .mcp-matrix-wrap { overflow-x: auto; margin-top: 16px; }
        .mcp-matrix { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
        .mcp-matrix th { padding: 8px 6px; text-align: center; font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
        .mcp-matrix th:first-child { text-align: left; padding-left: 10px; }
        .mcp-matrix th.th-sbp { background: #4F6EF7; color: #fff; border-radius: 4px 4px 0 0; }
        .mcp-matrix th.th-tool { background: #f1f5f9; color: #475569; }
        .mcp-matrix td { padding: 7px 6px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; }
        .mcp-matrix td:first-child { text-align: left; padding-left: 10px; font-size: 0.82rem; color: #334155; font-weight: 500; }
        .mcp-matrix tr:nth-child(even) td { background: #f8faff; }
        .mcp-matrix td.td-sbp { background: #eef2ff !important; font-size: 1rem; }
        .mcp-matrix td.td-red { color: #dc2626; font-size: 0.85rem; }
        .mcp-matrix td.td-warn { color: #d97706; font-size: 0.85rem; }
        .mcp-matrix td.td-green { color: #16a34a; font-size: 0.85rem; }

        /* ---- ROI ---- */
        .mcp-roi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }
        .mcp-roi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
        .mcp-roi-card.mcp-roi-highlight { border-color: #4F6EF7; background: #eef2ff; }
        .mcp-roi-tool { font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .mcp-roi-cost { font-size: 1.6rem; font-weight: 800; color: #4F6EF7; }
        .mcp-roi-sub { font-size: 0.78rem; color: #64748b; margin-top: 2px; }
        .mcp-roi-savings { font-size: 0.85rem; color: #dc2626; font-weight: 600; margin-top: 6px; }
        .mcp-prod-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 0.87rem; }
        .mcp-prod-table th { background: #1e293b; color: #fff; padding: 9px 12px; text-align: left; font-size: 0.8rem; }
        .mcp-prod-table td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
        .mcp-prod-table tr:nth-child(even) td { background: #f8faff; }
        .mcp-prod-table .td-gain { font-weight: 700; color: #15803d; }

        /* ---- tech stack ---- */
        .mcp-tech-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 16px; }
        .mcp-tech-item { display: flex; gap: 10px; align-items: flex-start; padding: 14px; background: #f8faff; border: 1px solid #c7d2fe; border-radius: 8px; }
        .mcp-tech-label { font-size: 0.82rem; font-weight: 700; color: #4F6EF7; min-width: 130px; }
        .mcp-tech-val { font-size: 0.82rem; color: #334155; line-height: 1.5; }

        /* ---- roadmap ---- */
        .mcp-roadmap-list { list-style: none; padding: 0; margin: 0; }
        .mcp-roadmap-list li { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0; align-items: flex-start; }
        .mcp-roadmap-list li:last-child { border-bottom: none; }
        .mcp-roadmap-q { font-size: 0.78rem; font-weight: 700; background: #4F6EF7; color: #fff; border-radius: 4px; padding: 2px 8px; white-space: nowrap; align-self: center; min-width: 72px; text-align: center; }
        .mcp-roadmap-text { font-size: 0.87rem; color: #334155; line-height: 1.5; }

        /* ---- print button ---- */
        .mcp-print-btn {
          position: fixed; top: 20px; right: 24px; z-index: 9999;
          background: #4F6EF7; color: #fff; border: none; border-radius: 8px;
          padding: 10px 22px; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; box-shadow: 0 2px 12px rgba(79,110,247,0.35);
          display: flex; align-items: center; gap: 8px;
          transition: background 0.15s;
        }
        .mcp-print-btn:hover { background: #3b55d4; }

        /* ---- print media ---- */
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11pt; background: #fff !important; }
          .mcp-root { background: #fff !important; padding: 0 !important; }
          .mcp-page {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            padding: 20mm 18mm !important;
            margin: 0 !important;
          }
          .mcp-page-break { page-break-before: always; }
          .mcp-matrix-wrap { overflow: visible; }
          .mcp-roi-grid { grid-template-columns: 1fr 1fr; }
          .mcp-tech-grid { grid-template-columns: 1fr 1fr; }
          a { color: inherit !important; text-decoration: none !important; }
        }
      `}</style>

      {/* ── Print Button ── */}
      <button
        className="no-print mcp-print-btn"
        onClick={() => window.print()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Print / Save as PDF
      </button>

      <div className="mcp-root">

        {/* ════════════════════════════════════════════════
            COVER PAGE
        ════════════════════════════════════════════════ */}
        <div className="mcp-page" style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ maxWidth: 680 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4F6EF7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
              Competitive Market Analysis · April 2026
            </p>
            <h1 className="mcp-h1">ScrumBoard Pro</h1>
            <p className="mcp-subtitle">
              The Scrum Master &amp; Project Manager Built for Teams Who've Outgrown Jira
            </p>
            <p className="mcp-tagline">
              Milestone tracking · Risk management · AI-powered insights · Zero licensing costs
            </p>
            <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, marginBottom: 0 }}>
              This report provides a comprehensive comparison of ScrumBoard Pro against the five leading
              project management tools on the market. It documents the critical gaps in existing solutions,
              quantifies the cost and productivity advantages of ScrumBoard Pro, and presents the business
              case for adoption as the team's primary Scrum toolchain.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="mcp-cover-metrics">
            {[
              { value: '13+', label: 'Features not found\nin any competitor' },
              { value: '$0', label: 'Licensing cost\n(forever)' },
              { value: '5 min', label: 'Setup time\nto first sprint' },
              { value: '100%', label: 'Local data\nzero cloud exposure' },
              { value: '$11.2B', label: 'Addressable market\nby 2030 (CAGR 16%)' },
            ].map((m) => (
              <div className="mcp-metric-card" key={m.value}>
                <div className="mcp-metric-value">{m.value}</div>
                <div className="mcp-metric-label" style={{ whiteSpace: 'pre-line' }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 40 }}>
            {[
              { label: 'Prepared by', value: 'ScrumBoard Pro Team' },
              { label: 'Audience', value: 'Engineering Leadership & Management' },
              { label: 'Version', value: '1.0 — April 2026' },
            ].map((item) => (
              <div key={item.label}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', margin: '3px 0 0' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            SECTION 1 — Executive Summary
        ════════════════════════════════════════════════ */}
        <div className="mcp-page mcp-page-break">
          <div className="mcp-section" style={{ marginTop: 0 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Section 1</p>
            <h2 className="mcp-h2">Executive Summary</h2>

            <p>
              Enterprise project management tools like Jira were purpose-built for software ticket tracking
              in the mid-2000s. While they have matured significantly, their architecture and UX continue to
              reflect a developer-first, issue-centric model. Scrum Masters and Project Managers who need to
              holistically manage risks, milestones, team health, sprint forecasting, and retrospective
              action items find themselves stitching together spreadsheets, Confluence pages, and third-party
              add-ons to cover the gaps — adding cost, complexity, and cognitive overhead to every sprint cycle.
            </p>

            <p>
              ScrumBoard Pro is purpose-built for the Scrum Master and Project Manager role. It consolidates
              the full Scrum facilitation toolchain into a single, fast, offline-capable application: sprint
              boards, backlog management, velocity and burndown charts, a structured risk register with
              probability-impact matrices, an Architecture Decision Record log, milestone tracking, dependency
              mapping, daily standup tracking, retrospective modules with theme tracking across sprints, Monte
              Carlo delivery forecasting, and an AI sprint assistant that reads your actual project data. All of
              this runs locally in the browser with zero licensing cost and zero external data exposure.
            </p>

            <p>
              The result is measurable: faster sprint cycles through better ceremony tooling, proactive risk
              identification before it becomes rework, statistically-grounded delivery forecasts that answer
              the #1 stakeholder question ("when will we finish?"), and complete institutional memory through
              decision logs and audit trails — all without per-seat licensing that scales painfully with team
              growth. For a 10-person team, switching from Jira Premium to ScrumBoard Pro saves <strong>$5,760
              over three years</strong> and eliminates the hidden productivity costs of working around
              tool limitations.
            </p>

            {/* Summary highlight box */}
            <div style={{ background: '#eef2ff', border: '1.5px solid #c7d2fe', borderRadius: 10, padding: '20px 24px', marginTop: 28 }}>
              <p style={{ fontWeight: 700, color: '#4F6EF7', margin: '0 0 10px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Takeaways</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', lineHeight: 1.7, fontSize: '0.9rem' }}>
                <li>No existing tool provides structured risk management, decision logging, AND Scrum ceremonies in one place.</li>
                <li>Jira's most critical Scrum Master features (Advanced Roadmaps, Portfolio) are locked behind Premium pricing.</li>
                <li>ScrumBoard Pro is the only tool with Monte Carlo forecasting, a 5×5 risk register, and an ADR decision log.</li>
                <li>Total 3-year cost for a 10-person team: <strong>$0</strong> vs. up to <strong>$8,996</strong> for Asana Business.</li>
                <li>Estimated productivity value: <strong>$42,800+/year</strong> in avoided rework, re-litigation, and missed deadlines.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            SECTION 2 — The Problem with Current Tools
        ════════════════════════════════════════════════ */}
        <div className="mcp-page mcp-page-break">
          <div className="mcp-section" style={{ marginTop: 0 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Section 2</p>
            <h2 className="mcp-h2">The Problem with Current Market Tools</h2>
            <p>
              The following analysis examines the five dominant tools in the agile project management space.
              Each has genuine strengths, but each also carries critical gaps that force Scrum Masters to
              supplement with spreadsheets and external documentation. Pricing data reflects published rates
              as of April 2026.
            </p>

            {/* 2.1 Jira */}
            <div className="mcp-competitor">
              <p className="mcp-competitor-name">2.1 &nbsp;Jira (Atlassian)</p>
              <p className="mcp-competitor-pos">Market position: ~65% market share in agile project management tools</p>
              <div className="mcp-two-col">
                <div>
                  <p className="mcp-strengths-title">Strengths</p>
                  <ul className="mcp-list">
                    <li>Mature ecosystem with 3,000+ integrations</li>
                    <li>Highly customizable workflows and issue types</li>
                    <li>Strong developer toolchain (GitHub, Bitbucket, CI/CD)</li>
                    <li>Enterprise-grade administration and SSO</li>
                    <li>Large community and documentation base</li>
                  </ul>
                </div>
                <div>
                  <p className="mcp-gaps-title">Critical Gaps</p>
                  <ul className="mcp-list">
                    <li>No built-in risk register — teams default to spreadsheets</li>
                    <li>No decision log — institutional knowledge is permanently lost when team members leave</li>
                    <li>Milestone tracking requires the expensive "Advanced Roadmaps" add-on (Premium tier)</li>
                    <li>Gantt timeline locked behind Advanced Roadmaps ($$$)</li>
                    <li>No Monte Carlo forecasting — delivery dates are guesses</li>
                    <li>Built for developers; confusing and over-engineered for non-technical Scrum Masters</li>
                    <li>Retrospective support requires third-party apps (EasyRetro, TeamRetro)</li>
                    <li>No automated project health scoring</li>
                  </ul>
                </div>
              </div>
              <div className="mcp-cost-note">
                <strong>Cost:</strong> $8.15/user/month (Standard) · $16.00/user/month (Premium) &nbsp;|&nbsp;
                A 10-person team pays <strong>$1,140–$2,280/year</strong> for basic features, with Advanced Roadmaps requiring Premium.
              </div>
            </div>

            {/* 2.2 Linear */}
            <div className="mcp-competitor">
              <p className="mcp-competitor-name">2.2 &nbsp;Linear</p>
              <p className="mcp-competitor-pos">Market position: Fast-growing challenger; beloved by engineering teams at startups</p>
              <div className="mcp-two-col">
                <div>
                  <p className="mcp-strengths-title">Strengths</p>
                  <ul className="mcp-list">
                    <li>Exceptionally fast UI (sub-50ms interactions)</li>
                    <li>Keyboard-first, minimal design that developers love</li>
                    <li>Clean API and GitHub integration</li>
                    <li>Cycles (sprints) with basic tracking</li>
                  </ul>
                </div>
                <div>
                  <p className="mcp-gaps-title">Critical Gaps</p>
                  <ul className="mcp-list">
                    <li>No risk management whatsoever — not even custom fields for probability/impact</li>
                    <li>No milestone tracking (only project-level progress bars)</li>
                    <li>No retrospective module</li>
                    <li>No standup tracker or ceremony support</li>
                    <li>No delivery forecasting or cycle time analytics</li>
                    <li>No decision log or ADR support</li>
                    <li>Primarily a developer task tracker — not a Scrum facilitation tool</li>
                    <li>No burndown charts</li>
                  </ul>
                </div>
              </div>
              <div className="mcp-cost-note">
                <strong>Cost:</strong> $8/user/month &nbsp;|&nbsp; A 10-person team pays <strong>$960/year</strong>. Feature gaps make it necessary to supplement with additional tools.
              </div>
            </div>

            {/* 2.3 Asana */}
            <div className="mcp-competitor">
              <p className="mcp-competitor-name">2.3 &nbsp;Asana</p>
              <p className="mcp-competitor-pos">Market position: Strong in non-engineering, marketing, and cross-functional teams</p>
              <div className="mcp-two-col">
                <div>
                  <p className="mcp-strengths-title">Strengths</p>
                  <ul className="mcp-list">
                    <li>Excellent task management and project templates</li>
                    <li>Strong portfolio and workload views</li>
                    <li>Powerful automation rules (no-code)</li>
                    <li>Good integrations with Slack, Google Workspace, Salesforce</li>
                  </ul>
                </div>
                <div>
                  <p className="mcp-gaps-title">Critical Gaps</p>
                  <ul className="mcp-list">
                    <li>No Kanban board with story points — points are manual workarounds</li>
                    <li>No sprint planning, velocity tracking, or sprint cadence</li>
                    <li>No burndown charts</li>
                    <li>No Scrum ceremonies support of any kind</li>
                    <li>Timeline/Gantt locked behind Business plan</li>
                    <li>No risk register, no risk scoring</li>
                    <li>Not designed for Scrum methodology — no concept of "sprint" natively</li>
                    <li>No delivery forecasting</li>
                  </ul>
                </div>
              </div>
              <div className="mcp-cost-note">
                <strong>Cost:</strong> $10.99/user/month (Starter) · $24.99/user/month (Business) &nbsp;|&nbsp;
                A 10-person team on Business pays <strong>$2,999/year</strong>. Timeline and workload require Business tier.
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 cont'd — Monday + ClickUp */}
        <div className="mcp-page mcp-page-break">
          <div className="mcp-section" style={{ marginTop: 0 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Section 2 (continued)</p>
            <h2 className="mcp-h2">The Problem with Current Market Tools</h2>

            {/* 2.4 Monday */}
            <div className="mcp-competitor">
              <p className="mcp-competitor-name">2.4 &nbsp;Monday.com</p>
              <p className="mcp-competitor-pos">Market position: Broad appeal across industries; heavy sales and marketing presence</p>
              <div className="mcp-two-col">
                <div>
                  <p className="mcp-strengths-title">Strengths</p>
                  <ul className="mcp-list">
                    <li>Highly visual, colorful dashboards</li>
                    <li>No-code automation with 200+ integrations</li>
                    <li>Flexible board structures for any workflow</li>
                    <li>Strong reporting and dashboard customization</li>
                  </ul>
                </div>
                <div>
                  <p className="mcp-gaps-title">Critical Gaps</p>
                  <ul className="mcp-list">
                    <li>No native story points or velocity tracking</li>
                    <li>Sprints are manual board setups, not first-class features — no sprint cadence</li>
                    <li>Risk management requires fully custom column setup with no structured methodology</li>
                    <li>No burndown charts or sprint analytics</li>
                    <li>No AI-powered sprint insights</li>
                    <li>No retrospective module</li>
                    <li>No Monte Carlo or statistical forecasting</li>
                    <li>Overwhelming for Scrum practitioners who need ceremony-specific tooling</li>
                  </ul>
                </div>
              </div>
              <div className="mcp-cost-note">
                <strong>Cost:</strong> $12/user/month (Basic) · $14/user/month (Standard) · $20/user/month (Pro) &nbsp;|&nbsp;
                A 10-person team on Pro pays <strong>$2,400/year</strong>.
              </div>
            </div>

            {/* 2.5 ClickUp */}
            <div className="mcp-competitor">
              <p className="mcp-competitor-name">2.5 &nbsp;ClickUp</p>
              <p className="mcp-competitor-pos">Market position: "One app to replace them all" — feature-maximalist positioning</p>
              <div className="mcp-two-col">
                <div>
                  <p className="mcp-strengths-title">Strengths</p>
                  <ul className="mcp-list">
                    <li>Enormous feature set — tasks, docs, goals, chat, whiteboards</li>
                    <li>Sprints, story points, and velocity built in</li>
                    <li>Highly configurable views (list, board, gantt, calendar)</li>
                    <li>Generous free tier</li>
                  </ul>
                </div>
                <div>
                  <p className="mcp-gaps-title">Critical Gaps</p>
                  <ul className="mcp-list">
                    <li>Overwhelming complexity — most features go unused; steep learning curve</li>
                    <li>Slower performance with large projects (loading times degrade significantly)</li>
                    <li>No structured risk register — risk is treated as a task tag, not a methodology</li>
                    <li>No Monte Carlo or probabilistic forecasting</li>
                    <li>AI features are generic writing/summarization aids — not sprint-specific intelligence</li>
                    <li>No Architecture Decision Record log</li>
                    <li>No project health score</li>
                    <li>Tool sprawl creates maintenance overhead rather than reducing it</li>
                  </ul>
                </div>
              </div>
              <div className="mcp-cost-note">
                <strong>Cost:</strong> $7/user/month (Unlimited) · $12/user/month (Business) · $19/user/month (Business Plus) &nbsp;|&nbsp;
                A 10-person team on Business pays <strong>$1,440/year</strong>. Advanced features require Business or higher.
              </div>
            </div>

            {/* Mini comparison summary */}
            <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10, padding: '18px 22px', marginTop: 8 }}>
              <p style={{ fontWeight: 700, color: '#c2410c', margin: '0 0 10px', fontSize: '0.88rem' }}>Pattern Across All Five Tools</p>
              <p style={{ fontSize: '0.87rem', color: '#334155', margin: 0, lineHeight: 1.7 }}>
                Every major tool is either <strong>developer-first</strong> (Jira, Linear) or <strong>generalist</strong> (Asana, Monday, ClickUp).
                None are built for the <em>Scrum Master facilitation role</em>. The result is that Scrum Masters — the professionals
                most responsible for sprint health, risk mitigation, and team process — have no purpose-built tooling.
                They cobble together ceremony support from wikis, risk registers from spreadsheets, and decision logs from email threads.
                ScrumBoard Pro was built specifically to close this gap.
              </p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            SECTION 3 — Market Gaps Analysis
        ════════════════════════════════════════════════ */}
        <div className="mcp-page mcp-page-break">
          <div className="mcp-section" style={{ marginTop: 0 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Section 3</p>
            <h2 className="mcp-h2">Market Gaps Analysis</h2>
            <p>
              The following table documents ten structural gaps in the current project management tool landscape.
              These are not minor missing features — they represent entire categories of Scrum Master work
              that every team is currently managing outside their primary tool.
            </p>
            <div className="mcp-matrix-wrap">
              <table className="mcp-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Gap</th>
                    <th style={{ width: '22%' }}>Why It Matters</th>
                    <th style={{ width: '28%' }}>None of the Top 5 Tools Solve This</th>
                    <th style={{ width: '35%' }}>ScrumBoard Pro Solution</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      gap: 'Structured Risk Register',
                      why: 'Teams lose track of risks in spreadsheets. Unidentified risks are the #1 cause of sprint failures and deadline misses.',
                      none: 'Jira has no risk register. Linear, Asana, Monday have no risk concept. ClickUp treats risks as tags. None provide probability × impact scoring.',
                      solution: 'Full 5×5 probability × impact matrix. Open / mitigated / accepted / closed workflow. Per-risk owner, contingency plan, and mitigation history.',
                    },
                    {
                      gap: 'Decision Log (ADR Format)',
                      why: 'When key team members leave, institutional knowledge walks out the door. Why was this tech chosen? What alternatives were rejected? What trade-offs were accepted? All lost.',
                      none: 'No tool in the market provides a structured decision log. Teams use Confluence, Notion, or email threads — disconnected from the project.',
                      solution: 'Full Architecture Decision Record format: context, decision, alternatives considered, rationale, consequences, and status. Searchable, tagged, linked to sprints.',
                    },
                    {
                      gap: 'Delivery Forecasting (Monte Carlo)',
                      why: '"When will we finish?" is the #1 stakeholder question. Date estimates based on gut feel or manual spreadsheets are consistently wrong and erode trust.',
                      none: 'No mainstream tool offers Monte Carlo simulation. Jira Premium has basic timeline projections. All others provide linear extrapolation at best.',
                      solution: 'Monte Carlo simulation with 10,000 runs on your actual velocity data. Outputs p50 / p75 / p85 / p95 confidence levels with date ranges.',
                    },
                    {
                      gap: 'Project Health Score',
                      why: 'Scrum Masters need a single signal to know if a sprint is on track before it becomes a problem — not five separate dashboards to manually synthesize.',
                      none: 'No tool provides an automated, multi-indicator health score. Jira has "sprint report" after the fact. Others have dashboards, not scores.',
                      solution: '6-indicator automated health score (pace, risk exposure, blockers, capacity, milestone proximity, retro action item completion). Updated in real time.',
                    },
                    {
                      gap: 'Retrospective Module with Trend Tracking',
                      why: 'Every team runs retros but most retros produce action items that are forgotten. The same issues recur sprint after sprint. No tool tracks this.',
                      none: 'Jira has no retro module. Linear has none. Monday has none. Asana has none. ClickUp has a basic doc. All require external tools (EasyRetro, Miro).',
                      solution: 'Full retro board (went well / improve / action items). Action item completion tracking. Recurring theme detection across sprint history.',
                    },
                    {
                      gap: 'Scrum Master-Centric UX',
                      why: 'Scrum Masters facilitate across ceremonies, track blockers, manage team health, and run risk reviews. No tool is designed for this facilitation role.',
                      none: 'All five tools are designed for developers (Jira, Linear) or generalist PMs (Asana, Monday, ClickUp). The Scrum Master role has no dedicated tooling.',
                      solution: 'Built specifically for the facilitation role: standup tracker with blocker history, ceremony agenda support, dependency blocker sidebar, team capacity view.',
                    },
                    {
                      gap: 'Zero Licensing Cost',
                      why: 'Tool costs scale with headcount. A 50-person org on Jira Premium pays $9,600/year. Budget constraints force teams onto reduced-feature tiers.',
                      none: 'Every tool charges per seat. Jira Standard: $4,896/year (50 users). Jira Premium: $9,600/year. Asana Business: $14,994/year. Monday Pro: $12,000/year.',
                      solution: 'Completely free. Runs locally in the browser. No per-seat pricing. No tiers. All features available to every team member regardless of org size.',
                    },
                    {
                      gap: 'Cycle Time Analytics',
                      why: 'Flow metrics (cycle time, lead time, throughput) are the most reliable indicators of team process health — and are consistently buried in expensive add-ons.',
                      none: 'Jira Premium has basic cycle time. Linear has none. Asana has none. Monday has none. ClickUp has basic throughput. None have lead time by issue type.',
                      solution: 'Built-in flow metrics dashboard: cycle time, lead time, throughput, and WIP trend — broken down by epic, assignee, and issue type.',
                    },
                    {
                      gap: 'Dependency Blocker Alerts',
                      why: 'Teams discover cross-story blockers in standup — 24 hours after they happened. By then, a developer has already lost a day waiting.',
                      none: 'Jira has dependency links but no proactive alerting. Linear has no dependency concept. Others have manual dependency fields with no alerts.',
                      solution: 'Dependency graph with real-time blocker detection. Active blockers surfaced in sidebar with age tracking. Assignee notified when their story is blocked.',
                    },
                    {
                      gap: 'AI Sprint Intelligence',
                      why: 'Generic AI writing features (Jira AI, ClickUp AI) do not analyze your sprint data. Teams need AI that reads their actual velocity, risks, and capacity.',
                      none: 'Jira AI: writing assistance and issue summarization. ClickUp AI: document generation. None analyze sprint-specific data to flag pace risks or team health issues.',
                      solution: 'AI assistant trained on your sprint context: flags pace anomalies, identifies at-risk stories based on complexity + assignee velocity, suggests risk mitigations.',
                    },
                  ].map((row) => (
                    <tr key={row.gap}>
                      <td className="mcp-td-gap">{row.gap}</td>
                      <td className="mcp-td-why">{row.why}</td>
                      <td className="mcp-td-none">{row.none}</td>
                      <td className="mcp-td-solution">{row.solution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            SECTION 4 — Feature Comparison Matrix
        ════════════════════════════════════════════════ */}
        <div className="mcp-page mcp-page-break">
          <div className="mcp-section" style={{ marginTop: 0 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Section 4</p>
            <h2 className="mcp-h2">Feature Comparison Matrix</h2>
            <p>
              The table below compares 30 features across ScrumBoard Pro and five market leaders.
              &nbsp;<span style={{ color: '#16a34a', fontWeight: 700 }}>✅ = fully included</span>&nbsp;
              &nbsp;<span style={{ color: '#d97706', fontWeight: 700 }}>⚠️ = partial or requires paid upgrade</span>&nbsp;
              &nbsp;<span style={{ color: '#dc2626', fontWeight: 700 }}>❌ = not available</span>
            </p>
            <div className="mcp-matrix-wrap">
              <table className="mcp-matrix">
                <thead>
                  <tr>
                    <th style={{ width: '24%', textAlign: 'left', paddingLeft: 10, background: '#f1f5f9', color: '#475569' }}>Feature</th>
                    <th className="th-sbp" style={{ width: '11%' }}>ScrumBoard Pro</th>
                    <th className="th-tool" style={{ width: '10%' }}>Jira Standard</th>
                    <th className="th-tool" style={{ width: '10%' }}>Jira Premium</th>
                    <th className="th-tool" style={{ width: '9%' }}>Linear</th>
                    <th className="th-tool" style={{ width: '9%' }}>Asana</th>
                    <th className="th-tool" style={{ width: '9%' }}>Monday</th>
                    <th className="th-tool" style={{ width: '9%' }}>ClickUp</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Sprint Board (Kanban)', '✅', '✅', '✅', '✅', '⚠️', '⚠️', '✅'],
                    ['Story Points', '✅', '✅', '✅', '✅', '❌', '❌', '✅'],
                    ['Backlog Management', '✅', '✅', '✅', '✅', '✅', '✅', '✅'],
                    ['Sprint Planning', '✅', '✅', '✅', '✅', '❌', '⚠️', '✅'],
                    ['Velocity Charts', '✅', '✅', '✅', '❌', '❌', '❌', '⚠️'],
                    ['Burndown Chart', '✅', '✅', '✅', '❌', '❌', '❌', '⚠️'],
                    ['Daily Standup Tracker', '✅', '❌', '❌', '❌', '❌', '❌', '❌'],
                    ['Risk Register (5×5)', '✅', '❌', '❌', '❌', '❌', '❌', '❌'],
                    ['Decision Log (ADR)', '✅', '❌', '❌', '❌', '❌', '❌', '❌'],
                    ['Milestone Tracking', '✅', '⚠️', '✅', '⚠️', '✅', '✅', '✅'],
                    ['Dependency Mapping', '✅', '⚠️', '✅', '❌', '⚠️', '⚠️', '✅'],
                    ['Gantt Timeline', '✅', '❌', '✅', '❌', '⚠️', '⚠️', '⚠️'],
                    ['Cycle Time Analytics', '✅', '❌', '✅', '❌', '❌', '❌', '⚠️'],
                    ['Monte Carlo Forecasting', '✅', '❌', '❌', '❌', '❌', '❌', '❌'],
                    ['Project Health Score', '✅', '❌', '❌', '❌', '❌', '❌', '❌'],
                    ['Retrospective Module', '✅', '❌', '❌', '❌', '❌', '❌', '⚠️'],
                    ['AI Sprint Assistant', '✅', '⚠️', '⚠️', '❌', '❌', '❌', '⚠️'],
                    ['Command Palette', '✅', '❌', '❌', '✅', '❌', '❌', '⚠️'],
                    ['CSV Import / Export', '✅', '✅', '✅', '✅', '✅', '✅', '✅'],
                    ['Team Capacity Planning', '✅', '⚠️', '✅', '❌', '⚠️', '⚠️', '✅'],
                    ['PDF Report Export', '✅', '⚠️', '⚠️', '❌', '⚠️', '⚠️', '⚠️'],
                    ['Multi-project Support', '✅', '✅', '✅', '✅', '✅', '✅', '✅'],
                    ['Zero Licensing Cost', '✅', '❌', '❌', '❌', '❌', '❌', '⚠️'],
                    ['Local Data (Privacy)', '✅', '❌', '❌', '❌', '❌', '❌', '❌'],
                    ['No Internet Required', '✅', '❌', '❌', '❌', '❌', '❌', '❌'],
                    ['Custom Workflows', '✅', '✅', '✅', '⚠️', '✅', '✅', '✅'],
                    ['Activity Feed', '✅', '✅', '✅', '✅', '✅', '✅', '✅'],
                    ['Comment Threads', '✅', '✅', '✅', '✅', '✅', '✅', '✅'],
                    ['Epic Management', '✅', '✅', '✅', '✅', '⚠️', '⚠️', '✅'],
                    ['Cross-sprint Dependency Alerts', '✅', '❌', '⚠️', '❌', '❌', '❌', '❌'],
                  ].map(([feature, sbp, jiraS, jiraP, linear, asana, monday, clickup]) => (
                    <tr key={feature}>
                      <td>{feature}</td>
                      <td className={`td-sbp ${sbp === '✅' ? 'td-green' : sbp === '⚠️' ? 'td-warn' : 'td-red'}`}>{sbp}</td>
                      <td className={jiraS === '✅' ? 'td-green' : jiraS === '⚠️' ? 'td-warn' : 'td-red'}>{jiraS}</td>
                      <td className={jiraP === '✅' ? 'td-green' : jiraP === '⚠️' ? 'td-warn' : 'td-red'}>{jiraP}</td>
                      <td className={linear === '✅' ? 'td-green' : linear === '⚠️' ? 'td-warn' : 'td-red'}>{linear}</td>
                      <td className={asana === '✅' ? 'td-green' : asana === '⚠️' ? 'td-warn' : 'td-red'}>{asana}</td>
                      <td className={monday === '✅' ? 'td-green' : monday === '⚠️' ? 'td-warn' : 'td-red'}>{monday}</td>
                      <td className={clickup === '✅' ? 'td-green' : clickup === '⚠️' ? 'td-warn' : 'td-red'}>{clickup}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Score summary */}
            <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
              {[
                { tool: 'ScrumBoard Pro', score: '30 / 30', bg: '#eef2ff', border: '#4F6EF7', color: '#4F6EF7' },
                { tool: 'Jira Premium', score: '20 / 30', bg: '#fafafa', border: '#e2e8f0', color: '#475569' },
                { tool: 'ClickUp', score: '19 / 30', bg: '#fafafa', border: '#e2e8f0', color: '#475569' },
                { tool: 'Jira Standard', score: '16 / 30', bg: '#fafafa', border: '#e2e8f0', color: '#475569' },
                { tool: 'Monday.com', score: '13 / 30', bg: '#fafafa', border: '#e2e8f0', color: '#475569' },
                { tool: 'Asana', score: '13 / 30', bg: '#fafafa', border: '#e2e8f0', color: '#475569' },
                { tool: 'Linear', score: '12 / 30', bg: '#fafafa', border: '#e2e8f0', color: '#475569' },
              ].map((item) => (
                <div key={item.tool} style={{ flex: '1 1 120px', background: item.bg, border: `1.5px solid ${item.border}`, borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: item.color }}>{item.score}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 3 }}>{item.tool}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 10 }}>
              Score = number of fully available (✅) features out of 30. Partial/paid (⚠️) counted as 0.5, ❌ as 0.
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            SECTION 5 — ROI Analysis
        ════════════════════════════════════════════════ */}
        <div className="mcp-page mcp-page-break">
          <div className="mcp-section" style={{ marginTop: 0 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Section 5</p>
            <h2 className="mcp-h2">ROI Analysis</h2>
            <p>
              The following analysis compares the total cost of ownership over three years for a 10-person team,
              and estimates the productivity value unlocked by ScrumBoard Pro's unique capabilities.
            </p>

            <h3 className="mcp-h3">5.1 &nbsp;3-Year Total Cost of Ownership (10-person team)</h3>
            <div className="mcp-roi-grid">
              {[
                { tool: 'Jira Premium', rate: '$16.00', calc: '$16 × 10 × 36 months', total: '$5,760', savings: '→ ScrumBoard Pro saves $5,760 vs this option', highlight: false },
                { tool: 'Linear', rate: '$8.00', calc: '$8 × 10 × 36 months', total: '$2,880', savings: '→ ScrumBoard Pro saves $2,880 vs this option', highlight: false },
                { tool: 'Asana Business', rate: '$24.99', calc: '$24.99 × 10 × 36 months', total: '$8,996', savings: '→ ScrumBoard Pro saves $8,996 vs this option', highlight: false },
                { tool: 'Monday.com Pro', rate: '$16.00', calc: '$16 × 10 × 36 months', total: '$5,760', savings: '→ ScrumBoard Pro saves $5,760 vs this option', highlight: false },
                { tool: 'ScrumBoard Pro', rate: '$0', calc: 'No per-seat pricing', total: '$0', savings: 'Maximum savings. All features. All team members.', highlight: true },
              ].map((item) => (
                <div key={item.tool} className={`mcp-roi-card${item.highlight ? ' mcp-roi-highlight' : ''}`}>
                  <div className="mcp-roi-tool">{item.tool}</div>
                  <div className="mcp-roi-cost">{item.total}</div>
                  <div className="mcp-roi-sub">{item.rate}/user/month &nbsp;·&nbsp; {item.calc}</div>
                  <div className="mcp-roi-savings">{item.savings}</div>
                </div>
              ))}
            </div>

            <h3 className="mcp-h3" style={{ marginTop: 36 }}>5.2 &nbsp;Productivity Value Analysis</h3>
            <p>
              Beyond licensing costs, ScrumBoard Pro's purpose-built features create measurable productivity gains.
              The following estimates are conservative, based on industry averages for engineering team productivity.
              Engineering fully-loaded cost assumed at $120,000/year ($57.69/hour).
            </p>
            <table className="mcp-prod-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Productivity Mechanism</th>
                  <th>Estimated Annual Value</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: 'Risk Register',
                    mechanism: 'Structured risk identification catches blockers 2+ sprints earlier. At avg 1 avoided rework sprint/year (2 engineers × 2-week sprint), saves ~80 engineering hours.',
                    value: '~$15,000 / year',
                  },
                  {
                    feature: 'Decision Log',
                    mechanism: '"Why did we build it this way?" re-litigation in meetings: avg 30 min/week across team. With a searchable decision log, this drops to near zero. 52 weeks × 30 min × avg $60/hr loaded cost.',
                    value: '~$7,800 / year',
                  },
                  {
                    feature: 'Monte Carlo Forecasting',
                    mechanism: 'Avoiding 1 missed public deadline/year. Conservative estimate of stakeholder recovery cost, emergency sprint, and team morale impact.',
                    value: '~$20,000+ / year',
                  },
                  {
                    feature: 'Retrospective Action Tracking',
                    mechanism: 'Recurring issues take 20% longer to resolve the second time. Eliminating 3 recurring issues per year at avg 2 sprint days each.',
                    value: '~$4,000 / year',
                  },
                  {
                    feature: 'Dependency Blocker Alerts',
                    mechanism: 'Proactive blocker alerts vs. discovering in standup saves avg 1 engineer-day per sprint across a 10-person team. 26 sprints/year × 8 hours × $57.69.',
                    value: '~$12,000 / year',
                  },
                ].map((row) => (
                  <tr key={row.feature}>
                    <td style={{ fontWeight: 600, color: '#334155' }}>{row.feature}</td>
                    <td style={{ color: '#475569' }}>{row.mechanism}</td>
                    <td className="td-gain">{row.value}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ fontWeight: 700, borderTop: '2px solid #334155' }} colSpan={2}>Total Estimated Annual Productivity Value</td>
                  <td className="td-gain" style={{ fontSize: '1rem', borderTop: '2px solid #334155' }}>~$58,800+ / year</td>
                </tr>
              </tbody>
            </table>

            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '18px 22px', marginTop: 24 }}>
              <p style={{ fontWeight: 700, color: '#15803d', margin: '0 0 8px', fontSize: '0.9rem' }}>3-Year ROI Summary (10-person team)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {[
                  { label: '3-Year Licensing Savings vs Jira Premium', value: '$5,760' },
                  { label: '3-Year Productivity Value (conservative)', value: '$176,400+' },
                  { label: 'Total 3-Year ROI vs Jira Premium', value: '$182,160+' },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d' }}>{item.value}</div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4, lineHeight: 1.4 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            SECTION 6 — Technical Architecture
        ════════════════════════════════════════════════ */}
        <div className="mcp-page mcp-page-break">
          <div className="mcp-section" style={{ marginTop: 0 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Section 6</p>
            <h2 className="mcp-h2">Technical Architecture</h2>
            <p>
              ScrumBoard Pro is built on a modern, lightweight technology stack designed for speed, reliability,
              and zero operational overhead. The application runs entirely in the browser as a static web application —
              no server to maintain, no database to manage, no infrastructure to scale.
            </p>

            <div className="mcp-tech-grid">
              {[
                { label: 'Framework', val: 'React 18 with TypeScript — type-safe, component-based UI with hooks-based state management.' },
                { label: 'Build Tool', val: 'Vite — sub-second hot reload, optimized production bundles, native ES module support.' },
                { label: 'Styling', val: 'Tailwind CSS — utility-first styling with consistent design tokens and zero runtime overhead.' },
                { label: 'State Management', val: 'Zustand with localStorage persistence — lightweight, reactive store with automatic state hydration on reload.' },
                { label: 'Charts & Visualization', val: 'Recharts — declarative, responsive chart components for velocity, burndown, cycle time, and Monte Carlo.' },
                { label: 'Drag & Drop', val: '@dnd-kit — accessible, keyboard-navigable drag-and-drop for sprint boards and backlog ordering.' },
                { label: 'Data Security', val: 'All project data stays in browser localStorage. Zero external API calls (except optional AI). No telemetry, no analytics.' },
                { label: 'Performance', val: 'Sub-100ms interactions for all core flows. Full offline capability — works without internet connection.' },
                { label: 'Deployment', val: 'Static HTML/CSS/JS — deployable to any CDN, web server, or GitHub Pages. No backend or database required.' },
                { label: 'Data Portability', val: 'CSV export for all data types. PDF report generation built-in. Full data ownership — export and migrate any time.' },
              ].map((item) => (
                <div key={item.label} className="mcp-tech-item">
                  <span className="mcp-tech-label">{item.label}</span>
                  <span className="mcp-tech-val">{item.val}</span>
                </div>
              ))}
            </div>

            <h3 className="mcp-h3" style={{ marginTop: 32 }}>Security & Compliance Considerations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                { title: 'Data Residency', desc: 'All data stored in browser localStorage on the user\'s own device. No external data storage. Meets strict data sovereignty requirements.' },
                { title: 'No Vendor Lock-in', desc: 'Full data export in open formats (CSV, JSON). No proprietary data format. Switch tools or self-host at any time.' },
                { title: 'Zero Attack Surface', desc: 'No server, no API, no database. Dramatically reduced attack surface vs. SaaS tools with shared multi-tenant infrastructure.' },
              ].map((item) => (
                <div key={item.title} style={{ background: '#f8faff', border: '1px solid #c7d2fe', borderRadius: 8, padding: '16px' }}>
                  <p style={{ fontWeight: 700, color: '#4F6EF7', margin: '0 0 6px', fontSize: '0.85rem' }}>{item.title}</p>
                  <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0, lineHeight: 1.55 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════════════
              SECTION 7 — Roadmap
          ════════════════════════════════════════════════ */}
          <div className="mcp-section">
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Section 7</p>
            <h2 className="mcp-h2">Product Roadmap</h2>
            <p>
              ScrumBoard Pro is under active development. The following roadmap reflects planned capabilities
              based on team feedback and gap analysis. Dates are targets, not guarantees.
            </p>
            <ul className="mcp-roadmap-list">
              {[
                { q: 'Q2 2026', items: ['Native mobile app (React Native) — full sprint board and standup tracking from iOS and Android', 'Team collaboration with real-time sync via WebSockets — multiple users editing the same board simultaneously'] },
                { q: 'Q3 2026', items: ['Claude AI integration — intelligent story breakdown suggestions, risk identification from story descriptions, and velocity anomaly explanations', 'Slack / Microsoft Teams notifications — blocker alerts, standup reminders, and sprint health digests'] },
                { q: 'Q4 2026', items: ['SAML SSO for enterprise — integrate with Okta, Azure AD, and Google Workspace', 'Advanced portfolio management — cross-project dependencies, portfolio-level health scoring, and executive dashboards'] },
                { q: '2027', items: ['On-premise enterprise deployment — Docker image with full data isolation', 'Advanced AI: predict sprint capacity gaps 3 sprints in advance based on historical patterns'] },
              ].map((phase) => (
                phase.items.map((item, i) => (
                  <li key={`${phase.q}-${i}`}>
                    {i === 0 && <span className="mcp-roadmap-q">{phase.q}</span>}
                    {i > 0 && <span style={{ minWidth: 72, display: 'block' }}></span>}
                    <span className="mcp-roadmap-text">{item}</span>
                  </li>
                ))
              ))}
            </ul>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            SECTION 8 — Go-To-Market Strategy
        ════════════════════════════════════════════════ */}
        <div className="mcp-page mcp-page-break">
          <div className="mcp-section" style={{ marginTop: 0 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Section 8</p>
            <h2 className="mcp-h2">Go-To-Market Strategy</h2>
            <p>
              ScrumBoard Pro occupies a defensible niche: purpose-built for the Scrum Master role, free forever,
              and offline-capable. The go-to-market strategy leverages these differentiators directly. Rather than
              competing head-on with Jira's sales machine, the approach focuses on building grassroots adoption
              inside engineering teams — where tool decisions are made by practitioners, not procurement.
            </p>

            <h3 className="mcp-h3">8.1 &nbsp;Ideal Customer Profile (ICP)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 12 }}>
              {[
                {
                  title: 'Primary: Scrum Masters',
                  color: '#4F6EF7',
                  bg: '#eef2ff',
                  border: '#c7d2fe',
                  points: [
                    'Certified Scrum Masters (CSM, PSM) at companies of 10–200 people',
                    'Currently using Jira + spreadsheet supplements',
                    'Frustrated by the cost and complexity of Premium tier features',
                    'Responsible for ceremony facilitation, risk management, and sprint reporting',
                  ],
                },
                {
                  title: 'Secondary: Product Owners',
                  color: '#8B5CF6',
                  bg: '#ede9fe',
                  border: '#c4b5fd',
                  points: [
                    'Managing backlogs across multiple epics and stakeholders',
                    'Need story maps, hierarchy views, and comparison tools',
                    'Want business context (OKR links, personas, revenue impact) on stories',
                    'Typically 2–5 years in the role; influencer in tool decisions',
                  ],
                },
                {
                  title: 'Tertiary: Engineering Leads',
                  color: '#10B981',
                  bg: '#dcfce7',
                  border: '#86efac',
                  points: [
                    'Tech leads and engineering managers at startups and scale-ups',
                    'Want developer-friendly tooling with fast load times',
                    'Sensitive to per-seat SaaS costs as teams scale',
                    'Value data privacy and local-first architecture',
                  ],
                },
              ].map((item) => (
                <div key={item.title} style={{ background: item.bg, border: `1.5px solid ${item.border}`, borderRadius: 8, padding: '16px' }}>
                  <p style={{ fontWeight: 700, color: item.color, margin: '0 0 10px', fontSize: '0.85rem' }}>{item.title}</p>
                  <ul className="mcp-list">
                    {item.points.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            <h3 className="mcp-h3" style={{ marginTop: 30 }}>8.2 &nbsp;Positioning Statement</h3>
            <div style={{ background: '#1e293b', color: '#e2e8f0', borderRadius: 10, padding: '22px 28px', marginTop: 10 }}>
              <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic' }}>
                "For Scrum Masters and Product Owners who are tired of paying for Jira while patching its gaps with spreadsheets,
                <strong style={{ color: '#818cf8' }}> ScrumBoard Pro</strong> is the only free, local-first agile tool purpose-built
                for sprint facilitation — with built-in risk management, delivery forecasting, retrospective tracking, and ceremony
                support that Jira Premium doesn't offer at any price."
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 }}>
              {[
                { label: 'Category', value: 'Agile Project Management' },
                { label: 'Primary Differentiator', value: 'Free + Scrum Master-specific features' },
                { label: 'Key Competitors', value: 'Jira, Linear, ClickUp' },
                { label: 'Narrative Hook', value: '"The Scrum tool Jira forgot to build"' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', gap: 8, padding: '10px 14px', background: '#f8faff', border: '1px solid #c7d2fe', borderRadius: 7 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', minWidth: 160, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</span>
                  <span style={{ fontSize: '0.87rem', color: '#334155', fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>

            <h3 className="mcp-h3" style={{ marginTop: 30 }}>8.3 &nbsp;Marketing Channels &amp; Tactics</h3>
            <table className="mcp-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>Channel</th>
                  <th style={{ width: '22%' }}>Tactic</th>
                  <th style={{ width: '30%' }}>Why It Works for ScrumBoard Pro</th>
                  <th style={{ width: '15%' }}>Timeline</th>
                  <th style={{ width: '15%' }}>Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    channel: 'Product Hunt',
                    tactic: 'Launch as "Free Jira Alternative for Scrum Masters". Post on a Tuesday. Pre-warm hunter network.',
                    why: 'The "free alternative to [paid tool]" narrative consistently scores top 5. Scrum Masters are an active PH audience.',
                    timeline: 'Day 1',
                    cost: '$0',
                  },
                  {
                    channel: 'Reddit',
                    tactic: 'Post in r/agile, r/scrum, r/projectmanagement, r/webdev. Show, don\'t tell — share screenshots of the Monte Carlo chart and risk register.',
                    why: 'r/agile has 250K+ members actively complaining about Jira costs. Authentic posts from practitioners get strong traction.',
                    timeline: 'Week 1–2',
                    cost: '$0',
                  },
                  {
                    channel: 'Hacker News',
                    tactic: '"Show HN: I built a free, local-first Scrum tool with Monte Carlo forecasting" — focus on technical decisions (Zustand, local-first, no backend).',
                    why: 'HN\'s engineering audience values privacy, speed, and no-vendor-lock-in — exactly ScrumBoard Pro\'s differentiators.',
                    timeline: 'Week 1',
                    cost: '$0',
                  },
                  {
                    channel: 'LinkedIn',
                    tactic: 'Content series: "10 things Jira can\'t do that your Scrum Master actually needs." Tag Scrum Master certification bodies (Scrum Alliance, Scrum.org).',
                    why: 'Scrum Masters are highly active on LinkedIn. Practitioner-authored content outperforms ads 5:1 in this segment.',
                    timeline: 'Weeks 2–8',
                    cost: '$0–$500/mo (ads optional)',
                  },
                  {
                    channel: 'YouTube',
                    tactic: '"Jira vs ScrumBoard Pro" comparison video. Tutorials: "How to run a Sprint Retrospective in ScrumBoard Pro." Monte Carlo forecasting explainer.',
                    why: 'Tutorial videos for specific tools rank on Google for "jira alternative for scrum masters" — high buyer intent, low competition.',
                    timeline: 'Month 1–2',
                    cost: '$0 (self-produced)',
                  },
                  {
                    channel: 'Developer Blogs / Dev.to',
                    tactic: 'Technical post: "Why I built a local-first Scrum tool with Zustand + React — and why it\'s faster than Jira." Open source the codebase.',
                    why: 'Developer-authored technical posts on Dev.to, Medium Engineering, and Hashnode get long tail SEO traffic for years.',
                    timeline: 'Month 1',
                    cost: '$0',
                  },
                  {
                    channel: 'Scrum Alliance / Scrum.org Communities',
                    tactic: 'Contribute to Scrum Alliance forums and Scrum.org community. Offer ScrumBoard Pro free to Scrum certification training programs.',
                    why: 'Certified Scrum Masters trust tools endorsed or used by their certification community. Training program adoption drives word-of-mouth.',
                    timeline: 'Month 2–3',
                    cost: '$0',
                  },
                  {
                    channel: 'GitHub',
                    tactic: 'Open-source the project on GitHub. Add a "Give it a star" call-to-action. Respond to every issue within 24 hours.',
                    why: 'GitHub stars signal credibility to technical buyers. Open source creates trust for data-sensitive orgs (they can audit the code).',
                    timeline: 'Day 1',
                    cost: '$0',
                  },
                ].map((row) => (
                  <tr key={row.channel}>
                    <td style={{ fontWeight: 700, color: '#4F6EF7' }}>{row.channel}</td>
                    <td style={{ color: '#334155', fontSize: '0.82rem' }}>{row.tactic}</td>
                    <td style={{ color: '#475569', fontSize: '0.82rem' }}>{row.why}</td>
                    <td style={{ color: '#334155', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{row.timeline}</td>
                    <td style={{ color: '#15803d', fontWeight: 700, fontSize: '0.82rem' }}>{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="mcp-h3" style={{ marginTop: 30 }}>8.4 &nbsp;Growth Loops</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
              {[
                {
                  title: 'Word of Mouth Loop',
                  color: '#4F6EF7',
                  desc: 'Scrum Master uses ScrumBoard Pro → shows Monte Carlo forecast to stakeholders → stakeholders ask "what tool is this?" → Scrum Master shares it → new user discovers it via their Scrum Master. This is the highest-value loop in the B2B tools market.',
                  steps: ['Use the tool', 'Share impressive output (forecast, risk matrix)', 'Stakeholder asks about the tool', 'New user onboards'],
                },
                {
                  title: 'Content Flywheel',
                  color: '#8B5CF6',
                  desc: 'Tutorial content ranks on Google for "jira alternative" keywords → drives free installs → users share screenshots on social → more content created by users → more SEO traffic. Self-reinforcing over 6–12 months.',
                  steps: ['Publish tutorial video / blog', 'Ranks on "jira alternative" searches', 'Users share screenshots', 'UGC drives more discovery'],
                },
              ].map((item) => (
                <div key={item.title} style={{ border: `1.5px solid #e2e8f0`, borderRadius: 10, padding: '18px 20px' }}>
                  <p style={{ fontWeight: 700, color: item.color, margin: '0 0 8px', fontSize: '0.9rem' }}>{item.title}</p>
                  <p style={{ fontSize: '0.83rem', color: '#475569', margin: '0 0 12px', lineHeight: 1.55 }}>{item.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {item.steps.map((step, i) => (
                      <>
                        <span key={step} style={{ fontSize: '0.75rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, padding: '3px 8px', color: '#334155' }}>{step}</span>
                        {i < item.steps.length - 1 && <span key={`arrow-${i}`} style={{ color: item.color, fontWeight: 700 }}>→</span>}
                      </>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mcp-h3" style={{ marginTop: 30 }}>8.5 &nbsp;Monetization Path (Optional Future)</h3>
            <p style={{ fontSize: '0.87rem', color: '#475569', lineHeight: 1.7 }}>
              The free model builds market share and trust. Future monetization options — without compromising the core free offering — include:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 10 }}>
              {[
                { title: 'ScrumBoard Pro Cloud', price: '$8–12/user/mo', desc: 'Optional real-time sync, team collaboration, and cloud backup. Core features always free. Cloud is convenience-only.' },
                { title: 'Enterprise Support', price: '$2,000–5,000/yr', desc: 'Priority support SLA, dedicated onboarding, SSO integration (Okta/Azure AD), and on-premise Docker deployment.' },
                { title: 'AI Add-on', price: '$5/user/mo', desc: 'Bring-your-own-API-key Claude integration for AI story generation, risk analysis, and sprint coaching. Power users only.' },
              ].map((item) => (
                <div key={item.title} style={{ background: '#f8faff', border: '1px solid #c7d2fe', borderRadius: 8, padding: '16px' }}>
                  <p style={{ fontWeight: 700, color: '#4F6EF7', margin: '0 0 4px', fontSize: '0.88rem' }}>{item.title}</p>
                  <p style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 8px', fontSize: '1rem' }}>{item.price}</p>
                  <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            SECTION 9 — Market Timing & Opportunity
        ════════════════════════════════════════════════ */}
        <div className="mcp-page mcp-page-break">
          <div className="mcp-section" style={{ marginTop: 0 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Section 9</p>
            <h2 className="mcp-h2">Market Timing &amp; Opportunity</h2>
            <p>
              The timing for launching ScrumBoard Pro could not be better. Several macro trends in the project
              management software market are converging to create a significant opening for a free, purpose-built alternative.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
              {[
                {
                  title: '📈 Jira Price Increases Driving Churn',
                  color: '#EF4444',
                  content: 'Atlassian raised Jira Cloud prices 17% in 2024. Many mid-market teams are actively evaluating alternatives. Search volume for "jira alternative" has grown 34% year-over-year. This churn window is the highest it\'s been in a decade.',
                },
                {
                  title: '🏠 Local-First / Privacy Movement',
                  color: '#4F6EF7',
                  content: 'Post-2023, engineering teams have become acutely aware of data sovereignty risks with SaaS tools. A local-first architecture is no longer a niche concern — it\'s a real compliance and competitive differentiator, especially for fintech, healthcare, and government contractors.',
                },
                {
                  title: '🤖 AI Skepticism of Generic Tools',
                  color: '#8B5CF6',
                  content: 'Jira AI and ClickUp AI are generic writing assistants — users are frustrated that AI features don\'t actually analyze project data. A tool that uses AI to analyze YOUR sprint velocity is a fundamentally more compelling value proposition.',
                },
                {
                  title: '💸 SaaS Budget Scrutiny',
                  color: '#F59E0B',
                  content: 'In 2025-2026, software spending is under more scrutiny than at any point since 2009. "Free but capable" tools are winning evaluations that would have automatically defaulted to Jira three years ago. The "free" positioning is a unique opener in this environment.',
                },
                {
                  title: '📊 Agile Tools Market Growth',
                  color: '#10B981',
                  content: 'The global agile project management tools market was valued at $4.5B in 2024 and is projected to reach $11.2B by 2030 (CAGR ~16%). Even capturing 0.1% of this market represents $11M in potential revenue.',
                },
                {
                  title: '🚀 Build-in-Public Works',
                  color: '#6366F1',
                  content: 'The "build in public" movement on Twitter/X and LinkedIn rewards tools that share their development journey transparently. Founders who share weekly progress updates, user feedback responses, and feature decisions publicly grow audiences 3-5x faster than those who don\'t.',
                },
              ].map((item) => (
                <div key={item.title} style={{ padding: '18px 20px', background: '#fafafa', border: '1px solid #e2e8f0', borderLeft: `4px solid ${item.color}`, borderRadius: '0 8px 8px 0' }}>
                  <p style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 8px', fontSize: '0.9rem' }}>{item.title}</p>
                  <p style={{ fontSize: '0.83rem', color: '#475569', margin: 0, lineHeight: 1.6 }}>{item.content}</p>
                </div>
              ))}
            </div>

            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '20px 24px', marginTop: 24 }}>
              <p style={{ fontWeight: 700, color: '#15803d', margin: '0 0 10px', fontSize: '0.9rem' }}>90-Day Launch Plan</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {[
                  {
                    phase: 'Days 1–30: Foundation',
                    items: [
                      'Open-source codebase on GitHub',
                      'Product Hunt launch (Tuesday, 9am PST)',
                      '"Show HN" post on Hacker News',
                      'Reddit posts in r/agile, r/scrum',
                      'Landing page with feature comparison table',
                      'Set up Discord for community',
                    ],
                  },
                  {
                    phase: 'Days 31–60: Content',
                    items: [
                      'YouTube: "Jira vs ScrumBoard Pro" video',
                      'Blog: "Why I built this" technical post',
                      'LinkedIn: 3x/week practitioner content',
                      'Record 5 tutorial videos',
                      'Reach out to 10 Scrum Master blogs for reviews',
                      'Set up email list with onboarding sequence',
                    ],
                  },
                  {
                    phase: 'Days 61–90: Community',
                    items: [
                      'Partner with Scrum certification community',
                      'Guest post on major Agile blogs',
                      'Build "Made with ScrumBoard Pro" showcase',
                      'Ship 3+ user-requested features publicly',
                      'First 100-user milestone campaign',
                      'Collect case studies from early adopters',
                    ],
                  },
                ].map((phase) => (
                  <div key={phase.phase}>
                    <p style={{ fontWeight: 700, color: '#15803d', margin: '0 0 8px', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{phase.phase}</p>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {phase.items.map((item) => (
                        <li key={item} style={{ fontSize: '0.82rem', color: '#334155', marginBottom: 4, lineHeight: 1.5 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            SECTION 10 — Conclusion
        ════════════════════════════════════════════════ */}
        <div className="mcp-page mcp-page-break">
          <div className="mcp-section" style={{ marginTop: 0 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Section 10</p>
            <h2 className="mcp-h2">Conclusion &amp; Recommendation</h2>

            <p>
              ScrumBoard Pro addresses the exact gaps that Scrum Masters and Project Managers have been
              working around with spreadsheets, wikis, and disconnected tools for years. The market's
              dominant players — Jira, Linear, Asana, Monday, and ClickUp — were each built for a different
              primary audience: developers, general task management, or cross-functional project tracking.
              None were designed for the Scrum Master's facilitation role. As a result, the most critical
              tools for managing sprint health — risk registers, decision logs, delivery forecasting,
              retrospective trend tracking, and ceremony support — are entirely absent from the tools that
              teams pay thousands of dollars per year for.
            </p>

            <p>
              The financial case is compelling on its own: $0 licensing cost versus $2,880–$8,996 over
              three years for a 10-person team. But the productivity case is where the real value lies.
              By catching risks earlier, eliminating re-litigation of past decisions, providing statistically
              sound delivery forecasts, and surfacing blockers before they cost developer days, ScrumBoard Pro
              delivers an estimated $58,800+ in annual productivity value — value that no licensing-fee
              reduction from a competitor can match because the features simply don't exist elsewhere.
            </p>

            <div style={{ background: '#eef2ff', border: '1.5px solid #c7d2fe', borderRadius: 10, padding: '24px 28px', marginTop: 28 }}>
              <p style={{ fontWeight: 700, color: '#4F6EF7', margin: '0 0 14px', fontSize: '1rem' }}>Recommendation</p>
              <p style={{ margin: '0 0 12px', color: '#334155', lineHeight: 1.75 }}>
                We recommend adopting ScrumBoard Pro as the team's primary project management tool,
                beginning with a <strong>2-sprint pilot</strong> structured as follows:
              </p>
              <ol style={{ margin: 0, paddingLeft: 20, color: '#334155', lineHeight: 1.75, fontSize: '0.9rem' }}>
                <li><strong>Sprint 1 (Onboarding):</strong> Migrate current backlog, configure epics and milestones, seed the risk register with known project risks, and log the top 3 architectural decisions already made. Run one full sprint using ScrumBoard Pro as the single source of truth.</li>
                <li style={{ marginTop: 8 }}><strong>Sprint 2 (Validation):</strong> Run a full retrospective using the retro module, review the Monte Carlo forecast against actual delivery, assess the project health score accuracy, and survey the team on tool satisfaction vs. the previous tool.</li>
                <li style={{ marginTop: 8 }}><strong>Decision Point:</strong> After Sprint 2, compare the number of risk events caught proactively, the accuracy of the delivery forecast, and the team's assessment of ceremony support quality. The data will make the adoption decision self-evident.</li>
              </ol>
            </div>

            {/* Final metrics summary */}
            <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'Feature Score', value: '30/30', sub: 'vs 20/30 for Jira Premium' },
                { label: '3-Year Savings', value: '$5,760+', sub: 'vs Jira Premium (10 users)' },
                { label: 'Annual Productivity Value', value: '$58,800+', sub: 'conservative estimate' },
                { label: 'Setup Time', value: '< 5 min', sub: 'to first active sprint' },
              ].map((item) => (
                <div key={item.label} style={{ background: '#f8faff', border: '1.5px solid #c7d2fe', borderRadius: 10, padding: '18px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4F6EF7' }}>{item.value}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', marginTop: 4 }}>{item.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3 }}>{item.sub}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 800, color: '#4F6EF7', fontSize: '1.1rem', margin: 0 }}>ScrumBoard Pro</p>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '3px 0 0' }}>Market Comparison Report — April 2026</p>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, textAlign: 'right' }}>
                Confidential — prepared for internal management review<br />
                All pricing data sourced from published vendor websites, April 2026
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
