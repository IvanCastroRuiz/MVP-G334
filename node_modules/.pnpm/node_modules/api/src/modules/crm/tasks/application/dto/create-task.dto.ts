export class CreateTaskInput {
  constructor(
    public readonly title: string,
    public readonly description: string | null,
    public readonly projectId: string,
    public readonly boardId: string,
    public readonly boardColumnId: string,
    public readonly assignedTo: string | null,
    public readonly priority: 'low' | 'medium' | 'high' | 'critical',
    public readonly dueDate: Date | null,
  ) {}
}
