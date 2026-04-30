import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, AlertTriangle, CheckCircle2, Calendar,
  ChevronLeft, ChevronRight, Mic, Square,
  Users, Zap, Copy, CheckCheck, ExternalLink, Bot, Plane,
} from 'lucide-react';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { useScrumStore, useActiveSprint } from '../store/useScrumStore';
import { Avatar } from '../components/ui/Avatar';
import { getTodayISO } from '../lib/dateUtils';

// ─── Web Speech API types ───────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

declare global {
  interface Window {
    SpeechRecognition: AnySpeechRecognition;
    webkitSpeechRecognition: AnySpeechRecognition;
  }
}

// ─── Standup parser ─────────────────────────────────────────────────────────────

interface ParsedMemberNote {
  memberId: string;
  memberName: string;
  yesterday: string;
  today: string;
  blockers: string;
  hasBlocker: boolean;
  referencedStoryIds: string[];
}

function parseTranscript(
  transcript: string,
  members: ReturnType<typeof useScrumStore.getState>['members'],
  stories: ReturnType<typeof useScrumStore.getState>['stories'],
): ParsedMemberNote[] {
  const lower = transcript.toLowerCase();
  const lines = transcript.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
  const results: ParsedMemberNote[] = [];

  members.forEach(member => {
    const firstName = member.name.split(' ')[0].toLowerCase();
    const fullLower = member.name.toLowerCase();
    const mentioned = lower.includes(firstName) || lower.includes(fullLower);
    if (!mentioned) return;

    // Find the section of transcript mentioning this member
    const memberLines = lines.filter(line => {
      const l = line.toLowerCase();
      return l.includes(firstName) || l.includes(fullLower);
    });

    const contextStart = lower.indexOf(firstName);
    // Grab ~300 chars around the mention as context
    const context = transcript.slice(Math.max(0, contextStart - 20), contextStart + 400).toLowerCase();
    const contextLines = context.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);

    // Yesterday detection
    let yesterday = '';
    const yesterdayKeywords = ['yesterday', 'completed', 'finished', 'done with', 'wrapped up', 'worked on'];
    for (const line of [...memberLines, ...contextLines]) {
      const l = line.toLowerCase();
      if (yesterdayKeywords.some(k => l.includes(k))) {
        yesterday = line.replace(new RegExp(firstName, 'gi'), '').replace(new RegExp(fullLower, 'gi'), '').trim();
        if (yesterday.length > 5) break;
      }
    }

    // Today detection
    let today = '';
    const todayKeywords = ['today', 'will work', 'going to', 'planning to', 'working on', 'will be'];
    for (const line of [...memberLines, ...contextLines]) {
      const l = line.toLowerCase();
      if (todayKeywords.some(k => l.includes(k))) {
        today = line.replace(new RegExp(firstName, 'gi'), '').replace(new RegExp(fullLower, 'gi'), '').trim();
        if (today.length > 5) break;
      }
    }

    // Blocker detection
    let blockers = '';
    let hasBlocker = false;
    const blockerKeywords = ['blocked', 'blocker', 'stuck', 'waiting for', 'dependency', 'issue with', 'problem'];
    for (const line of [...memberLines, ...contextLines]) {
      const l = line.toLowerCase();
      if (blockerKeywords.some(k => l.includes(k))) {
        blockers = line.trim();
        hasBlocker = true;
        break;
      }
    }

    // Story detection
    const referencedStoryIds: string[] = [];
    stories.forEach(story => {
      const words = story.title.toLowerCase().split(' ').filter(w => w.length > 4);
      const matches = words.filter(w => lower.includes(w));
      if (matches.length >= 2) referencedStoryIds.push(story.id);
    });

    results.push({
      memberId: member.id,
      memberName: member.name,
      yesterday: yesterday || `[Not detected - please fill in]`,
      today: today || `[Not detected - please fill in]`,
      blockers,
      hasBlocker,
      referencedStoryIds,
    });
  });

  return results;
}

// ─── AI Listener Panel ──────────────────────────────────────────────────────────

