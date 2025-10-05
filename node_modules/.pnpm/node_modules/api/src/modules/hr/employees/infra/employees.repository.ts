import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeOrmEntity } from './employee.orm-entity.js';
import { EmploymentHistoryOrmEntity } from './employment-history.orm-entity.js';
import type { EmployeesRepositoryPort } from '../application/ports/employees.repository-port.js';
import type { ListEmployeesFilters } from '../application/dto/list-employees-filters.dto.js';
import type { CreateEmployeeInput } from '../application/dto/create-employee.input.js';
import type { UpdateEmployeeInput } from '../application/dto/update-employee.input.js';
import { Employee } from '../domain/entities/employee.entity.js';
import { EmploymentHistoryEntry } from '../domain/entities/employment-history.entity.js';

@Injectable()
export class EmployeesRepository implements EmployeesRepositoryPort {
  constructor(
    @InjectRepository(EmployeeOrmEntity)
    private readonly employeesRepository: Repository<EmployeeOrmEntity>,
    @InjectRepository(EmploymentHistoryOrmEntity)
    private readonly historyRepository: Repository<EmploymentHistoryOrmEntity>,
  ) {}

  async list(
    companyId: string,
    filters: ListEmployeesFilters,
  ): Promise<Employee[]> {
    const where: any = { companyId };
    if (filters.status) {
      where.status = filters.status;
    }
    const employees = await this.employeesRepository.find({
      where,
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return employees
        .filter((employee) =>
          `${employee.firstName} ${employee.lastName}`
            .toLowerCase()
            .includes(search),
        )
        .map((employee) => this.toDomain(employee));
    }
    return employees.map((employee) => this.toDomain(employee));
  }

  async findById(companyId: string, employeeId: string): Promise<Employee | null> {
    const employee = await this.employeesRepository.findOne({
      where: { id: employeeId, companyId },
    });
    return employee ? this.toDomain(employee) : null;
  }

  async create(
    companyId: string,
    input: CreateEmployeeInput,
  ): Promise<Employee> {
    const entity = this.employeesRepository.create({
      companyId,
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      position: input.position,
      department: input.department,
      hireDate: input.hireDate,
      terminationDate: null,
      status: input.status ?? 'hired',
    });
    const saved = await this.employeesRepository.save(entity);
    return this.toDomain(saved);
  }

  async update(
    companyId: string,
    employeeId: string,
    input: UpdateEmployeeInput,
  ): Promise<Employee | null> {
    const employee = await this.employeesRepository.findOne({
      where: { id: employeeId, companyId },
    });
    if (!employee) {
      return null;
    }
    if (input.firstName !== undefined) {
      employee.firstName = input.firstName;
    }
    if (input.lastName !== undefined) {
      employee.lastName = input.lastName;
    }
    if (input.email !== undefined) {
      employee.email = input.email;
    }
    if (input.position !== undefined) {
      employee.position = input.position;
    }
    if (input.department !== undefined) {
      employee.department = input.department;
    }
    if (input.hireDate !== undefined) {
      employee.hireDate = input.hireDate;
    }
    const saved = await this.employeesRepository.save(employee);
    return this.toDomain(saved);
  }

  async setStatus(
    companyId: string,
    employeeId: string,
    status: Employee['status'],
    payload: { terminationDate?: Date | null; hireDate?: Date | null },
  ): Promise<Employee | null> {
    const employee = await this.employeesRepository.findOne({
      where: { id: employeeId, companyId },
    });
    if (!employee) {
      return null;
    }
    employee.status = status;
    if (payload.terminationDate !== undefined) {
      employee.terminationDate = payload.terminationDate;
    }
    if (payload.hireDate !== undefined && payload.hireDate !== null) {
      employee.hireDate = payload.hireDate;
    }
    const saved = await this.employeesRepository.save(employee);
    return this.toDomain(saved);
  }

  async recordEmploymentHistory(entry: {
    companyId: string;
    employeeId: string;
    status: Employee['status'];
    effectiveDate: Date;
    notes?: string | null;
    changedBy?: string | null;
  }): Promise<EmploymentHistoryEntry> {
    const entity = this.historyRepository.create({
      companyId: entry.companyId,
      employeeId: entry.employeeId,
      status: entry.status,
      effectiveDate: entry.effectiveDate,
      notes: entry.notes ?? null,
      changedBy: entry.changedBy ?? null,
    });
    const saved = await this.historyRepository.save(entity);
    const effectiveDate =
      saved.effectiveDate instanceof Date
        ? saved.effectiveDate
        : new Date(saved.effectiveDate);
    return new EmploymentHistoryEntry(
      saved.id,
      saved.companyId,
      saved.employeeId,
      saved.status,
      effectiveDate,
      saved.notes,
      saved.changedBy,
      saved.createdAt,
    );
  }

  private toDomain(employee: EmployeeOrmEntity): Employee {
    return new Employee(
      employee.id,
      employee.companyId,
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.position,
      employee.department,
      employee.hireDate instanceof Date
        ? employee.hireDate
        : new Date(employee.hireDate),
      employee.terminationDate
        ? employee.terminationDate instanceof Date
          ? employee.terminationDate
          : new Date(employee.terminationDate)
        : null,
      employee.status,
      employee.userId,
      employee.createdAt,
      employee.updatedAt,
    );
  }
}
