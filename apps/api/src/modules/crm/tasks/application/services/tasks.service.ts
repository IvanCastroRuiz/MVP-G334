import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { BoardDetailsDto, BoardSummaryDto } from '@mvp/shared';
import { CreateTaskInput } from '../dto/create-task.dto.js';
import { UpdateTaskInput } from '../dto/update-task.dto.js';
import { MoveTaskInput } from '../dto/move-task.dto.js';
import { TASKS_REPOSITORY } from '../../../shared/application/port.tokens.js';
import { TasksRepositoryPort } from '../ports/tasks.repository-port.js';
import { AUDIT_LOG_REPOSITORY } from '@modules/auth-rbac/application/ports/port.tokens.js';
import { AuditLogRepositoryPort } from '@modules/auth-rbac/application/ports/audit-log.repository-port.js';

@Injectable()
export class TasksService {
  constructor(
    @Inject(TASKS_REPOSITORY)
    private readonly tasksRepository: TasksRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {}

  async getBoard(companyId: string, boardId: string): Promise<BoardDetailsDto> {
    const board = await this.tasksRepository.findBoardWithDetails(companyId, boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    return board;
  }

  async listBoards(companyId: string): Promise<BoardSummaryDto[]> {
    return this.tasksRepository.listBoards(companyId);
  }

  async createTask(
    companyId: string,
    userId: string,
    input: CreateTaskInput,
  ) {
    const task = await this.tasksRepository.createTask({
      companyId,
      projectId: input.projectId,
      boardId: input.boardId,
      boardColumnId: input.boardColumnId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      assignedTo: input.assignedTo,
      dueDate: input.dueDate ?? null,
      createdBy: userId,
    });

    await this.auditLogRepository.record(companyId, userId, 'task_created', {
      taskId: task.id,
      boardId: input.boardId,
    });

    return task;
  }

  async updateTask(
    companyId: string,
    userId: string,
    taskId: string,
    input: UpdateTaskInput,
  ) {
    const task = await this.tasksRepository.updateTask(companyId, taskId, {
      title: input.title,
      description: input.description,
      priority: input.priority,
      assignedTo: input.assignedTo,
      dueDate: input.dueDate,
      status: input.status,
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.auditLogRepository.record(companyId, userId, 'task_updated', {
      taskId,
    });
    return task;
  }

  async moveTask(
    companyId: string,
    userId: string,
    taskId: string,
    input: MoveTaskInput,
  ) {
    const task = await this.tasksRepository.moveTask(
      companyId,
      taskId,
      input.boardColumnId,
    );
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await this.auditLogRepository.record(companyId, userId, 'task_moved', {
      taskId,
      boardColumnId: input.boardColumnId,
    });
    return task;
  }
}
