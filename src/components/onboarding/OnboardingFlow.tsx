import { useState, useEffect } from 'react';
import {
  CheckCircle2, X, Zap, Users, Layers, Columns2, Sparkles,
  ChevronRight, ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScrumStore } from '../../store/useScrumStore';

const STORAGE_KEY = 'scrumboard-onboarding-done';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  action?: { label: string; path: string };
  tip: string;
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome to ScrumBoard Pro',
    description: 'The Scrum tool built for modern teams. In 2 minutes you\'ll be up and running with your first sprint.',
    icon: Zap,
    color: 'text-brand-600 bg-brand-100',
    tip: 'ScrumBoard Pro works entirely in your browser — no setup, no database, no backend.',
  },
  {
    id: 'team',
    title: 'Set up your team',
    description: 'Add team members with their roles and capacity. This helps with sprint planning and burndown tracking.',
    icon: Users,
    color: 'text-purple-600 bg-purple-100',
    action: { label: 'Go to Team', path: '/team' },
    tip: 'Capacity is measured in story points. A typical developer might have 20–30 points per sprint.',
  },
  {
    id: 'epics',
    title: 'Create your first Epic',
    description: 'Epics are large bodies of work. Organize stories under epics to track progress at a high level.',
    icon: Layers,
    color: 'text-amber-600 bg-amber-100',
    action: { label: 'Go to Backlog', path: '/backlog' },
    tip: 'Good epics map to product themes: "Authentication", "Reporting", "Mobile App".',
  },
  {
    id: 'sprint',
    title: 'Plan your first Sprint',
    description: 'Create a sprint, drag stories in from the backlog, and set a clear sprint goal. Sprints are typically 2 weeks.',
    icon: Columns2,
    color: 'text-blue-600 bg-blue-100',
    action: { label: 'Go to Sprints', path: '/sprints' },
    tip: 'Use the Sprint Board to track progress daily. Blockers are highlighted automatically.',
  },
  {
    id: 'explore',
    title: 'Explore advanced features',
    description: 'AI Sprint Assistant, Burndown charts, Risk Register, Dependencies, Retrospectives — all built-in.',
    icon: Sparkles,
    color: 'text-emerald-600 bg-emerald-100',
    action: { label: 'Try AI Assistant', path: '/ai' },
    tip: 'Press ⌘K (or Ctrl+K) anywhere to open the command palette for quick navigation.',
  },
];

export function OnboardingFlow() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { stories } = useScrumStore();

  useEffect(() => {
    // Show onboarding only once, and only if there's very little data (fresh install)
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done && stories.length < 5) {
      setTimeout(() => setVisible(true), 800);
    }
  }, [stories.length]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  const prev = () => { if (step > 0) setStep(s => s - 1); };

  const goTo = (path: string) => {
    navigate(path);
    dismiss();
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-brand-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Close */}
        <button onClick={dismiss} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
          <X size={18} />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Step dots */}
          <div className="flex gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-brand-500' : i < step ? 'w-3 bg-brand-300' : 'w-3 bg-slate-200'}`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl ${current.color} flex items-center justify-center mb-5`}>
            <Icon size={26} />
          </div>

          {/* Step number */}
          <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-1">
            Step {step + 1} of {STEPS.length}
          </p>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-900 mb-3">{current.title}</h2>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed mb-5">{current.description}</p>

          {/* Tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-amber-800"><span className="font-semibold">Tip:</span> {current.tip}</p>
          </div>

          {/* Checkmarks for completed steps */}
          {step > 0 && (
            <div className="space-y-1.5 mb-5">
              {STEPS.slice(0, step).map(s => (
                <div key={s.id} className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" /> {s.title}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button onClick={prev} className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700">
                <ChevronLeft size={15} /> Back
              </button>
            )}
            <div className="flex-1" />
            {current.action && (
              <button
                onClick={() => goTo(current.action!.path)}
                className="px-4 py-2 border border-brand-300 rounded-lg text-sm text-brand-600 font-medium hover:bg-brand-50 transition-colors"
              >
                {current.action.label}
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1.5 px-5 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              {isLast ? 'Get Started' : 'Next'} {!isLast && <ChevronRight size={15} />}
            </button>
          </div>

          {/* Skip */}
          <button onClick={dismiss} className="w-full text-center mt-4 text-xs text-slate-400 hover:text-slate-600">
            Skip onboarding
          </button>
        </div>
      </div>
    </div>
  );
}
