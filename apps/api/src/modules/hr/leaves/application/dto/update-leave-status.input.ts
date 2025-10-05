import type { LeaveRequestStatus } from '../../domain/entities/leave-request.entity.js';

export class UpdateLeaveStatusInput {
  constructor(
    public readonly status: LeaveRequestStatus,
    public readonly approverId: string,
    public readonly notes: string | null,
  ) {}
}
