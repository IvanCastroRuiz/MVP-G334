export type ModuleVisibility = 'public' | 'dev_only';

export interface ModuleSummaryDto {
  id: string;
  key: string;
  name: string;
  visibility: ModuleVisibility;
  isActive: boolean;
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
