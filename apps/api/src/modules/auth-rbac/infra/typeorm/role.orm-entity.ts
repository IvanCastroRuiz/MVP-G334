import { Column, Entity, OneToMany } from 'typeorm';
import { BaseOrmEntity } from './base.entity.js';
import { UserRoleOrmEntity } from './user-role.orm-entity.js';
import { RolePermissionOrmEntity } from './role-permission.orm-entity.js';

@Entity({ name: 'roles', schema: 'auth_rbac' })
export class RoleOrmEntity extends BaseOrmEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @OneToMany(() => UserRoleOrmEntity, (userRole) => userRole.role)
  userRoles!: UserRoleOrmEntity[];

  @OneToMany(() => RolePermissionOrmEntity, (rolePermission) => rolePermission.role)
  rolePermissions!: RolePermissionOrmEntity[];
}
