import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseCrmOrmEntity } from '../../shared/infra/base-crm.entity.js';
import { ProjectOrmEntity } from '../../projects/infra/project.orm-entity.js';
import { BoardColumnOrmEntity } from './board-column.orm-entity.js';
import { TaskOrmEntity } from '../../tasks/infra/task.orm-entity.js';

@Entity({ name: 'boards', schema: 'crm' })
export class BoardOrmEntity extends BaseCrmOrmEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ type: 'text' })
  name!: string;

  @ManyToOne(() => ProjectOrmEntity, (project) => project.boards)
  @JoinColumn({ name: 'project_id' })
  project!: ProjectOrmEntity;

  @OneToMany(() => BoardColumnOrmEntity, (column) => column.board)
  columns!: BoardColumnOrmEntity[];

  @OneToMany(() => TaskOrmEntity, (task) => task.board)
  tasks!: TaskOrmEntity[];
}
