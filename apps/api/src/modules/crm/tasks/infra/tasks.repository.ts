import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { BoardDetailsDto, BoardSummaryDto } from '@mvp/shared';
import { TaskOrmEntity } from './task.orm-entity.js';
import { BoardOrmEntity } from '../../boards/infra/board.orm-entity.js';
import { Task } from '../domain/entities/task.entity.js';
import { TasksRepositoryPort } from '../application/ports/tasks.repository-port.js';

@Injectable()
export class TasksRepository implements TasksRepositoryPort {
  constructor(
    @InjectRepository(TaskOrmEntity)
    private readonly tasksRepository: Repository<TaskOrmEntity>,
    @InjectRepository(BoardOrmEntity)
    private readonly boardsRepository: Repository<BoardOrmEntity>,
  ) {}

  async findBoardWithDetails(
    companyId: string,
    boardId: string,
  ): Promise<BoardDetailsDto | null> {
    const board = await this.boardsRepository.findOne({
      where: { id: boardId, companyId },
      relations: ['columns', 'tasks', 'tasks.comments'],
      order: {
        columns: { orderIndex: 'ASC' },
      },
    });
    if (!board) {
      return null;
    }

    return {
      id: board.id,
      name: board.name,
      projectId: board.projectId,
      columns: board.columns
        .map((column) => ({
          id: column.id,
          name: column.name,
          orderIndex: column.orderIndex,
        }))
        .sort((a, b) => a.orderIndex - b.orderIndex),
      tasks: board.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        boardColumnId: task.boardColumnId,
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        comments: task.comments?.map((comment) => ({
          id: comment.id,
          content: comment.content,
          authorId: comment.authorId,
          createdAt: comment.createdAt.toISOString(),
        })) ?? [],
      })),
    };
  }

  async listBoards(companyId: string): Promise<BoardSummaryDto[]> {
    const boards = await this.boardsRepository.find({
      where: { companyId },
      order: { createdAt: 'ASC' },
    });
    return boards.map((board) => ({
      id: board.id,
      name: board.name,
      projectId: board.projectId,
    }));
  }

  async createTask(task: {
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
  }): Promise<Task> {
    const entity = this.tasksRepository.create({
      companyId: task.companyId,
      projectId: task.projectId,
      boardId: task.boardId,
      boardColumnId: task.boardColumnId,
      title: task.title,
      description: task.description ?? null,
      priority: task.priority ?? 'medium',
      assignedTo: task.assignedTo ?? null,
      dueDate: task.dueDate ?? null,
      createdBy: task.createdBy,
    });
    const saved = await this.tasksRepository.save(entity);
    return this.toDomain(saved);
  }

  async moveTask(
    companyId: string,
    taskId: string,
    boardColumnId: string,
  ): Promise<Task | null> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, companyId },
    });
    if (!task) {
      return null;
    }
    task.boardColumnId = boardColumnId;
    const saved = await this.tasksRepository.save(task);
    return this.toDomain(saved);
  }

  async updateTask(
    companyId: string,
    taskId: string,
    payload: Partial<
      Omit<Task, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>
    >,
  ): Promise<Task | null> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, companyId },
    });
    if (!task) {
      return null;
    }
    Object.assign(task, payload);
    const saved = await this.tasksRepository.save(task);
    return this.toDomain(saved);
  }

  async findById(companyId: string, taskId: string): Promise<Task | null> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, companyId },
    });
    return task ? this.toDomain(task) : null;
  }

  private toDomain(task: TaskOrmEntity): Task {
    return new Task(
      task.id,
      task.companyId,
      task.projectId,
      task.boardId,
      task.boardColumnId,
      task.title,
      task.description,
      task.priority,
      task.status,
      task.assignedTo,
      task.dueDate,
      task.createdBy,
      task.createdAt,
      task.updatedAt,
    );
  }
}
