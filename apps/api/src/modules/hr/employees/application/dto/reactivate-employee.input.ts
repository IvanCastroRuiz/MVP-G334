export class ReactivateEmployeeInput {
  constructor(
    public readonly hireDate: Date,
    public readonly notes: string | null,
  ) {}
}
