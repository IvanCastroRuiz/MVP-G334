import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseHrOrmEntity } from '../../shared/infra/base-hr.entity.js';
import { EmployeeOrmEntity } from './employee.orm-entity.js';

@Entity({ name: 'employment_history', schema: 'hr' })
export class EmploymentHistoryOrmEntity extends BaseHrOrmEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ type: 'text' })
  status!: 'hired' | 'terminated' | 'on_leave';

  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy!: string | null;

  @ManyToOne(() => EmployeeOrmEntity, (employee) => employee.history)
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employee!: EmployeeOrmEntity;
}
