import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  ROLES_REPOSITORY,
} from '@modules/auth-rbac/application/ports/port.tokens.js';
import type { AuditLogRepositoryPort } from '@modules/auth-rbac/application/ports/audit-log.repository-port.js';
import type { RolesRepositoryPort } from '@modules/auth-rbac/application/ports/roles.repository-port.js';
import { EMPLOYEES_REPOSITORY } from '../../../port.tokens.js';
import type { EmployeesRepositoryPort } from '../ports/employees.repository-port.js';
import type { ListEmployeesFilters } from '../dto/list-employees-filters.dto.js';
import type { CreateEmployeeInput } from '../dto/create-employee.input.js';
import type { UpdateEmployeeInput } from '../dto/update-employee.input.js';
import type { TerminateEmployeeInput } from '../dto/terminate-employee.input.js';
import type { ReactivateEmployeeInput } from '../dto/reactivate-employee.input.js';
import type { Employee } from '../../domain/entities/employee.entity.js';

@Injectable()
export class EmployeesService {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: RolesRepositoryPort,
  ) {}

  async listEmployees(
    companyId: string,
    filters: ListEmployeesFilters,
  ): Promise<Employee[]> {
    return this.employeesRepository.list(companyId, filters);
  }

  async getEmployee(companyId: string, employeeId: string): Promise<Employee> {
    const employee = await this.employeesRepository.findById(companyId, employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async createEmployee(
    companyId: string,
    userId: string,
    input: CreateEmployeeInput,
  ): Promise<Employee> {
    const employee = await this.employeesRepository.create(companyId, input);
    if (input.userId && input.roleId) {
      await this.rolesRepository.assignRoleToUser(
        companyId,
        input.userId,
        input.roleId,
      );
    }
    await this.employeesRepository.recordEmploymentHistory({
      companyId,
      employeeId: employee.id,
      status: employee.status,
      effectiveDate: input.hireDate,
      notes: 'Initial hiring',
      changedBy: userId,
    });
    await this.auditLogRepository.record(companyId, userId, 'hr.employee.created', {
      employeeId: employee.id,
      assignedUserId: input.userId,
      assignedRoleId: input.roleId,
    });
    return employee;
  }

  async updateEmployee(
    companyId: string,
    userId: string,
    employeeId: string,
    input: UpdateEmployeeInput,
  ): Promise<Employee> {
    const updated = await this.employeesRepository.update(
      companyId,
      employeeId,
      input,
    );
    if (!updated) {
      throw new NotFoundException('Employee not found');
    }
    await this.auditLogRepository.record(companyId, userId, 'hr.employee.updated', {
      employeeId,
    });
    return updated;
  }

  async terminateEmployee(
    companyId: string,
    userId: string,
    employeeId: string,
    input: TerminateEmployeeInput,
  ): Promise<Employee> {
    const updated = await this.employeesRepository.setStatus(
      companyId,
      employeeId,
      'terminated',
      { terminationDate: input.terminationDate },
    );
    if (!updated) {
      throw new NotFoundException('Employee not found');
    }
    await this.employeesRepository.recordEmploymentHistory({
      companyId,
      employeeId,
      status: 'terminated',
      effectiveDate: input.terminationDate,
      notes: input.reason ?? null,
      changedBy: userId,
    });
    await this.auditLogRepository.record(companyId, userId, 'hr.employee.terminated', {
      employeeId,
      reason: input.reason,
    });
    return updated;
  }

  async reactivateEmployee(
    companyId: string,
    userId: string,
    employeeId: string,
    input: ReactivateEmployeeInput,
  ): Promise<Employee> {
    const updated = await this.employeesRepository.setStatus(
      companyId,
      employeeId,
      'hired',
      { hireDate: input.hireDate, terminationDate: null },
    );
    if (!updated) {
      throw new NotFoundException('Employee not found');
    }
    await this.employeesRepository.recordEmploymentHistory({
      companyId,
      employeeId,
      status: 'hired',
      effectiveDate: input.hireDate,
      notes: input.notes ?? null,
      changedBy: userId,
    });
    await this.auditLogRepository.record(companyId, userId, 'hr.employee.reactivated', {
      employeeId,
    });
    return updated;
  }
}
