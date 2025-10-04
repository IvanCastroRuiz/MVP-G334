export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';
export type LeaveType = 'vacation' | 'sick' | 'personal' | 'other';

export class LeaveRequest {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly employeeId: string,
    public type: LeaveType,
    public status: LeaveRequestStatus,
    public startDate: Date,
    public endDate: Date,
    public reason: string | null,
    public requestedBy: string | null,
    public approvedBy: string | null,
    public decidedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
