'use client';

import { useEffect, useState, useRef } from 'react';
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
import { useSocketStore } from '@/stores/socket';
import { Task, Column as ColumnType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';

function TaskCard({ task }: { task: Task }) {
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
      {...attributes}
      {...listeners}
      className={`bg-white p-3 rounded-md shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''
      }`}
    >
      <p className="text-sm font-medium text-gray-900">{task.title}</p>
      {task.description && (
        <p className="text-xs text-gray-500 mt-1 truncate">{task.description}</p>
      )}
    </div>
  );
}

function Column({ column, onAddTask, onDeleteColumn, userRole }: { 
  column: ColumnType; 
  onAddTask: (columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  userRole: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: column.id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-100 rounded-lg p-4 w-72 flex-shrink-0 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <h3 className="font-semibold text-gray-700">{column.name}</h3>
          <span className="text-xs text-gray-500">{column.tasks.length} tasks</span>
        </div>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteColumn(column.id)}
            className="text-gray-400 hover:text-red-600"
          >
            ✕
          </Button>
        )}
      </div>

      <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[50px]">
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>

      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-gray-500"
          onClick={() => onAddTask(column.id)}
        >
          + Add Task
        </Button>
      )}
    </div>
  );
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const pointerYRef = useRef<number>(0);

  const { 
    currentBoard, 
    isLoading, 
    fetchBoard, 
    createTask, 
    deleteTask, 
    moveTask,
    deleteColumn,
    subscribeToBoard,
    unsubscribeFromBoard,
  } = useBoardStore();
  
  const socket = useSocketStore((state) => state.socket);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId);
      subscribeToBoard(boardId);
    }

    return () => {
      if (boardId) {
        unsubscribeFromBoard(boardId);
      }
    };
  }, [boardId]);

  useEffect(() => {
    if (!socket) return;

    const handleTaskMoved = (data: { taskId: string; fromColumnId: string; toColumnId: string; targetTaskId?: number; position?: string }) => {
      fetchBoard(boardId);
      setToast({ message: 'Task was moved by another user', type: 'info' });
    };

    const handleTaskCreated = (data: { task: Task; columnId: string }) => {
      fetchBoard(boardId);
      setToast({ message: 'A new task was created', type: 'info' });
    };

    const handleTaskUpdated = (data: { task: Task }) => {
      fetchBoard(boardId);
      setToast({ message: 'A task was updated', type: 'info' });
    };

    const handleTaskDeleted = (data: { taskId: string; columnId: string }) => {
      fetchBoard(boardId);
      setToast({ message: 'A task was deleted', type: 'info' });
    };

    const handleColumnDeleted = (data: { columnId: string }) => {
      fetchBoard(boardId);
      setToast({ message: 'A column was deleted', type: 'info' });
    };

    socket.on('task:moved', handleTaskMoved);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('column:deleted', handleColumnDeleted);

    return () => {
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('column:deleted', handleColumnDeleted);
    };
  }, [socket, boardId, fetchBoard]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const task = currentBoard?.columns.flatMap(c => c.tasks).find(t => t.id === active.id);
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

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const sourceColumn = currentBoard.columns.find(c => c.tasks.some(t => t.id === activeTaskId));
    let targetColumn = currentBoard.columns.find(c => c.tasks.some(t => t.id === overId));
    
    if (!targetColumn) {
      targetColumn = currentBoard.columns.find(c => c.id === overId);
    }

    if (!sourceColumn || !targetColumn) return;

    const activeIndex = sourceColumn.tasks.findIndex(t => t.id === activeTaskId);
    const overIndex = targetColumn.tasks.findIndex(t => t.id === overId);

    if (activeIndex === -1) return;

    let targetTaskId: number | undefined;
    let position: 'before' | 'after' | undefined;

    if (overId === targetColumn.id) {
      if (targetColumn.tasks.length === 0) {
        targetTaskId = undefined;
        position = undefined;
      } else if (sourceColumn.id === targetColumn.id) {
        if (activeIndex === overIndex || overIndex === -1) return;
        if (activeIndex < overIndex) {
          if (overIndex === targetColumn.tasks.length - 1) {
            targetTaskId = parseInt(targetColumn.tasks[overIndex].id, 10);
            position = 'after';
          } else {
            targetTaskId = parseInt(targetColumn.tasks[overIndex + 1].id, 10);
            position = 'before';
          }
        } else {
          if (overIndex === 0) {
            targetTaskId = parseInt(targetColumn.tasks[0].id, 10);
            position = 'before';
          } else {
            targetTaskId = parseInt(targetColumn.tasks[overIndex - 1].id, 10);
            position = 'after';
          }
        }
      } else {
        if (targetColumn.tasks.length === 0) {
          targetTaskId = undefined;
          position = undefined;
        } else {
          targetTaskId = parseInt(targetColumn.tasks[0].id, 10);
          position = 'before';
        }
      }
    } else {
      const overTaskIndex = targetColumn.tasks.findIndex(t => t.id === overId);
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
          targetTaskId = parseInt(targetColumn.tasks[overTaskIndex + 1].id, 10);
          position = 'before';
        }
      }
    }

    try {
      await moveTask(activeTaskId, targetColumn.id, targetTaskId, position);
    } catch (error) {
      console.error('Failed to move task:', error);
      fetchBoard(boardId);
    }
  };

  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setIsAddTaskModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColumnId || !newTaskTitle.trim()) return;

    try {
      await createTask(selectedColumnId, newTaskTitle, newTaskDescription);
      setIsAddTaskModalOpen(false);
      setToast({ message: 'Task created', type: 'success' });
    } catch (error) {
      console.error('Failed to create task:', error);
      setToast({ message: 'Failed to create task', type: 'error' });
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    const column = currentBoard?.columns.find(c => c.id === columnId);
    if (!column) return;

    if (column.tasks.length > 0) {
      setToast({ message: 'Cannot delete column with tasks. Move or delete the tasks first.', type: 'error' });
      return;
    }

    if (!confirm('Are you sure you want to delete this column?')) return;

    try {
      await deleteColumn(columnId);
      setToast({ message: 'Column deleted', type: 'success' });
    } catch (error) {
      console.error('Failed to delete column:', error);
      setToast({ message: 'Failed to delete column', type: 'error' });
    }
  };

  if (isLoading || !currentBoard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading board...</p>
      </div>
    );
  }

  const userRole = currentBoard.members.find(m => m.userId === currentBoard.ownerId)?.role || 'VIEWER';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{currentBoard.name}</h1>
              {currentBoard.description && (
                <p className="text-sm text-gray-500">{currentBoard.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={currentBoard.columns.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {currentBoard.columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onAddTask={handleAddTask}
                  onDeleteColumn={handleDeleteColumn}
                  userRole={userRole}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeTask && (
              <div className="bg-white p-3 rounded-md shadow-lg border border-blue-500 opacity-90">
                <p className="text-sm font-medium text-gray-900">{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </main>

      <Modal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        title="Add New Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter task title"
            required
          />
          <Input
            label="Description (optional)"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            placeholder="Enter task description"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddTaskModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </div>
        </form>
      </Modal>

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
