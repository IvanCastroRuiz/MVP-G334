export class UpdateTaskInput {
  constructor(
    public readonly title?: string,
    public readonly description?: string | null,
    public readonly priority?: 'low' | 'medium' | 'high' | 'critical',
    public readonly assignedTo?: string | null,
    public readonly dueDate?: Date | null,
    public readonly status?: string,
  ) {}
}
