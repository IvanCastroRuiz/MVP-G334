import { FormEvent, useMemo, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateUserInput, UserSummaryDto } from '@mvp/shared';
import { createUser, listUsers } from '../api/users';
import api from '../api/client';
import { useAuthStore } from '../store/auth-store';

type RoleSummary = { id: string; name: string; description: string | null };

type FormState = CreateUserInput;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

export default function AccessManagementPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const canManageAccess = user?.permissions.includes('rbac:manage_access') ?? false;

  const [formState, setFormState] = useState<FormState>({
    email: '',
    name: '',
    password: '',
    roleIds: [],
  });
  const [formError, setFormError] = useState<string | null>(null);

  const rolesQuery = useQuery<RoleSummary[]>({
    queryKey: ['auth', 'roles'],
    queryFn: async () => {
      const response = await api.get<RoleSummary[]>('/auth/roles');
      return response.data;
    },
    enabled: canManageAccess,
    staleTime: 60_000,
  });

  const usersQuery = useQuery<UserSummaryDto[]>({
    queryKey: ['auth', 'users'],
    queryFn: listUsers,
    enabled: canManageAccess,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'users'] });
      setFormState({ email: '', name: '', password: '', roleIds: [] });
      setFormError(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message;
      if (typeof message === 'string') {
        setFormError(message);
      } else if (Array.isArray(message) && message.length > 0) {
        setFormError(message[0]);
      } else {
        setFormError('No se pudo crear el usuario.');
      }
    },
  });

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((previous) => {
      switch (name) {
        case 'name':
          return { ...previous, name: value };
        case 'email':
          return { ...previous, email: value };
        case 'password':
          return { ...previous, password: value };
        default:
          return previous;
      }
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createUserMutation.isPending) {
      return;
    }
    setFormError(null);
    createUserMutation.mutate(formState);
  };

  const handleRoleToggle = (roleId: string) => {
    setFormState((previous) => {
      const hasRole = previous.roleIds.includes(roleId);
      return {
        ...previous,
        roleIds: hasRole
          ? previous.roleIds.filter((id) => id !== roleId)
          : [...previous.roleIds, roleId],
      };
    });
  };

  const sortedUsers = useMemo(() => {
    if (!usersQuery.data) {
      return [] as UserSummaryDto[];
    }
    return [...usersQuery.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [usersQuery.data]);

  if (!canManageAccess) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-8 text-center text-slate-300">
          <h2 className="text-xl font-semibold text-slate-100">Acceso restringido</h2>
          <p className="mt-2 text-sm">No tienes permisos para administrar usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <section className="rounded-lg border border-slate-800 bg-slate-950/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Crear nuevo usuario</h2>
            <p className="text-sm text-slate-400">Gestiona accesos asignando roles disponibles.</p>
          </div>
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Nombre completo</span>
            <input
              required
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
              placeholder="Jane Doe"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Correo electrónico</span>
            <input
              required
              name="email"
              type="email"
              value={formState.email}
              onChange={handleInputChange}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
              placeholder="jane.doe@example.com"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="text-slate-300">Contraseña temporal</span>
            <input
              required
              name="password"
              type="password"
              minLength={8}
              value={formState.password}
              onChange={handleInputChange}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-slate-300">Roles asignados</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {rolesQuery.isLoading && <p className="text-sm text-slate-400">Cargando roles...</p>}
              {rolesQuery.isError && (
                <p className="text-sm text-rose-400">No se pudieron cargar los roles disponibles.</p>
              )}
              {rolesQuery.data?.map((role) => {
                const isSelected = formState.roleIds.includes(role.id);
                return (
                  <label
                    key={role.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                      isSelected
                        ? 'border-sky-500/60 bg-sky-500/10 text-sky-200'
                        : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
                      checked={isSelected}
                      onChange={() => handleRoleToggle(role.id)}
                    />
                    <span>
                      <span className="font-medium">{role.name}</span>
                      {role.description && <span className="block text-xs text-slate-400">{role.description}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          {formError && (
            <div className="md:col-span-2 rounded border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {formError}
            </div>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-500/50"
            >
              {createUserMutation.isPending ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-950/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Usuarios creados</h2>
            <p className="text-sm text-slate-400">Resumen de accesos en la organización.</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Correo</th>
                <th className="px-4 py-2 font-medium">Roles</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {usersQuery.isLoading && (
                <tr>
                  <td className="px-4 py-4" colSpan={5}>
                    Cargando usuarios...
                  </td>
                </tr>
              )}
              {usersQuery.isError && (
                <tr>
                  <td className="px-4 py-4 text-rose-300" colSpan={5}>
                    No se pudieron cargar los usuarios.
                  </td>
                </tr>
              )}
              {sortedUsers.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">{item.name}</div>
                    <div className="text-xs text-slate-400">{item.id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-3">{item.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {item.roles.length === 0 && <span className="text-xs text-slate-400">Sin roles</span>}
                      {item.roles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-medium text-sky-200"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.isActive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {item.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
              {sortedUsers.length === 0 && !usersQuery.isLoading && !usersQuery.isError && (
                <tr>
                  <td className="px-4 py-4 text-slate-400" colSpan={5}>
                    Aún no se han registrado usuarios adicionales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
