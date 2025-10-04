import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks/application/services/tasks.service.js';
import { TaskCommentsService } from './comments/application/services/task-comments.service.js';
import { TasksRepository } from './tasks/infra/tasks.repository.js';
import { TaskCommentsRepository } from './comments/infra/task-comments.repository.js';
import { TaskOrmEntity } from './tasks/infra/task.orm-entity.js';
import { BoardOrmEntity } from './boards/infra/board.orm-entity.js';
import { BoardColumnOrmEntity } from './boards/infra/board-column.orm-entity.js';
import { TaskCommentOrmEntity } from './comments/infra/task-comment.orm-entity.js';
import { ProjectOrmEntity } from './projects/infra/project.orm-entity.js';
import { TASKS_REPOSITORY, TASK_COMMENTS_REPOSITORY } from './shared/application/port.tokens.js';
import { TasksController } from './tasks/ui/controllers/tasks.controller.js';
import { TaskCommentsController } from './comments/ui/controllers/task-comments.controller.js';
import { AuthRbacModule } from '../auth-rbac/auth-rbac.module.js';

@Module({
  imports: [
    forwardRef(() => AuthRbacModule),
    TypeOrmModule.forFeature([
      TaskOrmEntity,
      BoardOrmEntity,
      BoardColumnOrmEntity,
      TaskCommentOrmEntity,
      ProjectOrmEntity,
    ]),
  ],
  providers: [
    TasksService,
    TaskCommentsService,
    TasksRepository,
    TaskCommentsRepository,
    { provide: TASKS_REPOSITORY, useExisting: TasksRepository },
    {
      provide: TASK_COMMENTS_REPOSITORY,
      useExisting: TaskCommentsRepository,
    },
  ],
  controllers: [TasksController, TaskCommentsController],
  exports: [TasksService],
})
export class CrmModule {}
