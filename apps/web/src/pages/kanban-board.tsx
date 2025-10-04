import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BoardDetailsDto, BoardSummaryDto } from '@mvp/shared';
import api from '../api/client';
import { useAuthStore } from '../store/auth-store';

export default function KanbanBoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canCreateTasks = user?.permissions.includes('tasks:create');
  const canMoveTasks = user?.permissions.includes('tasks:move');
  const canComment = user?.permissions.includes('tasks:comment');

  const boardsQuery = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const response = await api.get('/kanban/boards');
      return response.data as BoardSummaryDto[];
    },
  });

  const effectiveBoardId = useMemo(() => {
    if (boardId) {
      return boardId;
    }
    if (boardsQuery.data && boardsQuery.data.length > 0) {
      return boardsQuery.data[0].id;
    }
    return null;
  }, [boardId, boardsQuery.data]);

  useEffect(() => {
    if (!boardId && effectiveBoardId) {
      navigate(`/board/${effectiveBoardId}`, { replace: true });
    }
  }, [boardId, effectiveBoardId, navigate]);

  const boardQuery = useQuery({
    queryKey: ['board', effectiveBoardId],
    queryFn: async () => {
      const response = await api.get(`/kanban/boards/${effectiveBoardId}`);
      return response.data as BoardDetailsDto;
    },
    enabled: Boolean(effectiveBoardId),
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      boardColumnId: string;
      projectId: string;
      boardId: string;
    }) => {
      await api.post('/kanban/tasks', {
        title: payload.title,
        projectId: payload.projectId,
        boardId: payload.boardId,
        boardColumnId: payload.boardColumnId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', effectiveBoardId] });
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: async (payload: { taskId: string; boardColumnId: string }) => {
      await api.post(`/kanban/tasks/${payload.taskId}/move`, {
        boardColumnId: payload.boardColumnId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', effectiveBoardId] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (payload: { taskId: string; content: string }) => {
      await api.post(`/kanban/tasks/${payload.taskId}/comments`, {
        content: payload.content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', effectiveBoardId] });
    },
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  if (boardsQuery.isLoading || boardQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-300">
        Loading board…
      </div>
    );
  }

  if (!effectiveBoardId || !boardQuery.data) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-slate-300">
        No boards available yet. Create one via seeds.
      </div>
    );
  }

  const board = boardQuery.data;

  const handleCreateTask = () => {
    if (!newTaskTitle || !selectedColumn) {
      return;
    }
    createTaskMutation.mutate({
      title: newTaskTitle,
      boardColumnId: selectedColumn,
      projectId: board.projectId,
      boardId: board.id,
    });
    setNewTaskTitle('');
  };

  const handleDrop = (columnId: string) => {
    if (!dragTaskId || !canMoveTasks) {
      return;
    }
    moveTaskMutation.mutate({ taskId: dragTaskId, boardColumnId: columnId });
    setDragTaskId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">{board.name}</h2>
          <p className="text-sm text-slate-400">Drag tasks across columns if permitted.</p>
        </div>
      </div>

      {canCreateTasks && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Create task</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            <input
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder="Task title"
              className="min-w-[240px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            />
            <select
              value={selectedColumn}
              onChange={(event) => setSelectedColumn(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            >
              <option value="">Select column</option>
              {board.columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateTask}
              disabled={createTaskMutation.isLoading}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
            >
              Add task
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {board.columns.map((column) => {
          const tasksInColumn = board.tasks.filter((task) => task.boardColumnId === column.id);
          return (
            <div
              key={column.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(column.id)}
              className="flex min-h-[400px] flex-col rounded-xl border border-slate-800 bg-slate-950/40"
            >
              <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
                {column.name}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                {tasksInColumn.map((task) => (
                  <div
                    key={task.id}
                    draggable={canMoveTasks}
                    onDragStart={() => setDragTaskId(task.id)}
                    className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 shadow-sm"
                  >
                    <div className="text-sm font-semibold text-slate-100">{task.title}</div>
                    {task.description && (
                      <p className="mt-2 text-xs text-slate-400">{task.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span className="rounded bg-slate-800 px-2 py-1 uppercase text-[10px] text-slate-300">
                        {task.priority}
                      </span>
                      <span>{task.comments.length} comments</span>
                    </div>
                    {canComment && (
                      <div className="mt-3 space-y-2">
                        <input
                          value={commentDrafts[task.id] ?? ''}
                          onChange={(event) =>
                            setCommentDrafts((prev) => ({ ...prev, [task.id]: event.target.value }))
                          }
                          placeholder="Add comment"
                          className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            const content = commentDrafts[task.id];
                            if (!content) return;
                            commentMutation.mutate({ taskId: task.id, content });
                            setCommentDrafts((prev) => ({ ...prev, [task.id]: '' }));
                          }}
                          className="rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500"
                        >
                          Comment
                        </button>
                      </div>
                    )}
                    <div className="mt-2 space-y-1 text-xs text-slate-400">
                      {task.comments.slice(-2).map((comment) => (
                        <div key={comment.id} className="rounded bg-slate-800/60 px-2 py-1">
                          {comment.content}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
