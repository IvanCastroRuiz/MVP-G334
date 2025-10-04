import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { RefreshTokensRepositoryPort } from '../../application/ports/refresh-tokens.repository-port.js';
import { RefreshTokenOrmEntity } from './refresh-token.orm-entity.js';

@Injectable()
export class RefreshTokensRepository implements RefreshTokensRepositoryPort {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repository: Repository<RefreshTokenOrmEntity>,
  ) {}

  async createToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.repository.save({ userId, tokenHash, expiresAt });
  }

  async replaceToken(
    userId: string,
    oldHash: string,
    newHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.repository.delete({ userId, tokenHash: oldHash });
    await this.repository.save({ userId, tokenHash: newHash, expiresAt });
  }

  async revokeToken(userId: string, tokenHash: string): Promise<void> {
    await this.repository.delete({ userId, tokenHash });
  }

  async findTokenByUser(userId: string): Promise<
    { tokenHash: string; expiresAt: Date }[]
  > {
    return this.repository.find({
      where: { userId, expiresAt: MoreThan(new Date()) },
    });
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.repository.delete({ expiresAt: LessThan(new Date()) });
  }
}
