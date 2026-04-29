import { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, FileText, ClipboardList, Database, Download, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useScrumStore } from '../store/useScrumStore';
import { Priority, StoryStatus } from '../types';

// ─── CSV helpers ───────────────────────────────────────────────────────────────

function parseCSV(raw: string): string[][] {
  const rows: string[][] = [];
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let inQuote = false;
    let cur = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuote = !inQuote; }
      } else if (c === ',' && !inQuote) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

function detectSeparator(text: string): ',' | '\t' {
  const tabs = (text.match(/\t/g) ?? []).length;
  const commas = (text.match(/,/g) ?? []).length;
  return tabs > commas ? '\t' : ',';
}

function parseTabSeparated(raw: string): string[][] {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  return lines.filter((l) => l.trim()).map((l) => l.split('\t').map((c) => c.trim()));
}

// ─── Field mapping helpers ─────────────────────────────────────────────────────

const STORY_FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'storyPoints', label: 'Story Points' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'epicName', label: 'Epic Name' },
  { key: 'sprintName', label: 'Sprint Name' },
  { key: 'assigneeName', label: 'Assignee Name' },
  { key: '_skip', label: '— Skip —' },
] as const;

type FieldKey = typeof STORY_FIELDS[number]['key'];

function normalizePriority(v: string): Priority {
  const low = v.toLowerCase().trim();
  if (['critical', 'p0', 'highest'].includes(low)) return 'critical';
  if (['high', 'p1'].includes(low)) return 'high';
  if (['low', 'p3', 'lowest', 'minor'].includes(low)) return 'low';
  return 'medium';
}

function normalizeStatus(v: string): StoryStatus {
  const low = v.toLowerCase().trim();
  if (['done', 'closed', 'resolved', 'complete', 'completed'].includes(low)) return 'done';
  if (['in progress', 'in_progress', 'inprogress', 'wip', 'started'].includes(low)) return 'in_progress';
  if (['review', 'in review', 'code review', 'pr open'].includes(low)) return 'review';
  if (['to do', 'todo', 'open', 'new', 'selected for development'].includes(low)) return 'todo';
  return 'backlog';
}

// ─── Sample data ───────────────────────────────────────────────────────────────

const SAMPLE_CSV = `title,description,storyPoints,priority,status,epicName,sprintName,assigneeName
"Implement dark mode","Add a toggle to switch between light and dark themes",5,high,"To Do","Dashboard & Reporting","Sprint 5","Alice Chen"
"Fix login redirect bug","After OAuth login, users are redirected to 404",2,critical,"Done","User Authentication","Sprint 4","Bob Martinez"
"Add CSV export","Export table data to downloadable CSV format",3,medium,"In Progress","Dashboard & Reporting","Sprint 5","Carol Kim"
"Write unit tests for auth","Cover login, logout and token refresh with Jest tests",5,high,"To Do","User Authentication","Sprint 5","David Lee"
"API documentation","Create OpenAPI spec and Swagger UI for all endpoints",8,medium,"Backlog","API Integration","","Emma Wilson"`;

// ─── ImportPage ────────────────────────────────────────────────────────────────

type ImportMode = 'csv' | 'paste' | 'sample';

interface ImportResult {
  imported: number;
  epicsCreated: number;
  errors: string[];
}

