import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseOrmEntity } from './base.entity.js';
import { PermissionOrmEntity } from './permission.orm-entity.js';

@Entity({ name: 'modules', schema: 'auth_rbac' })
export class ModuleOrmEntity extends BaseOrmEntity {
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => ModuleOrmEntity, (module) => module.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: ModuleOrmEntity | null;

  @OneToMany(() => ModuleOrmEntity, (module) => module.parent)
  children?: ModuleOrmEntity[];

  @Column({ type: 'text', unique: true })
  key!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', default: 'public' })
  visibility!: 'public' | 'dev_only';

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => PermissionOrmEntity, (permission) => permission.module)
  permissions!: PermissionOrmEntity[];
}
