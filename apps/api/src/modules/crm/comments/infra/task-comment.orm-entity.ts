import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseCrmOrmEntity } from '../../shared/infra/base-crm.entity.js';
import { TaskOrmEntity } from '../../tasks/infra/task.orm-entity.js';

@Entity({ name: 'task_comments', schema: 'crm' })
export class TaskCommentOrmEntity extends BaseCrmOrmEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ type: 'text' })
  content!: string;

  @ManyToOne(() => TaskOrmEntity, (task) => task.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task!: TaskOrmEntity;
}
