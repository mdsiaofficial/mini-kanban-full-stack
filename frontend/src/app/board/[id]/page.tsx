'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useBoardStore } from '@/stores/board';
import { useAuthStore } from '@/stores/auth';
import { Task, Column as ColumnType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  GripVerticalIcon,
  UsersIcon,
  ShieldIcon,
  CheckIcon,
  CloseIcon,
  KanbanIcon,
} from '@/components/ui/icons';

// --- Task Card Component ---
function TaskCard({
  task,
  onTaskClick,
  onDeleteTask,
  canEdit,
}: {
  task: Task;
  onTaskClick: (task: Task) => void;
  onDeleteTask: (e: React.MouseEvent, taskId: string) => void;
  canEdit: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer select-none ${
        isDragging ? 'opacity-40 ring-2 ring-indigo-500 shadow-lg scale-102 z-30' : ''
      }`}
      onClick={() => onTaskClick(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {canEdit && (
            <div
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing p-0.5 rounded shrink-0 transition-colors"
              title="Drag task"
            >
              <GripVerticalIcon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 leading-snug break-words">
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed break-words">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={(e) => onDeleteTask(e, task.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
            title="Delete task"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// --- Column Component ---
function Column({
  column,
  onAddTask,
  onDeleteColumn,
  onTaskClick,
  onDeleteTask,
  canEdit,
}: {
  column: ColumnType;
  onAddTask: (columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onTaskClick: (task: Task) => void;
  onDeleteTask: (e: React.MouseEvent, taskId: string) => void;
  canEdit: boolean;
}) {
  const { setNodeRef, isDragging } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column shrink-0 bg-slate-100/90 rounded-2xl p-3.5 flex flex-col max-h-[calc(100vh-180px)] border border-slate-200/80 transition-all ${
        isDragging ? 'opacity-50 ring-2 ring-indigo-400' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
          <h3 className="font-bold text-sm text-slate-800 truncate" title={column.name}>
            {column.name}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200/80 text-slate-600">
            {column.tasks.length}
          </span>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => onDeleteColumn(column.id)}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete column"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Task List (Droppable area) */}
      <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1 min-h-[120px]">
          {column.tasks.length === 0 ? (
            <div className="h-full border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-4 text-center">
              <p className="text-xs text-slate-400">No tasks yet</p>
            </div>
          ) : (
            column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onTaskClick={onTaskClick}
                onDeleteTask={onDeleteTask}
                canEdit={canEdit}
              />
            ))
          )}
        </div>
      </SortableContext>

      {/* Add Task Button */}
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2.5 py-2 border border-transparent hover:border-slate-200 bg-white/50 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-xl text-xs font-semibold shadow-xs"
          onClick={() => onAddTask(column.id)}
          leftIcon={<PlusIcon className="w-3.5 h-3.5" />}
        >
          Add Task
        </Button>
      )}
    </div>
  );
}

// --- Board Page Component ---
export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const { user } = useAuthStore();
  const {
    currentBoard,
    isLoading,
    fetchBoard,
    createColumn,
    deleteColumn,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    addBoardMember,
    removeBoardMember,
  } = useBoardStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Modals state
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pointerYRef = useRef<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
    }
  }, [boardId, fetchBoard]);

  // Determine user's role on this board
  const userRole = useMemo(() => {
    if (!currentBoard || !user) return 'VIEWER';
    if (String(currentBoard.ownerId) === String(user.id)) return 'OWNER';
    const member = currentBoard.members?.find((m) => String(m.userId) === String(user.id));
    return member?.role || 'VIEWER';
  }, [currentBoard, user]);

  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR';
  const isOwner = userRole === 'OWNER';

  // --- Drag and drop handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    const task = currentBoard?.columns.flatMap((c) => c.tasks).find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (event.activatorEvent) {
      const mouseEvent = event.activatorEvent as MouseEvent;
      pointerYRef.current = mouseEvent.clientY;
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);

    if (!over || !currentBoard) return;

    const activeTaskId = String(active.id);
    const overId = String(over.id);

    const sourceColumn = currentBoard.columns.find((c) =>
      c.tasks.some((t) => String(t.id) === activeTaskId)
    );
    let targetColumn = currentBoard.columns.find((c) =>
      c.tasks.some((t) => String(t.id) === overId)
    );

    if (!targetColumn) {
      targetColumn = currentBoard.columns.find((c) => String(c.id) === overId);
    }

    if (!sourceColumn || !targetColumn) return;

    const activeIndex = sourceColumn.tasks.findIndex((t) => String(t.id) === activeTaskId);
    const overIndex = targetColumn.tasks.findIndex((t) => String(t.id) === overId);

    if (activeIndex === -1) return;

    let targetTaskId: number | undefined;
    let position: 'before' | 'after' | undefined;

    if (overId === String(targetColumn.id)) {
      if (targetColumn.tasks.length === 0) {
        targetTaskId = undefined;
        position = undefined;
      } else if (sourceColumn.id === targetColumn.id) {
        if (activeIndex === overIndex || overIndex === -1) return;
        if (activeIndex < overIndex) {
          if (overIndex === targetColumn.tasks.length - 1) {
            targetTaskId = parseInt(String(targetColumn.tasks[overIndex].id), 10);
            position = 'after';
          } else {
            targetTaskId = parseInt(String(targetColumn.tasks[overIndex + 1].id), 10);
            position = 'before';
          }
        } else {
          if (overIndex === 0) {
            targetTaskId = parseInt(String(targetColumn.tasks[0].id), 10);
            position = 'before';
          } else {
            targetTaskId = parseInt(String(targetColumn.tasks[overIndex - 1].id), 10);
            position = 'after';
          }
        }
      } else {
        if (targetColumn.tasks.length === 0) {
          targetTaskId = undefined;
          position = undefined;
        } else {
          targetTaskId = parseInt(String(targetColumn.tasks[0].id), 10);
          position = 'before';
        }
      }
    } else {
      const overTaskIndex = targetColumn.tasks.findIndex((t) => String(t.id) === overId);
      if (overTaskIndex === -1) return;

      const overRect = over.rect;
      const pointerY = pointerYRef.current;
      const taskTop = overRect.top;
      const taskMidpoint = taskTop + overRect.height / 2;

      if (pointerY < taskMidpoint) {
        targetTaskId = parseInt(overId, 10);
        position = 'before';
      } else {
        if (overTaskIndex === targetColumn.tasks.length - 1) {
          targetTaskId = parseInt(overId, 10);
          position = 'after';
        } else {
          targetTaskId = parseInt(String(targetColumn.tasks[overTaskIndex + 1].id), 10);
          position = 'before';
        }
      }
    }

    try {
      // Note: targetColumnId must be passed as string to match moveTask API
      await moveTask(activeTaskId, String(targetColumn.id), targetTaskId, position);
    } catch (error) {
      console.error('Failed to move task:', error);
      fetchBoard(boardId);
    }
  };

  // --- Task creation and editing ---
  const handleOpenAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setIsAddTaskModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColumnId || !newTaskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await createTask(selectedColumnId, newTaskTitle.trim(), newTaskDescription.trim() || undefined);
      setIsAddTaskModalOpen(false);
      setToast({ message: 'Task created successfully', type: 'success' });
    } catch (error) {
      console.error('Failed to create task:', error);
      setToast({ message: 'Failed to create task', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !editTaskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await updateTask(selectedTask.id, {
        title: editTaskTitle.trim(),
        description: editTaskDescription.trim() || undefined,
      });
      setSelectedTask(null);
      setToast({ message: 'Task updated', type: 'success' });
    } catch (error) {
      console.error('Failed to update task:', error);
      setToast({ message: 'Failed to update task', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask(taskId);
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
      setToast({ message: 'Task deleted', type: 'success' });
    } catch (error) {
      console.error('Failed to delete task:', error);
      setToast({ message: 'Failed to delete task', type: 'error' });
    }
  };

  // --- Column operations ---
  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    setIsSubmitting(true);
    try {
      await createColumn(boardId, newColumnName.trim());
      setNewColumnName('');
      setIsAddColumnModalOpen(false);
      setToast({ message: 'Column created', type: 'success' });
    } catch (error) {
      console.error('Failed to create column:', error);
      setToast({ message: 'Failed to create column', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    const col = currentBoard?.columns.find((c) => c.id === columnId);
    if (!col) return;

    if (col.tasks.length > 0) {
      setToast({ message: 'Please remove all tasks before deleting this column.', type: 'error' });
      return;
    }

    if (!confirm(`Delete column "${col.name}"?`)) return;

    try {
      await deleteColumn(columnId);
      setToast({ message: 'Column deleted', type: 'success' });
    } catch (error) {
      console.error('Failed to delete column:', error);
      setToast({ message: 'Failed to delete column', type: 'error' });
    }
  };

  // --- Board member operations ---
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setIsSubmitting(true);
    try {
      await addBoardMember(boardId, newMemberEmail.trim(), newMemberRole);
      setNewMemberEmail('');
      setToast({ message: 'Member added successfully', type: 'success' });
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Failed to add member',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the board?')) return;

    try {
      await removeBoardMember(boardId, userId);
      setToast({ message: 'Member removed', type: 'success' });
    } catch (error: any) {
      setToast({
        message: error.response?.data?.message || 'Failed to remove member',
        type: 'error',
      });
    }
  };

  if (isLoading || !currentBoard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md animate-bounce">
            <KanbanIcon className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-500">Loading board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Board Top Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Back to boards"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                  {currentBoard.name}
                </h1>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    userRole === 'OWNER'
                      ? 'bg-amber-100 text-amber-800'
                      : userRole === 'EDITOR'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {userRole}
                </span>
              </div>
              {currentBoard.description && (
                <p className="text-xs text-slate-500 truncate max-w-xl">
                  {currentBoard.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Members Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMembersModalOpen(true)}
              leftIcon={<UsersIcon className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Members</span>
              <span className="ml-0.5 text-xs text-slate-400">({currentBoard.members?.length || 1})</span>
            </Button>

            {/* Add Column Button */}
            {canEdit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddColumnModalOpen(true)}
                leftIcon={<PlusIcon className="w-4 h-4" />}
              >
                Add Column
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Kanban Board Board Canvas */}
      <main className="flex-1 p-4 sm:p-6 overflow-x-auto flex items-start">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-5 items-start">
            <SortableContext
              items={currentBoard.columns.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {currentBoard.columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onAddTask={handleOpenAddTask}
                  onDeleteColumn={handleDeleteColumn}
                  onTaskClick={handleTaskClick}
                  onDeleteTask={handleDeleteTask}
                  canEdit={canEdit}
                />
              ))}
            </SortableContext>

            {/* Empty or Add Column quick card */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsAddColumnModalOpen(true)}
                className="kanban-column shrink-0 h-32 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl bg-white/40 hover:bg-indigo-50/30 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer select-none group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                  <PlusIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Add Another Column</span>
              </button>
            )}
          </div>

          {/* Drag Overlay for smooth preview */}
          <DragOverlay>
            {activeTask && (
              <div className="bg-white p-3.5 rounded-xl border border-indigo-400 shadow-2xl scale-105 opacity-95 w-72 select-none">
                <p className="text-sm font-semibold text-slate-900">{activeTask.title}</p>
                {activeTask.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{activeTask.description}</p>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Modal: Add New Task */}
      <Modal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        title="Create New Task"
        description="Add a task card to this column"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="e.g. Implement user login API"
            required
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            placeholder="Provide context, acceptance criteria or details..."
            rows={3}
          />
          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddTaskModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Task Details & Editing */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={canEdit ? 'Edit Task' : 'Task Details'}
        description="Inspect or update details for this card"
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <Input
            label="Title"
            value={editTaskTitle}
            onChange={(e) => setEditTaskTitle(e.target.value)}
            placeholder="Task Title"
            required
            disabled={!canEdit}
          />
          <Textarea
            label="Description"
            value={editTaskDescription}
            onChange={(e) => setEditTaskDescription(e.target.value)}
            placeholder="No description provided."
            rows={4}
            disabled={!canEdit}
          />

          <div className="flex items-center justify-between pt-3">
            {canEdit ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={(e) => selectedTask && handleDeleteTask(e, selectedTask.id)}
                leftIcon={<TrashIcon className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedTask(null)}
                disabled={isSubmitting}
              >
                Close
              </Button>
              {canEdit && (
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Column */}
      <Modal
        isOpen={isAddColumnModalOpen}
        onClose={() => setIsAddColumnModalOpen(false)}
        title="Add Column"
        description="Add a new workflow stage to your board (e.g. Review, QA)"
      >
        <form onSubmit={handleCreateColumn} className="space-y-4">
          <Input
            label="Column Name"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            placeholder="e.g. In Review, QA, Backlog"
            required
            autoFocus
          />
          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddColumnModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Add Column
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Board Members */}
      <Modal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        title="Board Members"
        description="Manage collaborators and permission roles for this board."
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Add member form (Owner only) */}
          {isOwner && (
            <form onSubmit={handleAddMember} className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Invite Collaborator</h4>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="teammate@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                  />
                </div>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as 'EDITOR' | 'VIEWER')}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="EDITOR">Editor (Can edit)</option>
                  <option value="VIEWER">Viewer (Read only)</option>
                </select>
                <Button type="submit" variant="primary" isLoading={isSubmitting} className="shrink-0">
                  Invite
                </Button>
              </div>
            </form>
          )}

          {/* Members list */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Active Members ({currentBoard.members?.length || 0})
            </h4>
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {currentBoard.members?.map((m) => {
                const initial = m.user?.name
                  ? m.user.name.charAt(0).toUpperCase()
                  : m.user?.email.charAt(0).toUpperCase() || 'U';

                return (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {m.user?.name || m.user?.email}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{m.user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          m.role === 'OWNER'
                            ? 'bg-amber-100 text-amber-800'
                            : m.role === 'EDITOR'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.role}
                      </span>

                      {isOwner && m.role !== 'OWNER' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(String(m.userId))}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsMembersModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Floating Toast Feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
