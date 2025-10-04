import { Inject, Injectable } from '@nestjs/common';
import { RolesRepositoryPort } from '../ports/roles.repository-port.js';
import { PermissionsServicePort } from '../ports/permissions.service-port.js';
import { ROLES_REPOSITORY } from '../ports/port.tokens.js';

@Injectable()
export class PermissionsService implements PermissionsServicePort {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: RolesRepositoryPort,
  ) {}

  async userHasPermissions(
    companyId: string,
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    const userPermissions = await this.rolesRepository.getUserPermissions(
      companyId,
      userId,
    );

    return permissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }

  async getUserPermissions(companyId: string, userId: string): Promise<string[]> {
    return this.rolesRepository.getUserPermissions(companyId, userId);
  }
}
