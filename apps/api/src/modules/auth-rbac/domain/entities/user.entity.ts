export class User {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
