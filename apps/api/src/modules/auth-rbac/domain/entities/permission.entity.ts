export class Permission {
  constructor(
    public readonly id: string,
    public readonly moduleId: string,
    public readonly action: string,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
