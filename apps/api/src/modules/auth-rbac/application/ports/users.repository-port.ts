import { User } from '../../domain/entities/user.entity.js';

export interface UsersRepositoryPort {
  findByEmail(companyId: string, email: string): Promise<User | null>;
  findByEmailAcrossCompanies(email: string): Promise<User | null>;
  findById(companyId: string, userId: string): Promise<User | null>;
  findAll(companyId: string): Promise<User[]>;
  create(user: Partial<User> & { companyId: string; email: string; name: string; passwordHash: string }): Promise<User>;
}
