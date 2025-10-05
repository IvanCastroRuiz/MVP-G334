import { FormEvent, useMemo, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EmployeeSummaryDto, LeaveRequestDto, LeaveRequestStatus, LeaveType } from '@mvp/shared';
import {
  approveLeaveRequest,
  createLeaveRequest,
  listEmployees,
  listLeaveRequests,
  rejectLeaveRequest,
} from '../api/hr';
import { useAuthStore } from '../store/auth-store';
import { Dialog } from '../components/dialog';

const leaveTypes: LeaveType[] = ['vacation', 'sick', 'personal', 'other'];
const leaveStatuses: LeaveRequestStatus[] = ['pending', 'approved', 'rejected'];

const leaveTypeLabels: Record<LeaveType, string> = {
  vacation: 'Vacaciones',
  sick: 'Enfermedad',
  personal: 'Personal',
  other: 'Otro',
};

const leaveStatusStyles: Record<LeaveRequestStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  rejected: 'bg-rose-500/20 text-rose-300',
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

export default function HrLeavesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const canManageLeaves = user?.permissions.includes('hr:leaves.manage') ?? false;

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

  const employeesQuery = useQuery<EmployeeSummaryDto[]>({
    queryKey: ['hr', 'employees', 'for-leaves'],
    queryFn: () => listEmployees(),
    staleTime: 60_000,
  });

  const createLeaveMutation = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leaves'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
    },
  });

  const approveLeaveMutation = useMutation({
    mutationFn: ({ leaveId, notes }: { leaveId: string; notes?: string }) =>
      approveLeaveRequest(leaveId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leaves'] });
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
    },
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: ({ leaveId, notes }: { leaveId: string; notes?: string }) =>
      rejectLeaveRequest(leaveId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leaves'] });
    },
  });

  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    type: 'vacation' as LeaveType,
    startDate: getDefaultDate(),
    endDate: getDefaultDate(),
    reason: '',
  });
  const [createLeaveError, setCreateLeaveError] = useState<string | null>(null);

  const [leaveActionDialog, setLeaveActionDialog] = useState<LeaveActionDialogState>({
    isOpen: false,
    leave: null,
    mode: 'approve',
    notes: '',
    error: null,
  });

  const employees = employeesQuery.data ?? [];
  const leaves = leavesQuery.data ?? [];

  const activeEmployees = useMemo(
    () => employees.filter((employee: EmployeeSummaryDto) => employee.status === 'hired'),
    [employees],
  );

  const employeeNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const employee of employees) {
      map.set(employee.id, `${employee.firstName} ${employee.lastName}`);
    }
    return map;
  }, [employees]);

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
        startDate: getDefaultDate(),
        endDate: getDefaultDate(),
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
      setLeaveActionDialog((previous) => ({
        ...previous,
        error:
          error?.response?.data?.message ??
          'La acción no pudo completarse. Intenta nuevamente.',
      }));
    }
  };

  return (
    <div className="space-y-8">
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
                  {status === 'pending'
                    ? 'Pendientes'
                    : status === 'approved'
                    ? 'Aprobadas'
                    : 'Rechazadas'}
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
                Registrar licencia
              </button>
            </div>
            {createLeaveError && (
              <p className="md:col-span-2 text-sm text-rose-400">{createLeaveError}</p>
            )}
          </form>
        )}
      </section>

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
                setLeaveActionDialog((previous) => ({
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
