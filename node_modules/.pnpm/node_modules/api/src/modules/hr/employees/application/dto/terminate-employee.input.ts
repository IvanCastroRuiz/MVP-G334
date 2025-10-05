export class TerminateEmployeeInput {
  constructor(
    public readonly terminationDate: Date,
    public readonly reason: string | null,
  ) {}
}
