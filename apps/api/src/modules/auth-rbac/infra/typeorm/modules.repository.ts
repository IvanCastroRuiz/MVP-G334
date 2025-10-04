import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
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
        { key: In(moduleKeys), companyId: IsNull() },
        { key: In(moduleKeys), companyId },
      ],
    });

    if (modules.length === 0) {
      return [];
    }

    const modulesById = new Map<string, ModuleOrmEntity>();
    const pendingParentIds = new Set<string>();

    for (const module of modules) {
      modulesById.set(module.id, module);
      if (module.parentId) {
        pendingParentIds.add(module.parentId);
      }
    }

    while (pendingParentIds.size > 0) {
      const missingParentIds = Array.from(pendingParentIds).filter(
        (id) => !modulesById.has(id),
      );
      if (missingParentIds.length === 0) {
        break;
      }
      const parents = await this.repository.find({
        where: { id: In(missingParentIds) },
      });
      for (const parent of parents) {
        modulesById.set(parent.id, parent);
        if (parent.parentId) {
          pendingParentIds.add(parent.parentId);
        }
      }
      for (const id of missingParentIds) {
        pendingParentIds.delete(id);
      }
    }

    const moduleEntities = new Map<string, ModuleEntity>();

    for (const module of modulesById.values()) {
      moduleEntities.set(
        module.id,
        new ModuleEntity(
          module.id,
          module.companyId,
          module.parentId,
          module.key,
          module.name,
          module.visibility,
          module.isActive,
          module.createdAt,
          module.updatedAt,
          [],
        ),
      );
    }

    for (const module of moduleEntities.values()) {
      if (!module.parentId) {
        continue;
      }
      const parent = moduleEntities.get(module.parentId);
      if (parent) {
        parent.children.push(module);
      }
    }

    return Array.from(moduleEntities.values()).filter(
      (module) => !module.parentId || !moduleEntities.has(module.parentId),
    );
  }

  async ensureSeedData(): Promise<void> {
    const existing = await this.repository.count();
    if (existing > 0) {
      return;
    }
    const definitions: Array<{
      key: string;
      name: string;
      visibility: 'public' | 'dev_only';
      isActive: boolean;
      parentKey: string | null;
    }> = [
      {
        key: 'rbac',
        name: 'RBAC Admin',
        visibility: 'dev_only',
        isActive: true,
        parentKey: null,
      },
      {
        key: 'projects',
        name: 'Projects',
        visibility: 'public',
        isActive: true,
        parentKey: null,
      },
      {
        key: 'boards',
        name: 'Boards',
        visibility: 'public',
        isActive: true,
        parentKey: 'projects',
      },
      {
        key: 'tasks',
        name: 'Tasks',
        visibility: 'public',
        isActive: true,
        parentKey: 'boards',
      },
      {
        key: 'comments',
        name: 'Comments',
        visibility: 'public',
        isActive: true,
        parentKey: 'tasks',
      },
    ];

    const createdByKey = new Map<string, ModuleOrmEntity>();

    for (const definition of definitions) {
      const module = this.repository.create({
        key: definition.key,
        name: definition.name,
        visibility: definition.visibility,
        isActive: definition.isActive,
        parentId: definition.parentKey
          ? createdByKey.get(definition.parentKey)!.id
          : null,
      });
      const saved = await this.repository.save(module);
      createdByKey.set(definition.key, saved);
    }
  }
}
