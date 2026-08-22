import type { ApiCollection, ListParams } from "~/types/api";
import type { AuditLog } from "~/schemas/audit-log";

/**
 * Repository du journal d'audit (administration système, lecture seule).
 * Seul endroit qui connaît la route `/audit-logs`.
 */
export function useAuditLogsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<AuditLog>>("/audit-logs", { query: params }),
  };
}
