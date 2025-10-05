import type {
  CreateAccessUserRequestDto,
  CreateAccessUserResponseDto,
} from '@mvp/shared';
import api from './client';

export async function createUser(
  payload: CreateAccessUserRequestDto,
): Promise<CreateAccessUserResponseDto> {
  const response = await api.post<CreateAccessUserResponseDto>('/auth/users', {
    ...payload,
    roles: payload.roles && payload.roles.length > 0 ? payload.roles : undefined,
  });
  return response.data;
}
