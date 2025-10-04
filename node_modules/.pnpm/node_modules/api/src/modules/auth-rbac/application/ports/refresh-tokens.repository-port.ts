export interface RefreshTokensRepositoryPort {
  createToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  replaceToken(userId: string, oldHash: string, newHash: string, expiresAt: Date): Promise<void>;
  revokeToken(userId: string, tokenHash: string): Promise<void>;
  findTokenByUser(userId: string): Promise<{ tokenHash: string; expiresAt: Date }[]>;
  deleteExpiredTokens(): Promise<void>;
}
