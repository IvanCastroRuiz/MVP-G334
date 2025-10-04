import type { Employee } from '../../domain/entities/employee.entity.js';
import type { EmploymentHistoryEntry } from '../../domain/entities/employment-history.entity.js';
import type { ListEmployeesFilters } from '../dto/list-employees-filters.dto.js';
import type { CreateEmployeeInput } from '../dto/create-employee.input.js';
import type { UpdateEmployeeInput } from '../dto/update-employee.input.js';

export interface EmployeesRepositoryPort {
  list(companyId: string, filters: ListEmployeesFilters): Promise<Employee[]>;
  findById(companyId: string, employeeId: string): Promise<Employee | null>;
  create(companyId: string, input: CreateEmployeeInput): Promise<Employee>;
  update(
    companyId: string,
    employeeId: string,
    input: UpdateEmployeeInput,
  ): Promise<Employee | null>;
  setStatus(
    companyId: string,
    employeeId: string,
    status: Employee['status'],
    payload: {
      terminationDate?: Date | null;
      hireDate?: Date | null;
    },
  ): Promise<Employee | null>;
  recordEmploymentHistory(entry: {
    companyId: string;
    employeeId: string;
    status: Employee['status'];
    effectiveDate: Date;
    notes?: string | null;
    changedBy?: string | null;
  }): Promise<EmploymentHistoryEntry>;
}
