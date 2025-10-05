import type { CreateUserInput, UserSummaryDto } from '@mvp/shared';
import api from './client';

export async function listUsers(): Promise<UserSummaryDto[]> {
  const response = await api.get<UserSummaryDto[]>('/auth/users');
  return response.data;
}

export async function createUser(input: CreateUserInput): Promise<UserSummaryDto> {
  const response = await api.post<UserSummaryDto>('/auth/users', input);
  return response.data;
}
