import type { EmployeeStatus } from '../../domain/entities/employee.entity.js';

export class ListEmployeesFilters {
  constructor(
    public readonly status?: EmployeeStatus,
    public readonly search?: string,
  ) {}
}