export function ImportPage() {
  const { stories, sprints, epics, members, addStory, addEpic } = useScrumStore();

  const [mode, setMode] = useState<ImportMode>('csv');
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMap, setFieldMap] = useState<Record<number, FieldKey>>({});
  const [pasteText, setPasteText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Preview: first 5 data rows (row 0 = header)
  const previewRows = useMemo(() => rawRows.slice(1, 6), [rawRows]);

  function loadRows(rows: string[][]) {
    if (rows.length < 1) return;
    setRawRows(rows);
    const hdrs = rows[0];
    setHeaders(hdrs);
    // Auto-map headers
    const autoMap: Record<number, FieldKey> = {};
    hdrs.forEach((h, i) => {
      const low = h.toLowerCase().trim();
      if (['title', 'summary', 'name', 'story'].includes(low)) { autoMap[i] = 'title'; return; }
      if (['description', 'desc', 'detail', 'body'].includes(low)) { autoMap[i] = 'description'; return; }
      if (['points', 'story points', 'storypoints', 'sp', 'estimate'].includes(low)) { autoMap[i] = 'storyPoints'; return; }
      if (['priority', 'prio', 'severity'].includes(low)) { autoMap[i] = 'priority'; return; }
      if (['status', 'state', 'column'].includes(low)) { autoMap[i] = 'status'; return; }
      if (['epic', 'epic name', 'epicname', 'feature'].includes(low)) { autoMap[i] = 'epicName'; return; }
      if (['sprint', 'sprint name', 'iteration'].includes(low)) { autoMap[i] = 'sprintName'; return; }
      if (['assignee', 'assigneename', 'owner', 'reporter', 'assigned to'].includes(low)) { autoMap[i] = 'assigneeName'; return; }
      autoMap[i] = '_skip';
    });
    setFieldMap(autoMap);
    setImportResult(null);
  }

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      loadRows(parseCSV(text));
    };
    reader.readAsText(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  function handlePasteImport() {
    const sep = detectSeparator(pasteText);
    const rows = sep === '\t' ? parseTabSeparated(pasteText) : parseCSV(pasteText);
    loadRows(rows);
  }

  function loadSample() {
    loadRows(parseCSV(SAMPLE_CSV));
    setFileName('sample-jira-export.csv');
  }

  function doImport() {
    const dataRows = rawRows.slice(1);
    let imported = 0;
    let epicsCreated = 0;
    const errors: string[] = [];

    // Build local epic / sprint / member lookup
    const epicByName: Record<string, string> = {};
    epics.forEach((e) => { epicByName[e.title.toLowerCase()] = e.id; });
    const sprintByName: Record<string, string> = {};
    sprints.forEach((sp) => { sprintByName[sp.name.toLowerCase()] = sp.id; });
    const memberByName: Record<string, string> = {};
    members.forEach((m) => { memberByName[m.name.toLowerCase()] = m.id; });

    // Reverse mapping: col index → field key
    const colToField: Record<number, FieldKey> = fieldMap;

    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const row = dataRows[rowIdx];
      const mapped: Record<string, string> = {};
      headers.forEach((_, i) => {
        const fk = colToField[i] ?? '_skip';
        if (fk !== '_skip') mapped[fk] = row[i] ?? '';
      });

      const title = mapped['title']?.trim();
      if (!title) { errors.push(`Row ${rowIdx + 2}: missing title — skipped`); continue; }

      // Resolve epic
      let epicId = epics[0]?.id ?? '';
      if (mapped['epicName']) {
        const en = mapped['epicName'].trim().toLowerCase();
        if (epicByName[en]) {
          epicId = epicByName[en];
        } else if (mapped['epicName'].trim()) {
          // Create epic
          const newEpicId = `epic-import-${Date.now()}-${rowIdx}`;
          addEpic({
            title: mapped['epicName'].trim(),
            description: '',
            color: '#6B7280',
            priority: 'medium',
            ownerId: members[0]?.id ?? '',
          });
          // Note: addEpic generates its own id, but we need to look up after. Use a hack: fetch after.
          const created = epics.find((e) => e.title.toLowerCase() === mapped['epicName'].trim().toLowerCase());
          epicId = created?.id ?? epicId;
          epicByName[mapped['epicName'].trim().toLowerCase()] = epicId;
          epicsCreated++;
        }
      }

      // Resolve sprint
      let sprintId: string | undefined;
      if (mapped['sprintName']) {
        const sn = mapped['sprintName'].trim().toLowerCase();
        sprintId = sprintByName[sn];
      }

      // Resolve assignee
      let assigneeId: string | undefined;
      if (mapped['assigneeName']) {
        const an = mapped['assigneeName'].trim().toLowerCase();
        assigneeId = memberByName[an];
      }

      // Parse points
      let storyPoints = 3;
      if (mapped['storyPoints']) {
        const n = parseInt(mapped['storyPoints'], 10);
        storyPoints = isNaN(n) ? 3 : n;
      }

      const status = mapped['status'] ? normalizeStatus(mapped['status']) : 'backlog';
      const priority = mapped['priority'] ? normalizePriority(mapped['priority']) : 'medium';

      addStory({
        epicId,
        sprintId,
        assigneeId,
        title,
        description: mapped['description'] ?? '',
        acceptanceCriteria: [],
        storyPoints,
        priority,
        status: sprintId ? status : 'backlog',
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
        order: rowIdx,
      });
      imported++;
    }

    setImportResult({ imported, epicsCreated, errors });
  }

  // ── Export helpers ──────────────────────────────────────────────────────────

  function exportAllStories() {
    const headers = ['id', 'title', 'description', 'storyPoints', 'priority', 'status', 'epicId', 'sprintId', 'assigneeId', 'createdAt', 'completedAt'];
    const rows = stories.map((s) => headers.map((h) => {
      const v = (s as unknown as Record<string, unknown>)[h] ?? '';
      const str = String(v);
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }));
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV(csv, 'all-stories.csv');
  }

  function exportSprintReport() {
    const activeSprint = sprints.find((sp) => sp.status === 'active') ?? sprints.find((sp) => sp.status === 'completed');
    if (!activeSprint) { alert('No sprint to export.'); return; }
    const sprintStories = stories.filter((s) => s.sprintId === activeSprint.id);
    const headers = ['title', 'storyPoints', 'priority', 'status', 'assigneeId', 'completedAt'];
    const rows = sprintStories.map((s) => headers.map((h) => {
      const v = (s as unknown as Record<string, unknown>)[h] ?? '';
      const str = String(v);
      return str.includes(',') ? `"${str}"` : str;
    }));
    const csv = [`Sprint: ${activeSprint.name}`, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV(csv, `sprint-${activeSprint.name.replace(/\s+/g, '-').toLowerCase()}-report.csv`);
  }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const mappedFields = Object.values(fieldMap).filter((v) => v !== '_skip');
  const hasTitleMapped = mappedFields.includes('title');
  const canImport = rawRows.length > 1 && hasTitleMapped;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
          <Upload size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Data</h1>
          <p className="text-slate-500 text-sm">Import stories from CSV, Excel paste, or sample data</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        {(
          [
            { key: 'csv', label: 'CSV File', icon: FileText },
            { key: 'paste', label: 'Quick Paste', icon: ClipboardList },
            { key: 'sample', label: 'Sample Data', icon: Database },
          ] as { key: ImportMode; label: string; icon: React.ElementType }[]
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setMode(key); setRawRows([]); setImportResult(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              mode === key
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Mode: CSV */}
      {mode === 'csv' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Upload CSV File</h2>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
            }`}
          >
            <Upload size={28} className="mx-auto mb-3 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">Drag & drop a CSV file here</p>
            <p className="text-xs text-slate-400 mt-1">or click to browse</p>
            {fileName && <p className="mt-2 text-xs text-brand-600 font-medium">{fileName}</p>}
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        </div>
      )}

      {/* Mode: Paste */}
      {mode === 'paste' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Paste Table Data</h2>
          <p className="text-sm text-slate-500">Paste data copied from Excel, Google Sheets, or Jira. Tab-separated or comma-separated are both supported.</p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={8}
            placeholder="Paste your data here..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            onClick={handlePasteImport}
            disabled={!pasteText.trim()}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            Parse Data
          </button>
        </div>
      )}

      {/* Mode: Sample */}
      {mode === 'sample' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Load Sample Jira Export</h2>
          <p className="text-sm text-slate-500">Load 5 sample stories to see how the import process works.</p>
          <div className="bg-slate-50 rounded-xl p-3 font-mono text-xs text-slate-600 overflow-x-auto">
            <pre>{SAMPLE_CSV.split('\n').slice(0, 4).join('\n')}...</pre>
          </div>
          <button
            onClick={loadSample}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Load Sample Data
          </button>
        </div>
      )}

      {/* Preview + Field mapping */}
      {rawRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-base font-semibold text-slate-900">
            Preview & Field Mapping
            <span className="ml-2 text-sm text-slate-400 font-normal">({rawRows.length - 1} rows detected)</span>
          </h2>

          {/* Field mapping row */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Map CSV columns to story fields:</p>
            <div className="flex flex-wrap gap-3">
              {headers.map((h, i) => (
                <div key={i} className="flex flex-col gap-1 min-w-[130px]">
                  <span className="text-xs font-medium text-slate-600 truncate">{h || `Column ${i + 1}`}</span>
                  <select
                    value={fieldMap[i] ?? '_skip'}
                    onChange={(e) => setFieldMap((prev) => ({ ...prev, [i]: e.target.value as FieldKey }))}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
                  >
                    {STORY_FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview table */}
          {previewRows.length > 0 && (
            <div className="overflow-x-auto">
              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">First {previewRows.length} rows:</p>
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr className="bg-slate-50">
                    {headers.map((h, i) => (
                      <th key={i} className="border border-slate-200 px-3 py-1.5 text-left font-medium text-slate-600 whitespace-nowrap">
                        {h || `Col ${i + 1}`}
                        {fieldMap[i] && fieldMap[i] !== '_skip' && (
                          <span className="ml-1 text-brand-600">→ {STORY_FIELDS.find((f) => f.key === fieldMap[i])?.label}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-slate-50">
                      {row.map((cell, ci) => (
                        <td key={ci} className="border border-slate-100 px-3 py-1.5 text-slate-700 max-w-[160px] truncate">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!hasTitleMapped && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm">
              <AlertTriangle size={15} />
              Map at least the "Title" field to import stories.
            </div>
          )}

          <button
            onClick={doImport}
            disabled={!canImport}
            className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import {rawRows.length - 1} Stories
          </button>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className={`rounded-2xl border p-5 ${importResult.errors.length === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            {importResult.errors.length === 0
              ? <CheckCircle2 size={18} className="text-green-600" />
              : <AlertTriangle size={18} className="text-amber-600" />}
            <h3 className="font-semibold text-slate-800">Import Complete</h3>
          </div>
          <ul className="text-sm space-y-1 text-slate-700">
            <li><strong>{importResult.imported}</strong> stories imported</li>
            {importResult.epicsCreated > 0 && <li><strong>{importResult.epicsCreated}</strong> new epics created</li>}
          </ul>
          {importResult.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-amber-700 mb-1">Warnings:</p>
              <ul className="space-y-0.5">
                {importResult.errors.map((e, i) => (
                  <li key={i} className="flex items-start gap-1 text-xs text-amber-700">
                    <X size={11} className="mt-0.5 flex-shrink-0" /> {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Export section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Export Data</h2>
        <p className="text-sm text-slate-500 mb-4">Download your story data as CSV for use in other tools.</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportAllStories}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={15} />
            Export All Stories ({stories.length})
          </button>
          <button
            onClick={exportSprintReport}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={15} />
            Export Sprint Report (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}
