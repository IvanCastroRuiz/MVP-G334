export class Task {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly projectId: string,
    public readonly boardId: string,
    public readonly boardColumnId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly priority: 'low' | 'medium' | 'high' | 'critical',
    public readonly status: string,
    public readonly assignedTo: string | null,
    public readonly dueDate: Date | null,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
