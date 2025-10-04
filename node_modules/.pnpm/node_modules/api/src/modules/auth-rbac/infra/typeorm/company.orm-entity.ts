import { Column, Entity, OneToMany } from 'typeorm';
import { BaseOrmEntity } from './base.entity.js';
import { UserOrmEntity } from './user.orm-entity.js';

@Entity({ name: 'companies', schema: 'auth_rbac' })
export class CompanyOrmEntity extends BaseOrmEntity {
  @Column({ type: 'text' })
  name!: string;

  @OneToMany(() => UserOrmEntity, (user) => user.company)
  users!: UserOrmEntity[];
}
