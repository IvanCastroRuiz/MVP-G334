export type ModuleVisibility = 'public' | 'dev_only';

export interface ModuleSummaryDto {
  id: string;
  key: string;
  name: string;
  visibility: ModuleVisibility;
  isActive: boolean;
  children?: ModuleSummaryDto[];
}

export interface AuthProfileDto {
  userId: string;
  companyId: string;
  email: string;
  name: string;
  permissions: string[];
  roles: string[];
}

export interface AuthLoginDto {
  accessToken: string;
  refreshToken: string;
  user: AuthProfileDto;
}

export interface AssignedRoleSummaryDto {
  id: string;
  name: string;
}

export interface CreateAccessUserRequestDto {
  name: string;
  email: string;
  password: string;
  roles?: string[];
}

export interface CreateAccessUserResponseDto {
  userId: string;
  email: string;
  name: string;
  assignedRoles: AssignedRoleSummaryDto[];
}

export interface BoardSummaryDto {
  id: string;
  name: string;
  projectId: string;
}

export interface BoardColumnDto {
  id: string;
  name: string;
  orderIndex: number;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskCommentDto {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
}

export interface TaskDto {
  id: string;
  title: string;
  description?: string | null;
  boardColumnId: string;
  priority: TaskPriority;
  status: string;
  assignedTo?: string | null;
  dueDate?: string | null;
  comments: TaskCommentDto[];
}

export interface BoardDetailsDto extends BoardSummaryDto {
  columns: BoardColumnDto[];
  tasks: TaskDto[];
}

export type EmployeeStatus = 'hired' | 'terminated' | 'on_leave';

export interface EmployeeSummaryDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  position: string | null;
  department: string | null;
  status: EmployeeStatus;
  hireDate: string;
  terminationDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDetailsDto extends EmployeeSummaryDto {
  fullName: string;
  userId: string | null;
}

export type LeaveType = 'vacation' | 'sick' | 'personal' | 'other';
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequestDto {
  id: string;
  companyId: string;
  employeeId: string;
  type: LeaveType;
  status: LeaveRequestStatus;
  startDate: string;
  endDate: string;
  reason: string | null;
  requestedBy: string | null;
  approvedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
