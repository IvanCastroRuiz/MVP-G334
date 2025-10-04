export class UpdateEmployeeInput {
  constructor(
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly email?: string | null,
    public readonly position?: string | null,
    public readonly department?: string | null,
    public readonly hireDate?: Date,
  ) {}
}
