import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Story, StoryStatus } from '../../types';
import { useScrumStore } from '../../store/useScrumStore';
import { KanbanColumn } from './KanbanColumn';
import { StoryModal } from '../story/StoryModal';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';

const COLUMNS: { id: StoryStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: '#3B82F6' },
  { id: 'in_progress', title: 'In Progress', color: '#8B5CF6' },
  { id: 'review', title: 'Review', color: '#F59E0B' },
  { id: 'blocked', title: 'Blocked', color: '#EF4444' },
  { id: 'done', title: 'Done', color: '#10B981' },
];

export type SwimlaneBy = 'none' | 'assignee' | 'priority' | 'epic';

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];

interface KanbanBoardProps {
  sprintId: string;
  swimlaneBy?: SwimlaneBy;
  wipLimits?: Record<string, number>;
}

export function KanbanBoard({ sprintId, swimlaneBy = 'none', wipLimits = {} }: KanbanBoardProps) {
  const { stories, moveStory, epics, members } = useScrumStore();
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<StoryStatus>('todo');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const sprintStories = stories.filter((s) => s.sprintId === sprintId);

  const getStoriesForColumn = (status: StoryStatus) =>
    sprintStories.filter((s) => s.status === status).sort((a, b) => a.order - b.order);

  const handleDragStart = (event: DragStartEvent) => {
    const story = stories.find((s) => s.id === event.active.id);
    setActiveStory(story ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeStoryItem = stories.find((s) => s.id === active.id);
    if (!activeStoryItem) return;

    // Determine if dropping over a column or another story
    const overIsColumn = COLUMNS.some((c) => c.id === over.id);
    const overStory = stories.find((s) => s.id === over.id);
    const targetStatus = overIsColumn
      ? (over.id as StoryStatus)
      : overStory?.status ?? activeStoryItem.status;

    if (activeStoryItem.status !== targetStatus) {
      moveStory(activeStoryItem.id, targetStatus);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveStory(null);

    if (!over) return;

    const activeStoryItem = stories.find((s) => s.id === active.id);
    if (!activeStoryItem) return;

    const overIsColumn = COLUMNS.some((c) => c.id === over.id);
    const overStory = stories.find((s) => s.id === over.id);
    const targetStatus = overIsColumn
      ? (over.id as StoryStatus)
      : overStory?.status ?? activeStoryItem.status;

    // Reorder within the same column
    if (!overIsColumn && overStory && activeStoryItem.status === overStory.status) {
      const colStories = getStoriesForColumn(activeStoryItem.status);
      const oldIdx = colStories.findIndex((s) => s.id === active.id);
      const newIdx = colStories.findIndex((s) => s.id === over.id);
      if (oldIdx !== newIdx) {
        const reordered = arrayMove(colStories, oldIdx, newIdx);
        reordered.forEach((s, idx) => {
          moveStory(s.id, s.status, idx);
        });
      }
    } else {
      moveStory(activeStoryItem.id, targetStatus);
    }
  };

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    setIsModalOpen(true);
  };

  const handleAddStory = (status: StoryStatus) => {
    setSelectedStory(null);
    setDefaultStatus(status);
    setIsModalOpen(true);
  };

  const activeEpic = activeStory ? epics.find((e) => e.id === activeStory.epicId) : null;
  const activeAssignee = activeStory?.assigneeId
    ? members.find((m) => m.id === activeStory.assigneeId)
    : null;

  // Build swimlane groups
  const swimlanes = useMemo(() => {
    if (swimlaneBy === 'none') return [{ key: 'all', label: '', stories: sprintStories }];
    if (swimlaneBy === 'assignee') {
      const assigneeIds = [...new Set(sprintStories.map((s) => s.assigneeId ?? '__unassigned__'))];
      return assigneeIds.map((id) => {
        const member = members.find((m) => m.id === id);
        return {
          key: id,
          label: member?.name ?? 'Unassigned',
          color: member?.avatarColor,
          initials: member?.avatarInitials,
          stories: sprintStories.filter((s) => (s.assigneeId ?? '__unassigned__') === id),
        };
      });
    }
    if (swimlaneBy === 'priority') {
      return PRIORITY_ORDER.map((p) => ({
        key: p,
        label: p.charAt(0).toUpperCase() + p.slice(1),
        stories: sprintStories.filter((s) => s.priority === p),
      })).filter((g) => g.stories.length > 0);
    }
    // epic
    const epicIds = [...new Set(sprintStories.map((s) => s.epicId ?? '__none__'))];
    return epicIds.map((id) => {
      const epic = epics.find((e) => e.id === id);
      return {
        key: id,
        label: epic?.title ?? 'No Epic',
        color: epic?.color,
        stories: sprintStories.filter((s) => (s.epicId ?? '__none__') === id),
      };
    });
  }, [swimlaneBy, sprintStories, members, epics]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6 overflow-x-auto pb-4">
          {swimlanes.map((lane) => (
            <div key={lane.key}>
              {swimlaneBy !== 'none' && (
                <div className="flex items-center gap-2 mb-3 sticky left-0">
                  {lane.color && (
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: lane.color }} />
                  )}
                  {lane.initials && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: lane.color ?? '#94A3B8', fontSize: '9px' }}>
                      {lane.initials}
                    </div>
                  )}
                  <span className="text-sm font-bold text-slate-600">{lane.label}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{lane.stories.length}</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
              )}
              <div className="flex gap-4 items-start">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={`${lane.key}-${col.id}`}
                    id={col.id}
                    title={swimlaneBy === 'none' ? col.title : ''}
                    color={col.color}
                    wipLimit={wipLimits[col.id]}
                    stories={lane.stories.filter((s) => s.status === col.id).sort((a, b) => a.order - b.order)}
                    onStoryClick={handleStoryClick}
                    onAddStory={handleAddStory}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeStory && (
            <div className="bg-white rounded-lg border border-brand-300 shadow-xl flex overflow-hidden w-72 rotate-2 opacity-95">
              <div
                className="w-1 flex-shrink-0"
                style={{ backgroundColor: activeEpic?.color ?? '#94A3B8' }}
              />
              <div className="flex-1 p-3">
                <p className="text-sm font-medium text-slate-800 leading-snug mb-2 line-clamp-2">
                  {activeStory.title}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="priority" value={activeStory.priority} />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                      {activeStory.storyPoints}pt
                    </span>
                    {activeAssignee && (
                      <Avatar
                        initials={activeAssignee.avatarInitials}
                        color={activeAssignee.avatarColor}
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <StoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStory(null);
        }}
        story={selectedStory}
        defaultSprintId={sprintId}
        defaultStatus={defaultStatus}
      />
    </>
  );
}
