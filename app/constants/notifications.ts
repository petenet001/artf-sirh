import type { Notification } from "~/schemas/notification";

/**
 * Métadonnées d'affichage et de routage des notifications, par **domaine**
 * métier (cf. `note-fe-etat-implementations.md` §2b). Source unique : le hub
 * (cloche) s'appuie dessus pour l'icône, le libellé et le lien d'un item.
 *
 * Domaines connus : `integration`, `affectation`, `nomination`,
 * `lot_affectation`, `lot_nomination`, `compte`, `prise_de_service`, `stage`,
 * `conge`, `absence`.
 */
export interface NotificationDomaineMeta {
  icon: string;
  label: string;
}

const DOMAINES: Record<string, NotificationDomaineMeta> = {
  integration: { icon: "i-lucide-folder-open", label: "Intégration" },
  affectation: { icon: "i-lucide-map-pin", label: "Affectation" },
  nomination: { icon: "i-lucide-award", label: "Nomination" },
  lot_affectation: { icon: "i-lucide-layers", label: "Lot d'affectations" },
  lot_nomination: { icon: "i-lucide-layers", label: "Lot de nominations" },
  compte: { icon: "i-lucide-key-round", label: "Compte" },
  prise_de_service: { icon: "i-lucide-badge-check", label: "Prise de service" },
  stage: { icon: "i-lucide-graduation-cap", label: "Stage" },
  conge: { icon: "i-lucide-palmtree", label: "Congé" },
  absence: { icon: "i-lucide-user-x", label: "Absence" },
};

const DEFAUT: NotificationDomaineMeta = { icon: "i-lucide-bell", label: "Notification" };

/** Icône + libellé du domaine (repli neutre si domaine inconnu). */
export function notificationDomaineMeta(domaine?: string | null): NotificationDomaineMeta {
  return (domaine && DOMAINES[domaine]) || DEFAUT;
}

/** Premier `data[key]` interprétable comme identifiant numérique, sinon `undefined`. */
function idFromData(data: Notification["data"], ...keys: string[]): number | undefined {
  if (!data) return undefined;
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

/**
 * Écran cible d'une notification, ou `undefined` si aucun écran ne l'accueille
 * encore (ex. congés / absences, pas encore livrés côté FE). On ne construit un
 * lien que si l'identifiant attendu est présent dans `data` — jamais de
 * navigation « au hasard ».
 */
export function notificationLink(n: Pick<Notification, "domaine" | "data">): string | undefined {
  const data = n.data;
  switch (n.domaine) {
    case "integration":
    case "compte":
    case "prise_de_service":
    case "stage": {
      const id = idFromData(data, "dossier_id", "dossier_integration_id");
      return id ? `/integration/dossiers/${id}` : undefined;
    }
    case "affectation": {
      const id = idFromData(data, "affectation_id");
      return id ? `/carriere/affectations/${id}` : undefined;
    }
    case "lot_affectation": {
      const id = idFromData(data, "lot_affectation_id", "lot_id");
      return id ? `/carriere/affectations/lots/${id}` : undefined;
    }
    case "nomination": {
      const id = idFromData(data, "nomination_id");
      return id ? `/carriere/nominations/${id}` : undefined;
    }
    case "lot_nomination": {
      const id = idFromData(data, "lot_nomination_id", "lot_id");
      return id ? `/carriere/nominations/lots/${id}` : undefined;
    }
    // conge / absence : écrans pas encore livrés → pas de lien pour l'instant.
    default:
      return undefined;
  }
}
