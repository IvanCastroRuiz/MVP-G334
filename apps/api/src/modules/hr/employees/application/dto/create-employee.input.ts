import type { EmployeeStatus } from '../../domain/entities/employee.entity.js';

export class CreateEmployeeInput {
  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string | null,
    public readonly position: string | null,
    public readonly department: string | null,
    public readonly hireDate: Date,
    public readonly userId: string | null,
    public readonly roleId: string | null,
    public readonly status: EmployeeStatus = 'hired',
  ) {}
}
