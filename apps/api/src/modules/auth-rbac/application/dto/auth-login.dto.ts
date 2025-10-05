import { AuthTokensDto } from './auth-tokens.dto.js';

interface AuthLoginUser {
  userId: string;
  companyId: string;
  email: string;
  name: string;
  permissions: string[];
  roles: string[];
}

export class AuthLoginDto extends AuthTokensDto {
  constructor(
    accessToken: string,
    refreshToken: string,
    public readonly user: AuthLoginUser,
  ) {
    super(accessToken, refreshToken);
  }
}
