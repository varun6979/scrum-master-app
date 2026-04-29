import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({
  value,
  color = '#4F6EF7',
  showLabel = false,
  size = 'md',
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        className={clsx(
          'flex-1 bg-slate-100 rounded-full overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2.5'
        )}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-500 w-8 text-right flex-shrink-0">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
