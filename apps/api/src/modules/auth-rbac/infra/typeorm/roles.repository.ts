import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RolesRepositoryPort } from '../../application/ports/roles.repository-port.js';
import { RoleOrmEntity } from './role.orm-entity.js';
import { UserRoleOrmEntity } from './user-role.orm-entity.js';
import { RolePermissionOrmEntity } from './role-permission.orm-entity.js';
import { PermissionOrmEntity } from './permission.orm-entity.js';
import { ModuleOrmEntity } from './module.orm-entity.js';

@Injectable()
export class RolesRepository implements RolesRepositoryPort {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly rolesRepository: Repository<RoleOrmEntity>,
    @InjectRepository(UserRoleOrmEntity)
    private readonly userRolesRepository: Repository<UserRoleOrmEntity>,
    @InjectRepository(RolePermissionOrmEntity)
    private readonly rolePermissionsRepository: Repository<RolePermissionOrmEntity>,
    @InjectRepository(PermissionOrmEntity)
    private readonly permissionsRepository: Repository<PermissionOrmEntity>,
    @InjectRepository(ModuleOrmEntity)
    private readonly modulesRepository: Repository<ModuleOrmEntity>,
  ) {}

  async assignRoleToUser(
    companyId: string,
    userId: string,
    roleId: string,
  ): Promise<void> {
    await this.userRolesRepository.save({
      companyId,
      userId,
      roleId,
    });
  }

  async getUserPermissions(
    companyId: string,
    userId: string,
  ): Promise<string[]> {
    const userRoles = await this.userRolesRepository.find({
      where: { companyId, userId },
    });
    if (userRoles.length === 0) {
      return [];
    }
    const roleIds = userRoles.map((role) => role.roleId);
    const rolePermissions = await this.rolePermissionsRepository.find({
      where: { roleId: In(roleIds) },
    });
    if (rolePermissions.length === 0) {
      return [];
    }
    const permissionIds = rolePermissions.map((item) => item.permissionId);
    const permissions = await this.permissionsRepository.find({
      where: { id: In(permissionIds) },
    });
    const moduleIds = permissions.map((permission) => permission.moduleId);
    const modules = await this.modulesRepository.find({
      where: { id: In(moduleIds) },
    });
    const moduleMap = new Map(modules.map((module) => [module.id, module.key]));

    const expandedPermissions = new Set<string>();

    for (const permission of permissions) {
      const moduleKey = moduleMap.get(permission.moduleId) ?? permission.moduleId;
      const canonicalPermission = `${moduleKey}:${permission.action}`;
      expandedPermissions.add(canonicalPermission);

      if (moduleKey === 'hr') {
        // Support legacy HR permissions that used the `hr:submodule.action` pattern by
        // translating them into the new `hr-submodule:action` format so both the guards
        // and the module navigation can rely on the updated prefixes without forcing a
        // reseed of existing databases.
        const [firstPart, ...rest] = permission.action.split('.');
        if (firstPart && rest.length > 0) {
          const normalizedModuleKey = `hr-${firstPart}`;
          const normalizedAction = rest.join('.');
          if (normalizedAction.length > 0) {
            const colonAction = normalizedAction.replace(/\./g, ':');
            expandedPermissions.add(`${normalizedModuleKey}:${colonAction}`);
          }
        } else if (firstPart === 'read') {
          const legacyHrModules = ['hr-employees', 'hr-leaves'];
          for (const legacyModule of legacyHrModules) {
            expandedPermissions.add(`${legacyModule}:read`);
          }
        }
      }
    }

    return Array.from(expandedPermissions);
  }

  async getUserRoles(companyId: string, userId: string): Promise<string[]> {
    const userRoles = await this.userRolesRepository.find({
      where: { companyId, userId },
      relations: ['role'],
    });

    if (userRoles.length === 0) {
      return [];
    }

    return userRoles.map((userRole) => userRole.role?.name ?? userRole.roleId);
  }

  async listCompanyRoles(companyId: string) {
    const roles = await this.rolesRepository.find({ where: { companyId } });
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
    }));
  }
}
