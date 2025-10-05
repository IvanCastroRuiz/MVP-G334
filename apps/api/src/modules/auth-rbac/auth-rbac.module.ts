import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './ui/controllers/auth.controller.js';
import { UsersController } from './ui/controllers/users.controller.js';
import { AuthService } from './application/services/auth.service.js';
import { UsersRepository } from './infra/typeorm/users.repository.js';
import { UserOrmEntity } from './infra/typeorm/user.orm-entity.js';
import { CompanyOrmEntity } from './infra/typeorm/company.orm-entity.js';
import { RoleOrmEntity } from './infra/typeorm/role.orm-entity.js';
import { PermissionOrmEntity } from './infra/typeorm/permission.orm-entity.js';
import { ModuleOrmEntity } from './infra/typeorm/module.orm-entity.js';
import { RolePermissionOrmEntity } from './infra/typeorm/role-permission.orm-entity.js';
import { UserRoleOrmEntity } from './infra/typeorm/user-role.orm-entity.js';
import { RefreshTokenOrmEntity } from './infra/typeorm/refresh-token.orm-entity.js';
import { AuditLogOrmEntity } from './infra/typeorm/audit-log.orm-entity.js';
import { RolesRepository } from './infra/typeorm/roles.repository.js';
import { ModulesRepository } from './infra/typeorm/modules.repository.js';
import { RefreshTokensRepository } from './infra/typeorm/refresh-tokens.repository.js';
import { AuditLogRepository } from './infra/typeorm/audit-log.repository.js';
import { TokenService } from './application/services/token.service.js';
import { JwtStrategy } from './infra/jwt.strategy.js';
import { PermissionsService } from './application/services/permissions.service.js';
import { UsersService } from './application/services/users.service.js';
import {
  AUDIT_LOG_REPOSITORY,
  MODULES_REPOSITORY,
  PERMISSIONS_SERVICE,
  REFRESH_TOKENS_REPOSITORY,
  ROLES_REPOSITORY,
  TOKEN_SERVICE,
  USERS_REPOSITORY,
} from './application/ports/port.tokens.js';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRES', '15m') },
      }),
    }),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      CompanyOrmEntity,
      RoleOrmEntity,
      PermissionOrmEntity,
      ModuleOrmEntity,
      RolePermissionOrmEntity,
      UserRoleOrmEntity,
      RefreshTokenOrmEntity,
      AuditLogOrmEntity,
    ]),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    AuthService,
    UsersService,
    UsersRepository,
    RolesRepository,
    ModulesRepository,
    RefreshTokensRepository,
    AuditLogRepository,
    TokenService,
    PermissionsService,
    JwtStrategy,
    { provide: USERS_REPOSITORY, useExisting: UsersRepository },
    { provide: ROLES_REPOSITORY, useExisting: RolesRepository },
    { provide: MODULES_REPOSITORY, useExisting: ModulesRepository },
    {
      provide: REFRESH_TOKENS_REPOSITORY,
      useExisting: RefreshTokensRepository,
    },
    { provide: AUDIT_LOG_REPOSITORY, useExisting: AuditLogRepository },
    { provide: TOKEN_SERVICE, useExisting: TokenService },
    { provide: PERMISSIONS_SERVICE, useExisting: PermissionsService },
  ],
  exports: [
    AuthService,
    PermissionsService,
    PERMISSIONS_SERVICE,
    MODULES_REPOSITORY,
    AUDIT_LOG_REPOSITORY,
    ROLES_REPOSITORY,
  ],
})
export class AuthRbacModule {}
