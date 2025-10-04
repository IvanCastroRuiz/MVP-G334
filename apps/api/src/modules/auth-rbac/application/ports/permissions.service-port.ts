export interface PermissionsServicePort {
  userHasPermissions(companyId: string, userId: string, permissions: string[]): Promise<boolean>;
  getUserPermissions(companyId: string, userId: string): Promise<string[]>;
}
