import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { Story, StoryStatus } from '../../types';
import { StoryCard } from '../story/StoryCard';

interface KanbanColumnProps {
  id: StoryStatus;
  title: string;
  stories: Story[];
  color: string;
  wipLimit?: number;
  onStoryClick: (story: Story) => void;
  onAddStory: (status: StoryStatus) => void;
}

export function KanbanColumn({
  id,
  title,
  stories,
  color,
  wipLimit,
  onStoryClick,
  onAddStory,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const sortedStories = [...stories].sort((a, b) => a.order - b.order);
  const isOverLimit = wipLimit !== undefined && stories.length > wipLimit;

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          <span className={clsx(
            'text-xs font-medium rounded-full px-2 py-0.5',
            isOverLimit ? 'bg-red-100 text-red-600 font-bold' : 'bg-slate-100 text-slate-400'
          )}>
            {stories.length}{wipLimit !== undefined ? `/${wipLimit}` : ''}
          </span>
          {isOverLimit && <span title="WIP limit exceeded"><AlertTriangle size={13} className="text-red-500" /></span>}
        </div>
      </div>

      {/* Column body */}
      <div
        ref={setNodeRef}
        className={clsx(
          'flex-1 rounded-xl p-2 min-h-[500px] transition-colors duration-150',
          isOver ? 'bg-brand-50 border-2 border-brand-200 border-dashed' : isOverLimit ? 'bg-red-50 border border-red-200' : 'bg-slate-50'
        )}
      >
        <SortableContext items={sortedStories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sortedStories.length === 0 ? (
              <div className="flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-slate-200">
                <p className="text-xs text-slate-400">Drop stories here</p>
              </div>
            ) : (
              sortedStories.map((story) => (
                <StoryCard key={story.id} story={story} onClick={onStoryClick} />
              ))
            )}
          </div>
        </SortableContext>

        {/* Add Story button */}
        <button
          onClick={() => onAddStory(id)}
          className="mt-2 w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
        >
          <Plus size={13} /> Add Story
        </button>
      </div>
    </div>
  );
}
