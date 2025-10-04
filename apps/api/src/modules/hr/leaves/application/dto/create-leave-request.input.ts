import type { LeaveType } from '../../domain/entities/leave-request.entity.js';

export class CreateLeaveRequestInput {
  constructor(
    public readonly employeeId: string,
    public readonly type: LeaveType,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly reason: string | null,
  ) {}
}
