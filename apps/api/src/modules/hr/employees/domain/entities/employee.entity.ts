export type EmployeeStatus = 'hired' | 'terminated' | 'on_leave';

export class Employee {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public firstName: string,
    public lastName: string,
    public email: string | null,
    public position: string | null,
    public department: string | null,
    public hireDate: Date,
    public terminationDate: Date | null,
    public status: EmployeeStatus,
    public userId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}
