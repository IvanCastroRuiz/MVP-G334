import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseOrmEntity } from './base.entity.js';
import { ModuleOrmEntity } from './module.orm-entity.js';
import { RolePermissionOrmEntity } from './role-permission.orm-entity.js';

@Entity({ name: 'permissions', schema: 'auth_rbac' })
export class PermissionOrmEntity extends BaseOrmEntity {
  @Column({ name: 'module_id', type: 'uuid' })
  moduleId!: string;

  @Column({ type: 'text' })
  action!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToOne(() => ModuleOrmEntity, (module) => module.permissions)
  @JoinColumn({ name: 'module_id' })
  module!: ModuleOrmEntity;

  @OneToMany(() => RolePermissionOrmEntity, (rolePermission) => rolePermission.permission)
  rolePermissions!: RolePermissionOrmEntity[];
}
