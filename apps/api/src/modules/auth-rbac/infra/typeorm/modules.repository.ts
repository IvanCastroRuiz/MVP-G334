import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ModulesRepositoryPort } from '../../application/ports/modules.repository-port.js';
import { ModuleOrmEntity } from './module.orm-entity.js';
import { ModuleEntity } from '../../domain/entities/module.entity.js';

@Injectable()
export class ModulesRepository implements ModulesRepositoryPort {
  constructor(
    @InjectRepository(ModuleOrmEntity)
    private readonly repository: Repository<ModuleOrmEntity>,
  ) {}

  async listModulesForUser(
    companyId: string,
    permissions: string[],
  ): Promise<ModuleEntity[]> {
    const moduleKeys = Array.from(
      new Set(permissions.map((permission) => permission.split(':')[0])),
    );
    if (moduleKeys.length === 0) {
      return [];
    }
    const modules = await this.repository.find({
      where: [
        { key: In(moduleKeys), companyId: null },
        { key: In(moduleKeys), companyId },
      ],
    });
    const toModuleEntity = (
      module: ModuleOrmEntity & { children?: ModuleOrmEntity[] },
    ): ModuleEntity =>
      new ModuleEntity(
        module.id,
        module.companyId,
        module.key,
        module.name,
        module.visibility,
        module.isActive,
        module.createdAt,
        module.updatedAt,
        Array.isArray(module.children)
          ? module.children.map((child) => toModuleEntity(child as any))
          : [],
      );

    return modules.map((module) => toModuleEntity(module));
  }

  async ensureSeedData(): Promise<void> {
    const existing = await this.repository.count();
    if (existing > 0) {
      return;
    }
    const modules = this.repository.create([
      {
        key: 'rbac',
        name: 'RBAC Admin',
        visibility: 'dev_only',
        isActive: true,
      },
      {
        key: 'projects',
        name: 'Projects',
        visibility: 'public',
        isActive: true,
      },
      {
        key: 'boards',
        name: 'Boards',
        visibility: 'public',
        isActive: true,
      },
      {
        key: 'tasks',
        name: 'Tasks',
        visibility: 'public',
        isActive: true,
      },
      {
        key: 'comments',
        name: 'Comments',
        visibility: 'public',
        isActive: true,
      },
    ]);
    await this.repository.save(modules);
  }
}
