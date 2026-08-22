import type { ApiCollection, ListParams } from "~/types/api";
import type { Permission } from "~/schemas/permission";

/**
 * Repository des permissions (administration système, lecture seule).
 * Seul endroit qui connaît la route `/permissions`.
 */
export function usePermissionsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<Permission>>("/permissions", { query: params }),
  };
}
