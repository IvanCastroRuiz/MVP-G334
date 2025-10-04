import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { RoleOrmEntity } from './role.orm-entity.js';
import { PermissionOrmEntity } from './permission.orm-entity.js';

@Entity({ name: 'role_permissions', schema: 'auth_rbac' })
export class RolePermissionOrmEntity {
  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @PrimaryColumn({ name: 'permission_id', type: 'uuid' })
  permissionId!: string;

  @ManyToOne(() => RoleOrmEntity, (role) => role.rolePermissions)
  @JoinColumn({ name: 'role_id' })
  role!: RoleOrmEntity;

  @ManyToOne(() => PermissionOrmEntity, (permission) => permission.rolePermissions)
  @JoinColumn({ name: 'permission_id' })
  permission!: PermissionOrmEntity;
}
