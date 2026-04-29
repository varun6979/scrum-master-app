import { clsx } from 'clsx';

interface AvatarProps {
  initials: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export function Avatar({ initials, color, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
      title={initials}
    >
      {initials}
    </div>
  );
}
