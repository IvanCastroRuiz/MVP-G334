import type { LeaveRequest } from '../../domain/entities/leave-request.entity.js';
import type { ListLeaveFilters } from '../dto/list-leave-filters.dto.js';
import type { CreateLeaveRequestInput } from '../dto/create-leave-request.input.js';

export interface LeaveRequestsRepositoryPort {
  list(companyId: string, filters: ListLeaveFilters): Promise<LeaveRequest[]>;
  findById(companyId: string, leaveId: string): Promise<LeaveRequest | null>;
  create(
    companyId: string,
    requestedBy: string,
    input: CreateLeaveRequestInput,
  ): Promise<LeaveRequest>;
  updateStatus(
    companyId: string,
    leaveId: string,
    input: {
      status: LeaveRequest['status'];
      approverId: string;
      notes: string | null;
    },
  ): Promise<LeaveRequest | null>;
}
