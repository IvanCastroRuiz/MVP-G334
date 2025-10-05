import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard.js';
import { RbacGuard } from '@common/guards/rbac.guard.js';
import { Permissions } from '@common/decorators/permissions.decorator.js';
import type { UserSummaryDto } from '@mvp/shared';
import { UsersAdminService } from '../../application/services/users-admin.service.js';
import { CreateUserDto } from '../dto/create-user.dto.js';

@Controller('auth/users')
@UseGuards(JwtAuthGuard, RbacGuard)
@Permissions('rbac:manage_access')
export class UsersController {
  constructor(private readonly usersAdminService: UsersAdminService) {}

  @Get()
  async list(@Req() req: any): Promise<UserSummaryDto[]> {
    return this.usersAdminService.listUsers(req.user.companyId);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateUserDto): Promise<UserSummaryDto> {
    return this.usersAdminService.createUser(req.user.companyId, {
      email: dto.email,
      name: dto.name,
      password: dto.password,
      roleIds: dto.roleIds,
    });
  }
}
