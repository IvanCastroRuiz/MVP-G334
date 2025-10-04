export class Role {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
