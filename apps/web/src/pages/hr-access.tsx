import { FormEvent, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createUser } from '../api/auth';
import api from '../api/client';
import { useAuthStore } from '../store/auth-store';

type RoleSummary = { id: string; name: string; description: string | null };

export default function HrAccessPage() {
  const { user } = useAuthStore();

  const canManageAccess = user?.permissions.includes('hr-access:read') ?? false;
  const canCreateAccess = user?.permissions.includes('hr-access:create') ?? false;

  const rolesQuery = useQuery<RoleSummary[]>({
    queryKey: ['auth', 'roles'],
    queryFn: async () => {
      const response = await api.get<RoleSummary[]>('/auth/roles');
      return response.data;
    },
    enabled: canManageAccess,
    retry: false,
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roles: [] as string[],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      setForm({ name: '', email: '', password: '', confirmPassword: '', roles: [] });
      setFormError(null);
      setFormSuccess('El usuario fue creado correctamente. Comparte las credenciales de acceso de forma segura.');
    },
  });

  const handleRolesChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedRoles = Array.from(event.target.selectedOptions).map((option) => option.value);
    setForm((previous) => ({ ...previous, roles: selectedRoles }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormSuccess(null);
    if (!canCreateAccess) {
      setFormError('No tienes permisos para crear accesos de RRHH.');
      return;
    }
    if (!form.name || !form.email || !form.password) {
      setFormError('Nombre, correo y contraseña son obligatorios.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }
    setFormError(null);
    try {
      await createUserMutation.mutateAsync({
        name: form.name,
        email: form.email,
        password: form.password,
        roles: form.roles,
      });
    } catch (error: any) {
      setFormError(
        error?.response?.data?.message ?? 'No se pudo crear el usuario. Intenta nuevamente.',
      );
    }
  };

  if (!canManageAccess) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-100">Gestión de accesos</h2>
        <p className="mt-2 text-sm text-slate-400">
          No tienes permisos para gestionar los accesos de RRHH. Contacta a un administrador para continuar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Crear usuario de acceso</h2>
            <p className="text-sm text-slate-400">
              Define las credenciales iniciales y asigna los roles correspondientes.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Las credenciales deberán actualizarse en el primer inicio de sesión.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-xl border border-slate-800 bg-slate-950/80 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Nombre completo</label>
              <input
                value={form.name}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((previous) => ({ ...previous, name: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((previous) => ({ ...previous, email: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Contraseña temporal</label>
              <input
                type="password"
                value={form.password}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((previous) => ({ ...previous, password: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Recomienda una contraseña temporal robusta y cámbiala tras el primer acceso.
              </p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Confirmar contraseña</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((previous) => ({ ...previous, confirmPassword: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Roles asignados</label>
            {rolesQuery.isSuccess ? (
              <select
                multiple
                value={form.roles}
                onChange={handleRolesChange}
                className="mt-1 h-32 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              >
                {rolesQuery.data.map((role: RoleSummary) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.roles.join(', ')}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm((previous) => ({ ...previous, roles: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) }))
                }
                placeholder="IDs de roles separados por coma"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            )}
            <p className="mt-1 text-xs text-slate-500">
              Selecciona uno o varios roles para definir los permisos disponibles.
            </p>
            {rolesQuery.isError && (
              <p className="mt-1 text-xs text-amber-400">
                No fue posible cargar los roles disponibles o no cuentas con permisos de lectura de accesos de RRHH. Ingresa los identificadores manualmente o contacta a un administrador.
              </p>
            )}
          </div>

          {formError && <p className="text-sm text-rose-400">{formError}</p>}
          {formSuccess && <p className="text-sm text-emerald-400">{formSuccess}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createUserMutation.isLoading}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
            >
              Crear usuario
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
