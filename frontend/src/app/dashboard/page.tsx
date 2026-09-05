'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { useBoardStore } from '@/stores/board';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea } from '@/components/ui/input';
import {
  KanbanIcon,
  PlusIcon,
  SearchIcon,
  LogOutIcon,
  TrashIcon,
  EditIcon,
  ClockIcon,
  LayersIcon,
  UserIcon,
} from '@/components/ui/icons';

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<{ id: string; name: string; description: string } | null>(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const { boards, isLoading: boardsLoading, fetchBoards, createBoard, updateBoard, deleteBoard } = useBoardStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBoards();
    }
  }, [isAuthenticated, fetchBoards]);

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        (b.description && b.description.toLowerCase().includes(query))
    );
  }, [boards, searchQuery]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    setIsSubmitting(true);
    try {
      await createBoard(newBoardName.trim(), newBoardDescription.trim() || undefined);
      setNewBoardName('');
      setNewBoardDescription('');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create board:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBoard || !editingBoard.name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateBoard(editingBoard.id, {
        name: editingBoard.name.trim(),
        description: editingBoard.description.trim() || undefined,
      });
      setEditingBoard(null);
    } catch (error) {
      console.error('Failed to update board:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBoard = async (e: React.MouseEvent, boardId: string, boardName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${boardName}"? This action cannot be undone.`)) return;

    try {
      await deleteBoard(boardId);
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  if (authLoading || boardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md animate-bounce">
            <KanbanIcon className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-500">Loading your workspaces...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <KanbanIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base">Mini Kanban</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-full bg-slate-50 border border-slate-200/70">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                {userInitial}
              </div>
              <span className="text-xs font-medium text-slate-700 max-w-[120px] sm:max-w-[180px] truncate">
                {user?.name || user?.email}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              leftIcon={<LogOutIcon className="w-3.5 h-3.5 text-slate-500" />}
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action / Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">My Boards</h1>
            <p className="text-sm text-slate-500 mt-1">
              Organize, track tasks, and collaborate in real-time
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<SearchIcon className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<PlusIcon className="w-4 h-4" />}
              className="shrink-0"
            >
              New Board
            </Button>
          </div>
        </div>

        {/* Board Cards Grid */}
        {boards.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center bg-white flex flex-col items-center justify-center max-w-xl mx-auto my-12 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <LayersIcon className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No boards found</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">
              Create your very first board to start managing your projects and tracking work across columns.
            </p>
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<PlusIcon className="w-4 h-4" />}
            >
              Create First Board
            </Button>
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="border border-slate-200 rounded-2xl p-12 text-center bg-white shadow-xs">
            <p className="text-slate-500 text-sm">No boards match your search query "{searchQuery}"</p>
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="mt-3">
              Clear filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBoards.map((board) => {
              const totalTasks = board.columns?.reduce((acc, c) => acc + (c.tasks?.length || 0), 0) || 0;
              const totalColumns = board.columns?.length || 0;

              return (
                <Link key={board.id} href={`/board/${board.id}`} className="group block focus:outline-none">
                  <Card
                    hoverEffect
                    className="p-6 h-full flex flex-col justify-between group-hover:border-indigo-200 relative overflow-hidden"
                  >
                    {/* Top Decorative accent */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity" />

                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {board.name}
                        </h3>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-1 -mr-2 -mt-1 opacity-80 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingBoard({
                                id: board.id,
                                name: board.name,
                                description: board.description || '',
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit board"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteBoard(e, board.id, board.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete board"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] mb-4">
                        {board.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          {totalColumns} {totalColumns === 1 ? 'column' : 'columns'}
                        </span>
                        <span>•</span>
                        <span>{totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}</span>
                      </div>

                      <span className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">
                        Open →
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Board"
        description="A board contains columns and draggable cards to visualize your workflow."
      >
        <form onSubmit={handleCreateBoard} className="space-y-4">
          <Input
            label="Board Name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="e.g. Sprint Roadmap, Marketing Launch"
            required
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            value={newBoardDescription}
            onChange={(e) => setNewBoardDescription(e.target.value)}
            placeholder="What is this board for?"
            rows={3}
          />
          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Board
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Board Modal */}
      <Modal
        isOpen={!!editingBoard}
        onClose={() => setEditingBoard(null)}
        title="Edit Board"
        description="Update board details"
      >
        <form onSubmit={handleUpdateBoard} className="space-y-4">
          <Input
            label="Board Name"
            value={editingBoard?.name || ''}
            onChange={(e) =>
              setEditingBoard((prev) => (prev ? { ...prev, name: e.target.value } : null))
            }
            placeholder="Board Name"
            required
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            value={editingBoard?.description || ''}
            onChange={(e) =>
              setEditingBoard((prev) => (prev ? { ...prev, description: e.target.value } : null))
            }
            placeholder="Board Description"
            rows={3}
          />
          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingBoard(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
