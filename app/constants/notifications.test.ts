import { describe, it, expect } from "vitest";
import { notificationLink, notificationDomaineMeta } from "./notifications";

describe("notificationLink", () => {
  it("congé : lien vers le détail de la demande (demande_id)", () => {
    expect(notificationLink({ domaine: "conge", data: { demande_id: 4 } })).toBe("/conges/demandes/4");
    expect(notificationLink({ domaine: "conge", data: { demande_id: "4" } })).toBe("/conges/demandes/4");
  });

  it("congé sans identifiant : pas de lien", () => {
    expect(notificationLink({ domaine: "conge", data: { agent_id: 12 } })).toBeUndefined();
  });

  it("absence : lien vers la liste des absences", () => {
    expect(notificationLink({ domaine: "absence", data: { absence_id: 3 } })).toBe("/conges/absences");
  });

  it("évaluation : fiche si connue, sinon session, sinon ses propres fiches", () => {
    expect(notificationLink({ domaine: "evaluation", data: { evaluation_id: 12 } })).toBe("/evaluations/fiches/12");
    expect(notificationLink({ domaine: "evaluation", data: { session_id: 3 } })).toBe("/evaluations/sessions/3");
    // Ouverture de commission sans identifiant exploitable : on reste utile.
    expect(notificationLink({ domaine: "evaluation", data: {} })).toBe("/evaluations/mes-evaluations");
  });

  it("discipline : le dossier RH pour les habilités, l'espace personnel sinon", () => {
    const rh = { peutConsulterDiscipline: true };
    expect(notificationLink({ domaine: "discipline", data: { sanction_id: 7 } }, rh)).toBe("/discipline/dossiers/7");
    expect(notificationLink({ domaine: "discipline", data: {} }, rh)).toBe("/discipline/dossiers");
    // L'agent concerné n'a aucune permission disciplinaire.
    expect(notificationLink({ domaine: "discipline", data: { sanction_id: 7 } })).toBe("/mon-espace/discipline");
  });

  it("domaines existants inchangés, domaine inconnu sans lien", () => {
    expect(notificationLink({ domaine: "affectation", data: { affectation_id: 9 } })).toBe("/carriere/affectations/9");
    expect(notificationLink({ domaine: "inconnu", data: {} })).toBeUndefined();
  });
});

describe("notificationDomaineMeta", () => {
  it("repli neutre pour un domaine inconnu", () => {
    expect(notificationDomaineMeta("conge").label).toBe("Congé");
    expect(notificationDomaineMeta("evaluation").label).toBe("Évaluation");
    expect(notificationDomaineMeta("discipline").label).toBe("Discipline");
    expect(notificationDomaineMeta("xyz").icon).toBe("i-lucide-bell");
  });
});
