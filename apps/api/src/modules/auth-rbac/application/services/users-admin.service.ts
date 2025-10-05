import { Inject, Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { hash as argon2Hash } from '@node-rs/argon2';
import { isEmail } from 'class-validator';
import type { CreateUserInput, UserSummaryDto } from '@mvp/shared';
import { USERS_REPOSITORY, ROLES_REPOSITORY } from '../ports/port.tokens.js';
import type { UsersRepositoryPort } from '../ports/users.repository-port.js';
import type { RolesRepositoryPort } from '../ports/roles.repository-port.js';

@Injectable()
export class UsersAdminService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: RolesRepositoryPort,
  ) {}

  async listUsers(companyId: string): Promise<UserSummaryDto[]> {
    const users = await this.usersRepository.findAll(companyId);

    return Promise.all(
      users.map(async (user) => {
        const roles = await this.rolesRepository.getUserRoles(companyId, user.id);
        return {
          id: user.id,
          companyId: user.companyId,
          email: user.email,
          name: user.name,
          isActive: user.isActive,
          roles,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        } satisfies UserSummaryDto;
      }),
    );
  }

  async createUser(companyId: string, input: CreateUserInput): Promise<UserSummaryDto> {
    const email = input.email.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('El email es obligatorio.');
    }
    if (!isEmail(email)) {
      throw new BadRequestException('El email no es válido.');
    }

    const name = input.name.trim();
    if (!name) {
      throw new BadRequestException('El nombre es obligatorio.');
    }

    if (!input.password || input.password.length < 8) {
      throw new BadRequestException('La contraseña debe tener al menos 8 caracteres.');
    }

    const existing = await this.usersRepository.findByEmail(companyId, email);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con este email.');
    }

    const roleIds = Array.from(
      new Set(
        input.roleIds
          .map((roleId) => roleId.trim())
          .filter((roleId) => roleId.length > 0),
      ),
    );

    if (roleIds.length === 0) {
      throw new BadRequestException('Debes seleccionar al menos un rol.');
    }

    const availableRoles = await this.rolesRepository.listCompanyRoles(companyId);
    const availableRoleIds = new Set(availableRoles.map((role) => role.id));
    const invalidRoles = roleIds.filter((roleId) => !availableRoleIds.has(roleId));

    if (invalidRoles.length > 0) {
      throw new BadRequestException('Uno o más roles seleccionados no son válidos.');
    }

    const passwordHash = await argon2Hash(input.password);

    const user = await this.usersRepository.create({
      companyId,
      email,
      name,
      passwordHash,
    });

    await Promise.all(
      roleIds.map((roleId) => this.rolesRepository.assignRoleToUser(companyId, user.id, roleId)),
    );

    const roles = await this.rolesRepository.getUserRoles(companyId, user.id);

    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      roles,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    } satisfies UserSummaryDto;
  }
}
