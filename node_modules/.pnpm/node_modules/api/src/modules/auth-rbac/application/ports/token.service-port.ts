export interface TokenServicePort {
  generateAccessToken(payload: Record<string, unknown>): Promise<string>;
  generateRefreshToken(payload: Record<string, unknown>): Promise<string>;
  verifyRefreshToken(token: string): Promise<Record<string, unknown>>;
  revokeRefreshToken(userId: string, token: string): Promise<void>;
  rotateRefreshToken(userId: string, token: string): Promise<string>;
}
