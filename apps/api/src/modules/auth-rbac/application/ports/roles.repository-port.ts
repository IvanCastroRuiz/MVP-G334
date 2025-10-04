export interface RolesRepositoryPort {
  assignRoleToUser(companyId: string, userId: string, roleId: string): Promise<void>;
  getUserPermissions(companyId: string, userId: string): Promise<string[]>;
  getUserRoles(companyId: string, userId: string): Promise<string[]>;
  listCompanyRoles(companyId: string): Promise<{ id: string; name: string; description: string | null }[]>;
}
