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
    return permissions.map((permission) => {
      const moduleKey = moduleMap.get(permission.moduleId) ?? permission.moduleId;
      return `${moduleKey}:${permission.action}`;
    });
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
