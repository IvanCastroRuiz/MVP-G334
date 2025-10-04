import { Column, Entity, OneToMany } from 'typeorm';
import { BaseCrmOrmEntity } from '../../shared/infra/base-crm.entity.js';
import { BoardOrmEntity } from '../../boards/infra/board.orm-entity.js';

@Entity({ name: 'projects', schema: 'crm' })
export class ProjectOrmEntity extends BaseCrmOrmEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @OneToMany(() => BoardOrmEntity, (board) => board.project)
  boards!: BoardOrmEntity[];
}
