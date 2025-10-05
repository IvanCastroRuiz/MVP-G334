import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { hash as argon2Hash } from '@node-rs/argon2';
import type {
  CreateAccessUserRequestDto,
  CreateAccessUserResponseDto,
} from '@mvp/shared';
import { ROLES_REPOSITORY, USERS_REPOSITORY } from '../ports/port.tokens.js';
import type { UsersRepositoryPort } from '../ports/users.repository-port.js';
import type { RolesRepositoryPort } from '../ports/roles.repository-port.js';
import { CreateUserInput } from '../dto/create-user.input.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: RolesRepositoryPort,
  ) {}

  async createUser(
    companyId: string,
    payload: CreateAccessUserRequestDto,
  ): Promise<CreateAccessUserResponseDto> {
    const sanitizedRoles = payload.roles
      ?.map((roleId: string) => roleId.trim())
      .filter(Boolean);
    const input = await CreateUserInput.create({
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      roles: sanitizedRoles && sanitizedRoles.length > 0 ? Array.from(new Set(sanitizedRoles)) : [],
    }).catch((error: Error) => {
      throw new BadRequestException(error.message);
    });

    const existingUser = await this.usersRepository.findByEmailAcrossCompanies(
      input.email,
    );
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado.');
    }

    const passwordHash = await argon2Hash(input.password);
    const user = await this.usersRepository.create({
      companyId,
      email: input.email,
      name: input.name,
      passwordHash,
    });

    let assignedRoles: CreateAccessUserResponseDto['assignedRoles'] = [];
    if (input.roles.length > 0) {
      const availableRoles = await this.rolesRepository.listCompanyRoles(companyId);
      const roleMap = new Map(availableRoles.map((role) => [role.id, role]));
      const invalidRoles = input.roles.filter((roleId) => !roleMap.has(roleId));
      if (invalidRoles.length > 0) {
        throw new BadRequestException('Se intentó asignar un rol que no pertenece a la compañía.');
      }

      assignedRoles = input.roles.map((roleId) => ({
        id: roleId,
        name: roleMap.get(roleId)!.name,
      }));

      await Promise.all(
        input.roles.map((roleId) =>
          this.rolesRepository.assignRoleToUser(companyId, user.id, roleId),
        ),
      );
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      assignedRoles,
    };
  }
}
