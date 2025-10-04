import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AUDIT_LOG_REPOSITORY } from '@modules/auth-rbac/application/ports/port.tokens.js';
import type { AuditLogRepositoryPort } from '@modules/auth-rbac/application/ports/audit-log.repository-port.js';
import { EMPLOYEES_REPOSITORY, LEAVE_REQUESTS_REPOSITORY } from '../../../port.tokens.js';
import type { LeaveRequestsRepositoryPort } from '../ports/leave-requests.repository-port.js';
import type { ListLeaveFilters } from '../dto/list-leave-filters.dto.js';
import type { CreateLeaveRequestInput } from '../dto/create-leave-request.input.js';
import type { LeaveRequest } from '../../domain/entities/leave-request.entity.js';
import type { EmployeesRepositoryPort } from '../../../employees/application/ports/employees.repository-port.js';

@Injectable()
export class LeaveRequestsService {
  constructor(
    @Inject(LEAVE_REQUESTS_REPOSITORY)
    private readonly leaveRequestsRepository: LeaveRequestsRepositoryPort,
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {}

  async listLeaveRequests(
    companyId: string,
    filters: ListLeaveFilters,
  ): Promise<LeaveRequest[]> {
    return this.leaveRequestsRepository.list(companyId, filters);
  }

  async createLeaveRequest(
    companyId: string,
    userId: string,
    input: CreateLeaveRequestInput,
  ): Promise<LeaveRequest> {
    const employee = await this.employeesRepository.findById(
      companyId,
      input.employeeId,
    );
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    const leave = await this.leaveRequestsRepository.create(
      companyId,
      userId,
      input,
    );
    await this.auditLogRepository.record(companyId, userId, 'hr.leave.requested', {
      leaveId: leave.id,
      employeeId: input.employeeId,
    });
    return leave;
  }

  async approveLeave(
    companyId: string,
    userId: string,
    leaveId: string,
    notes: string | null,
  ): Promise<LeaveRequest> {
    const updated = await this.leaveRequestsRepository.updateStatus(
      companyId,
      leaveId,
      {
        status: 'approved',
        approverId: userId,
        notes: notes ?? null,
      },
    );
    if (!updated) {
      throw new NotFoundException('Leave request not found');
    }
    await this.employeesRepository.setStatus(companyId, updated.employeeId, 'on_leave', {
      terminationDate: null,
    });
    await this.employeesRepository.recordEmploymentHistory({
      companyId,
      employeeId: updated.employeeId,
      status: 'on_leave',
      effectiveDate: updated.startDate,
      notes: notes ?? 'Leave approved',
      changedBy: userId,
    });
    await this.auditLogRepository.record(companyId, userId, 'hr.leave.approved', {
      leaveId,
      employeeId: updated.employeeId,
    });
    return updated;
  }

  async rejectLeave(
    companyId: string,
    userId: string,
    leaveId: string,
    notes: string | null,
  ): Promise<LeaveRequest> {
    const updated = await this.leaveRequestsRepository.updateStatus(
      companyId,
      leaveId,
      {
        status: 'rejected',
        approverId: userId,
        notes: notes ?? null,
      },
    );
    if (!updated) {
      throw new NotFoundException('Leave request not found');
    }
    await this.auditLogRepository.record(companyId, userId, 'hr.leave.rejected', {
      leaveId,
      employeeId: updated.employeeId,
    });
    return updated;
  }
}
