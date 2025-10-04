import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseCrmOrmEntity } from '../../shared/infra/base-crm.entity.js';
import { BoardOrmEntity } from './board.orm-entity.js';
import { TaskOrmEntity } from '../../tasks/infra/task.orm-entity.js';

@Entity({ name: 'board_columns', schema: 'crm' })
export class BoardColumnOrmEntity extends BaseCrmOrmEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'board_id', type: 'uuid' })
  boardId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'order_index', type: 'integer' })
  orderIndex!: number;

  @ManyToOne(() => BoardOrmEntity, (board) => board.columns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'board_id' })
  board!: BoardOrmEntity;

  @OneToMany(() => TaskOrmEntity, (task) => task.boardColumn)
  tasks!: TaskOrmEntity[];
}
