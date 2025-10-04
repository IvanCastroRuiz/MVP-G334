import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseCrmOrmEntity } from '../../shared/infra/base-crm.entity.js';
import { BoardOrmEntity } from '../../boards/infra/board.orm-entity.js';
import { BoardColumnOrmEntity } from '../../boards/infra/board-column.orm-entity.js';
import { ProjectOrmEntity } from '../../projects/infra/project.orm-entity.js';
import { TaskCommentOrmEntity } from '../../comments/infra/task-comment.orm-entity.js';

@Entity({ name: 'tasks', schema: 'crm' })
export class TaskOrmEntity extends BaseCrmOrmEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'board_id', type: 'uuid' })
  boardId!: string;

  @Column({ name: 'board_column_id', type: 'uuid' })
  boardColumnId!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', default: 'medium' })
  priority!: 'low' | 'medium' | 'high' | 'critical';

  @Column({ type: 'text', default: 'open' })
  status!: string;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo!: string | null;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate!: Date | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @ManyToOne(() => ProjectOrmEntity, (project) => project.boards)
  @JoinColumn({ name: 'project_id' })
  project!: ProjectOrmEntity;

  @ManyToOne(() => BoardOrmEntity, (board) => board.tasks)
  @JoinColumn({ name: 'board_id' })
  board!: BoardOrmEntity;

  @ManyToOne(() => BoardColumnOrmEntity, (column) => column.tasks)
  @JoinColumn({ name: 'board_column_id' })
  boardColumn!: BoardColumnOrmEntity;

  @OneToMany(() => TaskCommentOrmEntity, (comment) => comment.task)
  comments!: TaskCommentOrmEntity[];
}
