declare module '@mvp/shared' {
  export interface ModuleSummaryDto {
    id: string;
    key: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    [extra: string]: unknown;
  }
}
