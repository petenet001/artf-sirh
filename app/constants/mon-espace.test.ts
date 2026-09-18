import { describe, it, expect } from "vitest";
import { cartesVisibles, CARTES_MON_ESPACE, alertesParCarte } from "./mon-espace";

/**
 * L'espace personnel obéit à deux conditions distinctes : un agent rattaché au
 * compte (sans lui l'API répond 403), et la permission de lecture du domaine.
 */
const PERMISSIONS_AGENT = [
  "consulter-referentiels",
  "consulter-conges",
  "creer-conges",
  "consulter-absences",
  "creer-absences",
  "consulter-evaluations",
];

const ctx = (estAgent: boolean, permissions: string[] = PERMISSIONS_AGENT) => ({
  estAgent,
  can: (p: string) => permissions.includes(p),
});

const cles = (c: Parameters<typeof cartesVisibles>[0]) => cartesVisibles(c).map((x) => x.key);

describe("cartesVisibles", () => {
  it("un agent voit tout son espace personnel", () => {
    expect(cles(ctx(true))).toEqual([
      "profil",
      "dossier",
      "carriere",
      "conges",
      "absences",
      "evaluations",
      "discipline",
    ]);
  });

  it("un compte sans agent rattaché ne garde que son profil", () => {
    // Ni congés, ni carrière, ni dossier : ces routes sont indexées par agent.
    expect(cles(ctx(false))).toEqual(["profil", "evaluations"]);
  });

  it("une carte disparaît si la permission de lecture manque", () => {
    const sansConges = ctx(true, ["consulter-absences", "consulter-evaluations"]);
    expect(cles(sansConges)).not.toContain("conges");
    expect(cles(sansConges)).toContain("absences");
  });

  it("le profil reste ouvert à tout compte, même sans permission", () => {
    expect(cles(ctx(false, []))).toEqual(["profil"]);
  });

  it("toutes les cartes pointent vers un écran personnel", () => {
    for (const carte of CARTES_MON_ESPACE) {
      expect(carte.to.startsWith("/mon-espace/") || ["/profil", "/evaluations/mes-evaluations"].includes(carte.to)).toBe(true);
    }
  });
});

describe("alertesParCarte", () => {
  const vide = { nonLuesParDomaine: {}, fichesASigner: 0, sectionsManquantes: [] };

  it("ne pose aucune pastille quand rien n'attend", () => {
    expect(alertesParCarte(vide)).toEqual({});
  });

  it("rattache les notifications non lues à la bonne carte", () => {
    const a = alertesParCarte({ ...vide, nonLuesParDomaine: { conge: 2, discipline: 1 } });
    expect(a.conges).toEqual({ ton: "info", compte: 2, libelle: "2 notifications non lues" });
    expect(a.discipline?.compte).toBe(1);
    expect(a.discipline?.libelle).toBe("1 notification non lue");
  });

  it("additionne les domaines qui pointent vers une même carte", () => {
    // Carrière couvre affectation, nomination, lots, prise de service, stage.
    const a = alertesParCarte({
      ...vide,
      nonLuesParDomaine: { affectation: 1, nomination: 2, lot_affectation: 1 },
    });
    expect(a.carriere?.compte).toBe(4);
  });

  it("ignore un domaine qu'aucune carte ne couvre", () => {
    expect(alertesParCarte({ ...vide, nonLuesParDomaine: { domaine_inconnu: 3 } })).toEqual({});
  });

  it("fait primer l'action sur l'information, sur une même carte", () => {
    // Sinon « 3 non lues » masquerait « une fiche attend votre signature ».
    const a = alertesParCarte({
      ...vide,
      nonLuesParDomaine: { evaluation: 3 },
      fichesASigner: 1,
    });
    expect(a.evaluations?.ton).toBe("action");
    expect(a.evaluations?.compte).toBe(1);
    expect(a.evaluations?.libelle).toContain("signature");
  });

  it("accorde le libellé au pluriel", () => {
    expect(alertesParCarte({ ...vide, fichesASigner: 2 }).evaluations?.libelle).toBe(
      "2 fiches attendent votre signature",
    );
  });

  it("signale un dossier incomplet sans chiffre, et nomme ce qui manque", () => {
    const a = alertesParCarte({
      ...vide,
      sectionsManquantes: ["informations professionnelles", "contact d'urgence"],
    });
    expect(a.dossier?.ton).toBe("action");
    // Un « 2 » se lirait comme deux documents reçus, pas deux rubriques à remplir.
    expect(a.dossier?.compte).toBe(0);
    expect(a.dossier?.libelle).toBe(
      "À compléter : informations professionnelles, contact d'urgence.",
    );
  });

  it("n'affecte pas les autres cartes", () => {
    const a = alertesParCarte({ ...vide, fichesASigner: 1 });
    expect(Object.keys(a)).toEqual(["evaluations"]);
  });
});
