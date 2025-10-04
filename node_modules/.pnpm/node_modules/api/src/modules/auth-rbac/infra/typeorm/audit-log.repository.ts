import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogRepositoryPort } from '../../application/ports/audit-log.repository-port.js';
import { AuditLogOrmEntity } from './audit-log.orm-entity.js';

@Injectable()
export class AuditLogRepository implements AuditLogRepositoryPort {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repository: Repository<AuditLogOrmEntity>,
  ) {}

  async record(
    companyId: string,
    userId: string | null,
    action: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.repository.save({
      companyId,
      userId,
      action,
      metadata: metadata ?? null,
    });
  }
}
