import { Column, Entity, OneToMany } from 'typeorm';
import { BaseOrmEntity } from './base.entity.js';
import { PermissionOrmEntity } from './permission.orm-entity.js';

@Entity({ name: 'modules', schema: 'auth_rbac' })
export class ModuleOrmEntity extends BaseOrmEntity {
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

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
