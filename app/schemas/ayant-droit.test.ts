import { describe, it, expect } from "vitest";
import { ayantDroitSchema, ayantDroitInputSchema, dossierSocialSchema } from "./ayant-droit";

describe("ayantDroitSchema", () => {
  const valid = {
    id: 1,
    agent_id: 12,
    type: "enfant",
    type_label: "Enfant",
    nom: "DUPONT",
    prenom: "Léa",
    nom_complet: "Léa DUPONT",
    date_naissance: "2015-04-02",
    age: 11,
    lien_juridique: "naturel_reconnu",
    qualite_age: "standard",
    age_limite: 16,
    actif: true,
    a_charge: true,
    eligible_arbre_noel: true,
  };

  it("valide un enfant à charge", () => {
    const parsed = ayantDroitSchema.parse(valid);
    expect(parsed.a_charge).toBe(true);
    expect(parsed.age_limite).toBe(16);
  });

  it("valide un conjoint", () => {
    const parsed = ayantDroitSchema.parse({
      ...valid,
      type: "conjoint",
      lien_juridique: "mariage",
      qualite_age: null,
      age_limite: null,
    });
    expect(parsed.type).toBe("conjoint");
    expect(parsed.qualite_age).toBeNull();
  });

  it("rejette un lien juridique ou un régime d'âge hors enum", () => {
    expect(() => ayantDroitSchema.parse({ ...valid, lien_juridique: "concubinage" })).toThrow();
    expect(() => ayantDroitSchema.parse({ ...valid, qualite_age: "majeur" })).toThrow();
  });
});

describe("ayantDroitInputSchema", () => {
  it("exige identité, date de naissance et lien juridique", () => {
    expect(() =>
      ayantDroitInputSchema.parse({ agent_id: 1, type: "enfant", nom: "", prenom: "Léa", date_naissance: "2015-04-02", lien_juridique: "adoption" }),
    ).toThrow();
    const parsed = ayantDroitInputSchema.parse({
      agent_id: 1,
      type: "enfant",
      nom: "DUPONT",
      prenom: "Léa",
      date_naissance: "2015-04-02",
      lien_juridique: "adoption",
    });
    expect(parsed.lien_juridique).toBe("adoption");
  });

  it("n'envoie aucun champ calculé serveur", () => {
    const shape = ayantDroitInputSchema.shape;
    for (const champ of ["age", "age_limite", "a_charge", "eligible_arbre_noel"]) {
      expect(champ in shape).toBe(false);
    }
  });
});

describe("dossierSocialSchema", () => {
  it("valide la réponse complète du dossier social", () => {
    const parsed = dossierSocialSchema.parse({
      agent: { id: 1, matricule: "AG001", nom: "DUPONT", prenom: "Jean", nom_complet: "Jean DUPONT", numero_cnss: "123", statut: "actif" },
      affiliations: [],
      ayants_droit: [],
      synthese: {
        affiliation_cnss: false,
        nb_enfants_a_charge: 0,
        nb_enfants_arbre_noel: 0,
        prime_arbre_noel_forfaitaire: true,
        nb_enfants_tutelle: 0,
        a_conjoint_a_charge: false,
      },
    });
    expect(parsed.synthese?.prime_arbre_noel_forfaitaire).toBe(true);
    expect(parsed.agent?.numero_cnss).toBe("123");
  });
});
