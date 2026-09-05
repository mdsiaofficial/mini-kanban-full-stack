'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { useBoardStore } from '@/stores/board';
import { useSocketStore } from '@/stores/socket';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const { boards, isLoading: boardsLoading, fetchBoards, createBoard, deleteBoard } = useBoardStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBoards();
    }
  }, [isAuthenticated, fetchBoards]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      await createBoard(newBoardName, newBoardDescription);
      setNewBoardName('');
      setNewBoardDescription('');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleDeleteBoard = async (e: React.MouseEvent, boardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this board?')) return;

    try {
      await deleteBoard(boardId);
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  if (authLoading || boardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Boards</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button variant="secondary" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Create New Board
          </Button>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No boards yet. Create your first board!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Link key={board.id} href={`/board/${board.id}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {board.name}
                      </h3>
                      {board.description && (
                        <p className="text-sm text-gray-500 mb-2">{board.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {board.columns.length} columns · {board.columns.reduce((acc, c) => acc + c.tasks.length, 0)} tasks
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteBoard(e, board.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Board"
      >
        <form onSubmit={handleCreateBoard} className="space-y-4">
          <Input
            label="Board Name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="My Kanban Board"
            required
          />
          <Input
            label="Description (optional)"
            value={newBoardDescription}
            onChange={(e) => setNewBoardDescription(e.target.value)}
            placeholder="A brief description"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Board</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
