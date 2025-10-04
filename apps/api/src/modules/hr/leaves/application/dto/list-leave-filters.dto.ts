import type { LeaveRequestStatus, LeaveType } from '../../domain/entities/leave-request.entity.js';

export class ListLeaveFilters {
  constructor(
    public readonly status?: LeaveRequestStatus,
    public readonly type?: LeaveType,
    public readonly employeeId?: string,
  ) {}
}
