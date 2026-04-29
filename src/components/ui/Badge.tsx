import { clsx } from 'clsx';

type BadgeVariant = 'priority' | 'status' | 'sprint' | 'role';

interface BadgeProps {
  variant: BadgeVariant;
  value: string;
  className?: string;
}

const priorityClasses: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
};

const statusClasses: Record<string, string> = {
  backlog: 'bg-slate-100 text-slate-600 border-slate-200',
  todo: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  review: 'bg-amber-100 text-amber-700 border-amber-200',
  done: 'bg-green-100 text-green-700 border-green-200',
};

const sprintClasses: Record<string, string> = {
  planning: 'bg-violet-100 text-violet-700 border-violet-200',
  active: 'bg-brand-100 text-brand-700 border-brand-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
};

const roleClasses: Record<string, string> = {
  scrum_master: 'bg-brand-100 text-brand-700 border-brand-200',
  product_owner: 'bg-purple-100 text-purple-700 border-purple-200',
  developer: 'bg-teal-100 text-teal-700 border-teal-200',
  designer: 'bg-pink-100 text-pink-700 border-pink-200',
  qa: 'bg-orange-100 text-orange-700 border-orange-200',
};

const labelMap: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  planning: 'Planning',
  active: 'Active',
  completed: 'Completed',
  scrum_master: 'Scrum Master',
  product_owner: 'Product Owner',
  developer: 'Developer',
  designer: 'Designer',
  qa: 'QA',
};

export function Badge({ variant, value, className }: BadgeProps) {
  let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';

  if (variant === 'priority') colorClass = priorityClasses[value] ?? colorClass;
  else if (variant === 'status') colorClass = statusClasses[value] ?? colorClass;
  else if (variant === 'sprint') colorClass = sprintClasses[value] ?? colorClass;
  else if (variant === 'role') colorClass = roleClasses[value] ?? colorClass;

  const label = labelMap[value] ?? value;

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
