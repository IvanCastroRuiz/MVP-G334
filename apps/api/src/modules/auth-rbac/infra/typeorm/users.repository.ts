import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersRepositoryPort } from '../../application/ports/users.repository-port.js';
import { UserOrmEntity } from './user.orm-entity.js';
import { User } from '../../domain/entities/user.entity.js';

@Injectable()
export class UsersRepository implements UsersRepositoryPort {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async findByEmail(companyId: string, email: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { email, companyId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmailAcrossCompanies(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async findById(companyId: string, userId: string): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { id: userId, companyId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(user: {
    companyId: string;
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<User> {
    const entity = this.repository.create({
      companyId: user.companyId,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  private toDomain(entity: UserOrmEntity): User {
    return new User(
      entity.id,
      entity.companyId,
      entity.email,
      entity.name,
      entity.passwordHash,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
