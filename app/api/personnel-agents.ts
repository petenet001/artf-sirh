import type { ApiResponse } from "~/types/api";
import type { Agent, AgentArchiverInput } from "~/schemas/agent";
import type { InformationsPersonnelle, InformationsPersonnelleInput } from "~/schemas/informations-personnelle";
import type {
  InformationsProfessionnelle,
  InformationsProfessionnelleInput,
} from "~/schemas/informations-professionnelle";
import type { SituationFamiliale, SituationFamilialeInput } from "~/schemas/situation-familiale";
import type { ContactUrgence, ContactUrgenceInput } from "~/schemas/contact-urgence";
import type { DocumentAgent, DocumentAgentInput } from "~/schemas/document-agent";

/**
 * Repository Dossier agent — vie courante (préfixe `/personnel/agents/{id}`).
 * Seul endroit autorisé à connaître ces routes. Auth Bearer, sans permission
 * dédiée (comme le reste de `/personnel`). Toutes throwent.
 *
 * La `fiche` embarque toutes les relations (carrière + vie courante) : c'est la
 * source unique de lecture ; les sous-appels ci-dessous ne servent qu'à l'écriture.
 */
export function usePersonnelAgentsApi() {
  const api = useApiClient();
  const base = (id: number) => `/personnel/agents/${id}`;

  return {
    /** Fiche complète (infos, contacts, situation, documents + carrière). */
    fiche: (id: number) => api<ApiResponse<Agent>>(base(id)),

    // — Archivage ————————————————————————————————————————————————
    archiver: (id: number, payload: AgentArchiverInput) =>
      api<ApiResponse<Agent>>(`${base(id)}/archiver`, { method: "POST", body: payload }),
    desarchiver: (id: number) =>
      api<ApiResponse<Agent>>(`${base(id)}/desarchiver`, { method: "POST", body: {} }),

    // — Informations (upsert = PUT ; `data: null` si vide en lecture) ————
    upsertInfosPersonnelles: (id: number, payload: InformationsPersonnelleInput) =>
      api<ApiResponse<InformationsPersonnelle>>(`${base(id)}/informations-personnelles`, {
        method: "PUT",
        body: payload,
      }),
    upsertInfosProfessionnelles: (id: number, payload: InformationsProfessionnelleInput) =>
      api<ApiResponse<InformationsProfessionnelle>>(`${base(id)}/informations-professionnelles`, {
        method: "PUT",
        body: payload,
      }),
    upsertSituationFamiliale: (id: number, payload: SituationFamilialeInput) =>
      api<ApiResponse<SituationFamiliale>>(`${base(id)}/situation-familiale`, {
        method: "PUT",
        body: payload,
      }),

    // — Contacts d'urgence (CRUD) ————————————————————————————————
    creerContact: (id: number, payload: ContactUrgenceInput) =>
      api<ApiResponse<ContactUrgence>>(`${base(id)}/contacts-urgence`, { method: "POST", body: payload }),
    modifierContact: (id: number, contactId: number, payload: ContactUrgenceInput) =>
      api<ApiResponse<ContactUrgence>>(`${base(id)}/contacts-urgence/${contactId}`, {
        method: "PUT",
        body: payload,
      }),
    supprimerContact: (id: number, contactId: number) =>
      api<{ message: string }>(`${base(id)}/contacts-urgence/${contactId}`, { method: "DELETE" }),

    // — Documents (GED légère) ——————————————————————————————————
    creerDocument: (id: number, payload: DocumentAgentInput, fichier: File) => {
      const fd = new FormData();
      fd.append("type_document_id", String(payload.type_document_id));
      if (payload.titre) fd.append("titre", payload.titre);
      if (payload.sous_dossier) fd.append("sous_dossier", payload.sous_dossier);
      fd.append("fichier", fichier);
      return api<ApiResponse<DocumentAgent>>(`${base(id)}/documents`, { method: "POST", body: fd });
    },
    /** Télécharge le fichier (binaire) — traiter en blob, ne pas parser en JSON. */
    telechargerDocument: (id: number, docId: number) =>
      api<Blob>(`${base(id)}/documents/${docId}/fichier`, { responseType: "blob" }),
    supprimerDocument: (id: number, docId: number) =>
      api<{ message: string }>(`${base(id)}/documents/${docId}`, { method: "DELETE" }),
  };
}
