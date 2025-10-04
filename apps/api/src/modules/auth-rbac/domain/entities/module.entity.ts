export class ModuleEntity {
  constructor(
    public readonly id: string,
    public readonly companyId: string | null,
    public readonly parentId: string | null,
    public readonly key: string,
    public readonly name: string,
    public readonly visibility: 'public' | 'dev_only',
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly children: ModuleEntity[] = [],
  ) {}
}
