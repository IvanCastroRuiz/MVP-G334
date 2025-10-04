import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseHrOrmEntity } from '../../shared/infra/base-hr.entity.js';
import { EmployeeOrmEntity } from '../../employees/infra/employee.orm-entity.js';

@Entity({ name: 'leave_requests', schema: 'hr' })
export class LeaveRequestOrmEntity extends BaseHrOrmEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'requested_by', type: 'uuid', nullable: true })
  requestedBy!: string | null;

  @Column({ type: 'text' })
  type!: 'vacation' | 'sick' | 'personal' | 'other';

  @Column({ type: 'text', default: 'pending' })
  status!: 'pending' | 'approved' | 'rejected';

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: Date;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt!: Date | null;

  @ManyToOne(() => EmployeeOrmEntity, (employee) => employee.leaveRequests)
  employee!: EmployeeOrmEntity;
}
