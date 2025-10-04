import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity.js';
import { RoleOrmEntity } from './role.orm-entity.js';

@Entity({ name: 'user_roles', schema: 'auth_rbac' })
export class UserRoleOrmEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => UserOrmEntity, (user) => user.roles)
  @JoinColumn({ name: 'user_id' })
  user!: UserOrmEntity;

  @ManyToOne(() => RoleOrmEntity, (role) => role.userRoles)
  @JoinColumn({ name: 'role_id' })
  role!: RoleOrmEntity;
}
