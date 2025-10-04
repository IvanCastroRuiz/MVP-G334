import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthProfileDto, ModuleSummaryDto } from '@mvp/shared';
import { ModuleEntity } from '../../domain/entities/module.entity.js';
import { UsersRepositoryPort } from '../ports/users.repository-port.js';
import { TokenServicePort } from '../ports/token.service-port.js';
import { AuthTokensDto } from '../dto/auth-tokens.dto.js';
import { AuthLoginDto } from '../dto/auth-login.dto.js';
import { PermissionsServicePort } from '../ports/permissions.service-port.js';
import { RolesRepositoryPort } from '../ports/roles.repository-port.js';
import { verify as argon2Verify } from '@node-rs/argon2';
import {
  MODULES_REPOSITORY,
  PERMISSIONS_SERVICE,
  ROLES_REPOSITORY,
  TOKEN_SERVICE,
  USERS_REPOSITORY,
} from '../ports/port.tokens.js';
import { ModulesRepositoryPort } from '../ports/modules.repository-port.js';
import { ModuleEntity } from '../../domain/entities/module.entity.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenServicePort,
    @Inject(PERMISSIONS_SERVICE)
    private readonly permissionsService: PermissionsServicePort,
    @Inject(ROLES_REPOSITORY)
    private readonly rolesRepository: RolesRepositoryPort,
    @Inject(MODULES_REPOSITORY)
    private readonly modulesRepository: ModulesRepositoryPort,
  ) {}

  async login(email: string, password: string): Promise<AuthLoginDto> {
    const user = await this.usersRepository.findByEmailAcrossCompanies(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await argon2Verify(user.passwordHash, password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      companyId: user.companyId,
      email: user.email,
    };
    const [accessToken, refreshToken, permissions, roles] = await Promise.all([
      this.tokenService.generateAccessToken(payload),
      this.tokenService.generateRefreshToken(payload),
      this.permissionsService.getUserPermissions(user.companyId, user.id),
      this.rolesRepository.getUserRoles(user.companyId, user.id),
    ]);

    return new AuthLoginDto(accessToken, refreshToken, {
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      name: user.name,
      permissions,
      roles,
    });
  }

  async refresh(userId: string, companyId: string, token: string): Promise<AuthTokensDto> {
    const payload = await this.tokenService.verifyRefreshToken(token);
    if (payload.sub !== userId || payload.companyId !== companyId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const rotatedToken = await this.tokenService.rotateRefreshToken(userId, token);

    const accessToken = await this.tokenService.generateAccessToken({
      sub: userId,
      companyId,
      email: payload.email,
    });

    return new AuthTokensDto(accessToken, rotatedToken);
  }

  async logout(userId: string, token: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(userId, token);
  }

  async getProfile(
    companyId: string,
    userId: string,
  ): Promise<AuthProfileDto> {
    const user = await this.usersRepository.findById(companyId, userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const [permissions, roles] = await Promise.all([
      this.permissionsService.getUserPermissions(companyId, userId),
      this.rolesRepository.getUserRoles(companyId, userId),
    ]);

    return {
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      name: user.name,
      permissions,
      roles,
    };
  }

  async listRoles(companyId: string) {
    return this.rolesRepository.listCompanyRoles(companyId);
  }

  async listModules(
    companyId: string,
    userId: string,
  ): Promise<ModuleSummaryDto[]> {
    const permissions = await this.permissionsService.getUserPermissions(
      companyId,
      userId,
    );
    const modules = await this.modulesRepository.listModulesForUser(
      companyId,
      permissions,
    );
    const serialize = (module: ModuleEntity): ModuleSummaryDto => ({
      id: module.id,
      key: module.key,
      name: module.name,
      visibility: module.visibility,
      isActive: module.isActive,
      children:
        module.children && module.children.length > 0
          ? module.children.map(serialize)
          : undefined,
    });
    return modules.map(serialize);
  }
}
