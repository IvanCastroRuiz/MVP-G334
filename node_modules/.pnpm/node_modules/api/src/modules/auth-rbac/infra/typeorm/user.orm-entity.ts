import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseOrmEntity } from './base.entity.js';
import { CompanyOrmEntity } from './company.orm-entity.js';
import { UserRoleOrmEntity } from './user-role.orm-entity.js';
import { RefreshTokenOrmEntity } from './refresh-token.orm-entity.js';

@Entity({ name: 'users', schema: 'auth_rbac' })
export class UserOrmEntity extends BaseOrmEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => CompanyOrmEntity, (company) => company.users)
  @JoinColumn({ name: 'company_id' })
  company!: CompanyOrmEntity;

  @OneToMany(() => UserRoleOrmEntity, (userRole) => userRole.user)
  roles!: UserRoleOrmEntity[];

  @OneToMany(() => RefreshTokenOrmEntity, (token) => token.user)
  refreshTokens!: RefreshTokenOrmEntity[];
}
