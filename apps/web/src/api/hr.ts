import type {
  EmployeeDetailsDto,
  EmployeeSummaryDto,
  LeaveRequestDto,
  LeaveRequestStatus,
  LeaveType,
} from '@mvp/shared';
import api from './client';

export type ListEmployeesParams = {
  status?: 'hired' | 'terminated' | 'on_leave';
  search?: string;
};

export async function listEmployees(params: ListEmployeesParams = {}): Promise<
  EmployeeSummaryDto[]
> {
  const response = await api.get<EmployeeSummaryDto[]>('/hr/employees', {
    params,
  });
  return response.data;
}

export type CreateEmployeePayload = {
  firstName: string;
  lastName: string;
  email?: string;
  position?: string;
  department?: string;
  hireDate: string;
  userId?: string;
  roleId?: string;
};

export async function createEmployee(
  payload: CreateEmployeePayload,
): Promise<EmployeeDetailsDto> {
  const response = await api.post<EmployeeDetailsDto>('/hr/employees', {
    ...payload,
    email: payload.email?.trim() || undefined,
    position: payload.position?.trim() || undefined,
    department: payload.department?.trim() || undefined,
    userId: payload.userId?.trim() || undefined,
    roleId: payload.roleId?.trim() || undefined,
  });
  return response.data;
}

export type TerminateEmployeePayload = {
  employeeId: string;
  terminationDate: string;
  reason?: string;
};

export async function terminateEmployee(
  payload: TerminateEmployeePayload,
): Promise<EmployeeDetailsDto> {
  const response = await api.post<EmployeeDetailsDto>(
    `/hr/employees/${payload.employeeId}/terminate`,
    {
      terminationDate: payload.terminationDate,
      reason: payload.reason?.trim() || undefined,
    },
  );
  return response.data;
}

export type ReactivateEmployeePayload = {
  employeeId: string;
  hireDate: string;
  notes?: string;
};

export async function reactivateEmployee(
  payload: ReactivateEmployeePayload,
): Promise<EmployeeDetailsDto> {
  const response = await api.post<EmployeeDetailsDto>(
    `/hr/employees/${payload.employeeId}/reactivate`,
    {
      hireDate: payload.hireDate,
      notes: payload.notes?.trim() || undefined,
    },
  );
  return response.data;
}

export type ListLeaveParams = {
  status?: LeaveRequestStatus;
  type?: LeaveType;
  employeeId?: string;
};

export async function listLeaveRequests(
  params: ListLeaveParams = {},
): Promise<LeaveRequestDto[]> {
  const response = await api.get<LeaveRequestDto[]>('/hr/leaves', {
    params,
  });
  return response.data;
}

export type CreateLeavePayload = {
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
};

export async function createLeaveRequest(
  payload: CreateLeavePayload,
): Promise<LeaveRequestDto> {
  const response = await api.post<LeaveRequestDto>('/hr/leaves', {
    ...payload,
    reason: payload.reason?.trim() || undefined,
  });
  return response.data;
}

export async function approveLeaveRequest(
  leaveId: string,
  notes?: string,
): Promise<LeaveRequestDto> {
  const response = await api.patch<LeaveRequestDto>(
    `/hr/leaves/${leaveId}/approve`,
    { notes: notes?.trim() || undefined },
  );
  return response.data;
}

export async function rejectLeaveRequest(
  leaveId: string,
  notes?: string,
): Promise<LeaveRequestDto> {
  const response = await api.patch<LeaveRequestDto>(
    `/hr/leaves/${leaveId}/reject`,
    { notes: notes?.trim() || undefined },
  );
  return response.data;
}
