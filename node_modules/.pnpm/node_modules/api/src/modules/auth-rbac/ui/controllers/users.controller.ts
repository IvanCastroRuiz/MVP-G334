import { Inject } from '@nestjs/common';
import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import type { CreateAccessUserResponseDto } from '@mvp/shared';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard.js';
import { RbacGuard } from '@common/guards/rbac.guard.js';
import { Permissions } from '@common/decorators/permissions.decorator.js';
import { UsersService } from '../../application/services/users.service.js';

class CreateUserRequest {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(8, 120)
  password!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roles?: string[];
}

@Controller('auth/users')
@UseGuards(JwtAuthGuard, RbacGuard)
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Post()
  @Permissions('hr-access:create')
  async createUser(
    @Req() req: any,
    @Body() body: CreateUserRequest,
  ): Promise<CreateAccessUserResponseDto> {
    return this.usersService.createUser(req.user.companyId, {
      name: body.name,
      email: body.email,
      password: body.password,
      roles: body.roles && body.roles.length > 0 ? body.roles : [],
    });
  }
}
