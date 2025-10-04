import { ModuleEntity } from '../../domain/entities/module.entity.js';

export interface ModulesRepositoryPort {
  listModulesForUser(companyId: string, permissions: string[]): Promise<ModuleEntity[]>;
  ensureSeedData(): Promise<void>;
}
