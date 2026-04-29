import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { Story } from '../../types';
import { useScrumStore } from '../../store/useScrumStore';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';

interface StoryCardProps {
  story: Story;
  onClick: (story: Story) => void;
}

export function StoryCard({ story, onClick }: StoryCardProps) {
  const { epics, members } = useScrumStore();
  const epic = epics.find((e) => e.id === story.epicId);
  const assignee = story.assigneeId ? members.find((m) => m.id === story.assigneeId) : null;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: story.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(story)}
      className={clsx(
        'bg-white rounded-lg border border-surface-border shadow-sm cursor-pointer',
        'hover:border-brand-300 hover:shadow-md transition-all duration-150',
        'flex overflow-hidden group',
        isDragging && 'opacity-40 shadow-lg'
      )}
    >
      {/* Epic color strip */}
      <div
        className="w-1 flex-shrink-0 rounded-l-lg"
        style={{ backgroundColor: epic?.color ?? '#94A3B8' }}
      />

      <div className="flex-1 p-3 min-w-0">
        {/* Title */}
        <p className="text-sm font-medium text-slate-800 leading-snug mb-2 line-clamp-2">
          {story.title}
        </p>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Badge variant="priority" value={story.priority} />
            {epic && (
              <span
                className="text-xs text-slate-400 truncate hidden group-hover:block max-w-[80px]"
                title={epic.title}
              >
                {epic.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
              {story.storyPoints}pt
            </span>
            {assignee && (
              <Avatar
                initials={assignee.avatarInitials}
                color={assignee.avatarColor}
                size="sm"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
