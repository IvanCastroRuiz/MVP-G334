import type { EmployeeStatus } from './employee.entity.js';

export class EmploymentHistoryEntry {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly employeeId: string,
    public readonly status: EmployeeStatus,
    public readonly effectiveDate: Date,
    public readonly notes: string | null,
    public readonly changedBy: string | null,
    public readonly createdAt: Date,
  ) {}
}
