import type { ApiResponse, ApiCollection, ListParams } from "~/types/api";
import type { TypeDocument, TypeDocumentInput } from "~/schemas/type-document";

/** Repository Types de document (référentiel). Seul endroit autorisé à connaître ses routes. */
export function useTypesDocumentsApi() {
  const api = useApiClient();

  return {
    list: (params?: ListParams) =>
      api<ApiCollection<TypeDocument>>("/types-documents", { query: params }),

    getById: (id: number) => api<ApiResponse<TypeDocument>>(`/types-documents/${id}`),

    create: (payload: TypeDocumentInput) =>
      api<ApiResponse<TypeDocument>>("/types-documents", { method: "POST", body: payload }),

    update: (id: number, payload: Partial<TypeDocumentInput>) =>
      api<ApiResponse<TypeDocument>>(`/types-documents/${id}`, {
        method: "PUT",
        body: payload,
      }),

    remove: (id: number) =>
      api<{ message: string }>(`/types-documents/${id}`, { method: "DELETE" }),
  };
}
