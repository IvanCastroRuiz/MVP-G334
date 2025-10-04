import { Inject, Injectable } from '@nestjs/common';
import { TaskCommentsRepositoryPort } from '../ports/task-comments.repository-port.js';
import { TASK_COMMENTS_REPOSITORY } from '../../../shared/application/port.tokens.js';
import { AUDIT_LOG_REPOSITORY } from '@modules/auth-rbac/application/ports/port.tokens.js';
import { AuditLogRepositoryPort } from '@modules/auth-rbac/application/ports/audit-log.repository-port.js';

@Injectable()
export class TaskCommentsService {
  constructor(
    @Inject(TASK_COMMENTS_REPOSITORY)
    private readonly commentsRepository: TaskCommentsRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {}

  async addComment(
    companyId: string,
    userId: string,
    taskId: string,
    content: string,
  ) {
    const comment = await this.commentsRepository.createComment({
      companyId,
      taskId,
      authorId: userId,
      content,
    });
    await this.auditLogRepository.record(companyId, userId, 'task_commented', {
      taskId,
      commentId: comment.id,
    });
    return comment;
  }

  async getTaskComments(companyId: string, taskId: string) {
    return this.commentsRepository.findForTask(companyId, taskId);
  }
}