function AIListenerPanel({ sprintId, date }: { sprintId: string; date: string }) {
  const { members, stories, settings, addStandup, addComment } = useScrumStore();
  const integrations = settings.integrations;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [parsed, setParsed] = useState<ParsedMemberNote[]>([]);
  const [applied, setApplied] = useState(false);
  const [slackStatus, setSlackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [teamsStatus, setTeamsStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<AnySpeechRecognition>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      let finalText = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += text + ' ';
        else interim = text;
      }
      if (finalText) setTranscript(prev => prev + finalText);
      setInterimText(interim);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      console.warn('Speech recognition error:', e.error);
      setIsListening(false);
    };

    rec.onend = () => { if (isListening) rec.start(); };

    recognitionRef.current = rec;
    return () => { rec.stop(); };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setInterimText('');
    setParsed([]);
    setApplied(false);
    recognitionRef.current.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText('');
    if (transcript.trim().length > 20) {
      setParsed(parseTranscript(transcript, members, stories));
    }
  }, [transcript, members, stories]);

  const applyNotes = () => {
    parsed.forEach(note => {
      addStandup({
        memberId: note.memberId,
        sprintId,
        date,
        yesterday: note.yesterday,
        today: note.today,
        blockers: note.blockers,
        hasBlocker: note.hasBlocker,
      });
      // Add comment to referenced stories
      note.referencedStoryIds.forEach(storyId => {
        addComment({
          storyId,
          authorId: note.memberId,
          body: `[Standup ${date}] ${note.today || note.yesterday}`,
        });
      });
    });
    setApplied(true);
  };

  const buildSlackPayload = () => {
    const lines = parsed.map(n =>
      `*${n.memberName}*\n✅ Yesterday: ${n.yesterday}\n🎯 Today: ${n.today}${n.hasBlocker ? `\n🚧 Blocker: ${n.blockers}` : ''}`
    ).join('\n\n');
    return {
      text: `📋 *Daily Standup Notes — ${date}*\n\n${lines || transcript.slice(0, 2000)}`,
    };
  };

  const buildTeamsPayload = () => {
    const lines = parsed.map(n =>
      `**${n.memberName}**\n- Yesterday: ${n.yesterday}\n- Today: ${n.today}${n.hasBlocker ? `\n- 🚧 Blocker: ${n.blockers}` : ''}`
    ).join('\n\n');
    return {
      type: 'message',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          body: [{ type: 'TextBlock', text: `Daily Standup — ${date}`, weight: 'Bolder', size: 'Medium' },
                 { type: 'TextBlock', text: lines || transcript.slice(0, 2000), wrap: true }],
        },
      }],
    };
  };

  const postToSlack = async () => {
    if (!integrations?.slack?.webhookUrl) return;
    setSlackStatus('sending');
    try {
      await fetch(integrations.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSlackPayload()),
      });
      setSlackStatus('sent');
    } catch { setSlackStatus('error'); }
  };

  const postToTeams = async () => {
    if (!integrations?.teams?.webhookUrl) return;
    setTeamsStatus('sending');
    try {
      await fetch(integrations.teams.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildTeamsPayload()),
      });
      setTeamsStatus('sent');
    } catch { setTeamsStatus('error'); }
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!supported) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>AI Listener not supported:</strong> Your browser doesn't support the Web Speech API. Use Chrome or Edge for voice recognition.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white/60 border-b border-indigo-200">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-indigo-900">AI Standup Listener</p>
          <p className="text-xs text-indigo-600">Listens to your call · Creates notes · Posts to Slack/Teams</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isListening && (
            <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Listening...
            </span>
          )}
          {!isListening ? (
            <button
              onClick={startListening}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Mic size={14} /> Start Listening
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <Square size={14} /> Stop & Analyze
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Live transcript */}
        {(transcript || isListening) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Live Transcript</p>
              {transcript && (
                <button onClick={copyTranscript} className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700">
                  {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <div className="bg-white rounded-xl border border-indigo-100 p-4 min-h-[80px] max-h-48 overflow-y-auto">
              <p className="text-sm text-slate-700 leading-relaxed">
                {transcript}
                {interimText && <span className="text-slate-400 italic">{interimText}</span>}
              </p>
              {!transcript && isListening && (
                <p className="text-slate-400 text-sm">Speak now — transcript will appear here...</p>
              )}
            </div>
          </div>
        )}

        {/* Parsed notes */}
        {parsed.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3">
              Detected Standup Notes ({parsed.length} members)
            </p>
            <div className="space-y-3">
              {parsed.map(note => {
                const member = members.find(m => m.id === note.memberId);
                return (
                  <div key={note.memberId} className={`bg-white rounded-xl border p-4 ${note.hasBlocker ? 'border-red-200' : 'border-indigo-100'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      {member && <Avatar initials={member.avatarInitials} color={member.avatarColor} size="sm" />}
                      <span className="text-sm font-semibold text-slate-800">{note.memberName}</span>
                      {note.hasBlocker && (
                        <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Blocker Detected</span>
                      )}
                      {note.referencedStoryIds.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          {note.referencedStoryIds.length} story ref{note.referencedStoryIds.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div><span className="font-medium text-slate-500">✅ Yesterday:</span> <span className="text-slate-700">{note.yesterday}</span></div>
                      <div><span className="font-medium text-slate-500">🎯 Today:</span> <span className="text-slate-700">{note.today}</span></div>
                      {note.hasBlocker && <div><span className="font-medium text-red-500">🚧 Blocker:</span> <span className="text-red-700">{note.blockers}</span></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        {(parsed.length > 0 || transcript) && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-indigo-200">
            {parsed.length > 0 && (
              <button
                onClick={applyNotes}
                disabled={applied}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  applied ? 'bg-green-100 text-green-700 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {applied ? <CheckCheck size={14} /> : <Zap size={14} />}
                {applied ? 'Notes Applied!' : 'Apply Notes & Update Stories'}
              </button>
            )}

            {integrations?.slack?.enabled && integrations.slack.webhookUrl && (
              <button
                onClick={postToSlack}
                disabled={slackStatus === 'sending' || slackStatus === 'sent'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  slackStatus === 'sent' ? 'bg-green-100 text-green-700' :
                  slackStatus === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-[#4A154B] text-white hover:bg-[#3d1140]'
                }`}
              >
                <Mic size={14} />
                {slackStatus === 'sending' ? 'Posting...' : slackStatus === 'sent' ? 'Posted to Slack!' : slackStatus === 'error' ? 'Failed' : `Post to ${integrations.slack.channel || 'Slack'}`}
              </button>
            )}

            {integrations?.teams?.enabled && integrations.teams.webhookUrl && (
              <button
                onClick={postToTeams}
                disabled={teamsStatus === 'sending' || teamsStatus === 'sent'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  teamsStatus === 'sent' ? 'bg-green-100 text-green-700' :
                  teamsStatus === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-[#6264A7] text-white hover:bg-[#5254a0]'
                }`}
              >
                <Users size={14} />
                {teamsStatus === 'sending' ? 'Posting...' : teamsStatus === 'sent' ? 'Posted to Teams!' : teamsStatus === 'error' ? 'Failed' : 'Post to Teams'}
              </button>
            )}

            {(!integrations?.slack?.enabled || !integrations?.slack?.webhookUrl) && (
              <a href="/settings" className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-600 self-center">
                <ExternalLink size={11} /> Configure Slack/Teams in Settings
              </a>
            )}
          </div>
        )}

        {/* Instructions when idle */}
        {!transcript && !isListening && (
          <div className="text-center py-4">
            <p className="text-sm text-indigo-600 font-medium mb-1">Click "Start Listening" to begin</p>
            <p className="text-xs text-indigo-400">
              The AI will listen to your standup call, detect each team member's updates, identify blockers, and auto-create standup notes.
              Works in Chrome and Edge.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Standup Form ───────────────────────────────────────────────────────────────

function StandupForm({ date, sprintId }: { date: string; sprintId: string }) {
  const { members, standups, addStandup, updateStandup } = useScrumStore();
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? '');
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [hasBlocker, setHasBlocker] = useState(false);

  const existing = standups.find((s) => s.memberId === selectedMemberId && s.date === date && s.sprintId === sprintId);

  const handleMemberChange = (id: string) => {
    setSelectedMemberId(id);
    const ex = standups.find((s) => s.memberId === id && s.date === date && s.sprintId === sprintId);
    setYesterday(ex?.yesterday ?? '');
    setToday(ex?.today ?? '');
    setBlockers(ex?.blockers ?? '');
    setHasBlocker(ex?.hasBlocker ?? false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yesterday.trim() && !today.trim()) return;
    if (existing) {
      updateStandup(existing.id, { yesterday, today, blockers, hasBlocker });
    } else {
      addStandup({ memberId: selectedMemberId, sprintId, date, yesterday, today, blockers, hasBlocker });
    }
    setYesterday(''); setToday(''); setBlockers(''); setHasBlocker(false);
  };

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">
        {existing ? 'Update' : 'Log'} Standup · {format(parseISO(date), 'EEEE, MMM d')}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Team Member</label>
          <select className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={selectedMemberId} onChange={(e) => handleMemberChange(e.target.value)}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        {existing && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            <AlertTriangle size={12} />
            An entry for this member already exists today — updating it.
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">✅ What did you complete yesterday?</label>
          <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={2} value={yesterday} onChange={(e) => setYesterday(e.target.value)} placeholder="Yesterday I completed..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">🎯 What will you work on today?</label>
          <textarea className="w-full border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={2} value={today} onChange={(e) => setToday(e.target.value)} placeholder="Today I'll be working on..." />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-xs font-medium text-slate-700">🚧 Any blockers?</label>
            <label className="flex items-center gap-1.5 ml-auto cursor-pointer">
              <input type="checkbox" checked={hasBlocker} onChange={(e) => setHasBlocker(e.target.checked)} className="rounded" />
              <span className="text-xs text-slate-500">Has blocker</span>
            </label>
          </div>
          <textarea className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none transition-colors ${hasBlocker ? 'border-red-300 focus:ring-red-400 bg-red-50' : 'border-surface-border focus:ring-brand-500'}`} rows={2} value={blockers} onChange={(e) => setBlockers(e.target.value)} placeholder={hasBlocker ? 'Describe the blocker...' : 'No blockers (leave empty or uncheck)'} />
        </div>
        <button type="submit" className="w-full py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
          {existing ? 'Update Entry' : 'Submit Standup'}
        </button>
      </form>
    </div>
  );
}

// ─── Standup Card ───────────────────────────────────────────────────────────────

function StandupCard({ entry }: { entry: ReturnType<typeof useScrumStore.getState>['standups'][0] }) {
  const { members } = useScrumStore();
  const member = members.find((m) => m.id === entry.memberId);
  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${entry.hasBlocker ? 'border-red-200' : 'border-surface-border'}`}>
      {entry.hasBlocker && <div className="h-1 bg-red-400" />}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {member && <Avatar initials={member.avatarInitials} color={member.avatarColor} size="md" />}
          <div>
            <p className="text-sm font-semibold text-slate-800">{member?.name ?? 'Unknown'}</p>
            <p className="text-xs text-slate-400 capitalize">{member?.role.replace('_', ' ')}</p>
          </div>
          {entry.hasBlocker && (
            <span className="ml-auto flex items-center gap-1 bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
              <AlertTriangle size={10} /> Blocker
            </span>
          )}
        </div>
        {entry.yesterday && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-slate-500 mb-0.5">✅ Yesterday</p>
            <p className="text-xs text-slate-700">{entry.yesterday}</p>
          </div>
        )}
        {entry.today && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-slate-500 mb-0.5">🎯 Today</p>
            <p className="text-xs text-slate-700">{entry.today}</p>
          </div>
        )}
        {entry.hasBlocker && entry.blockers && (
          <div className="bg-red-50 rounded-lg p-2 mt-2">
            <p className="text-xs font-semibold text-red-600 mb-0.5">🚧 Blocker</p>
            <p className="text-xs text-red-700">{entry.blockers}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

function isOOOOnDate(member: { oooStart?: string; oooEnd?: string }, date: string): boolean {
  if (!member.oooStart || !member.oooEnd) return false;
  return date >= member.oooStart && date <= member.oooEnd;
}

export function StandupPage() {
  const { standups, members } = useScrumStore();
  const activeSprint = useActiveSprint();
  const [viewDate, setViewDate] = useState(getTodayISO());
  const [showAI, setShowAI] = useState(false);

  const isToday = viewDate === getTodayISO();
  const dateEntries = standups.filter((s) => s.date === viewDate);
  const blockers = dateEntries.filter((s) => s.hasBlocker);
  const submitted = dateEntries.map((e) => e.memberId);
  const missing = members.filter((m) => !submitted.includes(m.id));
  const oooMembers = members.filter((m) => isOOOOnDate(m, viewDate));

  const prevDay = () => setViewDate(format(subDays(parseISO(viewDate), 1), 'yyyy-MM-dd'));
  const nextDay = () => {
    const next = addDays(parseISO(viewDate), 1);
    if (format(next, 'yyyy-MM-dd') <= getTodayISO()) setViewDate(format(next, 'yyyy-MM-dd'));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
          <MessageSquare size={20} className="text-brand-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Daily Standup</h1>
          <p className="text-sm text-slate-500">{activeSprint ? activeSprint.name : 'No active sprint'} · {members.length} team members</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowAI(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showAI ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-indigo-300 text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <Bot size={15} />
            {showAI ? 'Hide AI Listener' : 'AI Listener'}
          </button>
        </div>
      </div>

      {/* AI Listener */}
      {showAI && activeSprint && (
        <AIListenerPanel sprintId={activeSprint.id} date={viewDate} />
      )}

      {/* Date nav */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={prevDay} className="p-2 rounded-lg border border-surface-border hover:bg-slate-50"><ChevronLeft size={16} /></button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-surface-border">
          <Calendar size={14} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{format(parseISO(viewDate), 'EEEE, MMMM d, yyyy')}</span>
          {isToday && <span className="bg-brand-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">Today</span>}
        </div>
        <button onClick={nextDay} disabled={isToday} className="p-2 rounded-lg border border-surface-border hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={16} /></button>
      </div>

      {/* OOO banner */}
      {oooMembers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Plane size={15} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-amber-700">Out of Office {isToday ? 'Today' : 'This Day'} ({oooMembers.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {oooMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-2 bg-amber-100 rounded-lg px-3 py-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: m.avatarColor }}>{m.avatarInitials}</div>
                <span className="text-xs font-medium text-amber-800">{m.name}</span>
                <span className="text-xs text-amber-600">· {m.oooStart === m.oooEnd ? 'today' : `until ${new Date((m.oooEnd ?? m.oooStart!) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blockers summary */}
      {blockers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-red-500" />
            <h3 className="text-sm font-semibold text-red-700">Active Blockers ({blockers.length})</h3>
          </div>
          <div className="space-y-2">
            {blockers.map((b) => {
              const m = members.find((x) => x.id === b.memberId);
              return (
                <div key={b.id} className="flex items-start gap-2 text-xs text-red-700">
                  <span className="font-semibold flex-shrink-0">{m?.name}:</span>
                  <span>{b.blockers}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isToday && activeSprint && (
          <div>
            <StandupForm date={viewDate} sprintId={activeSprint.id} />
            {missing.length > 0 && (
              <div className="mt-4 bg-white rounded-xl border border-surface-border p-4">
                <h3 className="text-xs font-semibold text-slate-600 mb-3">Waiting for ({missing.length})</h3>
                <div className="space-y-2">
                  {missing.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <Avatar initials={m.avatarInitials} color={m.avatarColor} size="sm" />
                      <span className="text-xs text-slate-600">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className={`space-y-3 ${isToday && activeSprint ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {dateEntries.length === 0 ? (
            <div className="bg-white rounded-xl border border-surface-border p-12 text-center">
              <MessageSquare size={28} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No standup entries for {format(parseISO(viewDate), 'MMM d')}.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-green-500" />
                <span className="text-xs font-medium text-slate-600">{dateEntries.length} of {members.length} submitted</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dateEntries.map((entry) => <StandupCard key={entry.id} entry={entry} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
