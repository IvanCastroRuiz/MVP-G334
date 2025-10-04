import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service.js';
import { LoginDto } from '../dto/login.dto.js';
import { RefreshTokenDto } from '../dto/refresh-token.dto.js';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard.js';
import { Permissions } from '@common/decorators/permissions.decorator.js';
import { RbacGuard } from '@common/guards/rbac.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email.toLowerCase(), dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any, @Body() dto: RefreshTokenDto) {
    await this.authService.logout(req.user.userId, dto.refreshToken);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh(@Req() req: any, @Body() dto: RefreshTokenDto) {
    return this.authService.refresh(
      req.user.userId,
      req.user.companyId,
      dto.refreshToken,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.authService.getProfile(req.user.companyId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/modules')
  async modules(@Req() req: any) {
    return this.authService.listModules(req.user.companyId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RbacGuard)
  @Permissions('rbac:read')
  @Get('roles')
  async roles(@Req() req: any) {
    return this.authService.listRoles(req.user.companyId);
  }
}
