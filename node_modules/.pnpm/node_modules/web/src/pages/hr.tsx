import { FormEvent, useMemo, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  EmployeeSummaryDto,
  LeaveRequestDto,
  LeaveRequestStatus,
  LeaveType,
} from '@mvp/shared';
import {
  approveLeaveRequest,
  createEmployee,
  createLeaveRequest,
  listEmployees,
  listLeaveRequests,
  reactivateEmployee,
  rejectLeaveRequest,
  terminateEmployee,
} from '../api/hr';
import api from '../api/client';
import { useAuthStore } from '../store/auth-store';
import { Dialog } from '../components/dialog';

type RoleSummary = { id: string; name: string; description: string | null };

const employeeStatusLabels: Record<EmployeeSummaryDto['status'], string> = {
  hired: 'Activo',
  terminated: 'Baja',
  on_leave: 'En licencia',
};

const employeeStatusStyles: Record<EmployeeSummaryDto['status'], string> = {
  hired: 'bg-emerald-500/20 text-emerald-300',
  terminated: 'bg-rose-500/20 text-rose-300',
  on_leave: 'bg-amber-500/20 text-amber-300',
};

const leaveStatusStyles: Record<LeaveRequestStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  rejected: 'bg-rose-500/20 text-rose-300',
};

const leaveTypeLabels: Record<LeaveType, string> = {
  vacation: 'Vacaciones',
  sick: 'Enfermedad',
  personal: 'Personal',
  other: 'Otro',
};

const leaveTypes: LeaveType[] = ['vacation', 'sick', 'personal', 'other'];
const leaveStatuses: LeaveRequestStatus[] = ['pending', 'approved', 'rejected'];

type TerminationDialogState = {
  isOpen: boolean;
  employee: EmployeeSummaryDto | null;
  terminationDate: string;
  reason: string;
  error: string | null;
};

type ReactivationDialogState = {
  isOpen: boolean;
  employee: EmployeeSummaryDto | null;
  hireDate: string;
  notes: string;
  error: string | null;
};

type LeaveActionMode = 'approve' | 'reject';

type LeaveActionDialogState = {
  isOpen: boolean;
  leave: LeaveRequestDto | null;
  mode: LeaveActionMode;
  notes: string;
  error: string | null;
};

function getDefaultDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

