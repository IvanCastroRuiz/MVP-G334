export interface AuditLogRepositoryPort {
  record(companyId: string, userId: string | null, action: string, metadata?: Record<string, unknown>): Promise<void>;
}
