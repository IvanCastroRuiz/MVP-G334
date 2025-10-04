import type {
  BoardDetailsDto,
  BoardSummaryDto,
} from '@mvp/shared';
import { Task } from '../../domain/entities/task.entity.js';

export interface TasksRepositoryPort {
  findBoardWithDetails(
    companyId: string,
    boardId: string,
  ): Promise<BoardDetailsDto | null>;
  listBoards(companyId: string): Promise<BoardSummaryDto[]>;
  createTask(task: {
    companyId: string;
    projectId: string;
    boardId: string;
    boardColumnId: string;
    title: string;
    description?: string | null;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    assignedTo?: string | null;
    dueDate?: Date | null;
    createdBy: string;
  }): Promise<Task>;
  moveTask(companyId: string, taskId: string, boardColumnId: string): Promise<Task | null>;
  updateTask(companyId: string, taskId: string, payload: Partial<Omit<Task, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>): Promise<Task | null>;
  findById(companyId: string, taskId: string): Promise<Task | null>;
}
