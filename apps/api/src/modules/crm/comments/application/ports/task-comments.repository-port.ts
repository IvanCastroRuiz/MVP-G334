import { TaskComment } from '../../domain/entities/task-comment.entity.js';

export interface TaskCommentsRepositoryPort {
  createComment(comment: {
    companyId: string;
    taskId: string;
    authorId: string;
    content: string;
  }): Promise<TaskComment>;
  findForTask(companyId: string, taskId: string): Promise<TaskComment[]>;
}
