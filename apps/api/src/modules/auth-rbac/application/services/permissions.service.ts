import { Inject, Injectable } from '@nestjs/common';
import { RolesRepositoryPort } from '../ports/roles.repository-port.js';
import { PermissionsServicePort } from '../ports/permissions.service-port.js';
import { ROLES_REPOSITORY } from '../ports/port.tokens.js';
import { expandHrPermissionVariants } from '../../shared/hr-permission-variants.js';

@Injectable()
export class PermissionsService implements PermissionsServicePort {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: RolesRepositoryPort,
  ) {}

  private expandPermissions(permissions: string[]): Set<string> {
    const expanded = new Set<string>();

    for (const permission of permissions) {
      expanded.add(permission);
      for (const variant of expandHrPermissionVariants(permission)) {
        expanded.add(variant);
      }
    }

    return expanded;
  }

  async userHasPermissions(
    companyId: string,
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    const userPermissions = await this.rolesRepository.getUserPermissions(
      companyId,
      userId,
    );
    const expandedPermissions = this.expandPermissions(userPermissions);

    return permissions.every((permission) => {
      if (expandedPermissions.has(permission)) {
        return true;
      }
      const variants = expandHrPermissionVariants(permission);
      return variants.some((variant) => expandedPermissions.has(variant));
    });
  }

  async getUserPermissions(companyId: string, userId: string): Promise<string[]> {
    const userPermissions = await this.rolesRepository.getUserPermissions(
      companyId,
      userId,
    );
    return Array.from(this.expandPermissions(userPermissions));
  }
}
