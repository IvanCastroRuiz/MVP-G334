import { Column, Entity, OneToMany } from 'typeorm';
import { BaseHrOrmEntity } from '../../shared/infra/base-hr.entity.js';
import { EmploymentHistoryOrmEntity } from './employment-history.orm-entity.js';
import { LeaveRequestOrmEntity } from '../../leaves/infra/leave-request.orm-entity.js';

@Entity({ name: 'employees', schema: 'hr' })
export class EmployeeOrmEntity extends BaseHrOrmEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'first_name', type: 'text' })
  firstName!: string;

  @Column({ name: 'last_name', type: 'text' })
  lastName!: string;

  @Column({ type: 'text', nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  position!: string | null;

  @Column({ type: 'text', nullable: true })
  department!: string | null;

  @Column({ name: 'hire_date', type: 'date' })
  hireDate!: Date;

  @Column({ name: 'termination_date', type: 'date', nullable: true })
  terminationDate!: Date | null;

  @Column({ type: 'text', default: 'hired' })
  status!: 'hired' | 'terminated' | 'on_leave';

  @OneToMany(() => EmploymentHistoryOrmEntity, (history) => history.employee)
  history!: EmploymentHistoryOrmEntity[];

  @OneToMany(() => LeaveRequestOrmEntity, (leave) => leave.employee)
  leaveRequests!: LeaveRequestOrmEntity[];
}