export default function HrDashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const canCreateEmployees = user?.permissions.includes('hr:employees.create') ?? false;
  const canTerminateEmployees = user?.permissions.includes('hr:employees.terminate') ?? false;
  const canUpdateEmployees = user?.permissions.includes('hr:employees.update') ?? false;
  const canManageLeaves = user?.permissions.includes('hr:leaves.manage') ?? false;

  const [statusFilter, setStatusFilter] = useState<'all' | EmployeeSummaryDto['status']>('hired');
  const [searchTerm, setSearchTerm] = useState('');

  const employeesQuery = useQuery<EmployeeSummaryDto[]>({
    queryKey: ['hr', 'employees', { statusFilter, searchTerm }],
    queryFn: async () =>
      listEmployees({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
      }),
  });

  const activeEmployeesQuery = useQuery<EmployeeSummaryDto[]>({
    queryKey: ['hr', 'employees', 'active'],
    queryFn: () => listEmployees({ status: 'hired' }),
    staleTime: 60_000,
  });

  const rolesQuery = useQuery<RoleSummary[]>({
    queryKey: ['auth', 'roles'],
    queryFn: async () => {
      const response = await api.get<RoleSummary[]>('/auth/roles');
      return response.data;
    },
    enabled: canCreateEmployees,
    retry: false,
  });

  const [createEmployeeError, setCreateEmployeeError] = useState<string | null>(null);
  const [createLeaveError, setCreateLeaveError] = useState<string | null>(null);
  const [terminationDialog, setTerminationDialog] = useState<TerminationDialogState>({
    isOpen: false,
    employee: null,
    terminationDate: getDefaultDate(),
    reason: '',
    error: null,
  });
  const [reactivationDialog, setReactivationDialog] = useState<ReactivationDialogState>({
    isOpen: false,
    employee: null,
    hireDate: getDefaultDate(),
    notes: '',
    error: null,
  });
  const [leaveActionDialog, setLeaveActionDialog] = useState<LeaveActionDialogState>({
    isOpen: false,
    leave: null,
    mode: 'approve',
    notes: '',
    error: null,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees', 'active'] });
    },
  });

  const terminateEmployeeMutation = useMutation({
    mutationFn: terminateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees', 'active'] });
    },
  });

  const reactivateEmployeeMutation = useMutation({
    mutationFn: reactivateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees', 'active'] });
    },
  });

  const [leaveStatusFilter, setLeaveStatusFilter] = useState<'all' | LeaveRequestStatus>('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<'all' | LeaveType>('all');
  const [leaveEmployeeFilter, setLeaveEmployeeFilter] = useState<string>('');

  const leavesQuery = useQuery<LeaveRequestDto[]>({
    queryKey: ['hr', 'leaves', { leaveStatusFilter, leaveTypeFilter, leaveEmployeeFilter }],
    queryFn: async () =>
      listLeaveRequests({
        status: leaveStatusFilter === 'all' ? undefined : leaveStatusFilter,
        type: leaveTypeFilter === 'all' ? undefined : leaveTypeFilter,
        employeeId: leaveEmployeeFilter || undefined,
      }),
  });

  const createLeaveMutation = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leaves'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees', 'active'] });
    },
  });

  const approveLeaveMutation = useMutation({
    mutationFn: ({ leaveId, notes }: { leaveId: string; notes?: string }) =>
      approveLeaveRequest(leaveId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leaves'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees', 'active'] });
    },
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: ({ leaveId, notes }: { leaveId: string; notes?: string }) =>
      rejectLeaveRequest(leaveId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leaves'] });
    },
  });

  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    department: '',
    hireDate: new Date().toISOString().slice(0, 10),
    userId: '',
    roleId: '',
  });

  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    type: 'vacation' as LeaveType,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: '',
  });

  const handleCreateEmployee = async (event: FormEvent) => {
    event.preventDefault();
    if (!employeeForm.firstName || !employeeForm.lastName) {
      setCreateEmployeeError('Nombre y apellidos son obligatorios.');
      return;
    }
    if (!employeeForm.hireDate) {
      setCreateEmployeeError('La fecha de contratación es obligatoria.');
      return;
    }
    setCreateEmployeeError(null);
    try {
      await createEmployeeMutation.mutateAsync({
        ...employeeForm,
        hireDate: new Date(employeeForm.hireDate).toISOString(),
        email: employeeForm.email || undefined,
        position: employeeForm.position || undefined,
        department: employeeForm.department || undefined,
        userId: employeeForm.userId || undefined,
        roleId: employeeForm.roleId || undefined,
      });
      setEmployeeForm({
        firstName: '',
        lastName: '',
        email: '',
        position: '',
        department: '',
        hireDate: new Date().toISOString().slice(0, 10),
        userId: '',
        roleId: '',
      });
    } catch (error: any) {
      setCreateEmployeeError(
        error?.response?.data?.message ?? 'No se pudo crear el empleado.',
      );
    }
  };

  const openTerminationDialog = (employee: EmployeeSummaryDto) => {
    setTerminationDialog({
      isOpen: true,
      employee,
      terminationDate: getDefaultDate(),
      reason: '',
      error: null,
    });
  };

  const closeTerminationDialog = () => {
    setTerminationDialog({
      isOpen: false,
      employee: null,
      terminationDate: getDefaultDate(),
      reason: '',
      error: null,
    });
  };

  const submitTermination = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!terminationDialog.employee) {
      return;
    }
    if (!terminationDialog.terminationDate) {
    setTerminationDialog((previous: TerminationDialogState) => ({
      ...previous,
      error: 'La fecha de baja es obligatoria.',
    }));
      return;
    }
    setTerminationDialog((previous: TerminationDialogState) => ({
      ...previous,
      error: null,
    }));
    try {
      await terminateEmployeeMutation.mutateAsync({
        employeeId: terminationDialog.employee.id,
        terminationDate: new Date(terminationDialog.terminationDate).toISOString(),
        reason: terminationDialog.reason || undefined,
      });
      closeTerminationDialog();
    } catch (error: any) {
      setTerminationDialog((previous: TerminationDialogState) => ({
        ...previous,
        error:
          error?.response?.data?.message ??
          'No se pudo registrar la baja. Revisa los datos e intenta nuevamente.',
      }));
    }
  };

  const openReactivationDialog = (employee: EmployeeSummaryDto) => {
    setReactivationDialog({
      isOpen: true,
      employee,
      hireDate: getDefaultDate(),
      notes: '',
      error: null,
    });
  };

  const closeReactivationDialog = () => {
    setReactivationDialog({
      isOpen: false,
      employee: null,
      hireDate: getDefaultDate(),
      notes: '',
      error: null,
    });
  };

  const submitReactivation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reactivationDialog.employee) {
      return;
    }
    if (!reactivationDialog.hireDate) {
    setReactivationDialog((previous: ReactivationDialogState) => ({
      ...previous,
      error: 'La fecha de reingreso es obligatoria.',
    }));
      return;
    }
    setReactivationDialog((previous: ReactivationDialogState) => ({
      ...previous,
      error: null,
    }));
    try {
      await reactivateEmployeeMutation.mutateAsync({
        employeeId: reactivationDialog.employee.id,
        hireDate: new Date(reactivationDialog.hireDate).toISOString(),
        notes: reactivationDialog.notes || undefined,
      });
      closeReactivationDialog();
    } catch (error: any) {
      setReactivationDialog((previous: ReactivationDialogState) => ({
        ...previous,
        error:
          error?.response?.data?.message ??
          'No se pudo reactivar al empleado. Intenta nuevamente.',
      }));
    }
  };

  const handleCreateLeave = async (event: FormEvent) => {
    event.preventDefault();
    if (!leaveForm.employeeId) {
      setCreateLeaveError('Selecciona un empleado.');
      return;
    }
    if (!leaveForm.startDate || !leaveForm.endDate) {
      setCreateLeaveError('Las fechas de la licencia son obligatorias.');
      return;
    }
    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
      setCreateLeaveError('La fecha de fin debe ser posterior al inicio.');
      return;
    }
    setCreateLeaveError(null);
    try {
      await createLeaveMutation.mutateAsync({
        ...leaveForm,
        startDate: new Date(leaveForm.startDate).toISOString(),
        endDate: new Date(leaveForm.endDate).toISOString(),
        reason: leaveForm.reason || undefined,
      });
      setLeaveForm({
        employeeId: '',
        type: 'vacation',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        reason: '',
      });
    } catch (error: any) {
      setCreateLeaveError(
        error?.response?.data?.message ?? 'No se pudo registrar la licencia.',
      );
    }
  };

  const openLeaveActionDialog = (mode: LeaveActionMode, leave: LeaveRequestDto) => {
    setLeaveActionDialog({
      isOpen: true,
      leave,
      mode,
      notes: '',
      error: null,
    });
  };

  const closeLeaveActionDialog = () => {
    setLeaveActionDialog({
      isOpen: false,
      leave: null,
      mode: 'approve',
      notes: '',
      error: null,
    });
  };

  const submitLeaveAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!leaveActionDialog.leave) {
      return;
    }

    try {
      if (leaveActionDialog.mode === 'approve') {
        await approveLeaveMutation.mutateAsync({
          leaveId: leaveActionDialog.leave.id,
          notes: leaveActionDialog.notes || undefined,
        });
      } else {
        await rejectLeaveMutation.mutateAsync({
          leaveId: leaveActionDialog.leave.id,
          notes: leaveActionDialog.notes || undefined,
        });
      }
      closeLeaveActionDialog();
    } catch (error: any) {
      setLeaveActionDialog((previous: LeaveActionDialogState) => ({
        ...previous,
        error:
          error?.response?.data?.message ??
          'La acción no pudo completarse. Intenta nuevamente.',
      }));
    }
  };

  const employees: EmployeeSummaryDto[] = employeesQuery.data ?? [];
  const leaves: LeaveRequestDto[] = leavesQuery.data ?? [];
  const activeEmployees = useMemo<EmployeeSummaryDto[]>(
    () => activeEmployeesQuery.data ?? [],
    [activeEmployeesQuery.data],
  );
  const employeeNameMap = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const employee of employees) {
      map.set(employee.id, `${employee.firstName} ${employee.lastName}`);
    }
    for (const employee of activeEmployees) {
      if (!map.has(employee.id)) {
        map.set(employee.id, `${employee.firstName} ${employee.lastName}`);
      }
    }
    return map;
  }, [employees, activeEmployees]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Colaboradores</h2>
            <p className="text-sm text-slate-400">
              Gestiona altas, bajas y actualizaciones del personal.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {(['all', 'hired', 'on_leave', 'terminated'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  statusFilter === status
                    ? 'bg-sky-500 text-white shadow'
                    : 'border border-slate-700 text-slate-300 hover:border-sky-500/60 hover:text-sky-200'
                }`}
              >
                {status === 'all' ? 'Todos' : employeeStatusLabels[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <input
              value={searchTerm}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Buscar por nombre o correo"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none lg:w-72"
            />
          </div>
          {canCreateEmployees && (
            <span className="text-xs text-slate-500">
              Completa el formulario para registrar un nuevo empleado.
            </span>
          )}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Colaborador</th>
                <th className="px-4 py-3">Departamento</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Ingreso</th>
                <th className="px-4 py-3">Baja</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {employeesQuery.isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Cargando colaboradores…
                  </td>
                </tr>
              )}

              {employeesQuery.isError && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-rose-400">
                    No se pudieron cargar los colaboradores. Intenta nuevamente.
                  </td>
                </tr>
              )}

              {!employeesQuery.isLoading && employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No hay colaboradores registrados con los filtros aplicados.
                  </td>
                </tr>
              )}

              {employees.map((employee: EmployeeSummaryDto) => (
                <tr key={employee.id} className="transition hover:bg-slate-900/70">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="text-xs text-slate-400">{employee.email ?? '—'}</div>
                    <div className="text-xs text-slate-500">
                      {employee.position ?? 'Sin posición asignada'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {employee.department ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        employeeStatusStyles[employee.status]
                      }`}
                    >
                      {employeeStatusLabels[employee.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{formatDate(employee.hireDate)}</td>
                  <td className="px-4 py-3 text-slate-300">{formatDate(employee.terminationDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {employee.status !== 'terminated' && canTerminateEmployees && (
                        <button
                          onClick={() => openTerminationDialog(employee)}
                          className="rounded-lg border border-rose-500/40 px-3 py-1 text-xs text-rose-300 transition hover:border-rose-400 hover:text-rose-200"
                          disabled={terminateEmployeeMutation.isLoading}
                        >
                          Registrar baja
                        </button>
                      )}
                      {employee.status === 'terminated' && canUpdateEmployees && (
                        <button
                          onClick={() => openReactivationDialog(employee)}
                          className="rounded-lg border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300 transition hover:border-emerald-400 hover:text-emerald-200"
                          disabled={reactivateEmployeeMutation.isLoading}
                        >
                          Reincorporar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canCreateEmployees && (
          <form onSubmit={handleCreateEmployee} className="mt-8 grid gap-4 rounded-xl border border-slate-800 bg-slate-950/80 p-6 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Nombre</label>
              <input
                value={employeeForm.firstName}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setEmployeeForm((prev) => ({ ...prev, firstName: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Apellidos</label>
              <input
                value={employeeForm.lastName}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setEmployeeForm((prev) => ({ ...prev, lastName: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Email corporativo</label>
              <input
                type="email"
                value={employeeForm.email}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setEmployeeForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Departamento</label>
              <input
                value={employeeForm.department}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setEmployeeForm((prev) => ({ ...prev, department: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Posición</label>
              <input
                value={employeeForm.position}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setEmployeeForm((prev) => ({ ...prev, position: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Fecha de contratación</label>
              <input
                type="date"
                value={employeeForm.hireDate}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setEmployeeForm((prev) => ({ ...prev, hireDate: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Usuario (opcional)</label>
              <input
                value={employeeForm.userId}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setEmployeeForm((prev) => ({ ...prev, userId: event.target.value }))
                }
                placeholder="ID del usuario existente"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">
                Asocia un usuario existente para habilitar accesos.
              </p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Rol asignado</label>
              {rolesQuery.isSuccess ? (
                <select
                  value={employeeForm.roleId}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setEmployeeForm((prev) => ({ ...prev, roleId: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Sin rol</option>
                  {rolesQuery.data.map((role: RoleSummary) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={employeeForm.roleId}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setEmployeeForm((prev) => ({ ...prev, roleId: event.target.value }))
                  }
                  placeholder="ID de rol opcional"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              )}
              <p className="mt-1 text-xs text-slate-500">
                El rol determina los módulos y permisos asignados.
              </p>
              {rolesQuery.isError && (
                <p className="mt-1 text-xs text-amber-400">
                  No fue posible cargar los roles disponibles. Ingresa el ID manualmente o contacta a un administrador.
                </p>
              )}
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={createEmployeeMutation.isLoading}
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
              >
                Registrar colaborador
              </button>
            </div>
            {createEmployeeError && (
              <p className="md:col-span-2 text-sm text-rose-400">{createEmployeeError}</p>
            )}
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Licencias y permisos</h2>
            <p className="text-sm text-slate-400">
              Registra solicitudes y gestiona aprobaciones.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            <select
              value={leaveStatusFilter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setLeaveStatusFilter(event.target.value as typeof leaveStatusFilter)
              }
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            >
              <option value="all">Todos los estados</option>
              {leaveStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'pending' ? 'Pendientes' : status === 'approved' ? 'Aprobadas' : 'Rechazadas'}
                </option>
              ))}
            </select>
            <select
              value={leaveTypeFilter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setLeaveTypeFilter(event.target.value as typeof leaveTypeFilter)
              }
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            >
              <option value="all">Todos los tipos</option>
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {leaveTypeLabels[type]}
                </option>
              ))}
            </select>
            <select
              value={leaveEmployeeFilter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setLeaveEmployeeFilter(event.target.value)
              }
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            >
              <option value="">Todos los colaboradores</option>
              {activeEmployees.map((employee: EmployeeSummaryDto) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Empleado</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Última actualización</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {leavesQuery.isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Cargando solicitudes…
                  </td>
                </tr>
              )}
              {leavesQuery.isError && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-rose-400">
                    No se pudieron cargar las solicitudes. Intenta nuevamente.
                  </td>
                </tr>
              )}
              {!leavesQuery.isLoading && leaves.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No hay solicitudes registradas con los filtros seleccionados.
                  </td>
                </tr>
              )}
              {leaves.map((leave: LeaveRequestDto) => {
                const employeeLabel = employeeNameMap.get(leave.employeeId) ?? leave.employeeId;
                return (
                  <tr key={leave.id} className="transition hover:bg-slate-900/70">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">{employeeLabel}</div>
                      <div className="text-xs text-slate-500">
                        Solicitado por: {leave.requestedBy ?? '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{leaveTypeLabels[leave.type]}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          leaveStatusStyles[leave.status]
                        }`}
                      >
                        {leave.status === 'pending'
                          ? 'Pendiente'
                          : leave.status === 'approved'
                          ? 'Aprobada'
                          : 'Rechazada'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatDate(leave.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {canManageLeaves && leave.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openLeaveActionDialog('approve', leave)}
                            className="rounded-lg border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300 transition hover:border-emerald-400 hover:text-emerald-200"
                            disabled={approveLeaveMutation.isLoading}
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => openLeaveActionDialog('reject', leave)}
                            className="rounded-lg border border-rose-500/40 px-3 py-1 text-xs text-rose-300 transition hover:border-rose-400 hover:text-rose-200"
                            disabled={rejectLeaveMutation.isLoading}
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {canManageLeaves && (
          <form onSubmit={handleCreateLeave} className="mt-8 grid gap-4 rounded-xl border border-slate-800 bg-slate-950/80 p-6 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Colaborador</label>
              <select
                value={leaveForm.employeeId}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setLeaveForm((prev) => ({ ...prev, employeeId: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                required
              >
                <option value="">Selecciona un colaborador</option>
                {activeEmployees.map((employee: EmployeeSummaryDto) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Tipo de licencia</label>
              <select
                value={leaveForm.type}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setLeaveForm((prev) => ({ ...prev, type: event.target.value as LeaveType }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                required
              >
                {leaveTypes.map((type) => (
                  <option key={type} value={type}>
                    {leaveTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Fecha de inicio</label>
              <input
                type="date"
                value={leaveForm.startDate}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setLeaveForm((prev) => ({ ...prev, startDate: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Fecha de fin</label>
              <input
                type="date"
                value={leaveForm.endDate}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setLeaveForm((prev) => ({ ...prev, endDate: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wide text-slate-400">Motivo (opcional)</label>
              <textarea
                value={leaveForm.reason}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setLeaveForm((prev) => ({ ...prev, reason: event.target.value }))
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={createLeaveMutation.isLoading}
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
              >
                Registrar solicitud
              </button>
            </div>
            {createLeaveError && (
              <p className="md:col-span-2 text-sm text-rose-400">{createLeaveError}</p>
            )}
          </form>
        )}
      </section>

      <Dialog
        open={terminationDialog.isOpen}
        onClose={closeTerminationDialog}
        title="Registrar baja"
        description={
          terminationDialog.employee
            ? `Confirma la fecha de baja para ${terminationDialog.employee.firstName} ${terminationDialog.employee.lastName}.`
            : undefined
        }
      >
        <form onSubmit={submitTermination} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Fecha de baja</label>
            <input
              type="date"
              value={terminationDialog.terminationDate}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setTerminationDialog((previous: TerminationDialogState) => ({
                  ...previous,
                  terminationDate: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Motivo (opcional)</label>
            <textarea
              value={terminationDialog.reason}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setTerminationDialog((previous: TerminationDialogState) => ({
                  ...previous,
                  reason: event.target.value,
                }))
              }
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
            />
          </div>
          {terminationDialog.error ? (
            <p className="text-sm text-rose-400">{terminationDialog.error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeTerminationDialog}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
              disabled={terminateEmployeeMutation.isLoading}
            >
              Confirmar baja
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={reactivationDialog.isOpen}
        onClose={closeReactivationDialog}
        title="Reincorporar colaborador"
        description={
          reactivationDialog.employee
            ? `Indica la nueva fecha de ingreso para ${reactivationDialog.employee.firstName} ${reactivationDialog.employee.lastName}.`
            : undefined
        }
      >
        <form onSubmit={submitReactivation} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Fecha de ingreso</label>
            <input
              type="date"
              value={reactivationDialog.hireDate}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setReactivationDialog((previous: ReactivationDialogState) => ({
                  ...previous,
                  hireDate: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Notas (opcional)</label>
            <textarea
              value={reactivationDialog.notes}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setReactivationDialog((previous: ReactivationDialogState) => ({
                  ...previous,
                  notes: event.target.value,
                }))
              }
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          {reactivationDialog.error ? (
            <p className="text-sm text-rose-400">{reactivationDialog.error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeReactivationDialog}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
              disabled={reactivateEmployeeMutation.isLoading}
            >
              Confirmar reingreso
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={leaveActionDialog.isOpen}
        onClose={closeLeaveActionDialog}
        title={leaveActionDialog.mode === 'approve' ? 'Aprobar licencia' : 'Rechazar licencia'}
        description={
          leaveActionDialog.leave
            ? `Describe notas para la solicitud de ${
                employeeNameMap.get(leaveActionDialog.leave.employeeId) ??
                leaveActionDialog.leave.employeeId
              }.`
            : undefined
        }
      >
        <form onSubmit={submitLeaveAction} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Notas (opcional)</label>
            <textarea
              value={leaveActionDialog.notes}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setLeaveActionDialog((previous: LeaveActionDialogState) => ({
                  ...previous,
                  notes: event.target.value,
                }))
              }
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>
          {leaveActionDialog.error ? (
            <p className="text-sm text-rose-400">{leaveActionDialog.error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeLeaveActionDialog}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`rounded-lg px-3 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
                leaveActionDialog.mode === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
              disabled={
                leaveActionDialog.mode === 'approve'
                  ? approveLeaveMutation.isLoading
                  : rejectLeaveMutation.isLoading
              }
            >
              {leaveActionDialog.mode === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
