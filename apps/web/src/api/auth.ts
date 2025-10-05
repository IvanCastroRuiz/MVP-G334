import api from './client';

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  roles?: string[];
};

export async function createUser(payload: CreateUserPayload): Promise<void> {
  await api.post('/auth/users', {
    ...payload,
    roles: payload.roles && payload.roles.length > 0 ? payload.roles : undefined,
  });
}
