import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskCommentOrmEntity } from './task-comment.orm-entity.js';
import { TaskComment } from '../domain/entities/task-comment.entity.js';
import { TaskCommentsRepositoryPort } from '../application/ports/task-comments.repository-port.js';

@Injectable()
export class TaskCommentsRepository implements TaskCommentsRepositoryPort {
  constructor(
    @InjectRepository(TaskCommentOrmEntity)
    private readonly repository: Repository<TaskCommentOrmEntity>,
  ) {}

  async createComment(comment: {
    companyId: string;
    taskId: string;
    authorId: string;
    content: string;
  }): Promise<TaskComment> {
    const entity = this.repository.create({
      companyId: comment.companyId,
      taskId: comment.taskId,
      authorId: comment.authorId,
      content: comment.content,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findForTask(companyId: string, taskId: string): Promise<TaskComment[]> {
    const comments = await this.repository.find({
      where: { companyId, taskId },
      order: { createdAt: 'ASC' },
    });
    return comments.map((comment) => this.toDomain(comment));
  }

  private toDomain(entity: TaskCommentOrmEntity): TaskComment {
    return new TaskComment(
      entity.id,
      entity.companyId,
      entity.taskId,
      entity.authorId,
      entity.content,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
